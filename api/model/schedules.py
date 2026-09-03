# -*- coding: utf-8 -*-
"""スケジュール（店舗×日の受付設定）と枠止めのDB定義"""

# サードパーティ
from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, Time
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Schedules(Base):
    """スケジュールテーブル - 店舗×日の受付設定

    時間枠そのものは持たない。受付時間（未設定なら店舗の営業時間）を
    slot_minutes で割って導出する。枠ごとの予約件数も列に持たず、
    reservations を数える（列に持つと取り消しや変更で実体とずれるため）。
    """

    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    schedule_date = Column(Date, nullable=False)
    capacity = Column(Integer, nullable=False, default=1)
    slot_minutes = Column(Integer, nullable=False, default=30)
    start_time = Column(Time)
    end_time = Column(Time)
    break_start = Column(Time)
    break_end = Column(Time)
    is_available = Column(Boolean, nullable=False, default=True)
    memo = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)


class ScheduleBlocks(Base):
    """枠止めテーブル - 予約以外の用途で時間を埋める

    休憩・棚卸し・研修など。ここに重なる予約枠は受付から外れる。
    """

    __tablename__ = "schedule_blocks"

    id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    block_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    title = Column(String(100), nullable=False)
    memo = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
