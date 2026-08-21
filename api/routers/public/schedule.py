# -*- coding: utf-8 -*-
"""スケジュール取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import Schedules
from schemas.public.schedules import SchedulePublic
from datetime import datetime, date
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "public-schedules"


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/schedules", response_model=list[SchedulePublic])
def get_schedules(
    store_id: int = Query(..., description="店舗ID"),
    start_date: date = Query(..., description="検索開始日"),
    end_date: date = Query(..., description="検索終了日"),
    db: Session = Depends(get_db),
):
    """スケジュール一覧を取得（顧客向け・空き状況確認）

    指定された店舗・期間のスケジュール一覧を返す。
    available_countは計算して返す（capacity - reserved_count）。
    """
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="開始日は終了日より前である必要があります",
        )

    schedules = (
        db.query(Schedules)
        .filter(
            Schedules.store_id == store_id,
            Schedules.schedule_date >= start_date,
            Schedules.schedule_date <= end_date,
            Schedules.is_available.is_(True),
            Schedules.deleted_at.is_(None),
        )
        .order_by(Schedules.schedule_date, Schedules.start_time)
        .all()
    )

    # available_countを計算して返す
    result = []
    for schedule in schedules:
        result.append(
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
        )

    return result
