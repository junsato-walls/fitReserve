# -*- coding: utf-8 -*-
"""店舗取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import Stores, ProjectStores
from schemas.public.stores import StorePublic
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "public-stores"


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/stores", response_model=list[StorePublic])
def get_stores(
    project_id: int | None = Query(None, description="プロジェクトID"),
    db: Session = Depends(get_db),
):
    """店舗一覧を取得（顧客向け）

    プロジェクトIDが指定された場合、そのプロジェクトに紐づく店舗のみを返す。
    未指定の場合は全ての有効な店舗を返す。
    """
    query = db.query(Stores).filter(
        Stores.is_enabled.is_(True),
        Stores.deleted_at.is_(None),
    )

    if project_id:
        # プロジェクトに紐づく店舗のみ取得
        store_ids = (
            db.query(ProjectStores.store_id)
            .filter(ProjectStores.project_id == project_id)
            .all()
        )

        if store_ids:
            # project_storesにレコードがある場合は指定店舗のみ
            query = query.filter(Stores.id.in_([s.store_id for s in store_ids]))
        # レコードがない場合は全店舗が対象（仕様通り）

    stores = query.order_by(Stores.name).all()
    return stores
