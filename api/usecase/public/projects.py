# -*- coding: utf-8 -*-
"""予約受付用プロジェクトの業務ロジック（顧客向け）"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import projects as projects_query
from repository.query import companies as companies_query
from repository.query import stores as stores_query
from schema.projects import AcceptingDivision, ProjectPublic, ProjectPublicQuery
from system.clock import today


def get_reservation_project(
    db: Session, project_id: int, query: ProjectPublicQuery
) -> ProjectPublic:
    """予約URLの妥当性を検証したうえでプロジェクト情報を返す

    予約URL /[company_slug]/[project_id]/[store_id] は公開されるため、
    会社・プロジェクト・店舗の組み合わせが正しいことをここで確認してから
    予約フォームを表示する。
    """
    company = companies_query.find_by_slug(db, query.company_slug)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="会社が見つかりません"
        )

    project = projects_query.find_public(db, project_id, company.id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プロジェクトが見つかりません",
        )

    if query.store_id is not None and not _is_target_store(
        db, project.id, query.store_id
    ):
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
        accepting_divisions=_accepting_divisions(db, project.id),
    )


def _accepting_divisions(db: Session, project_id: int) -> list[AcceptingDivision]:
    """本日受付中の学校区分を返す

    SPECIFICATION.md BL-2「受付期間の範囲内のみ予約可能」に従い、
    期間外の区分は返さない。（選んでも予約できる日が無いため）
    """
    rows = projects_query.list_accepting_divisions(db, project_id, today())
    return [
        AcceptingDivision(
            school_divisions_id=period.school_divisions_id,
            name=division.name,
            start_date=period.start_date,
            end_date=period.end_date,
        )
        for period, division in rows
    ]


def _is_target_store(db: Session, project_id: int, store_id: int) -> bool:
    """店舗がプロジェクトの対象かを判定する

    project_stores にレコードが無いプロジェクトは全店舗が対象という仕様。
    """
    if not stores_query.find_enabled_by_id(db, store_id):
        return False

    target_ids = stores_query.list_project_store_ids(db, project_id)
    return not target_ids or store_id in target_ids
