# -*- coding: utf-8 -*-
"""店舗関連のDB定義"""

# サードパーティ
from sqlalchemy import Boolean, Column, ForeignKey, Integer, SmallInteger, String, Time
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Stores(Base):
    """店舗マスタ - 店舗の基本情報・営業時間管理"""

    __tablename__ = "stores"

    id = Column(Integer, primary_key=True)
    store_code = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    name_kana = Column(String(100))
    postal_code = Column(String(10))
    address = Column(String(200))
    phone = Column(String(20))
    email = Column(String(100))
    capacity = Column(Integer, nullable=False, default=1)
    business_hours_start = Column(Time, nullable=False)
    business_hours_end = Column(Time, nullable=False)
    description = Column(String(500))
    image_url = Column(String(500))
    is_enabled = Column(Boolean, nullable=False, default=True)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)


class StoreSchools(Base):
    """店舗学校関連テーブル - 店舗が取り扱う学校の制服"""

    __tablename__ = "store_schools"

    store_id = Column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True
    )
    school_id = Column(
        Integer, ForeignKey("schools.id", ondelete="CASCADE"), primary_key=True
    )
    created_at = Column(DateTime, default=now, nullable=False)


class StoreRegularHolidays(Base):
    """店舗定休日テーブル - 曜日指定の定休日

    weekday は PostgreSQL の EXTRACT(DOW) に合わせて 0=日曜 〜 6=土曜。
    Python の date.weekday()（0=月曜）とはずれるため、
    変換は system/clock.py の to_dow を通すこと。
    """

    __tablename__ = "store_regular_holidays"

    store_id = Column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True
    )
    weekday = Column(SmallInteger, primary_key=True)
