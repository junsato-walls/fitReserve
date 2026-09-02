# -*- coding: utf-8 -*-
"""店舗一覧の業務ロジック（顧客向け）"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Stores
from repository.query import stores as stores_query
from schema.stores import StorePublicQuery


def list_public_stores(db: Session, query: StorePublicQuery) -> list[Stores]:
    """顧客が選べる店舗を返す

    プロジェクトが指定された場合は対象店舗のみ。
    project_stores にレコードが無いプロジェクトは全店舗が対象という仕様。
    """
    store_ids = None
    if query.project_id:
        target_ids = stores_query.list_project_store_ids(db, query.project_id)
        if target_ids:
            store_ids = target_ids

    return stores_query.list_enabled(db, store_ids=store_ids)
