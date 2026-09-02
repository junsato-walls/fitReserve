# -*- coding: utf-8 -*-
"""空き状況の業務ロジック（顧客向け）"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import schedules as schedules_query
from schema.schedules import SchedulePublic, SchedulePublicQuery


def list_open_schedules(
    db: Session, query: SchedulePublicQuery
) -> list[SchedulePublic]:
    """指定店舗・期間の予約可能な枠を返す

    available_count（残り予約可能数）はDBに持たず、ここで計算して返す。
    """
    # 期間の前後関係は、422の配列ではなく読める文言で返したいのでここで見る
    if query.start_date > query.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="開始日は終了日より前である必要があります",
        )

    schedules = schedules_query.list_open(
        db, query.store_id, query.start_date, query.end_date
    )

    return [
        SchedulePublic(
            id=schedule.id,
            store_id=schedule.store_id,
            schedule_date=schedule.schedule_date,
            start_time=schedule.start_time,
            end_time=schedule.end_time,
            capacity=schedule.capacity,
            reserved_count=schedule.reserved_count,
            available_count=schedule.capacity - schedule.reserved_count,
            is_available=schedule.is_available,
        )
        for schedule in schedules
    ]
