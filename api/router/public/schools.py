# -*- coding: utf-8 -*-
"""学校取得API（公開・認証不要）"""

# 標準ライブラリ
from typing import Annotated

# サードパーティ
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

# ローカル
from schema.schools import SchoolPublic, SchoolPublicQuery
from system.db import get_db
from usecase.public import schools as schools_usecase

router = APIRouter()


@router.get("/schools", response_model=list[SchoolPublic])
def get_schools(
    query: Annotated[SchoolPublicQuery, Query()], db: Session = Depends(get_db)
):
    """学校一覧を取得（顧客向け）"""
    return schools_usecase.list_public_schools(db, query)
