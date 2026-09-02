# -*- coding: utf-8 -*-
"""プロジェクトのSELECT"""

# 標準ライブラリ
from datetime import date
from typing import Optional

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import ProjectSchoolDivisions, Projects, SchoolDivisions


def find_by_id(db: Session, project_id: int) -> Optional[Projects]:
    """IDで1件取得する（削除済みは除く）"""
    return (
        db.query(Projects)
        .filter(Projects.id == project_id, Projects.deleted_at.is_(None))
        .first()
    )


def find_public(db: Session, project_id: int, company_id: int) -> Optional[Projects]:
    """顧客に見せてよいプロジェクトを1件取得する（有効かつ会社が一致）"""
    return (
        db.query(Projects)
        .filter(
            Projects.id == project_id,
            Projects.company_id == company_id,
            Projects.is_enabled.is_(True),
            Projects.deleted_at.is_(None),
        )
        .first()
    )


def exists_project_code(db: Session, project_code: str, exclude_id: int = 0) -> bool:
    """プロジェクトコードが既に使われているか"""
    return (
        db.query(Projects.id)
        .filter(
            Projects.project_code == project_code,
            Projects.deleted_at.is_(None),
            Projects.id != exclude_id,
        )
        .first()
        is not None
    )


def search(
    db: Session, skip: int = 0, limit: int = 100, include_deleted: bool = False
) -> list[Projects]:
    """プロジェクト一覧を取得する"""
    query = db.query(Projects)
    if not include_deleted:
        query = query.filter(Projects.deleted_at.is_(None))
    return query.order_by(Projects.id).offset(skip).limit(limit).all()


def names_by_ids(db: Session, project_ids: set[int]) -> dict[int, str]:
    """IDからプロジェクト名を引く辞書"""
    if not project_ids:
        return {}
    rows = (
        db.query(Projects.id, Projects.name).filter(Projects.id.in_(project_ids)).all()
    )
    return {row.id: row.name for row in rows}


def list_division_periods(
    db: Session, project_id: int
) -> list[ProjectSchoolDivisions]:
    """学校区分ごとの予約受付期間を取得する"""
    return (
        db.query(ProjectSchoolDivisions)
        .filter(ProjectSchoolDivisions.project_id == project_id)
        .order_by(ProjectSchoolDivisions.school_divisions_id)
        .all()
    )


def find_division_period(
    db: Session, project_id: int, school_divisions_id: int
) -> Optional[ProjectSchoolDivisions]:
    """特定の学校区分の受付期間を取得する（無ければ受付対象外）"""
    return (
        db.query(ProjectSchoolDivisions)
        .filter(
            ProjectSchoolDivisions.project_id == project_id,
            ProjectSchoolDivisions.school_divisions_id == school_divisions_id,
        )
        .first()
    )


def list_accepting_divisions(
    db: Session, project_id: int, target_date: date
) -> list[tuple[ProjectSchoolDivisions, SchoolDivisions]]:
    """指定日に受付中の学校区分を、区分マスタと組で取得する"""
    return (
        db.query(ProjectSchoolDivisions, SchoolDivisions)
        .join(
            SchoolDivisions,
            SchoolDivisions.id == ProjectSchoolDivisions.school_divisions_id,
        )
        .filter(
            ProjectSchoolDivisions.project_id == project_id,
            ProjectSchoolDivisions.start_date <= target_date,
            ProjectSchoolDivisions.end_date >= target_date,
        )
        .order_by(SchoolDivisions.id)
        .all()
    )
