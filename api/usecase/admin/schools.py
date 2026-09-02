# -*- coding: utf-8 -*-
"""学校マスタの業務ロジック"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Schools
from repository.command import schools as schools_command
from repository.query import schools as schools_query
from schema.schools import SchoolCreate, SchoolUpdate

NOT_FOUND = "学校が見つかりません"
DUPLICATED_CODE = "この学校コードは既に使用されています"


def create_school(db: Session, payload: SchoolCreate) -> Schools:
    """学校を新規作成する"""
    if schools_query.exists_school_code(db, payload.school_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATED_CODE
        )

    school = schools_command.create(db, payload.model_dump())

    db.commit()
    db.refresh(school)
    return school


def update_school(db: Session, school_id: int, payload: SchoolUpdate) -> Schools:
    """学校を更新する"""
    school = _find(db, school_id)

    if payload.school_code and payload.school_code != school.school_code:
        if schools_query.exists_school_code(
            db, payload.school_code, exclude_id=school_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATED_CODE
            )

    schools_command.update(db, school, payload.model_dump(exclude_unset=True))

    db.commit()
    db.refresh(school)
    return school


def delete_school(db: Session, school_id: int) -> None:
    """学校を削除する（論理削除）"""
    school = _find(db, school_id)
    schools_command.soft_delete(db, school)
    db.commit()


def _find(db: Session, school_id: int) -> Schools:
    school = schools_query.find_by_id(db, school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return school
