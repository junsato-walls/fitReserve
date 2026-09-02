# -*- coding: utf-8 -*-
"""店舗のSELECT"""

# 標準ライブラリ
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import ProjectStores, Stores, StoreSchools


def find_by_id(db: Session, store_id: int) -> Optional[Stores]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Stores)
        .filter(Stores.id == store_id, Stores.deleted_at.is_(None))
        .first()
    )


def find_enabled_by_id(db: Session, store_id: int) -> Optional[Stores]:
    """公開対象（有効）の店舗を1件取得する"""
    return (
        db.query(Stores)
        .filter(
            Stores.id == store_id,
            Stores.is_enabled.is_(True),
            Stores.deleted_at.is_(None),
        )
        .first()
    )


def exists_store_code(db: Session, store_code: str, exclude_id: int = 0) -> bool:
    """店舗コードが既に使われているか"""
    return (
        db.query(Stores.id)
        .filter(
            Stores.store_code == store_code,
            Stores.deleted_at.is_(None),
            Stores.id != exclude_id,
        )
        .first()
        is not None
    )


def search(
    db: Session, skip: int = 0, limit: int = 100, include_deleted: bool = False
) -> list[Stores]:
    """店舗一覧を取得する"""
    query = db.query(Stores)
    if not include_deleted:
        query = query.filter(Stores.deleted_at.is_(None))
    return query.order_by(Stores.id).offset(skip).limit(limit).all()


def list_enabled(db: Session, store_ids: Optional[list[int]] = None) -> list[Stores]:
    """公開対象（有効）の店舗を取得する。store_ids 指定時はその店舗のみ"""
    query = db.query(Stores).filter(
        Stores.is_enabled.is_(True),
        Stores.deleted_at.is_(None),
    )
    if store_ids is not None:
        query = query.filter(Stores.id.in_(store_ids))
    return query.order_by(Stores.name).all()


def count_existing(db: Session, store_ids: list[int]) -> int:
    """指定IDのうち実在する（削除されていない）店舗の件数"""
    if not store_ids:
        return 0
    return (
        db.query(Stores.id)
        .filter(Stores.id.in_(store_ids), Stores.deleted_at.is_(None))
        .count()
    )


def names_by_ids(db: Session, store_ids: set[int]) -> dict[int, str]:
    """IDから店舗名を引く辞書"""
    if not store_ids:
        return {}
    rows = db.query(Stores.id, Stores.name).filter(Stores.id.in_(store_ids)).all()
    return {row.id: row.name for row in rows}


def list_school_ids(db: Session, store_id: int) -> list[int]:
    """店舗が取り扱う学校IDを取得する"""
    return [
        row.school_id
        for row in db.query(StoreSchools.school_id)
        .filter(StoreSchools.store_id == store_id)
        .order_by(StoreSchools.school_id)
        .all()
    ]


def handles_school(db: Session, store_id: int, school_id: int) -> bool:
    """その店舗が指定学校の制服を取り扱っているか"""
    return (
        db.query(StoreSchools.store_id)
        .filter(
            StoreSchools.store_id == store_id,
            StoreSchools.school_id == school_id,
        )
        .first()
        is not None
    )


def list_project_store_ids(db: Session, project_id: int) -> list[int]:
    """プロジェクトの対象店舗IDを取得する（空なら全店舗が対象という仕様）"""
    return [
        row.store_id
        for row in db.query(ProjectStores.store_id)
        .filter(ProjectStores.project_id == project_id)
        .order_by(ProjectStores.store_id)
        .all()
    ]
