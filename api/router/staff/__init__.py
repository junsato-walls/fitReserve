# -*- coding: utf-8 -*-
"""staff面（ログイン必須・社内向け）

既定の権限は readonly以上。担当店舗の絞り込み（Actor.scope）が必要な面。
更新系は各ハンドラの引数で StaffUser に強めること。
"""

from fastapi import APIRouter

from router.staff import reservations, schedule_blocks, schedules

router = APIRouter()

router.include_router(reservations.router, tags=["reservations"])
router.include_router(schedules.router, tags=["schedules"])
router.include_router(schedule_blocks.router, tags=["schedule-blocks"])
