# -*- coding: utf-8 -*-
"""ユーザーのSELECT"""

# 標準ライブラリ
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Users, UserStores


def find_by_id(db: Session, user_id: int) -> Optional[Users]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Users).filter(Users.id == user_id, Users.deleted_at.is_(None)).first()
    )


def find_by_personal_id(db: Session, personal_id: str) -> Optional[Users]:
    """ログインIDで1件取得する（削除済みは除く）"""
    return (
        db.query(Users)
        .filter(Users.personal_id == personal_id, Users.deleted_at.is_(None))
        .first()
    )


def exists_personal_id(db: Session, personal_id: str, exclude_id: int = 0) -> bool:
    """ログインIDが既に使われているか"""
    return (
        db.query(Users.id)
        .filter(
            Users.personal_id == personal_id,
            Users.deleted_at.is_(None),
            Users.id != exclude_id,
        )
        .first()
        is not None
    )


def search(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    store_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    include_deleted: bool = False,
) -> list[Users]:
    """条件に合うユーザーを取得する"""
    query = db.query(Users)
    if not include_deleted:
        query = query.filter(Users.deleted_at.is_(None))

    if role:
        query = query.filter(Users.role == role)
    if store_id is not None:
        # 所属店舗ではなく、権限の対象である担当店舗で絞る
        query = query.filter(
            Users.id.in_(
                db.query(UserStores.user_id).filter(UserStores.store_id == store_id)
            )
        )
    if is_active is not None:
        query = query.filter(Users.is_active == is_active)

    return query.order_by(Users.id).offset(skip).limit(limit).all()


def list_store_ids(db: Session, user_id: int) -> list[int]:
    """担当店舗IDを取得する"""
    return [
        row.store_id
        for row in db.query(UserStores.store_id)
        .filter(UserStores.user_id == user_id)
        .order_by(UserStores.store_id)
        .all()
    ]


def store_ids_by_user(db: Session, user_ids: list[int]) -> dict[int, list[int]]:
    """複数ユーザーの担当店舗IDを1クエリでまとめて取得する"""
    if not user_ids:
        return {}

    rows = (
        db.query(UserStores.user_id, UserStores.store_id)
        .filter(UserStores.user_id.in_(user_ids))
        .order_by(UserStores.user_id, UserStores.store_id)
        .all()
    )
    result: dict[int, list[int]] = {}
    for row in rows:
        result.setdefault(row.user_id, []).append(row.store_id)
    return result
