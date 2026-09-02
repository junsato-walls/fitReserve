# -*- coding: utf-8 -*-
"""店舗取得API（公開・認証不要）"""

# 標準ライブラリ
from typing import Annotated

# サードパーティ
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import stores as stores_query
from schema.stores import StorePublic, StorePublicQuery
from system.db import get_db
from usecase.public import stores as stores_usecase

router = APIRouter()


@router.get("/stores", response_model=list[StorePublic])
def get_stores(
    query: Annotated[StorePublicQuery, Query()], db: Session = Depends(get_db)
):
    """店舗一覧を取得（顧客向け）"""
    return stores_usecase.list_public_stores(db, query)


@router.get("/stores/{store_id}", response_model=StorePublic)
def get_store(store_id: int, db: Session = Depends(get_db)):
    """店舗詳細を取得（顧客向け）

    予約URLに店舗IDが含まれるため、フォームの見出しに店舗名を出すのに使う。
    """
    store = stores_query.find_enabled_by_id(db, store_id)
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="店舗が見つかりません"
        )
    return store
