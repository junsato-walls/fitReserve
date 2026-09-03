# -*- coding: utf-8 -*-
"""店舗マスタのスキーマ定義"""

from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Optional
from datetime import datetime, time

from schema.common import PaginationQuery

# 曜日は PostgreSQL の EXTRACT(DOW) に合わせて 0=日曜 〜 6=土曜
WEEKDAY_LABELS = ("日", "月", "火", "水", "木", "金", "土")


class StoreBase(BaseModel):
    """店舗の基本情報"""

    store_code: str = Field(..., max_length=20, description="店舗コード（ユニーク）")
    name: str = Field(..., max_length=100, description="店舗名")
    name_kana: Optional[str] = Field(None, max_length=100, description="店舗名カナ")
    postal_code: Optional[str] = Field(None, max_length=10, description="郵便番号")
    address: Optional[str] = Field(None, max_length=200, description="住所")
    phone: Optional[str] = Field(None, max_length=20, description="電話番号")
    email: Optional[str] = Field(None, max_length=100, description="メールアドレス")
    capacity: int = Field(
        default=1, ge=1, description="同時対応可能人数（日ごとの受付数の既定値）"
    )
    business_hours_start: time = Field(
        ..., description="営業開始時間（予約枠の生成範囲）"
    )
    business_hours_end: time = Field(..., description="営業終了時間（予約枠の生成範囲）")
    regular_holidays: List[int] = Field(
        default_factory=list, description="定休日の曜日（0=日曜 〜 6=土曜）"
    )
    description: Optional[str] = Field(None, max_length=500, description="店舗説明")
    image_url: Optional[str] = Field(None, max_length=500, description="店舗画像URL")
    is_enabled: bool = Field(default=True, description="有効フラグ")

    @model_validator(mode="after")
    def check_business_hours(self):
        """営業時間の前後関係と定休日の値を見る

        DBにも同じCHECK制約があるが、そこまで落とすと500になるため
        入口の422で返す。
        """
        if self.business_hours_start >= self.business_hours_end:
            raise ValueError("営業開始時間は営業終了時間より前である必要があります")
        _assert_weekdays(self.regular_holidays)
        return self


class StoreCreate(StoreBase):
    """店舗新規作成用"""

    school_ids: Optional[List[int]] = Field(
        None, description="取り扱う学校IDリスト"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "store_code": "STORE001",
                    "name": "東京本店",
                    "name_kana": "トウキョウホンテン",
                    "postal_code": "100-0001",
                    "address": "東京都千代田区千代田1-1-1",
                    "phone": "03-1234-5678",
                    "email": "tokyo@example.com",
                    "capacity": 5,
                    "business_hours_start": "09:00:00",
                    "business_hours_end": "18:00:00",
                    "regular_holidays": [3],
                    "description": "東京エリアの本店です",
                    "is_enabled": True,
                }
            ]
        }
    )


class StoreUpdate(BaseModel):
    """店舗更新用（全フィールドオプショナル）"""

    store_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    name_kana: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    address: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    capacity: Optional[int] = Field(None, ge=1)
    business_hours_start: Optional[time] = None
    business_hours_end: Optional[time] = None
    regular_holidays: Optional[List[int]] = Field(
        None, description="定休日の曜日（0=日曜 〜 6=土曜）。指定した内容で置き換える"
    )
    description: Optional[str] = Field(None, max_length=500)
    school_ids: Optional[List[int]] = Field(
        None, description="取り扱う学校IDリスト（指定した内容で置き換える）"
    )

    @model_validator(mode="after")
    def check_business_hours(self):
        """両方指定されたときだけ前後関係を見る（片方だけの更新もあるため）"""
        if (
            self.business_hours_start is not None
            and self.business_hours_end is not None
            and self.business_hours_start >= self.business_hours_end
        ):
            raise ValueError("営業開始時間は営業終了時間より前である必要があります")
        if self.regular_holidays is not None:
            _assert_weekdays(self.regular_holidays)
        return self

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "name": "東京本店（更新）",
                    "capacity": 10,
                    "business_hours_start": "10:00:00",
                    "business_hours_end": "19:00:00",
                    "regular_holidays": [3],
                }
            ]
        }
    )


class StoreResponse(StoreBase):
    """店舗レスポンス用"""

    id: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    school_ids: List[int] = Field(
        default_factory=list, description="取り扱う学校IDリスト"
    )

    model_config = ConfigDict(from_attributes=True)


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
    business_hours_start: time
    business_hours_end: time
    capacity: int
    image_url: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class StoreSearchQuery(PaginationQuery):
    """店舗一覧の検索クエリ（管理用）"""

    include_deleted: bool = Field(False, description="削除済みを含めるか")


class StorePublicQuery(BaseModel):
    """店舗一覧の検索クエリ（顧客向け）"""

    project_id: Optional[int] = Field(
        None, description="プロジェクトID（対象店舗のみ。未設定なら全店舗）"
    )


def _assert_weekdays(weekdays: List[int]) -> None:
    """定休日の曜日が 0〜6 の重複なしであること"""
    if any(day < 0 or day > 6 for day in weekdays):
        raise ValueError("定休日の曜日は0（日曜）から6（土曜）で指定してください")
    if len(set(weekdays)) != len(weekdays):
        raise ValueError("定休日の曜日が重複しています")
