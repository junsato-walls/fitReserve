# -*- coding: utf-8 -*-
"""学校取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import Schools, ProjectSchools
from schemas.public.schools import SchoolPublic
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()
tag_name = "public-schools"


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


@router.get("/schools", response_model=list[SchoolPublic])
def get_schools(
    project_id: int | None = Query(None, description="プロジェクトID"),
    db: Session = Depends(get_db),
):
    """学校一覧を取得（顧客向け）

    プロジェクトIDが指定された場合、そのプロジェクトに紐づく学校のみを返す。
    未指定の場合は全ての有効な学校を返す。
    """
    query = db.query(Schools).filter(
        Schools.is_enabled.is_(True),
        Schools.deleted_at.is_(None),
    )

    if project_id:
        # プロジェクトに紐づく学校のみ取得
        school_ids = (
            db.query(ProjectSchools.school_id)
            .filter(ProjectSchools.project_id == project_id)
            .all()
        )

        if school_ids:
            # project_schoolsにレコードがある場合は指定学校のみ
            query = query.filter(Schools.id.in_([s.school_id for s in school_ids]))
        # レコードがない場合は全学校が対象（仕様通り）

    schools = query.order_by(Schools.name).all()
    return schools
