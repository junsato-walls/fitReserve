# -*- coding: utf-8 -*-
"""複数のリソースで共有するリクエスト定義"""

# サードパーティ
from pydantic import BaseModel, Field

# 1回で取得できる件数の上限。
# 上限が無いと ?limit=999999 で全件を引けてしまうため必ず設ける。
MAX_LIMIT = 500


class PaginationQuery(BaseModel):
    """一覧取得に共通するページングのクエリ

    各リソースの検索クエリはこれを継承し、固有の絞り込み条件だけを足す。
    """

    skip: int = Field(0, ge=0, description="読み飛ばす件数")
    limit: int = Field(
        100, ge=1, le=MAX_LIMIT, description=f"取得する最大件数（最大{MAX_LIMIT}）"
    )
