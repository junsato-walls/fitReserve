# -*- coding: utf-8 -*-
"""時刻の取得

JSTの現在時刻を1か所で作る。各モジュールが個別に定義すると
タイムゾーンの指定漏れが起きるため、必ずここを経由する。
"""

# 標準ライブラリ
from datetime import datetime
from zoneinfo import ZoneInfo

JST = ZoneInfo("Asia/Tokyo")


def now() -> datetime:
    """JSTの現在日時"""
    return datetime.now(JST)


def today():
    """JSTの今日の日付"""
    return now().date()
