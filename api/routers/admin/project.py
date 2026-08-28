# -*- coding: utf-8 -*-
"""プロジェクト管理API（管理者専用）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from system.db import get_db
from system.models import Projects, ProjectStores, ProjectSchoolDivisions
from schemas.projects import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SchoolDivisionPeriod,
)
from schemas.custom.auth import DecodedToken
from system.auth import require_admin
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "projects"

# 管理者のみアクセス可能
UserDependency = Annotated[DecodedToken, Depends(require_admin)]


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


def _summarize_periods(
    periods: list[SchoolDivisionPeriod], is_enabled: bool
) -> dict:
    """区分別の受付期間から、一覧表示用のまとめを作る

    プロジェクト自体は期間を持たないため、全区分の最も早い開始日と
    最も遅い終了日を「プロジェクトの期間」として扱う。
    受付中かどうかは、プロジェクトが有効で、かついずれか1つの区分が
    本日を含んでいれば真とする（無効なプロジェクトは顧客側に出ないため）。
    """
    if not periods:
        return {
            "school_divisions": [],
            "start_date": None,
            "end_date": None,
            "is_accepting": False,
        }

    today = jst().date()
    return {
        "school_divisions": periods,
        "start_date": min(p.start_date for p in periods),
        "end_date": max(p.end_date for p in periods),
        "is_accepting": is_enabled
        and any(p.start_date <= today <= p.end_date for p in periods),
    }


def _division_periods(project_id: int, db: Session) -> list[SchoolDivisionPeriod]:
    """学校区分ごとの予約受付期間を取得する"""
    return [
        SchoolDivisionPeriod(
            school_divisions_id=d.school_divisions_id,
            start_date=d.start_date,
            end_date=d.end_date,
        )
        for d in db.query(ProjectSchoolDivisions)
        .filter(ProjectSchoolDivisions.project_id == project_id)
        .order_by(ProjectSchoolDivisions.school_divisions_id)
        .all()
    ]


def _replace_division_periods(
    project_id: int, periods: list[SchoolDivisionPeriod], db: Session
) -> None:
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


def _build_project_response(project_id: int, db: Session) -> ProjectResponse:
    """プロジェクトと関連情報（対象店舗・区分別受付期間）をまとめて取得する

    FastAPIのDI（Depends）を経由しない通常の関数のため、
    ルートハンドラ間で使い回してもDependsの未解決オブジェクトが
    渡ってしまう心配がない。
    """
    project = (
        db.query(Projects)
        .filter(Projects.id == project_id, Projects.deleted_at.is_(None))
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="プロジェクトが見つかりません"
        )

    project_dict = ProjectResponse.model_validate(project).model_dump()

    # 対象店舗ID取得
    store_ids = [
        ps.store_id
        for ps in db.query(ProjectStores)
        .filter(ProjectStores.project_id == project.id)
        .all()
    ]
    project_dict["store_ids"] = store_ids
    project_dict.update(
        _summarize_periods(_division_periods(project.id, db), project.is_enabled)
    )

    return ProjectResponse(**project_dict)


@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(
    login_user: UserDependency,
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
):
    """プロジェクト一覧取得"""
    query = db.query(Projects)
    if not include_deleted:
        query = query.filter(Projects.deleted_at.is_(None))
    projects = query.offset(skip).limit(limit).all()

    # 関連する店舗IDを取得
    result = []
    for project in projects:
        project_dict = ProjectResponse.model_validate(project).model_dump()

        # 対象店舗ID取得
        store_ids = [
            ps.store_id
            for ps in db.query(ProjectStores)
            .filter(ProjectStores.project_id == project.id)
            .all()
        ]
        project_dict["store_ids"] = store_ids
        project_dict.update(
            _summarize_periods(_division_periods(project.id, db), project.is_enabled)
        )

        result.append(ProjectResponse(**project_dict))

    return result


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int, login_user: UserDependency, db: Session = Depends(get_db)
):
    """プロジェクト詳細取得"""
    return _build_project_response(project_id, db)


@router.post(
    "/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED
)
def create_project(
    project: ProjectCreate, login_user: UserDependency, db: Session = Depends(get_db)
):
    """プロジェクト新規作成"""
    # プロジェクトコードの重複チェック
    existing = (
        db.query(Projects)
        .filter(
            Projects.project_code == project.project_code, Projects.deleted_at.is_(None)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このプロジェクトコードは既に使用されています",
        )

    # プロジェクト本体を作成
    project_data = project.model_dump(exclude={"store_ids", "school_divisions"})
    db_project = Projects(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # 対象店舗を登録（指定がある場合のみ）
    if project.store_ids:
        for store_id in project.store_ids:
            db.add(ProjectStores(project_id=db_project.id, store_id=store_id))

    # 学校区分ごとの受付期間を登録（指定がある場合のみ）
    if project.school_divisions:
        _replace_division_periods(db_project.id, project.school_divisions, db)

    db.commit()
    db.refresh(db_project)

    # レスポンス作成
    return _build_project_response(db_project.id, db)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    login_user: UserDependency,
    db: Session = Depends(get_db),
):
    """プロジェクト更新"""
    db_project = (
        db.query(Projects)
        .filter(Projects.id == project_id, Projects.deleted_at.is_(None))
        .first()
    )
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="プロジェクトが見つかりません"
        )

    # プロジェクトコード変更時の重複チェック
    if project.project_code and project.project_code != db_project.project_code:
        existing = (
            db.query(Projects)
            .filter(
                Projects.project_code == project.project_code,
                Projects.deleted_at.is_(None),
                Projects.id != project_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このプロジェクトコードは既に使用されています",
            )

    # 更新処理
    update_data = project.model_dump(
        exclude_unset=True, exclude={"store_ids", "school_divisions"}
    )
    for field, value in update_data.items():
        setattr(db_project, field, value)

    # 対象店舗の更新
    if project.store_ids is not None:
        # 既存の関連を削除
        db.query(ProjectStores).filter(ProjectStores.project_id == project_id).delete()
        # 新しい関連を追加
        for store_id in project.store_ids:
            db.add(ProjectStores(project_id=project_id, store_id=store_id))

    # 学校区分ごとの受付期間の更新（未指定なら変更しない）
    if project.school_divisions is not None:
        _replace_division_periods(project_id, project.school_divisions, db)

    db.commit()
    db.refresh(db_project)

    return _build_project_response(project_id, db)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int, login_user: UserDependency, db: Session = Depends(get_db)
):
    """プロジェクト削除（論理削除）"""
    db_project = (
        db.query(Projects)
        .filter(Projects.id == project_id, Projects.deleted_at.is_(None))
        .first()
    )
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="プロジェクトが見つかりません"
        )

    db_project.deleted_at = jst()
    # CASCADE設定により、project_stores も自動削除される
    db.commit()
    return None
