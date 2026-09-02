# -*- coding: utf-8 -*-
"""予約のINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy import text
from sqlalchemy.orm import Session

# ローカル
from model import Reservations


def create(db: Session, values: dict) -> Reservations:
    """予約を追加する"""
    reservation = Reservations(**values)
    db.add(reservation)
    db.flush()
    return reservation


def update(db: Session, reservation: Reservations, values: dict) -> Reservations:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(reservation, field, value)
    return reservation


def lock_numbering(db: Session, year: int, month: int) -> None:
    """予約番号の採番を直列化する

    同時採番による番号の重複を防ぐ。ロックはトランザクション終了時に自動で解放される。
    """
    db.execute(
        text("SELECT pg_advisory_xact_lock(:lock_key)"),
        {"lock_key": year * 100 + month},
    )
