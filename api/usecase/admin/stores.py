# -*- coding: utf-8 -*-
"""店舗マスタの業務ロジック"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Stores
from repository.command import stores as stores_command
from repository.query import stores as stores_query
from schema.stores import (
    StoreCreate,
    StoreResponse,
    StoreSearchQuery,
    StoreUpdate,
)

NOT_FOUND = "店舗が見つかりません"
DUPLICATED_CODE = "この店舗コードは既に使用されています"


def list_stores(db: Session, query: StoreSearchQuery) -> list[StoreResponse]:
    """店舗一覧を取得する（取り扱い学校IDつき）"""
    stores = stores_query.search(
        db,
        skip=query.skip,
        limit=query.limit,
        include_deleted=query.include_deleted,
    )
    return [_to_response(db, store) for store in stores]


def get_store(db: Session, store_id: int) -> StoreResponse:
    """店舗を1件取得する（取り扱い学校IDつき）"""
    return _to_response(db, _find(db, store_id))


def create_store(db: Session, payload: StoreCreate) -> StoreResponse:
    """店舗を新規作成する"""
    if stores_query.exists_store_code(db, payload.store_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATED_CODE
        )

    store = stores_command.create(db, payload.model_dump(exclude={"school_ids"}))

    if payload.school_ids:
        stores_command.replace_school_ids(db, store.id, payload.school_ids)

    db.commit()
    db.refresh(store)
    return _to_response(db, store)


def update_store(db: Session, store_id: int, payload: StoreUpdate) -> StoreResponse:
    """店舗を更新する"""
    store = _find(db, store_id)

    if payload.store_code and payload.store_code != store.store_code:
        if stores_query.exists_store_code(db, payload.store_code, exclude_id=store_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATED_CODE
            )

    stores_command.update(
        db, store, payload.model_dump(exclude_unset=True, exclude={"school_ids"})
    )

    # 取り扱い学校の更新（未指定なら変更しない）
    if payload.school_ids is not None:
        stores_command.replace_school_ids(db, store_id, payload.school_ids)

    db.commit()
    db.refresh(store)
    return _to_response(db, store)


def delete_store(db: Session, store_id: int) -> None:
    """店舗を削除する（論理削除）"""
    store = _find(db, store_id)
    stores_command.soft_delete(db, store)
    db.commit()


def _find(db: Session, store_id: int) -> Stores:
    store = stores_query.find_by_id(db, store_id)
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return store


def _to_response(db: Session, store: Stores) -> StoreResponse:
    """店舗に取り扱い学校IDを添えてレスポンスを組み立てる"""
    values = StoreResponse.model_validate(store).model_dump()
    values["school_ids"] = stores_query.list_school_ids(db, store.id)
    return StoreResponse(**values)
