# -*- coding: utf-8 -*-
"""スケジュール（予約枠）のINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Schedules
from system.clock import now


def create(db: Session, values: dict) -> Schedules:
    """予約枠を追加する"""
    schedule = Schedules(**values)
    db.add(schedule)
    db.flush()
    return schedule


def update(db: Session, schedule: Schedules, values: dict) -> Schedules:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(schedule, field, value)
    return schedule


def soft_delete(db: Session, schedule: Schedules) -> Schedules:
    """論理削除する"""
    schedule.deleted_at = now()
    return schedule


def increment_reserved(db: Session, schedule: Schedules) -> Schedules:
    """予約済数を1増やす"""
    schedule.reserved_count += 1
    return schedule


def decrement_reserved(db: Session, schedule: Schedules) -> Schedules:
    """予約済数を1減らす（0未満にはしない）"""
    schedule.reserved_count = max(0, schedule.reserved_count - 1)
    return schedule
