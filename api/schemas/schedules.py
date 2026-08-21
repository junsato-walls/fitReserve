# -*- coding: utf-8 -*-
"""スケジュールのスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date, time


class ScheduleBase(BaseModel):
    """スケジュールの基本情報"""

    store_id: int = Field(..., description="店舗ID")
    schedule_date: date = Field(..., description="スケジュール日")
    start_time: time = Field(..., description="開始時刻")
    end_time: time = Field(..., description="終了時刻")
    capacity: int = Field(default=1, ge=1, description="受付可能数")
    is_available: bool = Field(default=True, description="予約可能フラグ")
    memo: Optional[str] = Field(None, max_length=500, description="備考")


class ScheduleCreate(ScheduleBase):
    """スケジュール新規作成用"""

    created_by: int = Field(..., description="作成者ID")
    updated_by: int = Field(..., description="更新者ID")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "store_id": 1,
                    "schedule_date": "2026-03-15",
                    "start_time": "10:00:00",
                    "end_time": "10:30:00",
                    "capacity": 3,
                    "is_available": True,
                    "memo": "午前の枚",
                    "created_by": 1,
                    "updated_by": 1,
                }
            ]
        }
    )


class ScheduleUpdate(BaseModel):
    """スケジュール更新用（全フィールドオプショナル）"""

    store_id: Optional[int] = None
    schedule_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    capacity: Optional[int] = Field(None, ge=1)
    is_available: Optional[bool] = None
    memo: Optional[str] = Field(None, max_length=500)
    updated_by: Optional[int] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"capacity": 5, "memo": "枚を拡大", "updated_by": 1}]
        }
    )


class ScheduleResponse(ScheduleBase):
    """スケジュールレスポンス用"""

    id: int
    reserved_count: int = Field(default=0, description="予約済み件数")
    created_by: int
    updated_by: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScheduleAvailability(BaseModel):
    """空き状況レスポンス用"""

    schedule_id: int
    schedule_date: date
    start_time: time
    end_time: time
    capacity: int
    reserved_count: int
    available_count: int = Field(..., description="残り枠数")
    status: str = Field(..., description="空き状況（◎余裕あり / △残りわずか / ×満席）")

    model_config = ConfigDict(from_attributes=True)
