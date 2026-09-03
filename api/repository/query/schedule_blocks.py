# -*- coding: utf-8 -*-
"""枠止めのSELECT"""

# 標準ライブラリ
from datetime import date, time
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import ScheduleBlocks


def find_by_id(db: Session, block_id: int) -> Optional[ScheduleBlocks]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(ScheduleBlocks)
        .filter(ScheduleBlocks.id == block_id, ScheduleBlocks.deleted_at.is_(None))
        .first()
    )


def list_range(
    db: Session, store_ids: list[int], date_from: date, date_to: date
) -> list[ScheduleBlocks]:
    """指定店舗・期間の枠止めをまとめて取得する（タイムテーブル用）"""
    if not store_ids:
        return []

    return (
        db.query(ScheduleBlocks)
        .filter(
            ScheduleBlocks.store_id.in_(store_ids),
            ScheduleBlocks.block_date >= date_from,
            ScheduleBlocks.block_date <= date_to,
            ScheduleBlocks.deleted_at.is_(None),
        )
        .order_by(ScheduleBlocks.block_date, ScheduleBlocks.start_time)
        .all()
    )


def find_overlapping(
    db: Session,
    store_id: int,
    block_date: date,
    start_time: time,
    end_time: time,
    exclude_id: int = 0,
) -> Optional[ScheduleBlocks]:
    """時間が重なる枠止めを1件返す（重複登録の判定に使う）"""
    return (
        db.query(ScheduleBlocks)
        .filter(
            ScheduleBlocks.store_id == store_id,
            ScheduleBlocks.block_date == block_date,
            # 半開区間 [start, end) どうしの重なり
            ScheduleBlocks.start_time < end_time,
            ScheduleBlocks.end_time > start_time,
            ScheduleBlocks.deleted_at.is_(None),
            ScheduleBlocks.id != exclude_id,
        )
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
) -> list[ScheduleBlocks]:
    """枠止め一覧を取得する

    store_ids は担当店舗による絞り込み。None は全店舗を表す。
    """
    query = db.query(ScheduleBlocks).filter(ScheduleBlocks.deleted_at.is_(None))

    if store_ids is not None:
        query = query.filter(ScheduleBlocks.store_id.in_(store_ids))
    if store_id:
        query = query.filter(ScheduleBlocks.store_id == store_id)
    if date_from:
        query = query.filter(ScheduleBlocks.block_date >= date_from)
    if date_to:
        query = query.filter(ScheduleBlocks.block_date <= date_to)

    return (
        query.order_by(ScheduleBlocks.block_date, ScheduleBlocks.start_time)
        .offset(skip)
        .limit(limit)
        .all()
    )
