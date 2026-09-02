# -*- coding: utf-8 -*-
"""プロジェクト取得API（公開・認証不要）"""

# 標準ライブラリ
from typing import Annotated

# サードパーティ
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

# ローカル
from schema.projects import ProjectPublic, ProjectPublicQuery
from system.db import get_db
from usecase.public import projects as projects_usecase

router = APIRouter()


@router.get("/projects/{project_id}", response_model=ProjectPublic)
def get_project(
    project_id: int,
    query: Annotated[ProjectPublicQuery, Query()],
    db: Session = Depends(get_db),
):
    """予約受付用のプロジェクト情報を取得（顧客向け）"""
    return projects_usecase.get_reservation_project(db, project_id, query)
