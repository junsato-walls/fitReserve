# -*- coding: utf-8 -*-
"""認証・認可機能"""

# 標準ライブラリ
import os
from datetime import datetime, timedelta
from typing import Annotated

# サードパーティ
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
    OAuth2PasswordBearer,
)
from jose import JWTError, jwt
from sqlalchemy.orm import Session

# ローカル
from schemas.custom.auth import DecodedToken
from system.db import get_db
from system.models import Users

oauth2_schema = OAuth2PasswordBearer(tokenUrl="/auth/login")
security = HTTPBearer()
# アクセストークンの作成
# ハッシュ化の方法
ALGORITHM = "HS256"
# 環境変数から取得、未設定時はデフォルト値を使用
SECRET_KEY = os.getenv(
    "SECRET_KEY", "iu8hlc4iak8ycbk4ayb6c0ilua8bu2fc7hnl4h6au9llbnubn11uhuohoh3uoh3zounh"
)


def create_access_token(db: Session, personal_id: str, expires_delta: timedelta):
    user = db.query(Users).filter(Users.personal_id == personal_id).first()
    expires = datetime.now() + expires_delta
    payload = {
        "id": user.id,
        "personal_id": user.personal_id,
        "user_name": user.user_name,
        "role": user.role,
        "store_id": user.store_id,
        "is_active": user.is_active,
        "exp": expires,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        personal_id = payload.get("personal_id")
        user_name = payload.get("user_name")
        role = payload.get("role")
        store_id = payload.get("store_id")
        is_active = payload.get("is_active")
        expires = payload.get("exp")
        if personal_id is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authentication credentials",
            )
        return DecodedToken(
            user_id=user_id,
            personal_id=personal_id,
            user_name=user_name,
            role=role,
            store_id=store_id,
            is_active=is_active,
            expires=expires,
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token or expired token",
        )


def require_roles(*allowed_roles: str):
    """指定したロールのみ許可する依存関数を生成する

    SPECIFICATION.mdのロール定義に基づく:
      - admin    : すべての機能
      - staff    : 予約・スケジュールの参照と更新
      - readonly : 参照のみ

    使用例:
        AdminDependency = Annotated[DecodedToken, Depends(require_roles("admin"))]
    """

    def checker(
        login_user: DecodedToken = Depends(get_current_user),
    ) -> DecodedToken:
        if not login_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このアカウントは無効化されています",
            )
        if login_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この操作を行う権限がありません",
            )
        return login_user

    return checker


# 管理者のみ（マスタ管理・ユーザー管理）
require_admin = require_roles("admin")
# 更新系（readonlyは不可）
require_staff = require_roles("admin", "staff")
# 参照系（ログイン済みなら全ロール可）
require_viewer = require_roles("admin", "staff", "readonly")


# timedelta(days=30)
def encode_jwt(db: Session, user: dict):
    user = db.query(Users).filter(Users.personal_id == user["personal_id"]).first()
    expires = datetime.now() + timedelta(days=30)
    payload = {
        "id": user.id,
        "personal_id": user.personal_id,
        "user_name": user.user_name,
        "role": user.role,
        "store_id": user.store_id,
        "is_active": user.is_active,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # return payload['sub']
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="The JWT has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="JWT is not valid"
        )


# アクセストークン確認用 デコードした内容を返す
def verify_jwt(request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No JWT exist: may not set yet or deleted",
        )

    if token.startswith("Bearer "):
        token = token.replace("Bearer ", "")

    subject = decode_jwt(token)
    return subject


# アクセストークン更新
def verify_update_jwt(db: Session, request):
    subject = verify_jwt(request)
    new_token = encode_jwt(db, subject)
    return new_token


# csrfトークン更新
def verify_csrf_update_jwt(db: Session, request, csrf_protect):
    csrf_token = csrf_protect.get_csrf_from_headers(request.headers)
    csrf_protect.validate_csrf(csrf_token)
    subject = verify_jwt(request)
    new_token = encode_jwt(db, subject)
    return new_token
