# -*- coding: utf-8 -*-
"""スケジュール（店舗×日の受付設定）のINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Schedules
from system.clock import now


def create(db: Session, values: dict) -> Schedules:
    """1日分の受付設定を追加する"""
    schedule = Schedules(**values)
    db.add(schedule)
    db.flush()
    return schedule


def create_many(db: Session, rows: list[dict]) -> int:
    """複数日の受付設定をまとめて追加する（プロジェクト作成時の一括生成）"""
    if not rows:
        return 0

    db.bulk_insert_mappings(Schedules, rows)
    return len(rows)


def update(db: Session, schedule: Schedules, values: dict) -> Schedules:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(schedule, field, value)
    return schedule


def soft_delete(db: Session, schedule: Schedules) -> Schedules:
    """論理削除する"""
    schedule.deleted_at = now()
    return schedule
