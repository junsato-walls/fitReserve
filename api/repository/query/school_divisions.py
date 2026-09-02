# -*- coding: utf-8 -*-
"""学校区分のSELECT"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import SchoolDivisions


def list_all(db: Session) -> list[SchoolDivisions]:
    """学校区分を全件取得する（固定マスタのため絞り込みは持たない）"""
    return db.query(SchoolDivisions).order_by(SchoolDivisions.id).all()
