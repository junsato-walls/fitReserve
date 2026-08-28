# -*- coding: utf-8 -*-
"""学校区分マスタのスキーマ定義"""

from pydantic import BaseModel, ConfigDict


class SchoolDivisionResponse(BaseModel):
    """学校区分レスポンス用"""

    id: int
    name: str

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={"examples": [{"id": 2, "name": "中学校"}]},
    )
