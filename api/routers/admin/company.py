# -*- coding: utf-8 -*-
"""会社管理API（管理者専用）"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Annotated, List
from system.db import get_db
from system.models import Companies
from schemas.companies import CompanyResponse
from schemas.custom.auth import DecodedToken
from system.auth import require_admin

router = APIRouter()
tag_name = "companies"

# 管理者のみアクセス可能
UserDependency = Annotated[DecodedToken, Depends(require_admin)]


@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(login_user: UserDependency, db: Session = Depends(get_db)):
    """会社一覧取得

    プロジェクトの所属会社の選択と、予約URL（/[company_slug]/...）の
    組み立てに使う。
    """
    return (
        db.query(Companies)
        .filter(Companies.deleted_at.is_(None))
        .order_by(Companies.id)
        .all()
    )
