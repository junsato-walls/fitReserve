# -*- coding: utf-8 -*-
"""スケジュール（予約枠）のDB定義"""

# サードパーティ
from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Time
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Schedules(Base):
    """スケジュールテーブル - 店舗ごとの予約可能スケジュール管理"""

    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    schedule_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    capacity = Column(Integer, nullable=False, default=1)
    reserved_count = Column(Integer, nullable=False, default=0)
    is_available = Column(Boolean, nullable=False, default=True)
    memo = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
