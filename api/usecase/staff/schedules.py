# -*- coding: utf-8 -*-
"""スケジュール（予約枠）管理の業務ロジック（社内向け）"""

# 標準ライブラリ
from datetime import date
from typing import Optional

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Schedules
from repository.command import schedules as schedules_command
from repository.query import schedules as schedules_query
from repository.query import stores as stores_query
from schema.schedules import (
    ScheduleAvailability,
    ScheduleAvailabilityQuery,
    ScheduleCreate,
    ScheduleUpdate,
)
from system.permissions import Actor

# 権限外のスケジュールは「存在しない」として扱う
NOT_FOUND = "スケジュールが見つかりません"

# 残りがこの数以下なら「残りわずか」として扱う
FEW_LEFT = 2


def get_schedule(db: Session, actor: Actor, schedule_id: int) -> Schedules:
    """担当店舗のスケジュールを1件取得する"""
    return _find(db, actor, schedule_id)


def list_availability(
    db: Session, actor: Actor, query: ScheduleAvailabilityQuery
) -> list[ScheduleAvailability]:
    """空き状況の一覧を取得する"""
    actor.assert_store(query.store_id, NOT_FOUND)

    result = []
    for schedule in schedules_query.list_open(
        db, query.store_id, query.date_from, query.date_to
    ):
        available_count = schedule.capacity - schedule.reserved_count

        # 空き状況の判定
        if available_count <= 0:
            availability_status = "×"  # 満席
        elif available_count <= FEW_LEFT:
            availability_status = "△"  # 残りわずか
        else:
            availability_status = "◎"  # 余裕あり

        result.append(
            ScheduleAvailability(
                schedule_id=schedule.id,
                schedule_date=schedule.schedule_date,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                capacity=schedule.capacity,
                reserved_count=schedule.reserved_count,
                available_count=available_count,
                status=availability_status,
            )
        )

    return result


def create_schedule(db: Session, actor: Actor, payload: ScheduleCreate) -> Schedules:
    """スケジュールを作成する"""
    # 担当外の店舗には作れない
    actor.assert_store(payload.store_id, "指定された店舗が見つかりません")

    if not stores_query.find_by_id(db, payload.store_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された店舗が見つかりません",
        )

    _assert_slot_free(db, payload.store_id, payload.schedule_date, payload.start_time)

    schedule = schedules_command.create(db, payload.model_dump())

    db.commit()
    db.refresh(schedule)
    return schedule


def update_schedule(
    db: Session, actor: Actor, schedule_id: int, payload: ScheduleUpdate
) -> Schedules:
    """スケジュールを更新する"""
    schedule = _find(db, actor, schedule_id)

    # 担当外の店舗へは移せない
    if payload.store_id is not None:
        actor.assert_store(payload.store_id, "指定された店舗が見つかりません")

    # 予約が入っている枠は日時・店舗を変えられない。
    # 予約は (store_id, reservation_date, reservation_time) で枠と結びついており
    # 外部キーが無いため、枠だけ動かすと予約が元の日時に取り残される。
    if _is_slot_changed(schedule, payload) and schedule.reserved_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="予約が入っている枠は日時・店舗を変更できません",
        )

    # 移動先に別の枠が無いか確認する（タイムテーブルのドラッグ移動で衝突しうる）
    _assert_slot_free(
        db,
        payload.store_id if payload.store_id is not None else schedule.store_id,
        (
            payload.schedule_date
            if payload.schedule_date is not None
            else schedule.schedule_date
        ),
        payload.start_time if payload.start_time is not None else schedule.start_time,
        exclude_id=schedule_id,
    )

    # capacityを予約済数より小さくできないようにチェック
    if payload.capacity and payload.capacity < schedule.reserved_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"受付可能数は予約済数（{schedule.reserved_count}）以上である必要があります",
        )

    schedules_command.update(db, schedule, payload.model_dump(exclude_unset=True))

    db.commit()
    db.refresh(schedule)
    return schedule


def delete_schedule(db: Session, actor: Actor, schedule_id: int) -> None:
    """スケジュールを削除する（論理削除）"""
    schedule = _find(db, actor, schedule_id)

    # 予約が入っている場合は削除不可
    if schedule.reserved_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="予約が入っているスケジュールは削除できません",
        )

    schedules_command.soft_delete(db, schedule)
    db.commit()


def _find(db: Session, actor: Actor, schedule_id: int) -> Schedules:
    """担当店舗のスケジュールを取得する。無ければ404"""
    schedule = schedules_query.find_by_id(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    actor.assert_store(schedule.store_id, NOT_FOUND)
    return schedule


def _is_slot_changed(schedule: Schedules, payload: ScheduleUpdate) -> bool:
    """予約枠の位置（店舗・日付・開始時刻）が変わるか"""
    return any(
        value is not None and value != getattr(schedule, field)
        for field, value in (
            ("store_id", payload.store_id),
            ("schedule_date", payload.schedule_date),
            ("start_time", payload.start_time),
        )
    )


def _assert_slot_free(
    db: Session, store_id: int, schedule_date, start_time, exclude_id: int = 0
) -> None:
    """同一店舗・同一日時の枠が既に無いかを確認する

    DBに部分ユニークインデックス(idx_schedules_slot)があるため、
    ここで弾かないとINSERT/UPDATEが500になる。
    """
    if schedules_query.find_slot(
        db, store_id, schedule_date, start_time, exclude_id=exclude_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="同じ日時のスケジュールが既に存在します",
        )
