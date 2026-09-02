# -*- coding: utf-8 -*-
"""ユーザー管理API（admin以上）"""

# 標準ライブラリ
from typing import Annotated, List

# サードパーティ
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# ローカル
from schema.users import UserCreate, UserSearchQuery, UserUpdate, UserWithStore
from system.db import get_db
from system.permissions import AdminUser
from usecase.admin import users as users_usecase

router = APIRouter()


@router.get("/users", response_model=List[UserWithStore])
def get_users(
    query: Annotated[UserSearchQuery, Query()], db: Session = Depends(get_db)
):
    """ユーザー一覧取得"""
    return users_usecase.list_users(db, query)


@router.get("/users/{user_id}", response_model=UserWithStore)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """ユーザー詳細取得"""
    return users_usecase.get_user(db, user_id)


@router.post(
    "/users", response_model=UserWithStore, status_code=status.HTTP_201_CREATED
)
def create_user(user: UserCreate, actor: AdminUser, db: Session = Depends(get_db)):
    """ユーザー新規作成"""
    return users_usecase.create_user(db, actor, user)


@router.put("/users/{user_id}", response_model=UserWithStore)
def update_user(
    user_id: int, user: UserUpdate, actor: AdminUser, db: Session = Depends(get_db)
):
    """ユーザー更新"""
    return users_usecase.update_user(db, actor, user_id, user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, actor: AdminUser, db: Session = Depends(get_db)):
    """ユーザー削除（論理削除）"""
    users_usecase.delete_user(db, actor, user_id)
