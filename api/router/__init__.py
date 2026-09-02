# -*- coding: utf-8 -*-
"""APIルーターの組み立て

ここがURLと権限の一覧表になる。ルーターは自動ロードせず明示的に登録する
（ファイルを置くだけでURLが生える作りだと、どのURLが存在するかがコードから
読み取れず、ディレクトリを掘った瞬間に黙ってAPIが消えるため）。

面（ディレクトリ）と権限の対応:

    面        URL          必要な権限        担当店舗の絞り込み
    --------- ------------ ----------------- ------------------
    auth      /auth        なし              -
    public    /public      なし              -
    staff     /            readonly 以上     あり（Actor.scope）
    admin     /admin       admin 以上        なし（全店舗）
    sysadmin  /sysadmin    super_admin       なし（全店舗）

既定の権限は面ごとに dependencies で掛ける。こうしておくと、新しい
ファイルで権限を書き忘れてもログイン必須側に倒れる。
個々のハンドラでは「既定より強くする」ときだけ引数に書くこと。
緩めたい場合はハンドラで書くのではなく、public 面へ移す。
"""

from fastapi import APIRouter, Depends

from router import admin, auth, public, staff, sysadmin
from system.permissions import require_admin, require_readonly, require_super_admin

api_router = APIRouter()

# 認証不要
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(public.router, prefix="/public")

# ログイン必須
api_router.include_router(
    staff.router, dependencies=[Depends(require_readonly)]
)
api_router.include_router(
    admin.router, prefix="/admin", dependencies=[Depends(require_admin)]
)
api_router.include_router(
    sysadmin.router, prefix="/sysadmin", dependencies=[Depends(require_super_admin)]
)
