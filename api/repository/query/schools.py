# -*- coding: utf-8 -*-
"""学校のSELECT"""

# 標準ライブラリ
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Schools, StoreSchools


def find_by_id(db: Session, school_id: int) -> Optional[Schools]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Schools)
        .filter(Schools.id == school_id, Schools.deleted_at.is_(None))
        .first()
    )


def exists_school_code(db: Session, school_code: str, exclude_id: int = 0) -> bool:
    """学校コードが既に使われているか"""
    return (
        db.query(Schools.id)
        .filter(
            Schools.school_code == school_code,
            Schools.deleted_at.is_(None),
            Schools.id != exclude_id,
        )
        .first()
        is not None
    )


def search(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    school_divisions_id: Optional[int] = None,
    include_deleted: bool = False,
) -> list[Schools]:
    """学校一覧を取得する"""
    query = db.query(Schools)
    if not include_deleted:
        query = query.filter(Schools.deleted_at.is_(None))
    if school_divisions_id:
        query = query.filter(Schools.school_divisions_id == school_divisions_id)
    return query.order_by(Schools.id).offset(skip).limit(limit).all()


def list_enabled(
    db: Session,
    store_id: Optional[int] = None,
    division_ids: Optional[list[int]] = None,
) -> list[Schools]:
    """公開対象（有効）の学校を取得する

    store_id    : その店舗が取り扱う学校のみ（store_schools）
    division_ids: その学校区分に属する学校のみ
    """
    query = db.query(Schools).filter(
        Schools.is_enabled.is_(True),
        Schools.deleted_at.is_(None),
    )

    if store_id:
        # 取り扱いが1件も登録されていない店舗は、学校を選べない状態が正しい。
        # （プロジェクトの「レコードなし＝全対象」とは扱いが異なる）
        query = query.join(StoreSchools, StoreSchools.school_id == Schools.id).filter(
            StoreSchools.store_id == store_id
        )

    if division_ids is not None:
        query = query.filter(Schools.school_divisions_id.in_(division_ids))

    return query.order_by(Schools.name).all()


def names_by_ids(db: Session, school_ids: set[int]) -> dict[int, str]:
    """IDから学校名を引く辞書"""
    if not school_ids:
        return {}
    rows = db.query(Schools.id, Schools.name).filter(Schools.id.in_(school_ids)).all()
    return {row.id: row.name for row in rows}
