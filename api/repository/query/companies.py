# -*- coding: utf-8 -*-
"""会社のSELECT"""

# 標準ライブラリ
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Companies


def find_by_id(db: Session, company_id: int) -> Optional[Companies]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Companies)
        .filter(Companies.id == company_id, Companies.deleted_at.is_(None))
        .first()
    )


def find_by_slug(db: Session, slug: str) -> Optional[Companies]:
    """スラッグ（予約URLの先頭）で1件取得する"""
    return (
        db.query(Companies)
        .filter(Companies.slug == slug, Companies.deleted_at.is_(None))
        .first()
    )


def exists_slug(db: Session, slug: str, exclude_id: int = 0) -> bool:
    """スラッグが既に使われているか"""
    return (
        db.query(Companies.id)
        .filter(
            Companies.slug == slug,
            Companies.deleted_at.is_(None),
            Companies.id != exclude_id,
        )
        .first()
        is not None
    )


def exists_company_code(db: Session, company_code: str, exclude_id: int = 0) -> bool:
    """会社コードが既に使われているか"""
    return (
        db.query(Companies.id)
        .filter(
            Companies.company_code == company_code,
            Companies.deleted_at.is_(None),
            Companies.id != exclude_id,
        )
        .first()
        is not None
    )


def list_all(db: Session) -> list[Companies]:
    """会社一覧を取得する（削除済みは除く）"""
    return (
        db.query(Companies)
        .filter(Companies.deleted_at.is_(None))
        .order_by(Companies.id)
        .all()
    )
