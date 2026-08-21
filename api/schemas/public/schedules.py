# -*- coding: utf-8 -*-
"""公開API用スケジュールスキーマ"""

from pydantic import BaseModel, Field
from datetime import date, time


class SchedulePublic(BaseModel):
    """公開API用スケジュール情報（顧客向け・空き状況確認）"""

    id: int
    store_id: int
    schedule_date: date
    start_time: time
    end_time: time
    capacity: int
    reserved_count: int
    available_count: int = Field(..., description="残り予約可能数")
    is_available: bool

    class Config:
        from_attributes = True
