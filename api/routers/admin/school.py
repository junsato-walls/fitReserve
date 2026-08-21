# -*- coding: utf-8 -*-
"""学校管理API（管理者専用）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from system.db import get_db
from system.models import Schools
from schemas.schools import SchoolCreate, SchoolUpdate, SchoolResponse
from schemas.custom.auth import DecodedToken
from system.auth import require_admin
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "schools"

# 管理者のみアクセス可能
UserDependency = Annotated[DecodedToken, Depends(require_admin)]


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/schools", response_model=List[SchoolResponse])
def get_schools(
    login_user: UserDependency,
    skip: int = 0,
    limit: int = 100,
    school_type: str = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
):
    """学校一覧取得"""
    query = db.query(Schools)
    if not include_deleted:
        query = query.filter(Schools.deleted_at.is_(None))
    if school_type:
        query = query.filter(Schools.school_type == school_type)
    schools = query.offset(skip).limit(limit).all()
    return schools


@router.get("/schools/{school_id}", response_model=SchoolResponse)
def get_school(
    school_id: int, login_user: UserDependency, db: Session = Depends(get_db)
):
    """学校詳細取得"""
    school = (
        db.query(Schools)
        .filter(Schools.id == school_id, Schools.deleted_at.is_(None))
        .first()
    )
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="学校が見つかりません"
        )
    return school


@router.post(
    "/schools", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED
)
def create_school(
    school: SchoolCreate, login_user: UserDependency, db: Session = Depends(get_db)
):
    """学校新規作成"""
    # 学校コードの重複チェック
    existing = (
        db.query(Schools)
        .filter(Schools.school_code == school.school_code, Schools.deleted_at.is_(None))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この学校コードは既に使用されています",
        )

    db_school = Schools(**school.model_dump())
    db.add(db_school)
    db.commit()
    db.refresh(db_school)
    return db_school


@router.put("/schools/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: int,
    school: SchoolUpdate,
    login_user: UserDependency,
    db: Session = Depends(get_db),
):
    """学校更新"""
    db_school = (
        db.query(Schools)
        .filter(Schools.id == school_id, Schools.deleted_at.is_(None))
        .first()
    )
    if not db_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="学校が見つかりません"
        )

    # 学校コード変更時の重複チェック
    if school.school_code and school.school_code != db_school.school_code:
        existing = (
            db.query(Schools)
            .filter(
                Schools.school_code == school.school_code,
                Schools.deleted_at.is_(None),
                Schools.id != school_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この学校コードは既に使用されています",
            )

    # 更新処理
    update_data = school.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_school, field, value)

    db.commit()
    db.refresh(db_school)
    return db_school


@router.delete("/schools/{school_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_school(
    school_id: int, login_user: UserDependency, db: Session = Depends(get_db)
):
    """学校削除（論理削除）"""
    db_school = (
        db.query(Schools)
        .filter(Schools.id == school_id, Schools.deleted_at.is_(None))
        .first()
    )
    if not db_school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="学校が見つかりません"
        )

    db_school.deleted_at = jst()
    db.commit()
    return None
