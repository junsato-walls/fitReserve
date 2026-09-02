# -*- coding: utf-8 -*-
"""予約のSELECT"""

# 標準ライブラリ
from datetime import date
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Reservations


def find_by_id(db: Session, reservation_id: int) -> Optional[Reservations]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Reservations)
        .filter(Reservations.id == reservation_id, Reservations.deleted_at.is_(None))
        .first()
    )


def find_by_number(db: Session, reservation_number: str) -> Optional[Reservations]:
    """予約番号で1件取得する（顧客の照会に使う）"""
    return (
        db.query(Reservations)
        .filter(
            Reservations.reservation_number == reservation_number,
            Reservations.deleted_at.is_(None),
        )
        .first()
    )


def find_latest_number(db: Session, prefix: str) -> Optional[str]:
    """同じ接頭辞を持つ予約番号のうち、最も大きいものを取得する"""
    latest = (
        db.query(Reservations.reservation_number)
        .filter(Reservations.reservation_number.like(f"{prefix}%"))
        .order_by(Reservations.reservation_number.desc())
        .first()
    )
    return latest.reservation_number if latest else None


def search(
    db: Session,
    store_ids: Optional[list[int]] = None,
    skip: int = 0,
    limit: int = 100,
    store_id: Optional[int] = None,
    school_id: Optional[int] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> list[Reservations]:
    """予約一覧を取得する

    store_ids は担当店舗による絞り込み。None は全店舗を表す。
    """
    query = db.query(Reservations).filter(Reservations.deleted_at.is_(None))

    if store_ids is not None:
        query = query.filter(Reservations.store_id.in_(store_ids))
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

    return (
        query.order_by(
            Reservations.reservation_date.desc(), Reservations.reservation_time.desc()
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
