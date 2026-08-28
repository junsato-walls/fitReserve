# -*- coding: utf-8 -*-
"""学校マスタのスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class SchoolBase(BaseModel):
    """学校の基本情報"""

    school_code: str = Field(..., max_length=20, description="学校コード（ユニーク）")
    name: str = Field(..., max_length=100, description="学校名")
    name_kana: Optional[str] = Field(None, max_length=100, description="学校名カナ")
    school_divisions_id: int = Field(
        ..., description="学校区分ID（school_divisions.id）"
    )
    postal_code: Optional[str] = Field(None, max_length=10, description="郵便番号")
    address: Optional[str] = Field(None, max_length=200, description="住所")
    phone: Optional[str] = Field(None, max_length=20, description="電話番号")
    description: Optional[str] = Field(None, max_length=500, description="備考")
    is_enabled: bool = Field(default=True, description="有効フラグ")


class SchoolCreate(SchoolBase):
    """学校新規作成用"""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "school_code": "SCH001",
                    "name": "東京第一中学校",
                    "name_kana": "トウキョウダイイチチュウガッコウ",
                    "school_divisions_id": 2,
                    "postal_code": "100-0001",
                    "address": "東京都千代田区千代田2-1-1",
                    "phone": "03-2345-6789",
                    "description": "千代田区の中学校",
                    "is_enabled": True,
                }
            ]
        }
    )


class SchoolUpdate(BaseModel):
    """学校更新用（全フィールドオプショナル）"""

    school_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    name_kana: Optional[str] = Field(None, max_length=100)
    school_divisions_id: Optional[int] = None
    postal_code: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    is_enabled: Optional[bool] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"name": "東京第一中学校（更新）", "phone": "03-2345-9999"}]
        }
    )


class SchoolResponse(SchoolBase):
    """学校レスポンス用"""

    id: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
