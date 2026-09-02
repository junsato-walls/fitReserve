# -*- coding: utf-8 -*-
"""admin面（admin以上・マスタ管理）

既定の権限は admin以上。この面のユーザーは全店舗が対象になるため、
担当店舗による絞り込みは行わない。
"""

from fastapi import APIRouter

from router.admin import (
    companies,
    projects,
    school_divisions,
    schools,
    stores,
    users,
)

router = APIRouter()

router.include_router(companies.router, tags=["admin-companies"])
router.include_router(projects.router, tags=["admin-projects"])
router.include_router(school_divisions.router, tags=["admin-school-divisions"])
router.include_router(schools.router, tags=["admin-schools"])
router.include_router(stores.router, tags=["admin-stores"])
router.include_router(users.router, tags=["admin-users"])
