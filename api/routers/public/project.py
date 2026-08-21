# -*- coding: utf-8 -*-
"""プロジェクト取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import Projects
from schemas.public.projects import ProjectPublic
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "public-projects"


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/projects", response_model=list[ProjectPublic])
def get_projects(db: Session = Depends(get_db)):
    """受付中のプロジェクト一覧を取得（顧客向け）

    SPECIFICATION.md BL-2「プロジェクトの開始日〜終了日の範囲内のみ予約可能」に従い、
    受付期間外のプロジェクトは返さない。
    （期間外のキャンペーンを選べてしまうと、選べる日が1つも無い状態になるため）
    """
    today = jst().date()

    projects = (
        db.query(Projects)
        .filter(
            Projects.is_enabled.is_(True),
            Projects.deleted_at.is_(None),
            Projects.start_date <= today,
            Projects.end_date >= today,
        )
        .order_by(Projects.start_date.desc())
        .all()
    )

    return projects
