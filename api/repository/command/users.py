# -*- coding: utf-8 -*-
"""ユーザーのINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Users, UserStores
from system.clock import now


def create(db: Session, values: dict) -> Users:
    """ユーザーを追加する

    担当店舗の登録にIDが必要なため flush までは行う（commitはしない）。
    """
    user = Users(**values)
    db.add(user)
    db.flush()
    return user


def update(db: Session, user: Users, values: dict) -> Users:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(user, field, value)
    return user


def soft_delete(db: Session, user: Users) -> Users:
    """論理削除する"""
    user.deleted_at = now()
    return user


def replace_store_ids(db: Session, user_id: int, store_ids: list[int]) -> None:
    """担当店舗を指定された内容で置き換える"""
    db.query(UserStores).filter(UserStores.user_id == user_id).delete()
    for store_id in sorted(set(store_ids)):
        db.add(UserStores(user_id=user_id, store_id=store_id))
