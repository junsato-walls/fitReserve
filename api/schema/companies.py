# -*- coding: utf-8 -*-
"""会社マスタのスキーマ定義"""

from pydantic import BaseModel, ConfigDict, Field


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


class CompanyCreate(BaseModel):
    """会社の新規作成用"""

    slug: str = Field(
        ...,
        max_length=50,
        pattern=r"^[a-z0-9][a-z0-9-]*$",
        description="予約URLの先頭に入るスラッグ（英小文字・数字・ハイフン）",
    )
    company_code: str = Field(..., max_length=20, description="会社コード（ユニーク）")
    name: str = Field(..., max_length=100, description="会社名")
    name_kana: str | None = Field(None, max_length=100, description="会社名カナ")
    postal_code: str | None = Field(None, max_length=10, description="郵便番号")
    address: str | None = Field(None, max_length=200, description="住所")
    phone: str | None = Field(None, max_length=20, description="電話番号")


class CompanyUpdate(BaseModel):
    """会社の更新用（指定された項目のみ更新する）"""

    slug: str | None = Field(
        None, max_length=50, pattern=r"^[a-z0-9][a-z0-9-]*$", description="スラッグ"
    )
    company_code: str | None = Field(None, max_length=20, description="会社コード")
    name: str | None = Field(None, max_length=100, description="会社名")
    name_kana: str | None = Field(None, max_length=100, description="会社名カナ")
    postal_code: str | None = Field(None, max_length=10, description="郵便番号")
    address: str | None = Field(None, max_length=200, description="住所")
    phone: str | None = Field(None, max_length=20, description="電話番号")


class CompanyDetail(CompanyResponse):
    """会社の詳細（管理用）"""

    postal_code: str | None = None
    address: str | None = None
    phone: str | None = None

    model_config = ConfigDict(from_attributes=True)
