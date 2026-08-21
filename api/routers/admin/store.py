# -*- coding: utf-8 -*-
"""店舗管理API（管理者専用）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from system.db import get_db
from system.models import Stores
from schemas.stores import StoreCreate, StoreUpdate, StoreResponse
from schemas.custom.auth import DecodedToken
from system.auth import require_admin
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "stores"

# 管理者のみアクセス可能
UserDependency = Annotated[DecodedToken, Depends(require_admin)]


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/stores", response_model=List[StoreResponse])
def get_stores(
    login_user: UserDependency,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
):
    """店舗一覧取得"""
    query = db.query(Stores)
    if not include_deleted:
        query = query.filter(Stores.deleted_at.is_(None))
    stores = query.offset(skip).limit(limit).all()
    return stores


@router.get("/stores/{store_id}", response_model=StoreResponse)
def get_store(store_id: int, login_user: UserDependency, db: Session = Depends(get_db)):
    """店舗詳細取得"""
    store = (
        db.query(Stores)
        .filter(Stores.id == store_id, Stores.deleted_at.is_(None))
        .first()
    )
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="店舗が見つかりません"
        )
    return store


@router.post(
    "/stores", response_model=StoreResponse, status_code=status.HTTP_201_CREATED
)
def create_store(
    store: StoreCreate, login_user: UserDependency, db: Session = Depends(get_db)
):
    """店舗新規作成"""
    # 店舗コードの重複チェック
    existing = (
        db.query(Stores)
        .filter(Stores.store_code == store.store_code, Stores.deleted_at.is_(None))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この店舗コードは既に使用されています",
        )

    db_store = Stores(**store.model_dump())
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store


@router.put("/stores/{store_id}", response_model=StoreResponse)
def update_store(
    store_id: int,
    store: StoreUpdate,
    login_user: UserDependency,
    db: Session = Depends(get_db),
):
    """店舗更新"""
    db_store = (
        db.query(Stores)
        .filter(Stores.id == store_id, Stores.deleted_at.is_(None))
        .first()
    )
    if not db_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="店舗が見つかりません"
        )

    # 店舗コード変更時の重複チェック
    if store.store_code and store.store_code != db_store.store_code:
        existing = (
            db.query(Stores)
            .filter(
                Stores.store_code == store.store_code,
                Stores.deleted_at.is_(None),
                Stores.id != store_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この店舗コードは既に使用されています",
            )

    # 更新処理
    update_data = store.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_store, field, value)

    db.commit()
    db.refresh(db_store)
    return db_store


@router.delete("/stores/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(
    store_id: int, login_user: UserDependency, db: Session = Depends(get_db)
):
    """店舗削除（論理削除）"""
    db_store = (
        db.query(Stores)
        .filter(Stores.id == store_id, Stores.deleted_at.is_(None))
        .first()
    )
    if not db_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="店舗が見つかりません"
        )

    db_store.deleted_at = jst()
    db.commit()
    return None
