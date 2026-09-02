# -*- coding: utf-8 -*-
"""学校管理API（admin以上）"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import schools as schools_query
from schema.schools import (
    SchoolCreate,
    SchoolResponse,
    SchoolSearchQuery,
    SchoolUpdate,
)
from system.db import get_db
from usecase.admin import schools as schools_usecase

router = APIRouter()


@router.get("/schools", response_model=List[SchoolResponse])
def get_schools(
    query: Annotated[SchoolSearchQuery, Query()], db: Session = Depends(get_db)
):
    """学校一覧取得（絞り込みのみのため repository を直接呼ぶ）

    Queryスキーマの項目名は repository の引数名と一致させてある。
    """
    return schools_query.search(db, **query.model_dump())


@router.get("/schools/{school_id}", response_model=SchoolResponse)
def get_school(school_id: int, db: Session = Depends(get_db)):
    """学校詳細取得（取得して無ければ404のみのため repository を直接呼ぶ）"""
    school = schools_query.find_by_id(db, school_id)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=schools_usecase.NOT_FOUND
        )
    return school


@router.post(
    "/schools", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED
)
def create_school(school: SchoolCreate, db: Session = Depends(get_db)):
    """学校新規作成"""
    return schools_usecase.create_school(db, school)


@router.put("/schools/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: int, school: SchoolUpdate, db: Session = Depends(get_db)
):
    """学校更新"""
    return schools_usecase.update_school(db, school_id, school)


@router.delete("/schools/{school_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_school(school_id: int, db: Session = Depends(get_db)):
    """学校削除（論理削除）"""
    schools_usecase.delete_school(db, school_id)
