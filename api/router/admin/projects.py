# -*- coding: utf-8 -*-
"""プロジェクト管理API（admin以上）"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# ローカル
from schema.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectSearchQuery,
    ProjectUpdate,
)
from system.db import get_db
from usecase.admin import projects as projects_usecase

router = APIRouter()


@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(
    query: Annotated[ProjectSearchQuery, Query()], db: Session = Depends(get_db)
):
    """プロジェクト一覧取得"""
    return projects_usecase.list_projects(db, query)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """プロジェクト詳細取得"""
    return projects_usecase.get_project(db, project_id)


@router.post(
    "/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED
)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """プロジェクト新規作成"""
    return projects_usecase.create_project(db, project)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)
):
    """プロジェクト更新"""
    return projects_usecase.update_project(db, project_id, project)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """プロジェクト削除（論理削除）"""
    projects_usecase.delete_project(db, project_id)
