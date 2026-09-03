# -*- coding: utf-8 -*-
"""スケジュール管理の業務ロジック（社内向け）"""

# 標準ライブラリ
from collections import defaultdict
from datetime import date, datetime, timedelta

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Reservations, ScheduleBlocks, Schedules, Stores
from repository.command import schedules as schedules_command
from repository.query import reservations as reservations_query
from repository.query import schedule_blocks as blocks_query
from repository.query import schedules as schedules_query
from repository.query import schools as schools_query
from repository.query import stores as stores_query
from schema.schedules import (
    ScheduleBlockResponse,
    ScheduleCreate,
    ScheduleDay,
    ScheduleDayQuery,
    ScheduleReservation,
    ScheduleSlot,
    ScheduleUpdate,
)
from system.permissions import Actor
from usecase import slots as slots_logic

# 権限外のスケジュールは「存在しない」として扱う
NOT_FOUND = "スケジュールが見つかりません"
STORE_NOT_FOUND = "指定された店舗が見つかりません"

# 一度に取得できる日数の上限。広い期間を全店舗分そのまま組み立てると重い
MAX_DAYS = 62

# 設定が無い日に使う既定の刻み（分）
DEFAULT_SLOT_MINUTES = 30


def get_schedule(db: Session, actor: Actor, schedule_id: int) -> Schedules:
    """担当店舗のスケジュールを1件取得する"""
    return _find(db, actor, schedule_id)


def list_days(db: Session, actor: Actor, query: ScheduleDayQuery) -> list[ScheduleDay]:
    """タイムテーブル（店舗×日）を組み立てて返す

    予約枠は受付時間から導出し、予約件数は reservations から数える。
    設定が無い日も「受付なし」として返し、画面が日付の抜けを気にせず描けるようにする。
    """
    date_to = query.date_to or query.date_from
    if query.date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="開始日は終了日より前である必要があります",
        )
    if (date_to - query.date_from).days + 1 > MAX_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"一度に取得できるのは{MAX_DAYS}日までです",
        )

    if query.store_id is not None:
        actor.assert_store(query.store_id, STORE_NOT_FOUND)
        stores = [_find_store(db, query.store_id)]
    else:
        stores = stores_query.list_enabled(db, actor.store_ids)

    store_ids = [store.id for store in stores]

    # 店舗ごと・日ごとに引くとN+1になるため、必要なものは期間分まとめて取る
    holidays = stores_query.map_regular_holidays(db, store_ids)
    schedules = {
        (row.store_id, row.schedule_date): row
        for row in schedules_query.list_days(db, store_ids, query.date_from, date_to)
    }
    blocks_by_day: dict[tuple[int, date], list[ScheduleBlocks]] = defaultdict(list)
    for block in blocks_query.list_range(db, store_ids, query.date_from, date_to):
        blocks_by_day[(block.store_id, block.block_date)].append(block)
    reserved = reservations_query.count_by_slot(db, store_ids, query.date_from, date_to)

    reservations = reservations_query.list_range(
        db, store_ids, query.date_from, date_to
    )
    reservations_by_day: dict[tuple[int, date], list[Reservations]] = defaultdict(list)
    for reservation in reservations:
        reservations_by_day[
            (reservation.store_id, reservation.reservation_date)
        ].append(reservation)
    # 学校名は1件ずつ引くとN+1になるため、まとめて取る
    school_names = schools_query.names_by_ids(
        db, {reservation.school_id for reservation in reservations}
    )

    days: list[ScheduleDay] = []
    for offset in range((date_to - query.date_from).days + 1):
        target = query.date_from + timedelta(days=offset)
        for store in stores:
            days.append(
                _to_day(
                    store=store,
                    target=target,
                    schedule=schedules.get((store.id, target)),
                    blocks=blocks_by_day[(store.id, target)],
                    reservations=reservations_by_day[(store.id, target)],
                    school_names=school_names,
                    holiday=slots_logic.is_holiday(target, holidays.get(store.id, [])),
                    reserved=reserved,
                )
            )

    return days


def create_schedule(db: Session, actor: Actor, payload: ScheduleCreate) -> Schedules:
    """1日分の受付設定を作成する"""
    actor.assert_store(payload.store_id, STORE_NOT_FOUND)
    _find_store(db, payload.store_id)

    if schedules_query.find_day(db, payload.store_id, payload.schedule_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="その日の設定は既に存在します",
        )

    schedule = schedules_command.create(db, payload.model_dump())

    db.commit()
    db.refresh(schedule)
    return schedule


def update_schedule(
    db: Session, actor: Actor, schedule_id: int, payload: ScheduleUpdate
) -> Schedules:
    """1日分の受付設定を更新する

    店舗・日付は変更できない（別の日の設定は別の行として作る）。
    """
    schedule = _find(db, actor, schedule_id)
    values = payload.model_dump(exclude_unset=True)

    # 部分更新では片側だけが送られてくるため、更新後の値どうしで確かめる
    _assert_pair(
        "受付時間",
        values.get("start_time", schedule.start_time),
        values.get("end_time", schedule.end_time),
    )
    _assert_pair(
        "休憩時間",
        values.get("break_start", schedule.break_start),
        values.get("break_end", schedule.break_end),
    )

    # 受付数を既にある予約より小さくすると、枠が定員超過のまま残る
    if "capacity" in values:
        peak = _peak_reserved(db, schedule)
        if values["capacity"] < peak:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"同時予約数は予約済みの最大数（{peak}）以上である必要があります",
            )

    schedules_command.update(db, schedule, values)

    db.commit()
    db.refresh(schedule)
    return schedule


def delete_schedule(db: Session, actor: Actor, schedule_id: int) -> None:
    """1日分の受付設定を削除する（論理削除）"""
    schedule = _find(db, actor, schedule_id)

    if _peak_reserved(db, schedule) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="予約が入っている日の設定は削除できません",
        )

    schedules_command.soft_delete(db, schedule)
    db.commit()


def _to_day(
    store: Stores,
    target: date,
    schedule,
    blocks: list[ScheduleBlocks],
    reservations: list[Reservations],
    school_names: dict[int, str],
    holiday: bool,
    reserved: dict,
) -> ScheduleDay:
    """1店舗・1日分のタイムテーブルを組み立てる"""
    start, end = slots_logic.opening_hours(store, schedule)
    capacity = schedule.capacity if schedule else store.capacity
    slot_minutes = schedule.slot_minutes if schedule else DEFAULT_SLOT_MINUTES

    slot_list = []
    for slot in slots_logic.build_slots(store, schedule, blocks):
        reserved_count = reserved.get((store.id, target, slot.start_time), 0)
        slot_list.append(
            ScheduleSlot(
                start_time=slot.start_time,
                end_time=slot.end_time,
                capacity=capacity,
                reserved_count=reserved_count,
                available_count=max(0, capacity - reserved_count),
            )
        )

    return ScheduleDay(
        store_id=store.id,
        store_name=store.name,
        schedule_date=target,
        schedule_id=schedule.id if schedule else None,
        is_available=bool(schedule and schedule.is_available),
        is_holiday=holiday,
        capacity=capacity,
        slot_minutes=slot_minutes,
        start_time=start,
        end_time=end,
        break_start=schedule.break_start if schedule else None,
        break_end=schedule.break_end if schedule else None,
        memo=schedule.memo if schedule else None,
        slots=slot_list,
        blocks=[ScheduleBlockResponse.model_validate(block) for block in blocks],
        reservations=[
            ScheduleReservation(
                id=reservation.id,
                reservation_number=reservation.reservation_number,
                start_time=reservation.reservation_time,
                # 予約は終了時刻を持たないため、その日の枠の刻みぶんとして描く
                end_time=_add_minutes(reservation.reservation_time, slot_minutes),
                customer_name=reservation.customer_name,
                school_name=school_names.get(reservation.school_id),
                status=reservation.status,
            )
            for reservation in reservations
        ],
    )


def _peak_reserved(db: Session, schedule: Schedules) -> int:
    """その日の枠のうち、最も予約が入っている枠の件数"""
    reserved = reservations_query.count_by_slot(
        db, [schedule.store_id], schedule.schedule_date, schedule.schedule_date
    )
    return max(reserved.values(), default=0)


def _find(db: Session, actor: Actor, schedule_id: int) -> Schedules:
    """担当店舗のスケジュールを取得する。無ければ404"""
    schedule = schedules_query.find_by_id(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    actor.assert_store(schedule.store_id, NOT_FOUND)
    return schedule


def _find_store(db: Session, store_id: int) -> Stores:
    """店舗を取得する。無ければ404"""
    store = stores_query.find_by_id(db, store_id)
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=STORE_NOT_FOUND
        )
    return store


def _assert_pair(label: str, start, end) -> None:
    """開始と終了が対で入っていること、前後関係が正しいこと

    スキーマ側でも見ているが、部分更新は「更新後の値」で判定する必要があるため
    ここでも確かめる。
    """
    if (start is None) != (end is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{label}は開始と終了の両方を指定してください",
        )
    if start is not None and end is not None and start >= end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{label}の開始は終了より前である必要があります",
        )


def _add_minutes(at, minutes: int):
    """時刻に分を足す。24時をまたぐ場合は23:59に丸める（枠は日をまたがない）"""
    base = datetime.combine(date.min, at) + timedelta(minutes=minutes)
    return base.time() if base.date() == date.min else at.replace(hour=23, minute=59)
