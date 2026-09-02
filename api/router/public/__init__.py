# -*- coding: utf-8 -*-
"""public面（認証不要・顧客向け）

顧客が予約するために必要な参照と、予約の登録だけを置く。
ここに置くものは誰でも叩けるため、追加するときは「公開して良いか」を必ず確認する。
"""

from fastapi import APIRouter

from router.public import (
    projects,
    reservations,
    schedules,
    school_divisions,
    schools,
    stores,
)

router = APIRouter()

router.include_router(projects.router, tags=["public-projects"])
router.include_router(reservations.router, tags=["public-reservations"])
router.include_router(schedules.router, tags=["public-schedules"])
router.include_router(school_divisions.router, tags=["public-school-divisions"])
router.include_router(schools.router, tags=["public-schools"])
router.include_router(stores.router, tags=["public-stores"])
