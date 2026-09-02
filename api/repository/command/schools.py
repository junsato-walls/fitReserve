# -*- coding: utf-8 -*-
"""学校のINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Schools
from system.clock import now


def create(db: Session, values: dict) -> Schools:
    """学校を追加する"""
    school = Schools(**values)
    db.add(school)
    db.flush()
    return school


def update(db: Session, school: Schools, values: dict) -> Schools:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(school, field, value)
    return school


def soft_delete(db: Session, school: Schools) -> Schools:
    """論理削除する"""
    school.deleted_at = now()
    return school
