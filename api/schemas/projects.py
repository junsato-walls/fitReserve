# -*- coding: utf-8 -*-
"""プロジェクトのスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date


class ProjectBase(BaseModel):
    """プロジェクトの基本情報"""

    project_code: str = Field(
        ..., max_length=20, description="プロジェクトコード（ユニーク）"
    )
    name: str = Field(..., max_length=100, description="プロジェクト名")
    description: Optional[str] = Field(
        None, max_length=500, description="プロジェクト説明"
    )
    start_date: date = Field(..., description="開始日")
    end_date: date = Field(..., description="終了日")
    reservation_interval: int = Field(
        default=30, ge=1, description="予約時間間隔（分）"
    )
    is_enabled: bool = Field(default=True, description="有効フラグ")


class ProjectCreate(ProjectBase):
    """プロジェクト新規作成用"""

    created_by: int = Field(..., description="作成者ID")
    updated_by: int = Field(..., description="更新者ID")
    store_ids: Optional[List[int]] = Field(
        None, description="対象店舗IDリスト（空の場合は全店舗）"
    )
    school_ids: Optional[List[int]] = Field(
        None, description="対象学校IDリスト（空の場合は全学校）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "project_code": "PRJ2026",
                    "name": "2026年度春季採寸会",
                    "description": "新入生向け制服採寸プロジェクト",
                    "start_date": "2026-03-01",
                    "end_date": "2026-03-31",
                    "reservation_interval": 30,
                    "is_enabled": True,
                    "created_by": 1,
                    "updated_by": 1,
                    "store_ids": [1, 2],
                    "school_ids": [1, 2, 3],
                }
            ]
        }
    )


class ProjectUpdate(BaseModel):
    """プロジェクト更新用（全フィールドオプショナル）"""

    project_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reservation_interval: Optional[int] = Field(None, ge=1)
    is_enabled: Optional[bool] = None
    updated_by: Optional[int] = None
    store_ids: Optional[List[int]] = Field(None, description="対象店舗IDリスト")
    school_ids: Optional[List[int]] = Field(None, description="対象学校IDリスト")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "2026年度春季採寸会（更新）",
                    "end_date": "2026-04-15",
                    "updated_by": 1,
                }
            ]
        }
    )


class ProjectResponse(ProjectBase):
    """プロジェクトレスポンス用"""

    id: int
    created_by: int
    updated_by: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    store_ids: List[int] = Field(default_factory=list, description="対象店舗IDリスト")
    school_ids: List[int] = Field(default_factory=list, description="対象学校IDリスト")

    model_config = ConfigDict(from_attributes=True)
