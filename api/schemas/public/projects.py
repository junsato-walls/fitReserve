# -*- coding: utf-8 -*-
"""公開API用プロジェクトスキーマ"""

from pydantic import BaseModel
from datetime import date


class ProjectPublic(BaseModel):
    """公開API用プロジェクト情報（顧客向け）"""

    id: int
    project_code: str
    name: str
    description: str | None = None
    start_date: date
    end_date: date
    reservation_interval: int
    is_enabled: bool

    class Config:
        from_attributes = True
