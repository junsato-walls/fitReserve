# -*- coding: utf-8 -*-
"""認証のスキーマ定義"""

# 標準ライブラリ
from datetime import datetime
from typing import Optional

# サードパーティ
from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    """ログイン時に返すアクセストークン"""

    access_token: str
    token_type: str


class DecodedToken(BaseModel):
    """JWTのペイロードを読み取ったもの

    role / store_ids は発行時点の値であり、権限判定には使わない。
    判定は毎リクエストDBを引き直す system.permissions.Actor が行う。
    """

    user_id: int
    personal_id: str
    user_name: str
    role: str  # super_admin / admin / staff / readonly
    store_id: Optional[int]  # 所属店舗（表示用の主店舗）
    store_ids: Optional[list[int]] = None  # 担当店舗。None は全店舗
    is_active: bool
    expires: datetime


class LoginRequest(BaseModel):
    """ログインのリクエストボディ"""

    personal_id: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"personal_id": "ADM001", "password": "password"}]
        }
    )
