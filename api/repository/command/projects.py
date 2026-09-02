# -*- coding: utf-8 -*-
"""プロジェクトのINSERT / UPDATE / DELETE"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import ProjectSchoolDivisions, Projects, ProjectStores
from system.clock import now


def create(db: Session, values: dict) -> Projects:
    """プロジェクトを追加する

    関連テーブルの登録にIDが必要なため flush までは行う。
    """
    project = Projects(**values)
    db.add(project)
    db.flush()
    return project


def update(db: Session, project: Projects, values: dict) -> Projects:
    """指定された項目だけ書き換える"""
    for field, value in values.items():
        setattr(project, field, value)
    return project


def soft_delete(db: Session, project: Projects) -> Projects:
    """論理削除する（project_stores はCASCADEで消える）"""
    project.deleted_at = now()
    return project


def replace_store_ids(db: Session, project_id: int, store_ids: list[int]) -> None:
    """対象店舗を指定された内容で置き換える"""
    db.query(ProjectStores).filter(ProjectStores.project_id == project_id).delete()
    for store_id in sorted(set(store_ids)):
        db.add(ProjectStores(project_id=project_id, store_id=store_id))


def replace_division_periods(db: Session, project_id: int, periods: list) -> None:
    """学校区分ごとの受付期間を指定された内容で置き換える"""
    db.query(ProjectSchoolDivisions).filter(
        ProjectSchoolDivisions.project_id == project_id
    ).delete()
    for period in periods:
        db.add(
            ProjectSchoolDivisions(
                project_id=project_id,
                school_divisions_id=period.school_divisions_id,
                start_date=period.start_date,
                end_date=period.end_date,
            )
        )
