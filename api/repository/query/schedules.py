# -*- coding: utf-8 -*-
"""スケジュール（店舗×日の受付設定）のSELECT"""

# 標準ライブラリ
from datetime import date
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


def find_day(db: Session, store_id: int, schedule_date: date) -> Optional[Schedules]:
    """店舗×日の設定を1件取得する"""
    return (
        db.query(Schedules)
        .filter(
            Schedules.store_id == store_id,
            Schedules.schedule_date == schedule_date,
            Schedules.deleted_at.is_(None),
        )
        .first()
    )


def lock_day(db: Session, store_id: int, schedule_date: date) -> Optional[Schedules]:
    """受付中の日を行ロック付きで取得する

    空き確認から予約の登録までを直列化し、
    同時予約によるオーバーブッキングを防ぐ。
    """
    return (
        db.query(Schedules)
        .filter(
            Schedules.store_id == store_id,
            Schedules.schedule_date == schedule_date,
            Schedules.is_available.is_(True),
            Schedules.deleted_at.is_(None),
        )
        .with_for_update()
        .first()
    )


def list_days(
    db: Session,
    store_ids: list[int],
    date_from: date,
    date_to: date,
) -> list[Schedules]:
    """指定店舗・期間の設定をまとめて取得する（タイムテーブル用）"""
    if not store_ids:
        return []

    return (
        db.query(Schedules)
        .filter(
            Schedules.store_id.in_(store_ids),
            Schedules.schedule_date >= date_from,
            Schedules.schedule_date <= date_to,
            Schedules.deleted_at.is_(None),
        )
        .order_by(Schedules.schedule_date, Schedules.store_id)
        .all()
    )


def list_existing_dates(
    db: Session, store_id: int, date_from: date, date_to: date
) -> set[date]:
    """既に設定がある日を返す

    プロジェクト作成時の一括生成で、既存の日を上書きしないために使う。
    """
    rows = (
        db.query(Schedules.schedule_date)
        .filter(
            Schedules.store_id == store_id,
            Schedules.schedule_date >= date_from,
            Schedules.schedule_date <= date_to,
            Schedules.deleted_at.is_(None),
        )
        .all()
    )
    return {row[0] for row in rows}


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
        query.order_by(Schedules.schedule_date, Schedules.store_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
