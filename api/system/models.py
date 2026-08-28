# -*- coding: utf-8 -*-
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date, Time, Numeric
from sqlalchemy.types import DateTime
from system.db import Base
from system.db import ENGINE
from datetime import datetime
from zoneinfo import ZoneInfo


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


class Users(Base):
    """ユーザーマスタ - 管理者・店舗スタッフのアカウント管理"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    personal_id = Column(String(50), nullable=False, unique=True)
    user_name = Column(String(50), nullable=False, unique=True)
    name_kana = Column(String(100))
    email = Column(String(100))
    password = Column(String(100), nullable=False)
    salt = Column(String(100), nullable=False)
    role = Column(
        String(20), nullable=False, default="readonly"
    )  # admin/staff/readonly
    store_id = Column(Integer, ForeignKey("stores.id"))
    is_active = Column(Boolean, nullable=False, default=True)
    icon = Column(String(500))
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)
    memo = Column(String(800))


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
    business_hours_start = Column(Time)
    business_hours_end = Column(Time)
    regular_holiday = Column(String(100))
    description = Column(String(500))
    image_url = Column(String(500))
    is_enabled = Column(Boolean, nullable=False, default=True)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)


class SchoolDivisions(Base):
    """学校区分マスタ - 小学校・中学校・高等学校などの区分"""

    __tablename__ = "school_divisions"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)


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
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)


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
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)


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
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)


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
    created_at = Column(DateTime, default=jst, nullable=False)


class ProjectStores(Base):
    """プロジェクト店舗関連テーブル - プロジェクトと店舗の多対多リレーション"""

    __tablename__ = "project_stores"

    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    store_id = Column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True
    )
    created_at = Column(DateTime, default=jst, nullable=False)


class StoreSchools(Base):
    """店舗学校関連テーブル - 店舗が取り扱う学校の制服"""

    __tablename__ = "store_schools"

    store_id = Column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True
    )
    school_id = Column(
        Integer, ForeignKey("schools.id", ondelete="CASCADE"), primary_key=True
    )
    created_at = Column(DateTime, default=jst, nullable=False)


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
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)


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
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)


def main():
    # テーブルが存在しなければ、テーブルを作成
    Base.metadata.create_all(bind=ENGINE)


if __name__ == "__main__":
    main()
