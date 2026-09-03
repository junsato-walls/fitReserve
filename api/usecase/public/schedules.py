# -*- coding: utf-8 -*-
"""空き状況の業務ロジック（顧客向け）"""

# 標準ライブラリ
from collections import defaultdict
from datetime import date, timedelta

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import ScheduleBlocks
from repository.query import reservations as reservations_query
from repository.query import schedule_blocks as blocks_query
from repository.query import schedules as schedules_query
from repository.query import stores as stores_query
from schema.schedules import SchedulePublicQuery, SchedulePublicSlot
from usecase import slots as slots_logic

# 一度に検索できる日数の上限
MAX_DAYS = 62


def list_open_slots(
    db: Session, query: SchedulePublicQuery
) -> list[SchedulePublicSlot]:
    """指定店舗・期間の予約できる枠を返す

    枠はDBに持たず、受付時間（未設定なら店舗の営業時間）から導出する。
    定休日・受付停止の日、休憩時間、枠止めに重なる枠は含まれない。
    満席の枠は返さない（顧客には選べないものを見せない）。
    """
    # 期間の前後関係は、422の配列ではなく読める文言で返したいのでここで見る
    if query.start_date > query.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="開始日は終了日より前である必要があります",
        )
    if (query.end_date - query.start_date).days + 1 > MAX_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"一度に検索できるのは{MAX_DAYS}日までです",
        )

    store = stores_query.find_enabled_by_id(db, query.store_id)
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="店舗が見つかりません"
        )

    store_ids = [store.id]
    schedules = {
        row.schedule_date: row
        for row in schedules_query.list_days(
            db, store_ids, query.start_date, query.end_date
        )
    }
    blocks_by_day: dict[date, list[ScheduleBlocks]] = defaultdict(list)
    for block in blocks_query.list_range(
        db, store_ids, query.start_date, query.end_date
    ):
        blocks_by_day[block.block_date].append(block)
    reserved = reservations_query.count_by_slot(
        db, store_ids, query.start_date, query.end_date
    )

    result: list[SchedulePublicSlot] = []
    for offset in range((query.end_date - query.start_date).days + 1):
        target = query.start_date + timedelta(days=offset)
        schedule = schedules.get(target)
        if schedule is None:
            continue

        for slot in slots_logic.build_slots(store, schedule, blocks_by_day[target]):
            reserved_count = reserved.get((store.id, target, slot.start_time), 0)
            available = schedule.capacity - reserved_count
            if available <= 0:
                continue

            result.append(
                SchedulePublicSlot(
                    store_id=store.id,
                    schedule_date=target,
                    start_time=slot.start_time,
                    end_time=slot.end_time,
                    capacity=schedule.capacity,
                    reserved_count=reserved_count,
                    available_count=available,
                )
            )

    return result
