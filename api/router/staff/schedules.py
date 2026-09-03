# -*- coding: utf-8 -*-
"""スケジュール管理API（社内向け・ログイン必須）

スケジュールは「店舗×日」の受付設定。時間枠そのものは持たず、
受付時間（未設定なら店舗の営業時間）から導出する。

面の既定は readonly。更新系は引数で StaffUser に強めている。
"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import schedules as schedules_query
from schema.schedules import (
    ScheduleCreate,
    ScheduleDay,
    ScheduleDayQuery,
    ScheduleResponse,
    ScheduleSearchQuery,
    ScheduleUpdate,
)
from system.db import get_db
from system.permissions import ReadonlyUser, StaffUser
from usecase.staff import schedules as schedules_usecase

router = APIRouter()


@router.get("/schedules", response_model=List[ScheduleResponse])
def get_schedules(
    actor: ReadonlyUser,
    query: Annotated[ScheduleSearchQuery, Query()],
    db: Session = Depends(get_db),
):
    """受付設定の一覧取得

    絞り込みだけで業務ルールが無いため、repositoryを直接呼ぶ。
    担当店舗（actor.store_ids）は絞り込み条件としてそのまま渡す。
    """
    return schedules_query.search(db, store_ids=actor.store_ids, **query.model_dump())


@router.get("/schedules/days", response_model=List[ScheduleDay])
def get_schedule_days(
    actor: ReadonlyUser,
    query: Annotated[ScheduleDayQuery, Query()],
    db: Session = Depends(get_db),
):
    """タイムテーブル（店舗×日）を取得

    予約枠・枠止め・空き数を組み立てて返す。
    パスが /schedules/{schedule_id} と競合するため、この定義は詳細取得より
    先に置くこと。後ろに置くと days が schedule_id として解釈される。
    """
    return schedules_usecase.list_days(db, actor, query)


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: int, actor: ReadonlyUser, db: Session = Depends(get_db)):
    """受付設定の詳細取得"""
    return schedules_usecase.get_schedule(db, actor, schedule_id)


@router.post(
    "/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED
)
def create_schedule(
    schedule: ScheduleCreate, actor: StaffUser, db: Session = Depends(get_db)
):
    """受付設定の新規作成（1日分）"""
    return schedules_usecase.create_schedule(db, actor, schedule)


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule: ScheduleUpdate,
    actor: StaffUser,
    db: Session = Depends(get_db),
):
    """受付設定の更新（同時予約数・受付時間・休憩など）"""
    return schedules_usecase.update_schedule(db, actor, schedule_id, schedule)


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, actor: StaffUser, db: Session = Depends(get_db)):
    """受付設定の削除（論理削除）"""
    schedules_usecase.delete_schedule(db, actor, schedule_id)
