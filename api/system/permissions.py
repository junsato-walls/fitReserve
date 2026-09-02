# -*- coding: utf-8 -*-
"""認可（ロールと担当店舗）

権限には性質の違う2つの軸がある。

- 縦軸（ロール）  : 何ができるか。super_admin > admin > staff > readonly の階層。
                    `require_min_role` で「◯◯以上」として宣言する。
- 横軸（担当店舗）: どの店舗のデータに触れるか。レコード単位のため Depends では
                    守れない。`Actor.scope()` / `Actor.assert_store()` を
                    各クエリに掛けて絞り込む。

ロールの列挙（"admin" または "staff" または ...）ではなく階層で判定するのは、
ロールが増えたときに全エンドポイントの列挙を書き換えずに済ませるため。
"""

# 標準ライブラリ
from dataclasses import dataclass
from typing import Annotated, Optional

# サードパーティ
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Query, Session

# ローカル
from model import Users
from repository.query import users as users_query
from schema.auth import DecodedToken
from system.auth import UNAUTHORIZED_HEADERS, get_current_user
from system.db import get_db

# ロールの強さ。数値は「間に新しいロールを差し込めるように」10刻みにしている
ROLE_LEVELS: dict[str, int] = {
    "readonly": 10,
    "staff": 20,
    "admin": 30,
    "super_admin": 40,
}

# 担当店舗の制限を受けないロール（全店舗が対象）
ALL_STORES_ROLES = ("admin", "super_admin")


@dataclass
class Actor:
    """リクエストを行っているログインユーザー

    store_ids が None は「全店舗が対象」を表す。空リストとは意味が違い、
    空リストは「担当店舗が1つも無い＝何も見えない」になる。
    """

    user_id: int
    personal_id: str
    user_name: str
    role: str
    store_ids: Optional[list[int]]
    is_active: bool

    @property
    def level(self) -> int:
        """ロールの強さ。未知のロールは最弱として扱う"""
        return ROLE_LEVELS.get(self.role, 0)

    @property
    def is_all_stores(self) -> bool:
        """全店舗を対象にできるか"""
        return self.store_ids is None

    def has_min_role(self, minimum: str) -> bool:
        """指定ロール以上かどうか"""
        return self.level >= ROLE_LEVELS[minimum]

    def scope(self, query: Query, column) -> Query:
        """一覧取得のクエリに担当店舗の絞り込みを掛ける

        使用例:
            query = actor.scope(db.query(Reservations), Reservations.store_id)
        """
        if self.is_all_stores:
            return query
        return query.filter(column.in_(self.store_ids))

    def can_access_store(self, store_id: Optional[int]) -> bool:
        """その店舗のデータに触れてよいか"""
        if self.is_all_stores:
            return True
        return store_id in self.store_ids

    def assert_store(self, store_id: Optional[int], detail: str) -> None:
        """単一リソースの参照・更新前に担当店舗かを確認する

        権限外は403ではなく404を返す。403だと「そのIDは存在するが権限が無い」と
        分かってしまい、他店舗のIDを総当たりで探れてしまうため。
        """
        if not self.can_access_store(store_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def get_actor(
    login_user: DecodedToken = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Actor:
    """トークンのユーザーをDBで引き直して Actor を組み立てる

    ロールも担当店舗もトークンではなくDBの値を正とする。
    トークンは発行時点のもので最大30日更新されないため、権限を落としても
    トークンが切れるまで旧権限で操作できてしまうのを防ぐ。

    この関数を通すのは1リクエストにつき1回だけ。require_min_role は
    この結果を受け取るだけにしてあるため、権限チェックを重ねてもDBへの
    問い合わせは増えない（FastAPIが同一の依存関数の結果をキャッシュする）。
    """
    user = users_query.find_by_id(db, login_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="アカウントが見つかりません",
            headers=UNAUTHORIZED_HEADERS,
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントは無効化されています",
        )

    return Actor(
        user_id=user.id,
        personal_id=user.personal_id,
        user_name=user.user_name,
        role=user.role,
        store_ids=resolve_store_ids(user, db),
        is_active=user.is_active,
    )


def resolve_store_ids(user: Users, db: Session) -> Optional[list[int]]:
    """担当店舗IDを解決する（None は全店舗）

    admin / super_admin は全店舗が対象のため user_stores を持たない。
    staff / readonly は user_stores に登録された店舗のみ。
    """
    if user.role in ALL_STORES_ROLES:
        return None

    return users_query.list_store_ids(db, user.id)


def require_min_role(minimum: str):
    """指定ロール以上のみ許可する依存関数を生成する

    使用例:
        # ルーターの面ごとの既定として
        include_router(admin.router, dependencies=[Depends(require_admin)])
        # 個別に強める場合
        def update_x(actor: StaffUser, ...): ...
    """
    if minimum not in ROLE_LEVELS:
        raise ValueError(f"未定義のロールです: {minimum}")

    def checker(actor: Actor = Depends(get_actor)) -> Actor:
        if not actor.has_min_role(minimum):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この操作を行う権限がありません",
            )
        return actor

    return checker


# 面ごとの既定権限。routers/__init__.py がこれをディレクトリ単位で掛ける
require_readonly = require_min_role("readonly")
require_staff = require_min_role("staff")
require_admin = require_min_role("admin")
require_super_admin = require_min_role("super_admin")

# ハンドラの引数で使う型エイリアス。各ルーターでの再定義は禁止（名前が揺れるため）
ReadonlyUser = Annotated[Actor, Depends(require_readonly)]
StaffUser = Annotated[Actor, Depends(require_staff)]
AdminUser = Annotated[Actor, Depends(require_admin)]
SuperAdminUser = Annotated[Actor, Depends(require_super_admin)]
