# -*- coding: utf-8 -*-
"""スケジュール取得API（公開・認証不要）"""

# 標準ライブラリ
from typing import Annotated

# サードパーティ
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

# ローカル
from schema.schedules import SchedulePublicQuery, SchedulePublicSlot
from system.db import get_db
from usecase.public import schedules as schedules_usecase

router = APIRouter()


@router.get("/schedules", response_model=list[SchedulePublicSlot])
def get_schedules(
    query: Annotated[SchedulePublicQuery, Query()], db: Session = Depends(get_db)
):
    """予約できる枠の一覧を取得（顧客向け・空き状況確認）

    枠はDBに持たず、店舗の営業時間から導出する。
    定休日・受付停止の日、休憩時間、枠止め、満席の枠は含まれない。
    """
    return schedules_usecase.list_open_slots(db, query)
