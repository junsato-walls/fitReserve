# -*- coding: utf-8 -*-
"""店舗マスタのスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, time


class StoreBase(BaseModel):
    """店舗の基本情報"""

    store_code: str = Field(..., max_length=20, description="店舗コード（ユニーク）")
    name: str = Field(..., max_length=100, description="店舗名")
    name_kana: Optional[str] = Field(None, max_length=100, description="店舗名カナ")
    postal_code: Optional[str] = Field(None, max_length=10, description="郵便番号")
    address: Optional[str] = Field(None, max_length=200, description="住所")
    phone: Optional[str] = Field(None, max_length=20, description="電話番号")
    email: Optional[str] = Field(None, max_length=100, description="メールアドレス")
    capacity: int = Field(default=1, ge=1, description="同時対応可能人数")
    business_hours_start: Optional[time] = Field(None, description="営業開始時間")
    business_hours_end: Optional[time] = Field(None, description="営業終了時間")
    regular_holiday: Optional[str] = Field(None, max_length=100, description="定休日")
    description: Optional[str] = Field(None, max_length=500, description="店舗説明")
    image_url: Optional[str] = Field(None, max_length=500, description="店舗画像URL")
    is_enabled: bool = Field(default=True, description="有効フラグ")


class StoreCreate(StoreBase):
    """店舗新規作成用"""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "store_code": "STORE001",
                    "name": "東京本店",
                    "name_kana": "トウキョウホンテン",
                    "postal_code": "100-0001",
                    "address": "東京都千代田区千代田1-1-1",
                    "phone": "03-1234-5678",
                    "email": "tokyo@example.com",
                    "capacity": 5,
                    "business_hours_start": "09:00:00",
                    "business_hours_end": "18:00:00",
                    "regular_holiday": "水曜日",
                    "description": "東京エリアの本店です",
                    "is_enabled": True,
                }
            ]
        }
    )


class StoreUpdate(BaseModel):
    """店舗更新用（全フィールドオプショナル）"""

    store_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    name_kana: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    capacity: Optional[int] = Field(None, ge=1)
    business_hours_start: Optional[time] = None
    business_hours_end: Optional[time] = None
    regular_holiday: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "東京本店（更新）",
                    "capacity": 10,
                    "business_hours_start": "10:00:00",
                    "business_hours_end": "19:00:00",
                }
            ]
        }
    )


class StoreResponse(StoreBase):
    """店舗レスポンス用"""

    id: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
