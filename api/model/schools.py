# -*- coding: utf-8 -*-
"""学校のDB定義"""

# サードパーティ
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Schools(Base):
    """学校マスタ - 制服取り扱い学校の情報管理"""

    __tablename__ = "schools"

    id = Column(Integer, primary_key=True)
    school_code = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    name_kana = Column(String(100))
    school_divisions_id = Column(
        Integer, ForeignKey("school_divisions.id"), nullable=False
    )
    postal_code = Column(String(10))
    address = Column(String(200))
    phone = Column(String(20))
    description = Column(String(500))
    is_enabled = Column(Boolean, nullable=False, default=True)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
