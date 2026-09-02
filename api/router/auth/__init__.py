# -*- coding: utf-8 -*-
"""auth面（認証・認証不要）

ログイン前に叩くため、public面（顧客向け）にも社内向けの面にも属さない。
ロールが確定する前の入り口なので、面ごとの既定権限は掛けない。

ユーザーの新規作成は管理者の操作なので POST /admin/users が担当する。
（認証不要のサインアップをここに置くと、ロールを指定して誰でも管理者を作れてしまう）
"""

from fastapi import APIRouter

from router.auth import sessions

router = APIRouter()

router.include_router(sessions.router, tags=["auth"])
