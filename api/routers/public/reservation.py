# -*- coding: utf-8 -*-
"""予約登録API（公開・認証不要）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import (
    Reservations,
    Schedules,
    Stores,
    Schools,
    Projects,
    ProjectSchoolDivisions,
    StoreSchools,
)
from schemas.reservations import ReservationCreate, ReservationResponse
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "public-reservations"


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


def generate_reservation_number(db: Session, reservation_date: datetime.date) -> str:
    """予約番号を生成（RES-YYYY-MM-XXX形式）"""
    year = reservation_date.year
    month = reservation_date.month

    # 同時採番による予約番号の重複を防ぐ（トランザクション終了時に自動解放される）
    db.execute(
        text("SELECT pg_advisory_xact_lock(:lock_key)"),
        {"lock_key": year * 100 + month},
    )

    # 同月の最新の予約番号を取得
    prefix = f"RES-{year:04d}-{month:02d}-"
    latest = (
        db.query(Reservations)
        .filter(Reservations.reservation_number.like(f"{prefix}%"))
        .order_by(Reservations.reservation_number.desc())
        .first()
    )

    if latest:
        # 最新の連番を取得してインクリメント
        last_number = int(latest.reservation_number.split("-")[-1])
        new_number = last_number + 1
    else:
        new_number = 1

    return f"{prefix}{new_number:03d}"


@router.post(
    "/reservations",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    """予約新規作成（顧客向け・認証不要）"""

    # 店舗の存在確認
    store = (
        db.query(Stores)
        .filter(Stores.id == reservation.store_id, Stores.deleted_at.is_(None))
        .first()
    )
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された店舗が見つかりません",
        )

    # 学校の存在確認
    school = (
        db.query(Schools)
        .filter(Schools.id == reservation.school_id, Schools.deleted_at.is_(None))
        .first()
    )
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された学校が見つかりません",
        )

    # プロジェクトの存在確認（指定されている場合）
    if reservation.project_id:
        project = (
            db.query(Projects)
            .filter(
                Projects.id == reservation.project_id, Projects.deleted_at.is_(None)
            )
            .first()
        )
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定されたプロジェクトが見つかりません",
            )

        # 予約受付期間のチェック
        #
        # 受付期間は学校区分ごとに異なるため、プロジェクトではなく
        # 「この学校の区分」の期間で判定する。
        # 区分の登録が無い＝その区分は受付対象外。
        period = (
            db.query(ProjectSchoolDivisions)
            .filter(
                ProjectSchoolDivisions.project_id == project.id,
                ProjectSchoolDivisions.school_divisions_id
                == school.school_divisions_id,
            )
            .first()
        )
        if not period:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この学校区分は受付対象外です",
            )

        if not (period.start_date <= reservation.reservation_date <= period.end_date):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="指定された日付は予約受付期間外です",
            )

    # 店舗がその学校の制服を取り扱っているかの確認
    handled = (
        db.query(StoreSchools)
        .filter(
            StoreSchools.store_id == reservation.store_id,
            StoreSchools.school_id == reservation.school_id,
        )
        .first()
    )
    if not handled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この店舗では指定された学校の制服を取り扱っていません",
        )

    # スケジュールの空き確認
    # 同時予約によるオーバーブッキングを防ぐため、
    # 空き確認からreserved_countの加算までを行ロックで直列化する
    schedule = (
        db.query(Schedules)
        .filter(
            Schedules.store_id == reservation.store_id,
            Schedules.schedule_date == reservation.reservation_date,
            Schedules.start_time == reservation.reservation_time,
            Schedules.is_available.is_(True),
            Schedules.deleted_at.is_(None),
        )
        .with_for_update()
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された日時の予約枠が見つかりません",
        )

    if schedule.reserved_count >= schedule.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="指定された日時は既に満席です",
        )

    # 予約番号を生成
    reservation_number = generate_reservation_number(db, reservation.reservation_date)

    # 予約を作成
    db_reservation = Reservations(
        **reservation.model_dump(),
        reservation_number=reservation_number,
        status="pending",
    )
    db.add(db_reservation)

    # スケジュールの予約済数をインクリメント
    schedule.reserved_count += 1

    db.commit()
    db.refresh(db_reservation)

    return db_reservation


@router.get("/reservations/{reservation_number}", response_model=ReservationResponse)
def get_reservation_by_number(reservation_number: str, db: Session = Depends(get_db)):
    """予約番号で予約を検索（顧客向け）"""
    reservation = (
        db.query(Reservations)
        .filter(
            Reservations.reservation_number == reservation_number,
            Reservations.deleted_at.is_(None),
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません"
        )

    return reservation
