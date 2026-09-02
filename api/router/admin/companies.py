# -*- coding: utf-8 -*-
"""会社取得API（admin以上）

会社の追加・変更は super_admin の操作のため /sysadmin/companies が担当する。
ここはプロジェクトの所属会社を選ぶための参照だけを提供する。
"""

# 標準ライブラリ
from typing import List

# サードパーティ
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# ローカル
from repository.query import companies as companies_query
from schema.companies import CompanyResponse
from system.db import get_db

router = APIRouter()


@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    """会社一覧取得

    プロジェクトの所属会社の選択と、予約URL（/[company_slug]/...）の
    組み立てに使う。
    """
    return companies_query.list_all(db)
