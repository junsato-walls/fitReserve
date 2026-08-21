# -*- coding: utf-8 -*-
"""予約のスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, date, time
from decimal import Decimal

Gender = Literal["male", "female", "other"]
ReservationStatus = Literal["pending", "confirmed", "completed", "cancelled"]


class ReservationBase(BaseModel):
    """予約の基本情報"""

    project_id: Optional[int] = Field(None, description="プロジェクトID")
    store_id: int = Field(..., description="店舗ID")
    school_id: int = Field(..., description="学校ID")
    reservation_date: date = Field(..., description="予約日")
    reservation_time: time = Field(..., description="予約時刻")
    customer_name: str = Field(..., max_length=100, description="顧客氏名")
    customer_name_kana: Optional[str] = Field(
        None, max_length=100, description="顧客氏名カナ"
    )
    gender: Gender = Field(..., description="性別")
    grade: Optional[int] = Field(None, ge=1, le=12, description="学年")
    height: Optional[Decimal] = Field(None, ge=0, le=999.99, description="身長（cm）")
    weight: Optional[Decimal] = Field(None, ge=0, le=999.99, description="体重（kg）")
    foot_size: Optional[Decimal] = Field(
        None, ge=0, le=99.9, description="足のサイズ（cm）"
    )
    phone: str = Field(..., max_length=20, description="電話番号")
    email: Optional[str] = Field(None, max_length=100, description="メールアドレス")
    guardian_name: Optional[str] = Field(None, max_length=100, description="保護者氏名")
    memo: Optional[str] = Field(None, max_length=800, description="備考")


class ReservationCreate(ReservationBase):
    """予約新規作成用（顧客向け）"""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "project_id": 1,
                    "store_id": 1,
                    "school_id": 1,
                    "reservation_date": "2026-03-15",
                    "reservation_time": "10:00:00",
                    "customer_name": "山田太郎",
                    "customer_name_kana": "ヤマダタロウ",
                    "gender": "male",
                    "grade": 1,
                    "height": 165.5,
                    "weight": 55.0,
                    "foot_size": 26.5,
                    "phone": "090-1234-5678",
                    "email": "yamada@example.com",
                    "guardian_name": "山田花子",
                    "memo": "午前中希望",
                }
            ]
        }
    )


class ReservationUpdate(BaseModel):
    """予約更新用（スタッフ向け）"""

    project_id: Optional[int] = None
    store_id: Optional[int] = None
    school_id: Optional[int] = None
    reservation_date: Optional[date] = None
    reservation_time: Optional[time] = None
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_name_kana: Optional[str] = Field(None, max_length=100)
    gender: Optional[Gender] = None
    grade: Optional[int] = Field(None, ge=1, le=12)
    height: Optional[Decimal] = Field(None, ge=0, le=999.99)
    weight: Optional[Decimal] = Field(None, ge=0, le=999.99)
    foot_size: Optional[Decimal] = Field(None, ge=0, le=99.9)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    guardian_name: Optional[str] = Field(None, max_length=100)
    status: Optional[ReservationStatus] = None
    memo: Optional[str] = Field(None, max_length=800)
    updated_by: Optional[int] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "status": "confirmed",
                    "height": 167.0,
                    "weight": 56.5,
                    "memo": "採寸完了",
                    "updated_by": 1,
                }
            ]
        }
    )


class ReservationResponse(ReservationBase):
    """予約レスポンス用"""

    id: int
    reservation_number: str
    status: ReservationStatus
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReservationWithDetails(ReservationResponse):
    """予約詳細レスポンス用（関連情報含む）"""

    store_name: Optional[str] = None
    school_name: Optional[str] = None
    project_name: Optional[str] = None
