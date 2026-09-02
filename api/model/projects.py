# -*- coding: utf-8 -*-
"""プロジェクト関連のDB定義"""

# サードパーティ
from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


class Projects(Base):
    """プロジェクトテーブル - 予約受付プロジェクト（キャンペーン期間）管理"""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    project_code = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    # 予約受付期間は学校区分ごとに異なるため ProjectSchoolDivisions が持つ
    reservation_interval = Column(Integer, nullable=False, default=30)  # 20/30/60分
    is_enabled = Column(Boolean, nullable=False, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)


class ProjectSchoolDivisions(Base):
    """プロジェクト学校区分関連テーブル - 学校区分ごとの予約受付期間"""

    __tablename__ = "project_school_divisions"

    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    school_divisions_id = Column(
        Integer, ForeignKey("school_divisions.id"), primary_key=True
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=now, nullable=False)


class ProjectStores(Base):
    """プロジェクト店舗関連テーブル - プロジェクトと店舗の多対多リレーション"""

    __tablename__ = "project_stores"

    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    store_id = Column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True
    )
    created_at = Column(DateTime, default=now, nullable=False)
