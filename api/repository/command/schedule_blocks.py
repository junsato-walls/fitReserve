# -*- coding: utf-8 -*-
"""枠止めのINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import ScheduleBlocks
from system.clock import now


def create(db: Session, values: dict) -> ScheduleBlocks:
    """枠止めを追加する"""
    block = ScheduleBlocks(**values)
    db.add(block)
    db.flush()
    return block


def update(db: Session, block: ScheduleBlocks, values: dict) -> ScheduleBlocks:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(block, field, value)
    return block


def soft_delete(db: Session, block: ScheduleBlocks) -> ScheduleBlocks:
    """論理削除する"""
    block.deleted_at = now()
    return block
