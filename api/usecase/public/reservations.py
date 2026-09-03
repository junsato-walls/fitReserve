# -*- coding: utf-8 -*-
"""予約登録の業務ロジック（顧客向け）"""

# 標準ライブラリ
from datetime import date

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Reservations
from repository.command import reservations as reservations_command
from repository.query import projects as projects_query
from repository.query import reservations as reservations_query
from repository.query import schools as schools_query
from repository.query import stores as stores_query
from schema.reservations import ReservationCreate
from usecase import slots as slots_logic


def create_reservation(db: Session, payload: ReservationCreate) -> Reservations:
    """予約を登録する（顧客向け・認証不要）

    枠の空き確認から予約の登録までを1つのトランザクションで行う。
    """
    store = stores_query.find_by_id(db, payload.store_id)
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された店舗が見つかりません",
        )

    school = schools_query.find_by_id(db, payload.school_id)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された学校が見つかりません",
        )

    if payload.project_id:
        _assert_within_accepting_period(
            db, payload.project_id, school.school_divisions_id, payload.reservation_date
        )

    # 店舗がその学校の制服を取り扱っているかの確認
    if not stores_query.handles_school(db, payload.store_id, payload.school_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この店舗では指定された学校の制服を取り扱っていません",
        )

    # 枠が予約できる状態かを確かめる。
    # 行ロックを取るため、以降のINSERTまで同時実行は直列化される
    slots_logic.take_slot(
        db, store, payload.reservation_date, payload.reservation_time
    )

    reservation = reservations_command.create(
        db,
        {
            **payload.model_dump(),
            "reservation_number": _generate_number(db, payload.reservation_date),
            "status": "pending",
        },
    )

    db.commit()
    db.refresh(reservation)
    return reservation


def _assert_within_accepting_period(
    db: Session, project_id: int, school_divisions_id: int, reservation_date: date
) -> None:
    """予約受付期間の内かを確認する

    受付期間は学校区分ごとに異なるため、プロジェクトではなく
    「この学校の区分」の期間で判定する。区分の登録が無い＝受付対象外。
    """
    project = projects_query.find_by_id(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたプロジェクトが見つかりません",
        )

    period = projects_query.find_division_period(db, project.id, school_divisions_id)
    if not period:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この学校区分は受付対象外です",
        )

    if not (period.start_date <= reservation_date <= period.end_date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="指定された日付は予約受付期間外です",
        )


def _generate_number(db: Session, reservation_date: date) -> str:
    """予約番号を生成する（RES-YYYY-MM-XXX形式）"""
    year = reservation_date.year
    month = reservation_date.month

    reservations_command.lock_numbering(db, year, month)

    prefix = f"RES-{year:04d}-{month:02d}-"
    latest = reservations_query.find_latest_number(db, prefix)
    next_number = int(latest.split("-")[-1]) + 1 if latest else 1

    return f"{prefix}{next_number:03d}"
