# -*- coding: utf-8 -*-
"""スケジュール取得API（公開・認証不要）"""

# 標準ライブラリ
from typing import Annotated

# サードパーティ
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

# ローカル
from schema.schedules import SchedulePublic, SchedulePublicQuery
from system.db import get_db
from usecase.public import schedules as schedules_usecase

router = APIRouter()


@router.get("/schedules", response_model=list[SchedulePublic])
def get_schedules(
    query: Annotated[SchedulePublicQuery, Query()], db: Session = Depends(get_db)
):
    """スケジュール一覧を取得（顧客向け・空き状況確認）"""
    return schedules_usecase.list_open_schedules(db, query)
