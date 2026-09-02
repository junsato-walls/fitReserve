# -*- coding: utf-8 -*-
"""店舗管理API（admin以上）"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# ローカル
from schema.stores import StoreCreate, StoreResponse, StoreSearchQuery, StoreUpdate
from system.db import get_db
from usecase.admin import stores as stores_usecase

router = APIRouter()


@router.get("/stores", response_model=List[StoreResponse])
def get_stores(
    query: Annotated[StoreSearchQuery, Query()], db: Session = Depends(get_db)
):
    """店舗一覧取得"""
    return stores_usecase.list_stores(db, query)


@router.get("/stores/{store_id}", response_model=StoreResponse)
def get_store(store_id: int, db: Session = Depends(get_db)):
    """店舗詳細取得"""
    return stores_usecase.get_store(db, store_id)


@router.post(
    "/stores", response_model=StoreResponse, status_code=status.HTTP_201_CREATED
)
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    """店舗新規作成"""
    return stores_usecase.create_store(db, store)


@router.put("/stores/{store_id}", response_model=StoreResponse)
def update_store(store_id: int, store: StoreUpdate, db: Session = Depends(get_db)):
    """店舗更新"""
    return stores_usecase.update_store(db, store_id, store)


@router.delete("/stores/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_store(store_id: int, db: Session = Depends(get_db)):
    """店舗削除（論理削除）"""
    stores_usecase.delete_store(db, store_id)
