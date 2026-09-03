# -*- coding: utf-8 -*-
"""枠止めAPI（社内向け・ログイン必須）

予約以外の用途で時間を埋めるためのもの（休憩・棚卸し・研修など）。
ここに重なる予約枠は受付から外れる。

面の既定は readonly。更新系は引数で StaffUser に強めている。
"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import schedule_blocks as blocks_query
from schema.schedules import (
    ScheduleBlockCreate,
    ScheduleBlockResponse,
    ScheduleBlockSearchQuery,
    ScheduleBlockUpdate,
)
from system.db import get_db
from system.permissions import ReadonlyUser, StaffUser
from usecase.staff import schedule_blocks as blocks_usecase

router = APIRouter()


@router.get("/schedule-blocks", response_model=List[ScheduleBlockResponse])
def get_schedule_blocks(
    actor: ReadonlyUser,
    query: Annotated[ScheduleBlockSearchQuery, Query()],
    db: Session = Depends(get_db),
):
    """枠止めの一覧取得

    絞り込みだけで業務ルールが無いため、repositoryを直接呼ぶ。
    """
    return blocks_query.search(db, store_ids=actor.store_ids, **query.model_dump())


@router.post(
    "/schedule-blocks",
    response_model=ScheduleBlockResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_schedule_block(
    block: ScheduleBlockCreate, actor: StaffUser, db: Session = Depends(get_db)
):
    """枠止めの新規作成"""
    return blocks_usecase.create_block(db, actor, block)


@router.put("/schedule-blocks/{block_id}", response_model=ScheduleBlockResponse)
def update_schedule_block(
    block_id: int,
    block: ScheduleBlockUpdate,
    actor: StaffUser,
    db: Session = Depends(get_db),
):
    """枠止めの更新（タイムテーブルのドラッグ移動でも使う）"""
    return blocks_usecase.update_block(db, actor, block_id, block)


@router.delete("/schedule-blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_block(
    block_id: int, actor: StaffUser, db: Session = Depends(get_db)
):
    """枠止めの削除（論理削除）"""
    blocks_usecase.delete_block(db, actor, block_id)
