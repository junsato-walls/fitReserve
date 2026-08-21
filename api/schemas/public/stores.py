# -*- coding: utf-8 -*-
"""公開API用店舗スキーマ"""

from pydantic import BaseModel
from datetime import time


class StorePublic(BaseModel):
    """公開API用店舗情報（顧客向け）"""

    id: int
    store_code: str
    name: str
    postal_code: str | None = None
    address: str | None = None
    phone: str | None = None
    # モデル(Stores)の属性名と一致させること。異なる名前にすると
    # from_attributes による変換で値が取得できず、常にNoneになる
    business_hours_start: time | None = None
    business_hours_end: time | None = None
    regular_holiday: str | None = None
    capacity: int
    image_url: str | None = None
    description: str | None = None

    class Config:
        from_attributes = True
