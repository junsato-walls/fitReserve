# -*- coding: utf-8 -*-
"""学校取得API（公開・認証不要）"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from system.db import get_db
from system.models import ProjectSchoolDivisions, Schools, StoreSchools
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
    store_id: int | None = Query(None, description="店舗ID"),
    project_id: int | None = Query(
        None, description="プロジェクトID（受付中の学校区分のみに絞る）"
    ),
    db: Session = Depends(get_db),
):
    """学校一覧を取得（顧客向け）

    予約フォームは「店舗を選んでから学校を選ぶ」流れになる。

    - store_id: その店舗が制服を取り扱っている学校のみ（store_schools）
    - project_id: 本日受付中の学校区分に属する学校のみ
      （受付期間は区分ごとに異なるため、期間外の区分の学校は選ばせない）
    """
    query = db.query(Schools).filter(
        Schools.is_enabled.is_(True),
        Schools.deleted_at.is_(None),
    )

    if store_id:
        # 取り扱いが1件も登録されていない店舗は、学校を選べない状態が正しい。
        # （プロジェクトの「レコードなし＝全対象」とは扱いが異なる）
        query = query.join(
            StoreSchools, StoreSchools.school_id == Schools.id
        ).filter(StoreSchools.store_id == store_id)

    if project_id:
        today = jst().date()
        accepting_ids = [
            row.school_divisions_id
            for row in db.query(ProjectSchoolDivisions.school_divisions_id)
            .filter(
                ProjectSchoolDivisions.project_id == project_id,
                ProjectSchoolDivisions.start_date <= today,
                ProjectSchoolDivisions.end_date >= today,
            )
            .all()
        ]
        # 受付中の区分が1つも無ければ、選べる学校も無いのが正しい
        query = query.filter(Schools.school_divisions_id.in_(accepting_ids))

    return query.order_by(Schools.name).all()
