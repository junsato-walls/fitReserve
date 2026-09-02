from datetime import timedelta
from typing import Annotated
from fastapi import Response, APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from starlette import status
from schemas.generic.users import UserCreate, UserResponse
from system.db import get_db
from system.models import Users
from passlib.context import CryptContext
from system.auth import create_access_token
from pydantic import BaseModel, ConfigDict
from schemas.custom.auth import Token, DecodedToken
from system.auth import get_current_user

# パスワードハッシュ化用のコンテキスト
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class OAuth2PasswordRequestFormCustom(BaseModel):
    personal_id: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"personal_id": "ADM001", "password": "password"}]
        }
    )


DbDependency = Annotated[Session, Depends(get_db)]
UserDependency = Annotated[DecodedToken, Depends(get_current_user)]
router = APIRouter()
tag_name = "ログイン認証"


# ユーザー作成機能（サインアップ）
@router.post(
    "/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def create_user(db: DbDependency, user_create: UserCreate):
    # 既存ユーザーのチェック
    existing = (
        db.query(Users)
        .filter(
            Users.personal_id == user_create.personal_id, Users.deleted_at.is_(None)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このユーザーIDは既に使用されています",
        )

    # パスワードのハッシュ化（bcrypt）
    hashed_password = pwd_context.hash(user_create.password)

    # 新規ユーザー作成
    new_user = Users(
        personal_id=user_create.personal_id,
        user_name=user_create.user_name,
        name_kana=user_create.name_kana,
        email=user_create.email,
        icon=user_create.icon,
        role=user_create.role,
        store_id=user_create.store_id,
        is_active=user_create.is_active,
        password=hashed_password,
        salt="",  # bcryptはsaltを内包するため不要
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse.model_validate(new_user)


# ログイン機能
@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(
    db: DbDependency,
    response: Response,
    form_data: OAuth2PasswordRequestFormCustom = Body(...),
):
    user = (
        db.query(Users)
        .filter(Users.personal_id == form_data.personal_id, Users.deleted_at.is_(None))
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect personal_id",
        )

    # bcryptでパスワード検証
    if not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    token = create_access_token(db, user.personal_id, timedelta(days=30))
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        samesite="none",
        secure=True,
    )
    return {"access_token": token, "token_type": "bearer"}


# ログアウト機能
@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged-out"}
