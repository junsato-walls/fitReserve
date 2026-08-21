# -*- coding: utf-8 -*-
"""プロジェクト管理API（管理者専用）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Annotated
from system.db import get_db
from system.models import Projects, ProjectStores, ProjectSchools
from schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse
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


def _build_project_response(project_id: int, db: Session) -> ProjectResponse:
    """プロジェクトと関連情報（対象店舗・学校ID）をまとめて取得する

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

    # 対象学校ID取得
    school_ids = [
        ps.school_id
        for ps in db.query(ProjectSchools)
        .filter(ProjectSchools.project_id == project.id)
        .all()
    ]
    project_dict["school_ids"] = school_ids

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

    # 関連する店舗IDと学校IDを取得
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

        # 対象学校ID取得
        school_ids = [
            ps.school_id
            for ps in db.query(ProjectSchools)
            .filter(ProjectSchools.project_id == project.id)
            .all()
        ]
        project_dict["school_ids"] = school_ids

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
    project_data = project.model_dump(exclude={"store_ids", "school_ids"})
    db_project = Projects(**project_data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # 対象店舗を登録（指定がある場合のみ）
    if project.store_ids:
        for store_id in project.store_ids:
            db.add(ProjectStores(project_id=db_project.id, store_id=store_id))

    # 対象学校を登録（指定がある場合のみ）
    if project.school_ids:
        for school_id in project.school_ids:
            db.add(ProjectSchools(project_id=db_project.id, school_id=school_id))

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
        exclude_unset=True, exclude={"store_ids", "school_ids"}
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

    # 対象学校の更新
    if project.school_ids is not None:
        # 既存の関連を削除
        db.query(ProjectSchools).filter(
            ProjectSchools.project_id == project_id
        ).delete()
        # 新しい関連を追加
        for school_id in project.school_ids:
            db.add(ProjectSchools(project_id=project_id, school_id=school_id))

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
    # CASCADE設定により、project_stores と project_schools も自動削除される
    db.commit()
    return None
