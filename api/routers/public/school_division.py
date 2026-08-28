# -*- coding: utf-8 -*-
"""学校区分取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import SchoolDivisions
from schemas.school_divisions import SchoolDivisionResponse

router = APIRouter()
tag_name = "public-school-divisions"


@router.get("/school-divisions", response_model=list[SchoolDivisionResponse])
def get_school_divisions(db: Session = Depends(get_db)):
    """学校区分一覧を取得（顧客向け）

    学校の区分は固定のマスタであり、顧客向け画面でも
    学校の絞り込み・表示に使うため認証不要で返す。
    """
    return db.query(SchoolDivisions).order_by(SchoolDivisions.id).all()
