# -*- coding: utf-8 -*-
"""スケジュール（予約枠）のSELECT"""

# 標準ライブラリ
from datetime import date, time
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Schedules


def find_by_id(db: Session, schedule_id: int) -> Optional[Schedules]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Schedules)
        .filter(Schedules.id == schedule_id, Schedules.deleted_at.is_(None))
        .first()
    )


def find_slot(
    db: Session,
    store_id: int,
    schedule_date: date,
    start_time: time,
    exclude_id: int = 0,
) -> Optional[Schedules]:
    """同一店舗・同一日時の枠を取得する（重複判定に使う）"""
    return (
        db.query(Schedules)
        .filter(
            Schedules.store_id == store_id,
            Schedules.schedule_date == schedule_date,
            Schedules.start_time == start_time,
            Schedules.deleted_at.is_(None),
            Schedules.id != exclude_id,
        )
        .first()
    )


def lock_open_slot(
    db: Session, store_id: int, schedule_date: date, start_time: time
) -> Optional[Schedules]:
    """予約可能な枠を行ロック付きで取得する

    空き確認から reserved_count の加算までを直列化し、
    同時予約によるオーバーブッキングを防ぐ。
    """
    return (
        db.query(Schedules)
        .filter(
            Schedules.store_id == store_id,
            Schedules.schedule_date == schedule_date,
            Schedules.start_time == start_time,
            Schedules.is_available.is_(True),
            Schedules.deleted_at.is_(None),
        )
        .with_for_update()
        .first()
    )


def search(
    db: Session,
    store_ids: Optional[list[int]] = None,
    skip: int = 0,
    limit: int = 100,
    store_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_available: Optional[bool] = None,
) -> list[Schedules]:
    """スケジュール一覧を取得する

    store_ids は担当店舗による絞り込み。None は全店舗を表す。
    """
    query = db.query(Schedules).filter(Schedules.deleted_at.is_(None))

    if store_ids is not None:
        query = query.filter(Schedules.store_id.in_(store_ids))
    if store_id:
        query = query.filter(Schedules.store_id == store_id)
    if date_from:
        query = query.filter(Schedules.schedule_date >= date_from)
    if date_to:
        query = query.filter(Schedules.schedule_date <= date_to)
    if is_available is not None:
        query = query.filter(Schedules.is_available == is_available)

    return (
        query.order_by(Schedules.schedule_date, Schedules.start_time)
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_open(
    db: Session,
    store_id: int,
    date_from: date,
    date_to: Optional[date] = None,
) -> list[Schedules]:
    """予約可能な枠を取得する（空き状況の表示に使う）"""
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

    return query.order_by(Schedules.schedule_date, Schedules.start_time).all()
