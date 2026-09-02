# -*- coding: utf-8 -*-
"""会社のINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Companies
from system.clock import now


def create(db: Session, values: dict) -> Companies:
    """会社を追加する"""
    company = Companies(**values)
    db.add(company)
    db.flush()
    return company


def update(db: Session, company: Companies, values: dict) -> Companies:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(company, field, value)
    return company


def soft_delete(db: Session, company: Companies, updated_by: int) -> Companies:
    """論理削除する"""
    company.deleted_at = now()
    company.updated_by = updated_by
    return company
