# -*- coding: utf-8 -*-
"""スケジュール管理API（スタッフ向け・認証必要）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Annotated
from system.db import get_db
from system.models import Schedules, Stores
from schemas.schedules import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse,
    ScheduleAvailability,
)
from schemas.custom.auth import DecodedToken
from system.auth import require_staff, require_viewer
from datetime import datetime, date
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "schedules"

# 参照系は全ロール、更新系はreadonlyを除外する
ViewerDependency = Annotated[DecodedToken, Depends(require_viewer)]
StaffDependency = Annotated[DecodedToken, Depends(require_staff)]


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/schedules", response_model=List[ScheduleResponse])
def get_schedules(
    login_user: ViewerDependency,
    skip: int = 0,
    limit: int = 100,
    store_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """スケジュール一覧取得"""
    query = db.query(Schedules).filter(Schedules.deleted_at.is_(None))

    # フィルター適用
    if store_id:
        query = query.filter(Schedules.store_id == store_id)
    if date_from:
        query = query.filter(Schedules.schedule_date >= date_from)
    if date_to:
        query = query.filter(Schedules.schedule_date <= date_to)
    if is_available is not None:
        query = query.filter(Schedules.is_available == is_available)

    schedules = (
        query.order_by(Schedules.schedule_date, Schedules.start_time)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return schedules


@router.get("/schedules/availability", response_model=List[ScheduleAvailability])
def get_schedule_availability(
    store_id: int,
    date_from: date,
    date_to: Optional[date] = None,
    login_user: ViewerDependency = None,
    db: Session = Depends(get_db),
):
    """空き状況一覧取得（顧客向け）"""
    query = db.query(Schedules).filter(
        Schedules.store_id == store_id,
        Schedules.schedule_date >= date_from,
        Schedules.is_available.is_(True),
        Schedules.deleted_at.is_(None),
    )

    if date_to:
        query = query.filter(Schedules.schedule_date <= date_to)
    else:
        query = query.filter(Schedules.schedule_date == date_from)

    schedules = query.order_by(Schedules.schedule_date, Schedules.start_time).all()

    result = []
    for schedule in schedules:
        available_count = schedule.capacity - schedule.reserved_count

        # 空き状況の判定
        if available_count <= 0:
            availability_status = "×"  # 満席
        elif available_count <= 2:
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


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(
    schedule_id: int, login_user: ViewerDependency, db: Session = Depends(get_db)
):
    """スケジュール詳細取得"""
    schedule = (
        db.query(Schedules)
        .filter(Schedules.id == schedule_id, Schedules.deleted_at.is_(None))
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="スケジュールが見つかりません"
        )

    return schedule


@router.post(
    "/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED
)
def create_schedule(
    schedule: ScheduleCreate, login_user: StaffDependency, db: Session = Depends(get_db)
):
    """スケジュール新規作成"""
    # 店舗の存在確認
    store = (
        db.query(Stores)
        .filter(Stores.id == schedule.store_id, Stores.deleted_at.is_(None))
        .first()
    )
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された店舗が見つかりません",
        )

    # 重複チェック（同一店舗・同一日付・同一開始時刻）
    existing = (
        db.query(Schedules)
        .filter(
            Schedules.store_id == schedule.store_id,
            Schedules.schedule_date == schedule.schedule_date,
            Schedules.start_time == schedule.start_time,
            Schedules.deleted_at.is_(None),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="同じ日時のスケジュールが既に存在します",
        )

    db_schedule = Schedules(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)

    return db_schedule


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule: ScheduleUpdate,
    login_user: StaffDependency,
    db: Session = Depends(get_db),
):
    """スケジュール更新"""
    db_schedule = (
        db.query(Schedules)
        .filter(Schedules.id == schedule_id, Schedules.deleted_at.is_(None))
        .first()
    )

    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="スケジュールが見つかりません"
        )

    # capacityを予約済数より小さくできないようにチェック
    if schedule.capacity and schedule.capacity < db_schedule.reserved_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"受付可能数は予約済数（{db_schedule.reserved_count}）以上である必要があります",
        )

    # 更新処理
    update_data = schedule.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_schedule, field, value)

    db.commit()
    db.refresh(db_schedule)

    return db_schedule


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int, login_user: StaffDependency, db: Session = Depends(get_db)
):
    """スケジュール削除（論理削除）"""
    db_schedule = (
        db.query(Schedules)
        .filter(Schedules.id == schedule_id, Schedules.deleted_at.is_(None))
        .first()
    )

    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="スケジュールが見つかりません"
        )

    # 予約が入っている場合は削除不可
    if db_schedule.reserved_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="予約が入っているスケジュールは削除できません",
        )

    db_schedule.deleted_at = jst()
    db.commit()
    return None
