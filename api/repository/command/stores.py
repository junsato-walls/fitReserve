# -*- coding: utf-8 -*-
"""店舗のINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Stores, StoreSchools
from system.clock import now


def create(db: Session, values: dict) -> Stores:
    """店舗を追加する

    取り扱い学校の登録に店舗IDが必要なため flush までは行う。
    """
    store = Stores(**values)
    db.add(store)
    db.flush()
    return store


def update(db: Session, store: Stores, values: dict) -> Stores:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(store, field, value)
    return store


def soft_delete(db: Session, store: Stores) -> Stores:
    """論理削除する"""
    store.deleted_at = now()
    return store


def replace_school_ids(db: Session, store_id: int, school_ids: list[int]) -> None:
    """取り扱い学校を指定された内容で置き換える"""
    db.query(StoreSchools).filter(StoreSchools.store_id == store_id).delete()
    for school_id in sorted(set(school_ids)):
        db.add(StoreSchools(store_id=store_id, school_id=school_id))
