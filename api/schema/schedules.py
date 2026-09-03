# -*- coding: utf-8 -*-
"""スケジュール（店舗×日の受付設定）と枠止めのスキーマ定義"""

from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from schema.common import PaginationQuery
from schema.reservations import ReservationStatus


# ==========================================================
# スケジュール（店舗 × 日）
# ==========================================================
class ScheduleBase(BaseModel):
    """1日分の受付設定

    start_time / end_time を省略すると店舗の営業時間に従う。
    時間枠そのものは持たず、受付時間を slot_minutes で割って導出する。
    """

    store_id: int = Field(..., description="店舗ID")
    schedule_date: date = Field(..., description="スケジュール日")
    capacity: int = Field(1, ge=1, description="その日の同時予約数")
    slot_minutes: int = Field(30, ge=5, le=480, description="予約枠の刻み（分）")
    start_time: Optional[time] = Field(
        None, description="受付開始時刻（未指定なら店舗の営業開始時間）"
    )
    end_time: Optional[time] = Field(
        None, description="受付終了時刻（未指定なら店舗の営業終了時間）"
    )
    break_start: Optional[time] = Field(
        None, description="休憩開始時刻（任意。この間は枠を作らない）"
    )
    break_end: Optional[time] = Field(None, description="休憩終了時刻（任意）")
    is_available: bool = Field(True, description="予約可能フラグ（定休日はFalse）")
    memo: Optional[str] = Field(None, max_length=500, description="備考")

    @model_validator(mode="after")
    def check_time_range(self):
        """受付時間・休憩時間の前後関係と、対で入っているかを見る

        DBにも同じCHECK制約があるが、そこまで落とすと500になるため
        入口の422で返す。
        """
        _assert_pair("受付時間", self.start_time, self.end_time)
        _assert_pair("休憩時間", self.break_start, self.break_end)
        return self


class ScheduleCreate(ScheduleBase):
    """スケジュール新規作成用"""

    created_by: int = Field(..., description="作成者ID")
    updated_by: int = Field(..., description="更新者ID")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "store_id": 1,
                    "schedule_date": "2026-03-15",
                    "capacity": 3,
                    "slot_minutes": 30,
                    "break_start": "12:00:00",
                    "break_end": "13:00:00",
                    "is_available": True,
                    "created_by": 1,
                    "updated_by": 1,
                }
            ]
        }
    )


class ScheduleUpdate(BaseModel):
    """スケジュール更新用（全フィールドオプショナル）

    店舗と日付は変更できない。別の日の設定は別の行として作る。
    休憩を外すときは break_start / break_end に明示的に null を送る。
    """

    capacity: Optional[int] = Field(None, ge=1)
    slot_minutes: Optional[int] = Field(None, ge=5, le=480)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    is_available: Optional[bool] = None
    memo: Optional[str] = Field(None, max_length=500)
    updated_by: Optional[int] = None

    model_config = ConfigDict(
        json_schema_extra={"examples": [{"capacity": 5, "updated_by": 1}]}
    )


class ScheduleResponse(ScheduleBase):
    """スケジュールレスポンス用"""

    id: int
    created_by: int
    updated_by: int
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# 枠止め（予約以外で時間を埋める）
# ==========================================================
class ScheduleBlockBase(BaseModel):
    """枠止めの基本情報"""

    store_id: int = Field(..., description="店舗ID")
    block_date: date = Field(..., description="対象日")
    start_time: time = Field(..., description="開始時刻")
    end_time: time = Field(..., description="終了時刻")
    title: str = Field(..., min_length=1, max_length=100, description="用件")
    memo: Optional[str] = Field(None, max_length=500, description="備考")

    @model_validator(mode="after")
    def check_time_range(self):
        if self.start_time >= self.end_time:
            raise ValueError("開始時刻は終了時刻より前である必要があります")
        return self


class ScheduleBlockCreate(ScheduleBlockBase):
    """枠止めの新規作成用"""

    created_by: int = Field(..., description="作成者ID")
    updated_by: int = Field(..., description="更新者ID")

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "store_id": 1,
                    "block_date": "2026-03-15",
                    "start_time": "12:00:00",
                    "end_time": "13:00:00",
                    "title": "昼休み",
                    "created_by": 1,
                    "updated_by": 1,
                }
            ]
        }
    )


class ScheduleBlockUpdate(BaseModel):
    """枠止めの更新用（タイムテーブルのドラッグ移動でも使う）"""

    store_id: Optional[int] = None
    block_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    memo: Optional[str] = Field(None, max_length=500)
    updated_by: Optional[int] = None

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"start_time": "13:00:00", "end_time": "14:00:00", "updated_by": 1}
            ]
        }
    )


class ScheduleBlockResponse(ScheduleBlockBase):
    """枠止めレスポンス用"""

    id: int
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================================
# 導出した予約枠
# ==========================================================
class ScheduleSlot(BaseModel):
    """受付時間から導出した予約枠1つ分"""

    start_time: time = Field(..., description="開始時刻")
    end_time: time = Field(..., description="終了時刻")
    capacity: int = Field(..., description="受付可能数")
    reserved_count: int = Field(..., description="予約済み件数")
    available_count: int = Field(..., description="残り予約可能数")


class ScheduleReservation(BaseModel):
    """タイムテーブルに出す予約1件分

    予約の全項目を返すと重く、個人情報も広く出るため、
    タイムテーブルの表示に必要な範囲だけにする。
    """

    id: int = Field(..., description="予約ID")
    reservation_number: str = Field(..., description="予約番号")
    start_time: time = Field(..., description="予約時刻")
    end_time: time = Field(..., description="予約時刻＋枠の刻み")
    customer_name: str = Field(..., description="お客様氏名")
    school_name: Optional[str] = Field(None, description="学校名")
    status: ReservationStatus = Field(..., description="予約ステータス")


class ScheduleDay(BaseModel):
    """タイムテーブル1日分（店舗ごと）

    設定が未登録の日も「受付なし」として返す。
    画面側で日付の抜けを気にせず描けるようにするため。
    """

    store_id: int
    store_name: str
    schedule_date: date
    schedule_id: Optional[int] = Field(None, description="未設定の日は null")
    is_available: bool = Field(..., description="その日に受付するか")
    is_holiday: bool = Field(..., description="店舗の定休日か")
    capacity: int = Field(..., description="その日の同時予約数")
    slot_minutes: int = Field(..., description="予約枠の刻み（分）")
    start_time: time = Field(
        ..., description="受付開始時刻（店舗の営業時間を反映済み）"
    )
    end_time: time = Field(..., description="受付終了時刻（店舗の営業時間を反映済み）")
    break_start: Optional[time] = None
    break_end: Optional[time] = None
    memo: Optional[str] = None
    slots: list[ScheduleSlot] = Field(default_factory=list, description="予約枠")
    blocks: list[ScheduleBlockResponse] = Field(
        default_factory=list, description="枠止め"
    )
    reservations: list[ScheduleReservation] = Field(
        default_factory=list, description="その日の予約（取り消し分を除く）"
    )


class SchedulePublicSlot(BaseModel):
    """公開API用の予約枠（顧客向け・空き状況確認）"""

    store_id: int
    schedule_date: date
    start_time: time
    end_time: time
    capacity: int
    reserved_count: int
    available_count: int = Field(..., description="残り予約可能数")


# ==========================================================
# クエリ
# ==========================================================
class ScheduleSearchQuery(PaginationQuery):
    """スケジュール一覧の検索クエリ（社内向け）"""

    store_id: Optional[int] = Field(None, description="店舗IDで絞る")
    date_from: Optional[date] = Field(None, description="日付の下限")
    date_to: Optional[date] = Field(None, description="日付の上限")
    is_available: Optional[bool] = Field(None, description="予約可否で絞る")


class ScheduleDayQuery(BaseModel):
    """タイムテーブルの検索クエリ（社内向け）

    期間の前後関係は、業務メッセージを返すため usecase で確認する。
    """

    date_from: date = Field(..., description="検索開始日")
    date_to: Optional[date] = Field(
        None, description="検索終了日（未指定なら開始日の1日分）"
    )
    store_id: Optional[int] = Field(
        None, description="店舗ID（未指定なら担当店舗すべて）"
    )


class ScheduleBlockSearchQuery(PaginationQuery):
    """枠止めの検索クエリ（社内向け）"""

    store_id: Optional[int] = Field(None, description="店舗IDで絞る")
    date_from: Optional[date] = Field(None, description="日付の下限")
    date_to: Optional[date] = Field(None, description="日付の上限")


class SchedulePublicQuery(BaseModel):
    """空き状況の検索クエリ（顧客向け）

    開始日と終了日の前後関係は、業務メッセージを返すため usecase で確認する。
    """

    store_id: int = Field(..., description="店舗ID")
    start_date: date = Field(..., description="検索開始日")
    end_date: date = Field(..., description="検索終了日")


def _assert_pair(label: str, start: Optional[time], end: Optional[time]) -> None:
    """開始と終了が対で入っていること、前後関係が正しいことを確かめる"""
    if (start is None) != (end is None):
        raise ValueError(f"{label}は開始と終了の両方を指定してください")
    if start is not None and end is not None and start >= end:
        raise ValueError(f"{label}の開始は終了より前である必要があります")
