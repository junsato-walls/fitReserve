# -*- coding: utf-8 -*-
"""学校区分のDB定義"""

# サードパーティ
from sqlalchemy import Column, Integer, String

# ローカル
from system.db import Base


class SchoolDivisions(Base):
    """学校区分マスタ - 小学校・中学校・高等学校などの区分"""

    __tablename__ = "school_divisions"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
