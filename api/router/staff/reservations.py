# -*- coding: utf-8 -*-
"""予約管理API（社内向け・ログイン必須）

面の既定は readonly。更新系は引数で StaffUser に強めている。
"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# ローカル
from schema.reservations import (
    ReservationResponse,
    ReservationSearchQuery,
    ReservationUpdate,
    ReservationWithDetails,
)
from system.db import get_db
from system.permissions import ReadonlyUser, StaffUser
from usecase.staff import reservations as reservations_usecase

router = APIRouter()


@router.get("/reservations", response_model=List[ReservationWithDetails])
def get_reservations(
    actor: ReadonlyUser,
    query: Annotated[ReservationSearchQuery, Query()],
    db: Session = Depends(get_db),
):
    """予約一覧取得（フィルター機能付き）"""
    return reservations_usecase.list_reservations(db, actor, query)


@router.get("/reservations/{reservation_id}", response_model=ReservationWithDetails)
def get_reservation(
    reservation_id: int, actor: ReadonlyUser, db: Session = Depends(get_db)
):
    """予約詳細取得"""
    return reservations_usecase.get_reservation(db, actor, reservation_id)


@router.put("/reservations/{reservation_id}", response_model=ReservationResponse)
def update_reservation(
    reservation_id: int,
    reservation: ReservationUpdate,
    actor: StaffUser,
    db: Session = Depends(get_db),
):
    """予約更新"""
    return reservations_usecase.update_reservation(
        db, actor, reservation_id, reservation
    )


@router.delete("/reservations/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_reservation(
    reservation_id: int, actor: StaffUser, db: Session = Depends(get_db)
):
    """予約キャンセル（ステータスをcancelledに変更）"""
    reservations_usecase.cancel_reservation(db, actor, reservation_id)
