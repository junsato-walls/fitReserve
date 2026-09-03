# -*- coding: utf-8 -*-
"""枠止め（予約以外で時間を埋める）の業務ロジック（社内向け）"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import ScheduleBlocks
from repository.command import schedule_blocks as blocks_command
from repository.query import reservations as reservations_query
from repository.query import schedule_blocks as blocks_query
from repository.query import stores as stores_query
from schema.schedules import ScheduleBlockCreate, ScheduleBlockUpdate
from system.permissions import Actor

# 権限外の枠止めは「存在しない」として扱う
NOT_FOUND = "枠止めが見つかりません"
STORE_NOT_FOUND = "指定された店舗が見つかりません"


def create_block(
    db: Session, actor: Actor, payload: ScheduleBlockCreate
) -> ScheduleBlocks:
    """枠止めを追加する"""
    actor.assert_store(payload.store_id, STORE_NOT_FOUND)

    if not stores_query.find_by_id(db, payload.store_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=STORE_NOT_FOUND
        )

    _assert_free(
        db,
        payload.store_id,
        payload.block_date,
        payload.start_time,
        payload.end_time,
    )

    block = blocks_command.create(db, payload.model_dump())

    db.commit()
    db.refresh(block)
    return block


def update_block(
    db: Session, actor: Actor, block_id: int, payload: ScheduleBlockUpdate
) -> ScheduleBlocks:
    """枠止めを更新する（タイムテーブルのドラッグ移動でも使う）"""
    block = _find(db, actor, block_id)
    values = payload.model_dump(exclude_unset=True)

    store_id = values.get("store_id", block.store_id)
    block_date = values.get("block_date", block.block_date)
    start_time = values.get("start_time", block.start_time)
    end_time = values.get("end_time", block.end_time)

    # 担当外の店舗へは移せない
    if "store_id" in values:
        actor.assert_store(store_id, STORE_NOT_FOUND)

    # 部分更新では片側だけが送られてくるため、更新後の値どうしで確かめる
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="開始時刻は終了時刻より前である必要があります",
        )

    _assert_free(db, store_id, block_date, start_time, end_time, exclude_id=block_id)

    blocks_command.update(db, block, values)

    db.commit()
    db.refresh(block)
    return block


def delete_block(db: Session, actor: Actor, block_id: int) -> None:
    """枠止めを削除する（論理削除）"""
    block = _find(db, actor, block_id)
    blocks_command.soft_delete(db, block)
    db.commit()


def _assert_free(
    db: Session,
    store_id: int,
    block_date,
    start_time,
    end_time,
    exclude_id: int = 0,
) -> None:
    """その時間に他の枠止めや予約が無いことを確かめる

    予約の入っている時間を塞ぐと、予約が残ったまま枠が消えて実体と食い違う。
    """
    if blocks_query.find_overlapping(
        db, store_id, block_date, start_time, end_time, exclude_id=exclude_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="同じ時間に別の枠止めがあります",
        )

    reserved = reservations_query.count_by_slot(
        db, [store_id], block_date, block_date
    )
    if any(
        start_time <= reservation_time < end_time
        for (_, _, reservation_time), count in reserved.items()
        if count > 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="予約が入っている時間は枠止めできません",
        )


def _find(db: Session, actor: Actor, block_id: int) -> ScheduleBlocks:
    """担当店舗の枠止めを取得する。無ければ404"""
    block = blocks_query.find_by_id(db, block_id)
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)

    actor.assert_store(block.store_id, NOT_FOUND)
    return block
