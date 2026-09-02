# -*- coding: utf-8 -*-
"""ユーザー関連のDB定義"""

# サードパーティ
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.types import DateTime

# ローカル
from system.clock import now
from system.db import Base


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
    )  # super_admin/admin/staff/readonly
    # 所属店舗（表示用の主店舗）。権限の対象店舗は UserStores が持つ
    store_id = Column(Integer, ForeignKey("stores.id"))
    is_active = Column(Boolean, nullable=False, default=True)
    icon = Column(String(500))
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=now, nullable=False)
    updated_at = Column(DateTime, default=now, onupdate=now, nullable=False)
    memo = Column(String(800))


class UserStores(Base):
    """ユーザー担当店舗テーブル - staff/readonly が操作・参照できる店舗

    super_admin / admin は全店舗が対象のため、ここにレコードを持たない。
    """

    __tablename__ = "user_stores"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    store_id = Column(
        Integer, ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True
    )
    created_at = Column(DateTime, default=now, nullable=False)
