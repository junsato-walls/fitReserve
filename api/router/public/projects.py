# -*- coding: utf-8 -*-
"""プロジェクト取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import (
    Companies,
    Projects,
    ProjectSchoolDivisions,
    ProjectStores,
    SchoolDivisions,
    Stores,
)
from schemas.public.projects import AcceptingDivision, ProjectPublic
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "public-projects"


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


def _accepting_divisions(project_id: int, db: Session) -> list[AcceptingDivision]:
    """本日受付中の学校区分を返す

    SPECIFICATION.md BL-2「受付期間の範囲内のみ予約可能」に従い、
    期間外の区分は返さない。（選んでも予約できる日が無いため）
    """
    today = jst().date()
    rows = (
        db.query(ProjectSchoolDivisions, SchoolDivisions)
        .join(
            SchoolDivisions,
            SchoolDivisions.id == ProjectSchoolDivisions.school_divisions_id,
        )
        .filter(
            ProjectSchoolDivisions.project_id == project_id,
            ProjectSchoolDivisions.start_date <= today,
            ProjectSchoolDivisions.end_date >= today,
        )
        .order_by(SchoolDivisions.id)
        .all()
    )
    return [
        AcceptingDivision(
            school_divisions_id=period.school_divisions_id,
            name=division.name,
            start_date=period.start_date,
            end_date=period.end_date,
        )
        for period, division in rows
    ]


@router.get("/projects/{project_id}", response_model=ProjectPublic)
def get_project(
    project_id: int,
    company_slug: str = Query(..., description="会社スラッグ（予約URLの先頭）"),
    store_id: int | None = Query(None, description="店舗ID（指定時は対象店舗か検証）"),
    db: Session = Depends(get_db),
):
    """予約受付用のプロジェクト情報を取得（顧客向け）

    予約URL /[company_slug]/[project_id]/[store_id] の妥当性をまとめて検証する。
    URLは公開されるため、会社・プロジェクト・店舗の組み合わせが正しいことを
    ここで確認してから予約フォームを表示する。
    """
    company = (
        db.query(Companies)
        .filter(Companies.slug == company_slug, Companies.deleted_at.is_(None))
        .first()
    )
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="会社が見つかりません"
        )

    project = (
        db.query(Projects)
        .filter(
            Projects.id == project_id,
            Projects.company_id == company.id,
            Projects.is_enabled.is_(True),
            Projects.deleted_at.is_(None),
        )
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プロジェクトが見つかりません",
        )

    if store_id is not None and not _is_target_store(project.id, store_id, db):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="この店舗はプロジェクトの対象ではありません",
        )

    return ProjectPublic(
        id=project.id,
        project_code=project.project_code,
        name=project.name,
        description=project.description,
        reservation_interval=project.reservation_interval,
        company_slug=company.slug,
        accepting_divisions=_accepting_divisions(project.id, db),
    )


def _is_target_store(project_id: int, store_id: int, db: Session) -> bool:
    """店舗がプロジェクトの対象かを判定する

    project_stores にレコードが無いプロジェクトは全店舗が対象という仕様。
    """
    store = (
        db.query(Stores)
        .filter(
            Stores.id == store_id,
            Stores.is_enabled.is_(True),
            Stores.deleted_at.is_(None),
        )
        .first()
    )
    if not store:
        return False

    target_ids = [
        ps.store_id
        for ps in db.query(ProjectStores)
        .filter(ProjectStores.project_id == project_id)
        .all()
    ]
    return not target_ids or store_id in target_ids
