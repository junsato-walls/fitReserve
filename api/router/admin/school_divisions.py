# -*- coding: utf-8 -*-
"""学校区分管理API（admin以上）"""

# 標準ライブラリ
from typing import List

# サードパーティ
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# ローカル
from repository.query import school_divisions as school_divisions_query
from schema.school_divisions import SchoolDivisionResponse
from system.db import get_db

router = APIRouter()


@router.get("/school-divisions", response_model=List[SchoolDivisionResponse])
def get_school_divisions(db: Session = Depends(get_db)):
    """学校区分一覧取得

    学校の登録・編集画面で区分の選択肢として使う。
    区分は固定のマスタのため参照のみを提供する。
    """
    return school_divisions_query.list_all(db)
