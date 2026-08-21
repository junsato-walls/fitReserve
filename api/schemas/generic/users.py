# -*- coding: utf-8 -*-
"""ユーザースキーマ"""

from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

UserRole = Literal["admin", "staff", "readonly"]


class UserBase(BaseModel):
    """ユーザー基本情報"""

    personal_id: str = Field(
        ..., min_length=6, max_length=50, description="ユーザーID（6～50文字）"
    )
    user_name: str = Field(
        ..., min_length=2, max_length=50, description="ユーザー名（2～50文字）"
    )
    name_kana: Optional[str] = Field(None, max_length=100, description="フリガナ")
    email: Optional[str] = Field(None, max_length=100, description="メールアドレス")
    icon: Optional[str] = Field(None, max_length=500, description="アイコン画像URL")
    role: UserRole = Field(..., description="ロール（admin/staff/readonly）")
    store_id: Optional[int] = Field(None, description="所属店舗ID（adminの場合は不要）")
    is_active: bool = Field(True, description="有効フラグ")


class UserCreate(UserBase):
    """ユーザー新規作成"""

    password: str = Field(
        ..., min_length=8, max_length=100, description="パスワード（8～100文字）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "personal_id": "staff001",
                    "user_name": "佐藤一郎",
                    "name_kana": "サトウイチロウ",
                    "email": "sato@example.com",
                    "role": "staff",
                    "store_id": 1,
                    "is_active": True,
                    "password": "password123",
                }
            ]
        }
    )


class UserUpdate(BaseModel):
    """ユーザー更新"""

    personal_id: Optional[str] = Field(
        None, min_length=6, max_length=50, description="ユーザーID"
    )
    user_name: Optional[str] = Field(
        None, min_length=2, max_length=50, description="ユーザー名"
    )
    name_kana: Optional[str] = Field(None, max_length=100, description="フリガナ")
    email: Optional[str] = Field(None, max_length=100, description="メールアドレス")
    icon: Optional[str] = Field(None, max_length=500, description="アイコン画像URL")
    role: Optional[UserRole] = Field(None, description="ロール")
    store_id: Optional[int] = Field(None, description="所属店舗ID")
    is_active: Optional[bool] = Field(None, description="有効フラグ")
    password: Optional[str] = Field(
        None, min_length=8, max_length=100, description="パスワード"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "user_name": "佐藤一郎（更新）",
                    "email": "sato.new@example.com",
                }
            ]
        }
    )


class UserResponse(BaseModel):
    """ユーザーレスポンス"""

    id: int = Field(..., description="ユーザーID")
    personal_id: str = Field(..., description="ユーザーID")
    user_name: str = Field(..., description="ユーザー名")
    name_kana: Optional[str] = Field(None, description="フリガナ")
    email: Optional[str] = Field(None, description="メールアドレス")
    icon: Optional[str] = Field(None, description="アイコン画像URL")
    role: str = Field(..., description="ロール")
    store_id: Optional[int] = Field(None, description="所属店舗ID")
    is_active: bool = Field(..., description="有効フラグ")
    created_at: datetime = Field(..., description="作成日時")
    updated_at: datetime = Field(..., description="更新日時")

    model_config = ConfigDict(from_attributes=True)


class UserWithStore(UserResponse):
    """ユーザー（店舗名付き）"""

    store_name: Optional[str] = Field(None, description="所属店舗名")
