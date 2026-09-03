# -*- coding: utf-8 -*-
"""予約枠の導出

予約枠はDBに行として持たず、次の順で計算して作る。
顧客向け（public）と社内向け（staff）の両方から使うため、面に属さない。

    1. 受付時間 = schedules.start_time / end_time（未設定なら店舗の営業時間）
    2. 刻み     = schedules.slot_minutes
    3. 休憩時間 = break_start 〜 break_end に重なる枠を除く
    4. 枠止め   = schedule_blocks に重なる枠を除く
    5. 受付停止・定休日（is_available = False）は枠なし
"""

# 標準ライブラリ
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Iterable, Optional

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import ScheduleBlocks, Schedules, Stores
from repository.query import reservations as reservations_query
from repository.query import schedule_blocks as blocks_query
from repository.query import schedules as schedules_query
from system.clock import to_dow

# 枠が見つからないときの文言。予約の登録・変更で共通に使う
SLOT_NOT_FOUND = "指定された日時は予約を受け付けていません"


@dataclass(frozen=True)
class SlotRange:
    """時間枠1つ分"""

    start_time: time
    end_time: time


def is_holiday(store_date: date, regular_holidays: Iterable[int]) -> bool:
    """その日が店舗の定休日か"""
    return to_dow(store_date) in set(regular_holidays)


def opening_hours(store: Stores, schedule: Optional[Schedules]) -> tuple[time, time]:
    """その日の受付時間を返す

    スケジュール側の指定を優先し、無ければ店舗の営業時間に従う。
    """
    if schedule is not None and schedule.start_time and schedule.end_time:
        return schedule.start_time, schedule.end_time
    return store.business_hours_start, store.business_hours_end


def build_slots(
    store: Stores,
    schedule: Optional[Schedules],
    blocks: Iterable[ScheduleBlocks] = (),
) -> list[SlotRange]:
    """その日の予約枠を組み立てる

    設定が無い日・受付停止の日は空を返す（＝予約できない）。
    """
    if schedule is None or not schedule.is_available:
        return []

    start, end = opening_hours(store, schedule)
    step = timedelta(minutes=schedule.slot_minutes)

    # 除外する時間帯（休憩＋枠止め）
    excluded = [
        (block.start_time, block.end_time)
        for block in blocks
        if block.block_date == schedule.schedule_date
        and block.store_id == schedule.store_id
    ]
    if schedule.break_start and schedule.break_end:
        excluded.append((schedule.break_start, schedule.break_end))

    slots: list[SlotRange] = []
    cursor = _to_datetime(schedule.schedule_date, start)
    limit = _to_datetime(schedule.schedule_date, end)

    while cursor + step <= limit:
        slot_start = cursor.time()
        slot_end = (cursor + step).time()
        if not any(_overlaps(slot_start, slot_end, s, e) for s, e in excluded):
            slots.append(SlotRange(start_time=slot_start, end_time=slot_end))
        cursor += step

    return slots


def _overlaps(
    start: time, end: time, other_start: time, other_end: time
) -> bool:
    """半開区間 [start, end) どうしが重なるか"""
    return start < other_end and other_start < end


def _to_datetime(target: date, at: time) -> datetime:
    """日付と時刻をつないで、時間の足し算をできるようにする"""
    return datetime.combine(target, at)


def take_slot(db: Session, store: Stores, target: date, at: time) -> None:
    """指定日時の枠を1件分確保できるかを確かめる

    予約の登録・変更の直前に呼ぶ。その日の設定行を FOR UPDATE で押さえてから
    予約件数を数えることで、空き確認から登録までを直列化し、
    同時予約によるオーバーブッキングを防ぐ。

    確保できない場合は例外を送出する（呼び出し側で握らないこと）。
    """
    schedule = schedules_query.lock_day(db, store.id, target)
    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=SLOT_NOT_FOUND
        )

    blocks = blocks_query.list_range(db, [store.id], target, target)
    if not any(slot.start_time == at for slot in build_slots(store, schedule, blocks)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=SLOT_NOT_FOUND
        )

    if reservations_query.count_slot(db, store.id, target, at) >= schedule.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="指定された日時は既に満席です",
        )
