# -*- coding: utf-8 -*-
"""ユーザー管理API（管理者専用）"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Annotated
from system.db import get_db
from system.models import Users, Stores
from schemas.generic.users import UserCreate, UserUpdate, UserResponse, UserWithStore
from schemas.custom.auth import DecodedToken
from system.auth import require_admin
from datetime import datetime
from zoneinfo import ZoneInfo
from passlib.context import CryptContext

router = APIRouter()
tag_name = "users"

# 管理者のみアクセス可能
UserDependency = Annotated[DecodedToken, Depends(require_admin)]

# パスワードハッシュ化用のコンテキスト
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def jst() -> datetime:
    """JSTタイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))


def hash_password(password: str) -> str:
    """パスワードをハッシュ化"""
    return pwd_context.hash(password)


@router.get("/users", response_model=List[UserWithStore])
def get_users(
    login_user: UserDependency,
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    store_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
):
    """ユーザー一覧取得"""
    query = db.query(Users)
    if not include_deleted:
        query = query.filter(Users.deleted_at.is_(None))

    # フィルター適用
    if role:
        query = query.filter(Users.role == role)
    if store_id is not None:
        query = query.filter(Users.store_id == store_id)
    if is_active is not None:
        query = query.filter(Users.is_active == is_active)

    users = query.offset(skip).limit(limit).all()

    # 店舗名を付与
    result = []
    for user in users:
        user_dict = UserWithStore.model_validate(user).model_dump()
        if user.store_id:
            store = db.query(Stores).filter(Stores.id == user.store_id).first()
            user_dict["store_name"] = store.name if store else None
        result.append(UserWithStore(**user_dict))

    return result


@router.get("/users/{user_id}", response_model=UserWithStore)
def get_user(user_id: int, login_user: UserDependency, db: Session = Depends(get_db)):
    """ユーザー詳細取得"""
    user = (
        db.query(Users).filter(Users.id == user_id, Users.deleted_at.is_(None)).first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ユーザーが見つかりません"
        )

    user_dict = UserWithStore.model_validate(user).model_dump()
    if user.store_id:
        store = db.query(Stores).filter(Stores.id == user.store_id).first()
        user_dict["store_name"] = store.name if store else None

    return UserWithStore(**user_dict)


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate, login_user: UserDependency, db: Session = Depends(get_db)
):
    """ユーザー新規作成"""
    # personal_idの重複チェック
    existing = (
        db.query(Users)
        .filter(Users.personal_id == user.personal_id, Users.deleted_at.is_(None))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このユーザーIDは既に使用されています",
        )

    # role=staff/readonlyの場合はstore_idが必須
    if user.role in ["staff", "readonly"] and not user.store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="スタッフと閲覧専用ユーザーには所属店舗IDが必要です",
        )

    # 店舗の存在確認
    if user.store_id:
        store = (
            db.query(Stores)
            .filter(Stores.id == user.store_id, Stores.deleted_at.is_(None))
            .first()
        )
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された店舗が見つかりません",
            )

    # パスワードをハッシュ化
    user_data = user.model_dump()
    user_data["password"] = hash_password(user.password)

    db_user = Users(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user: UserUpdate,
    login_user: UserDependency,
    db: Session = Depends(get_db),
):
    """ユーザー更新"""
    db_user = (
        db.query(Users).filter(Users.id == user_id, Users.deleted_at.is_(None)).first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ユーザーが見つかりません"
        )

    # personal_id変更時の重複チェック
    if user.personal_id and user.personal_id != db_user.personal_id:
        existing = (
            db.query(Users)
            .filter(
                Users.personal_id == user.personal_id,
                Users.deleted_at.is_(None),
                Users.id != user_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このユーザーIDは既に使用されています",
            )

    # role変更時のバリデーション
    new_role = user.role or db_user.role
    new_store_id = user.store_id if user.store_id is not None else db_user.store_id

    if new_role in ["staff", "readonly"] and not new_store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="スタッフと閲覧専用ユーザーには所属店舗IDが必要です",
        )

    # 店舗の存在確認
    if user.store_id:
        store = (
            db.query(Stores)
            .filter(Stores.id == user.store_id, Stores.deleted_at.is_(None))
            .first()
        )
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="指定された店舗が見つかりません",
            )

    # 更新処理
    update_data = user.model_dump(exclude_unset=True)

    # パスワードが指定されている場合はハッシュ化
    if "password" in update_data and update_data["password"]:
        update_data["password"] = hash_password(update_data["password"])

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int, login_user: UserDependency, db: Session = Depends(get_db)
):
    """ユーザー削除（論理削除）"""
    db_user = (
        db.query(Users).filter(Users.id == user_id, Users.deleted_at.is_(None)).first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ユーザーが見つかりません"
        )

    db_user.deleted_at = jst()
    db.commit()
    return None
