# -*- coding: utf-8 -*-
"""予約管理の業務ロジック（社内向け）"""

# 標準ライブラリ
from typing import Optional

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Reservations
from repository.command import reservations as reservations_command
from repository.command import schedules as schedules_command
from repository.query import projects as projects_query
from repository.query import reservations as reservations_query
from repository.query import schedules as schedules_query
from repository.query import schools as schools_query
from repository.query import stores as stores_query
from schema.reservations import (
    ReservationSearchQuery,
    ReservationUpdate,
    ReservationWithDetails,
)
from system.permissions import Actor

# 権限外の予約は「存在しない」として扱う（IDの総当たりで存在を知られないため）
NOT_FOUND = "予約が見つかりません"


def list_reservations(
    db: Session, actor: Actor, query: ReservationSearchQuery
) -> list[ReservationWithDetails]:
    """担当店舗の予約一覧を取得する"""
    reservations = reservations_query.search(
        db,
        store_ids=actor.store_ids,
        skip=query.skip,
        limit=query.limit,
        store_id=query.store_id,
        school_id=query.school_id,
        status=query.status,
        date_from=query.date_from,
        date_to=query.date_to,
    )
    return _with_details(db, reservations)


def get_reservation(
    db: Session, actor: Actor, reservation_id: int
) -> ReservationWithDetails:
    """担当店舗の予約を1件取得する"""
    reservation = _find(db, actor, reservation_id)
    return _with_details(db, [reservation])[0]


def update_reservation(
    db: Session, actor: Actor, reservation_id: int, payload: ReservationUpdate
) -> Reservations:
    """予約を更新する

    日時・店舗が変わる場合は、元の枠の予約済数を減らし、
    変更先の枠の空きを確認したうえで加算する。
    """
    reservation = _find(db, actor, reservation_id)

    _assert_status_transition(reservation.status, payload.status)

    if _is_slot_changed(reservation, payload):
        _move_slot(db, actor, reservation, payload)

    reservations_command.update(db, reservation, payload.model_dump(exclude_unset=True))

    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, actor: Actor, reservation_id: int) -> None:
    """予約をキャンセルする（ステータスをcancelledに変更）"""
    reservation = _find(db, actor, reservation_id)

    if reservation.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="完了済みの予約はキャンセルできません",
        )

    if reservation.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="既にキャンセルされています"
        )

    reservations_command.update(db, reservation, {"status": "cancelled"})

    schedule = schedules_query.find_slot(
        db,
        reservation.store_id,
        reservation.reservation_date,
        reservation.reservation_time,
    )
    if schedule:
        schedules_command.decrement_reserved(db, schedule)

    db.commit()


def _find(db: Session, actor: Actor, reservation_id: int) -> Reservations:
    """担当店舗の予約を取得する。無ければ404"""
    reservation = reservations_query.find_by_id(db, reservation_id)
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    actor.assert_store(reservation.store_id, NOT_FOUND)
    return reservation


def _assert_status_transition(current: str, next_status: Optional[str]) -> None:
    """ステータス遷移の妥当性を確認する"""
    if not next_status:
        return

    if current == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="完了済みの予約は変更できません",
        )

    if next_status == "completed" and current == "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未確認の予約を直接完了にはできません。まず確定してください",
        )


def _is_slot_changed(reservation: Reservations, payload: ReservationUpdate) -> bool:
    """予約枠（店舗・日付・時刻）が変わるか"""
    return any(
        value is not None and value != getattr(reservation, field)
        for field, value in (
            ("store_id", payload.store_id),
            ("reservation_date", payload.reservation_date),
            ("reservation_time", payload.reservation_time),
        )
    )


def _move_slot(
    db: Session, actor: Actor, reservation: Reservations, payload: ReservationUpdate
) -> None:
    """予約枠を移動し、双方の予約済数を調整する"""
    # 元のスケジュールの予約済数をデクリメント
    old_schedule = schedules_query.find_slot(
        db,
        reservation.store_id,
        reservation.reservation_date,
        reservation.reservation_time,
    )
    if old_schedule:
        schedules_command.decrement_reserved(db, old_schedule)

    new_date = payload.reservation_date or reservation.reservation_date
    new_time = payload.reservation_time or reservation.reservation_time
    new_store_id = payload.store_id or reservation.store_id

    # 担当外の店舗へは移せない
    actor.assert_store(new_store_id, "変更先の予約枠が見つかりません")

    # 変更先の枠は同時予約と競合しうるため行ロックを取得する
    new_schedule = schedules_query.lock_open_slot(db, new_store_id, new_date, new_time)
    if not new_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="変更先の予約枠が見つかりません",
        )

    if new_schedule.reserved_count >= new_schedule.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="変更先の予約枠は既に満席です",
        )

    schedules_command.increment_reserved(db, new_schedule)


def _with_details(
    db: Session, reservations: list[Reservations]
) -> list[ReservationWithDetails]:
    """店舗名・学校名・プロジェクト名を付与する

    1件ずつ引くとN+1になるため、必要なIDをまとめて引いて辞書で引き当てる。
    """
    store_names = stores_query.names_by_ids(db, {r.store_id for r in reservations})
    school_names = schools_query.names_by_ids(db, {r.school_id for r in reservations})
    project_names = projects_query.names_by_ids(
        db, {r.project_id for r in reservations if r.project_id}
    )

    result = []
    for reservation in reservations:
        detail = ReservationWithDetails.model_validate(reservation).model_dump()
        detail["store_name"] = store_names.get(reservation.store_id)
        detail["school_name"] = school_names.get(reservation.school_id)
        detail["project_name"] = project_names.get(reservation.project_id)
        result.append(ReservationWithDetails(**detail))
    return result
