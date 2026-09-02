# -*- coding: utf-8 -*-
"""学校区分管理API（管理者専用）"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Annotated, List
from system.db import get_db
from system.models import SchoolDivisions
from schemas.school_divisions import SchoolDivisionResponse
from schemas.custom.auth import DecodedToken
from system.auth import require_admin

router = APIRouter()
tag_name = "school-divisions"

# 管理者のみアクセス可能
UserDependency = Annotated[DecodedToken, Depends(require_admin)]


@router.get("/school-divisions", response_model=List[SchoolDivisionResponse])
def get_school_divisions(
    login_user: UserDependency, db: Session = Depends(get_db)
):
    """学校区分一覧取得

    学校の登録・編集画面で区分の選択肢として使う。
    区分は固定のマスタのため参照のみを提供する。
    """
    return db.query(SchoolDivisions).order_by(SchoolDivisions.id).all()
