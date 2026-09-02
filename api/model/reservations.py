# -*- coding: utf-8 -*-
"""予約のDB定義"""

# サードパーティ
from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, Time
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Reservations(Base):
    """予約テーブル - お客様の採寸予約情報管理"""

    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True)
    reservation_number = Column(String(30), nullable=False, unique=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    reservation_date = Column(Date, nullable=False)
    reservation_time = Column(Time, nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_name_kana = Column(String(100))
    gender = Column(String(10), nullable=False)  # male/female/other
    grade = Column(Integer)
    height = Column(Numeric(5, 2))
    weight = Column(Numeric(5, 2))
    foot_size = Column(Numeric(4, 1))
    phone = Column(String(20), nullable=False)
    email = Column(String(100))
    guardian_name = Column(String(100))
    status = Column(
        String(20), nullable=False, default="pending"
    )  # pending/confirmed/completed/cancelled
    memo = Column(String(800))
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
