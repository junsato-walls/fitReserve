# -*- coding: utf-8 -*-
"""時刻の取得

JSTの現在時刻を1か所で作る。各モジュールが個別に定義すると
タイムゾーンの指定漏れが起きるため、必ずここを経由する。
"""

# 標準ライブラリ
from datetime import date, datetime
from zoneinfo import ZoneInfo

JST = ZoneInfo("Asia/Tokyo")


def now() -> datetime:
    """JSTの現在日時"""
    return datetime.now(JST)


def today():
    """JSTの今日の日付"""
    return now().date()


def to_dow(target: date) -> int:
    """曜日を 0=日曜 〜 6=土曜 で返す

    DBの store_regular_holidays.weekday は PostgreSQL の EXTRACT(DOW) に
    合わせて日曜始まりだが、Python の date.weekday() は月曜始まりのため、
    比較する前に必ずここで揃える。
    """
    return (target.weekday() + 1) % 7
