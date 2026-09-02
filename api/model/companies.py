# -*- coding: utf-8 -*-
"""会社のDB定義"""

# サードパーティ
from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Companies(Base):
    """会社マスタ - 予約URLの [company_slug] で参照する"""

    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    slug = Column(String(50), nullable=False, unique=True)
    company_code = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    name_kana = Column(String(100))
    postal_code = Column(String(10))
    address = Column(String(200))
    phone = Column(String(20))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"))
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
