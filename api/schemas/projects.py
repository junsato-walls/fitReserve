# -*- coding: utf-8 -*-
"""プロジェクトのスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, List
from datetime import datetime, date


class SchoolDivisionPeriod(BaseModel):
    """学校区分ごとの予約受付期間

    予約受付期間は学校区分によって異なるため、プロジェクト自体は期間を持たず
    区分ごとにこの組で指定する。ここに無い区分は受付対象外になる。
    """

    school_divisions_id: int = Field(..., description="学校区分ID")
    start_date: date = Field(..., description="受付開始日")
    end_date: date = Field(..., description="受付終了日")

    @model_validator(mode="after")
    def check_period(self) -> "SchoolDivisionPeriod":
        if self.start_date > self.end_date:
            raise ValueError("受付開始日は受付終了日以前である必要があります")
        return self


class ProjectBase(BaseModel):
    """プロジェクトの基本情報"""

    company_id: int = Field(..., description="会社ID（予約URLの company_slug に対応）")
    project_code: str = Field(
        ..., max_length=20, description="プロジェクトコード（ユニーク）"
    )
    name: str = Field(..., max_length=100, description="プロジェクト名")
    description: Optional[str] = Field(
        None, max_length=500, description="プロジェクト説明"
    )
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
    school_divisions: Optional[List[SchoolDivisionPeriod]] = Field(
        None, description="学校区分ごとの予約受付期間"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "company_id": 1,
                    "project_code": "PRJ2026",
                    "name": "2026年度春季採寸会",
                    "description": "新入生向け制服採寸プロジェクト",
                    "reservation_interval": 30,
                    "is_enabled": True,
                    "created_by": 1,
                    "updated_by": 1,
                    "store_ids": [1, 2],
                    "school_divisions": [
                        {
                            "school_divisions_id": 2,
                            "start_date": "2026-03-01",
                            "end_date": "2026-03-31",
                        },
                        {
                            "school_divisions_id": 3,
                            "start_date": "2026-03-15",
                            "end_date": "2026-04-15",
                        },
                    ],
                }
            ]
        }
    )


class ProjectUpdate(BaseModel):
    """プロジェクト更新用（全フィールドオプショナル）"""

    company_id: Optional[int] = None
    project_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    reservation_interval: Optional[int] = Field(None, ge=1)
    is_enabled: Optional[bool] = None
    updated_by: Optional[int] = None
    store_ids: Optional[List[int]] = Field(None, description="対象店舗IDリスト")
    school_divisions: Optional[List[SchoolDivisionPeriod]] = Field(
        None, description="学校区分ごとの予約受付期間（指定した内容で置き換える）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "2026年度春季採寸会（更新）",
                    "school_divisions": [
                        {
                            "school_divisions_id": 2,
                            "start_date": "2026-03-01",
                            "end_date": "2026-04-15",
                        }
                    ],
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
    school_divisions: List[SchoolDivisionPeriod] = Field(
        default_factory=list, description="学校区分ごとの予約受付期間"
    )
    # 一覧表示用。区分ごとの期間から算出する（プロジェクト自体は期間を持たない）
    start_date: Optional[date] = Field(
        None, description="受付開始日（全区分の最も早い開始日）"
    )
    end_date: Optional[date] = Field(
        None, description="受付終了日（全区分の最も遅い終了日）"
    )
    is_accepting: bool = Field(
        default=False, description="本日いずれかの区分が受付中か"
    )

    model_config = ConfigDict(from_attributes=True)
