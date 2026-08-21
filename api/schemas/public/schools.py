# -*- coding: utf-8 -*-
"""公開API用学校スキーマ"""

from pydantic import BaseModel


class SchoolPublic(BaseModel):
    """公開API用学校情報（顧客向け）"""

    id: int
    school_code: str
    name: str
    school_type: str
    postal_code: str | None = None
    address: str | None = None

    class Config:
        from_attributes = True
