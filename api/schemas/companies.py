# -*- coding: utf-8 -*-
"""会社マスタのスキーマ定義"""

from pydantic import BaseModel, ConfigDict


class CompanyResponse(BaseModel):
    """会社レスポンス用"""

    id: int
    slug: str
    company_code: str
    name: str
    name_kana: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "slug": "nonoyama",
                    "company_code": "C001",
                    "name": "ノノヤマ洋服株式会社",
                    "name_kana": "ノノヤマヨウフク",
                }
            ]
        },
    )
