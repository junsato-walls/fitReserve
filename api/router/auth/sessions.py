# -*- coding: utf-8 -*-
"""ログインセッション（ログイン・ログアウト・自分の情報）

サーバー側にセッションは持たず、発行したトークンがセッションの実体になる。
"""

# 標準ライブラリ
from typing import Annotated

# サードパーティ
from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session
from starlette import status

# ローカル
from schema.auth import DecodedToken, LoginRequest, Token
from system.auth import get_current_user
from system.db import get_db
from usecase import auth as auth_usecase

DbDependency = Annotated[Session, Depends(get_db)]
UserDependency = Annotated[DecodedToken, Depends(get_current_user)]

router = APIRouter()


@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
def login(db: DbDependency, form_data: LoginRequest = Body(...)):
    """ログイン（アクセストークンの発行）"""
    return auth_usecase.login(db, form_data.personal_id, form_data.password)


@router.get("/me", response_model=DecodedToken, status_code=status.HTTP_200_OK)
def get_me(login_user: UserDependency):
    """ログイン中のユーザー情報を返す（トークンの内容）"""
    return login_user


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout():
    """ログアウト

    セッションCookieはNext.js側が持つため、ここでは何も破棄しない。
    クライアントがトークンを捨てればログアウトになる。
    """
    return {"message": "Successfully logged-out"}
