# -*- coding: utf-8 -*-
"""予約登録API（公開・認証不要）"""

# サードパーティ
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import reservations as reservations_query
from schema.reservations import ReservationCreate, ReservationResponse
from system.db import get_db
from usecase.public import reservations as reservations_usecase

router = APIRouter()


@router.post(
    "/reservations",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    """予約新規作成（顧客向け・認証不要）"""
    return reservations_usecase.create_reservation(db, reservation)


@router.get("/reservations/{reservation_number}", response_model=ReservationResponse)
def get_reservation_by_number(reservation_number: str, db: Session = Depends(get_db)):
    """予約番号で予約を検索（顧客向け）"""
    reservation = reservations_query.find_by_number(db, reservation_number)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません"
        )
    return reservation
