# -*- coding: utf-8 -*-
"""認証（トークンの発行と検証）

トークンはJWTで、Cookieへの保存はNext.js側（Server Action）が行う。
このモジュールが持つのは「発行」と「検証」まで。
ロールと担当店舗による認可は system/permissions.py が担当する。
"""

# 標準ライブラリ
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

# サードパーティ
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

# ローカル
from schema.auth import DecodedToken
from model import Users

# auto_error=True だと未ログイン時にFastAPIが403を返してしまう。
# 「未ログイン=401 / 権限不足=403」を守るため、自前で401を返す。
security = HTTPBearer(auto_error=False)

# 署名アルゴリズム
ALGORITHM = "HS256"

# 署名鍵。
# 既定値を持たせるとリポジトリ上の鍵で署名され、誰でもトークンを偽造できる。
# そのため未設定なら起動時に落とす。
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "環境変数 SECRET_KEY が設定されていません。"
        "JWTの署名鍵のため、必ず設定してください（docker-compose.yml の api サービス）。"
    )

# アクセストークンの有効期限
ACCESS_TOKEN_EXPIRE = timedelta(days=30)

# 未認証時に返すヘッダ（RFC 6750）
UNAUTHORIZED_HEADERS = {"WWW-Authenticate": "Bearer"}


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


def create_access_token(
    user: Users,
    store_ids: list[int] | None,
    expires_delta: timedelta = ACCESS_TOKEN_EXPIRE,
):
    """ログイン済みユーザーのアクセストークンを発行する

    呼び出し元が認証済みのユーザーを渡す前提のため、ここではDBを引き直さない。
    担当店舗（store_ids）も呼び出し元が解決して渡す
    （system.permissions.resolve_store_ids）。None は全店舗を表す。

    store_ids は画面表示（担当店舗の初期選択など）のために載せるものであり、
    権限判定には使わない。判定は毎リクエストDBを引き直す Actor が行う。

    exp はタイムゾーン付きで作る。naiveなdatetimeはUTCとして解釈されるため、
    コンテナのTZ設定次第で有効期限がずれてしまう。
    """
    payload = {
        "id": user.id,
        "personal_id": user.personal_id,
        "user_name": user.user_name,
        "role": user.role,
        "store_id": user.store_id,
        "store_ids": store_ids,
        "is_active": user.is_active,
        "exp": jst() + expires_delta,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: HTTPAuthorizationCredentials | None = Security(security),
) -> DecodedToken:
    """トークンを検証してログインユーザーの情報を返す

    ここで見るのは「トークンとして正しいか」だけ。
    アカウントが今も有効かどうかと権限は system.permissions が確認する。
    """
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ログインが必要です",
            headers=UNAUTHORIZED_HEADERS,
        )

    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        # 期限切れ・改ざん・署名不一致はいずれも「認証できない」＝401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="トークンが不正か、有効期限が切れています",
            headers=UNAUTHORIZED_HEADERS,
        )

    user_id = payload.get("id")
    personal_id = payload.get("personal_id")
    if user_id is None or personal_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="トークンの内容が不正です",
            headers=UNAUTHORIZED_HEADERS,
        )

    return DecodedToken(
        user_id=user_id,
        personal_id=personal_id,
        user_name=payload.get("user_name"),
        role=payload.get("role"),
        store_id=payload.get("store_id"),
        store_ids=payload.get("store_ids"),
        is_active=payload.get("is_active"),
        expires=payload.get("exp"),
    )
