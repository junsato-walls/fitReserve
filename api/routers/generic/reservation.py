# -*- coding: utf-8 -*-
"""予約管理API（スタッフ向け・認証必要）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Annotated
from system.db import get_db
from system.models import Reservations, Schedules, Stores, Schools, Projects
from schemas.reservations import (
    ReservationResponse,
    ReservationUpdate,
    ReservationWithDetails,
)
from schemas.custom.auth import DecodedToken
from system.auth import require_staff, require_viewer
from datetime import datetime, date
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "reservations"

# 参照系は全ロール、更新系はreadonlyを除外する
ViewerDependency = Annotated[DecodedToken, Depends(require_viewer)]
StaffDependency = Annotated[DecodedToken, Depends(require_staff)]


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/reservations", response_model=List[ReservationWithDetails])
def get_reservations(
    login_user: ViewerDependency,
    skip: int = 0,
    limit: int = 100,
    store_id: Optional[int] = None,
    school_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """予約一覧取得（フィルター機能付き）"""
    query = db.query(Reservations).filter(Reservations.deleted_at.is_(None))

    # フィルター適用
    if store_id:
        query = query.filter(Reservations.store_id == store_id)
    if school_id:
        query = query.filter(Reservations.school_id == school_id)
    if status:
        query = query.filter(Reservations.status == status)
    if date_from:
        query = query.filter(Reservations.reservation_date >= date_from)
    if date_to:
        query = query.filter(Reservations.reservation_date <= date_to)

    # 予約日時でソート
    reservations = (
        query.order_by(
            Reservations.reservation_date.desc(), Reservations.reservation_time.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    # 関連情報を付与
    result = []
    for reservation in reservations:
        res_dict = ReservationWithDetails.model_validate(reservation).model_dump()

        # 店舗名取得
        store = db.query(Stores).filter(Stores.id == reservation.store_id).first()
        res_dict["store_name"] = store.name if store else None

        # 学校名取得
        school = db.query(Schools).filter(Schools.id == reservation.school_id).first()
        res_dict["school_name"] = school.name if school else None

        # プロジェクト名取得
        if reservation.project_id:
            project = (
                db.query(Projects).filter(Projects.id == reservation.project_id).first()
            )
            res_dict["project_name"] = project.name if project else None

        result.append(ReservationWithDetails(**res_dict))

    return result


@router.get("/reservations/{reservation_id}", response_model=ReservationWithDetails)
def get_reservation(
    reservation_id: int, login_user: ViewerDependency, db: Session = Depends(get_db)
):
    """予約詳細取得"""
    reservation = (
        db.query(Reservations)
        .filter(Reservations.id == reservation_id, Reservations.deleted_at.is_(None))
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません"
        )

    res_dict = ReservationWithDetails.model_validate(reservation).model_dump()

    # 関連情報取得
    store = db.query(Stores).filter(Stores.id == reservation.store_id).first()
    res_dict["store_name"] = store.name if store else None

    school = db.query(Schools).filter(Schools.id == reservation.school_id).first()
    res_dict["school_name"] = school.name if school else None

    if reservation.project_id:
        project = (
            db.query(Projects).filter(Projects.id == reservation.project_id).first()
        )
        res_dict["project_name"] = project.name if project else None

    return ReservationWithDetails(**res_dict)


@router.put("/reservations/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: int,
    reservation: ReservationUpdate,
    login_user: StaffDependency,
    db: Session = Depends(get_db),
):
    """予約更新"""
    db_reservation = (
        db.query(Reservations)
        .filter(Reservations.id == reservation_id, Reservations.deleted_at.is_(None))
        .first()
    )

    if not db_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません"
        )

    # ステータス遷移のバリデーション
    if reservation.status:
        if db_reservation.status == "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="完了済みの予約は変更できません",
            )
        if reservation.status == "completed" and db_reservation.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="未確認の予約を直接完了にはできません。まず確定してください",
            )

    # 日時変更時のスケジュール調整
    if (
        (
            reservation.reservation_date
            and reservation.reservation_date != db_reservation.reservation_date
        )
        or (
            reservation.reservation_time
            and reservation.reservation_time != db_reservation.reservation_time
        )
        or (reservation.store_id and reservation.store_id != db_reservation.store_id)
    ):

        # 元のスケジュールの予約済数をデクリメント
        old_schedule = (
            db.query(Schedules)
            .filter(
                Schedules.store_id == db_reservation.store_id,
                Schedules.schedule_date == db_reservation.reservation_date,
                Schedules.start_time == db_reservation.reservation_time,
                Schedules.deleted_at.is_(None),
            )
            .first()
        )
        if old_schedule:
            old_schedule.reserved_count = max(0, old_schedule.reserved_count - 1)

        # 新しいスケジュールの空き確認とインクリメント
        new_date = reservation.reservation_date or db_reservation.reservation_date
        new_time = reservation.reservation_time or db_reservation.reservation_time
        new_store_id = reservation.store_id or db_reservation.store_id

        # 変更先の枠は同時予約と競合しうるため行ロックを取得する
        new_schedule = (
            db.query(Schedules)
            .filter(
                Schedules.store_id == new_store_id,
                Schedules.schedule_date == new_date,
                Schedules.start_time == new_time,
                Schedules.is_available.is_(True),
                Schedules.deleted_at.is_(None),
            )
            .with_for_update()
            .first()
        )

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

        new_schedule.reserved_count += 1

    # 更新処理
    update_data = reservation.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_reservation, field, value)

    db.commit()
    db.refresh(db_reservation)

    return db_reservation


@router.delete("/reservations/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_reservation(
    reservation_id: int, login_user: StaffDependency, db: Session = Depends(get_db)
):
    """予約キャンセル（ステータスをcancelledに変更）"""
    db_reservation = (
        db.query(Reservations)
        .filter(Reservations.id == reservation_id, Reservations.deleted_at.is_(None))
        .first()
    )

    if not db_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません"
        )

    if db_reservation.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="完了済みの予約はキャンセルできません",
        )

    if db_reservation.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="既にキャンセルされています"
        )

    # ステータスをcancelledに変更
    db_reservation.status = "cancelled"

    # スケジュールの予約済数をデクリメント
    schedule = (
        db.query(Schedules)
        .filter(
            Schedules.store_id == db_reservation.store_id,
            Schedules.schedule_date == db_reservation.reservation_date,
            Schedules.start_time == db_reservation.reservation_time,
            Schedules.deleted_at.is_(None),
        )
        .first()
    )

    if schedule:
        schedule.reserved_count = max(0, schedule.reserved_count - 1)

    db.commit()
    return None
