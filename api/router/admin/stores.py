# -*- coding: utf-8 -*-
"""店舗管理API（管理者専用）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from system.db import get_db
from system.models import Stores, StoreSchools
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


def _to_response(store: Stores, db: Session) -> StoreResponse:
    """店舗に取り扱い学校IDを添えてレスポンスを組み立てる"""
    store_dict = StoreResponse.model_validate(store).model_dump()
    store_dict["school_ids"] = [
        ss.school_id
        for ss in db.query(StoreSchools).filter(StoreSchools.store_id == store.id).all()
    ]
    return StoreResponse(**store_dict)


def _replace_school_ids(store_id: int, school_ids: List[int], db: Session) -> None:
    """取り扱い学校を指定された内容で置き換える"""
    db.query(StoreSchools).filter(StoreSchools.store_id == store_id).delete()
    for school_id in school_ids:
        db.add(StoreSchools(store_id=store_id, school_id=school_id))


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
    return [_to_response(store, db) for store in stores]


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
    return _to_response(store, db)


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

    db_store = Stores(**store.model_dump(exclude={"school_ids"}))
    db.add(db_store)
    db.flush()  # school_ids の登録に店舗IDが必要なため、先にIDを確定させる

    if store.school_ids:
        _replace_school_ids(db_store.id, store.school_ids, db)

    db.commit()
    db.refresh(db_store)
    return _to_response(db_store, db)


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
    update_data = store.model_dump(exclude_unset=True, exclude={"school_ids"})
    for field, value in update_data.items():
        setattr(db_store, field, value)

    # 取り扱い学校の更新（未指定なら変更しない）
    if store.school_ids is not None:
        _replace_school_ids(store_id, store.school_ids, db)

    db.commit()
    db.refresh(db_store)
    return _to_response(db_store, db)


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
