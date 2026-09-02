# -*- coding: utf-8 -*-
"""スケジュール管理API（社内向け・ログイン必須）

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
    ScheduleAvailability,
    ScheduleAvailabilityQuery,
    ScheduleCreate,
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
    """スケジュール一覧取得

    絞り込みだけで業務ルールが無いため、repositoryを直接呼ぶ。
    担当店舗（actor.store_ids）は絞り込み条件としてそのまま渡す。
    """
    return schedules_query.search(
        db, store_ids=actor.store_ids, **query.model_dump()
    )


@router.get("/schedules/availability", response_model=List[ScheduleAvailability])
def get_schedule_availability(
    actor: ReadonlyUser,
    query: Annotated[ScheduleAvailabilityQuery, Query()],
    db: Session = Depends(get_db),
):
    """空き状況一覧取得

    パスが /schedules/{schedule_id} と競合するため、この定義は詳細取得より
    先に置くこと。後ろに置くと availability が schedule_id として解釈される。
    """
    return schedules_usecase.list_availability(db, actor, query)


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: int, actor: ReadonlyUser, db: Session = Depends(get_db)):
    """スケジュール詳細取得"""
    return schedules_usecase.get_schedule(db, actor, schedule_id)


@router.post(
    "/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED
)
def create_schedule(
    schedule: ScheduleCreate, actor: StaffUser, db: Session = Depends(get_db)
):
    """スケジュール新規作成"""
    return schedules_usecase.create_schedule(db, actor, schedule)


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule: ScheduleUpdate,
    actor: StaffUser,
    db: Session = Depends(get_db),
):
    """スケジュール更新"""
    return schedules_usecase.update_schedule(db, actor, schedule_id, schedule)


@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, actor: StaffUser, db: Session = Depends(get_db)):
    """スケジュール削除（論理削除）"""
    schedules_usecase.delete_schedule(db, actor, schedule_id)
