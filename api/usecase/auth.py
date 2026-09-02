# -*- coding: utf-8 -*-
"""認証の業務ロジック"""

# サードパーティ
from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# ローカル
from repository.query import users as users_query
from system.auth import create_access_token
from system.permissions import resolve_store_ids

# パスワードハッシュ化用のコンテキスト
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 利用者にどちらが誤りかを教えないよう、IDとパスワードで文言を分けない
INVALID_CREDENTIALS = "ユーザーIDまたはパスワードが正しくありません"


def hash_password(password: str) -> str:
    """パスワードをハッシュ化する"""
    return pwd_context.hash(password)


def login(db: Session, personal_id: str, password: str) -> dict:
    """ログインしてアクセストークンを発行する"""
    user = users_query.find_by_personal_id(db, personal_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS
        )

    if not pwd_context.verify(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS
        )

    # 無効化されたアカウントはここで弾く。
    # トークンを発行してしまうと、画面には入れるのにAPIが全て403になる。
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントは無効化されています",
        )

    # 担当店舗は画面表示用にトークンへ載せる（権限判定はリクエストごとにDBを見る）
    store_ids = resolve_store_ids(user, db)

    # Cookieへの保存はNext.js側（Server Action）が行うため、ここでは発行のみ
    return {
        "access_token": create_access_token(user, store_ids),
        "token_type": "bearer",
    }
