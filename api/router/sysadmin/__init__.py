# -*- coding: utf-8 -*-
"""sysadmin面（super_admin専用・システム管理）

会社マスタのように、システム全体の土台になるデータを扱う。
"""

from fastapi import APIRouter

from router.sysadmin import companies

router = APIRouter()

router.include_router(companies.router, tags=["sysadmin-companies"])
