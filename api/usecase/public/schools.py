# -*- coding: utf-8 -*-
"""学校一覧の業務ロジック（顧客向け）"""

# サードパーティ
from sqlalchemy.orm import Session

# ローカル
from model import Schools
from repository.query import projects as projects_query
from repository.query import schools as schools_query
from schema.schools import SchoolPublicQuery
from system.clock import today


def list_public_schools(db: Session, query: SchoolPublicQuery) -> list[Schools]:
    """顧客が選べる学校を返す

    予約フォームは「店舗を選んでから学校を選ぶ」流れになる。

    - store_id  : その店舗が制服を取り扱っている学校のみ（store_schools）
    - project_id: 本日受付中の学校区分に属する学校のみ
      （受付期間は区分ごとに異なるため、期間外の区分の学校は選ばせない）
    """
    division_ids = None
    if query.project_id:
        # 受付中の区分が1つも無ければ、選べる学校も無いのが正しい
        division_ids = [
            period.school_divisions_id
            for period, _division in projects_query.list_accepting_divisions(
                db, query.project_id, today()
            )
        ]

    return schools_query.list_enabled(
        db, store_id=query.store_id, division_ids=division_ids
    )
