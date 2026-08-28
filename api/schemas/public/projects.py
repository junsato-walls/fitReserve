# -*- coding: utf-8 -*-
"""公開API用プロジェクトスキーマ"""

from pydantic import BaseModel
from datetime import date


class AcceptingDivision(BaseModel):
    """受付中の学校区分と、その受付期間"""

    school_divisions_id: int
    name: str
    start_date: date
    end_date: date


class ProjectPublic(BaseModel):
    """公開API用プロジェクト情報（顧客向け）

    予約受付期間は学校区分ごとに異なるため、プロジェクト自体は期間を持たない。
    accepting_divisions には「本日受付中の区分」だけが入る。
    """

    id: int
    project_code: str
    name: str
    description: str | None = None
    reservation_interval: int
    company_slug: str
    accepting_divisions: list[AcceptingDivision] = []
