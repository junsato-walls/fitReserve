# -*- coding: utf-8 -*-
"""ユーザー管理の業務ロジック

admin以上のロールを与える操作だけは super_admin に限定する
（adminがadminを増やせると、実質的に権限の上限が無くなるため）。
"""

# 標準ライブラリ
from typing import Optional

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Users
from repository.command import users as users_command
from repository.query import stores as stores_query
from repository.query import users as users_query
from schema.users import UserCreate, UserSearchQuery, UserUpdate, UserWithStore
from usecase.auth import hash_password
from system.permissions import ALL_STORES_ROLES, Actor

NOT_FOUND = "ユーザーが見つかりません"

# 担当店舗（user_stores）が必須のロール
SCOPED_ROLES = ("staff", "readonly")


def list_users(db: Session, query: UserSearchQuery) -> list[UserWithStore]:
    """ユーザー一覧を取得する"""
    users = users_query.search(
        db,
        skip=query.skip,
        limit=query.limit,
        role=query.role,
        store_id=query.store_id,
        is_active=query.is_active,
        include_deleted=query.include_deleted,
    )
    return _with_details(db, users)


def get_user(db: Session, user_id: int) -> UserWithStore:
    """ユーザーを1件取得する"""
    return _with_details(db, [_find(db, user_id)])[0]


def create_user(db: Session, actor: Actor, payload: UserCreate) -> UserWithStore:
    """ユーザーを新規作成する"""
    _assert_can_grant(payload.role, actor)

    if users_query.exists_personal_id(db, payload.personal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このユーザーIDは既に使用されています",
        )

    _validate_stores(db, payload.role, payload.store_ids)

    values = payload.model_dump(exclude={"store_ids"})
    values["password"] = hash_password(payload.password)
    # salt列はNOT NULL。bcryptはハッシュ内にsaltを含むため空文字を入れる
    values["salt"] = ""

    user = users_command.create(db, values)
    users_command.replace_store_ids(db, user.id, payload.store_ids)

    db.commit()
    db.refresh(user)
    return _with_details(db, [user])[0]


def update_user(
    db: Session, actor: Actor, user_id: int, payload: UserUpdate
) -> UserWithStore:
    """ユーザーを更新する"""
    user = _find(db, user_id)

    # 既にadmin以上のユーザーを触るのも、admin以上に引き上げるのも super_admin のみ
    _assert_can_grant(user.role, actor)
    if payload.role:
        _assert_can_grant(payload.role, actor)

    if payload.personal_id and payload.personal_id != user.personal_id:
        if users_query.exists_personal_id(
            db, payload.personal_id, exclude_id=user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="このユーザーIDは既に使用されています",
            )

    # 担当店舗のバリデーション（未指定なら現在の担当をそのまま使う）
    new_role = payload.role or user.role
    if payload.store_ids is not None:
        new_store_ids = payload.store_ids
    else:
        new_store_ids = users_query.list_store_ids(db, user_id)
    _validate_stores(db, new_role, new_store_ids)

    values = payload.model_dump(exclude_unset=True, exclude={"store_ids"})
    if values.get("password"):
        values["password"] = hash_password(values["password"])

    users_command.update(db, user, values)

    # admin以上に変わったら担当店舗は不要になるため消す（全店舗が対象になる）
    if new_role in ALL_STORES_ROLES:
        users_command.replace_store_ids(db, user_id, [])
    elif payload.store_ids is not None:
        users_command.replace_store_ids(db, user_id, payload.store_ids)

    db.commit()
    db.refresh(user)
    return _with_details(db, [user])[0]


def delete_user(db: Session, actor: Actor, user_id: int) -> None:
    """ユーザーを削除する（論理削除）"""
    user = _find(db, user_id)

    _assert_can_grant(user.role, actor)

    if user.id == actor.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身は削除できません",
        )

    users_command.soft_delete(db, user)
    db.commit()


def _find(db: Session, user_id: int) -> Users:
    user = users_query.find_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return user


def _assert_can_grant(role: str, actor: Actor) -> None:
    """admin以上のロールを与えられるのは super_admin だけ"""
    if role in ALL_STORES_ROLES and not actor.has_min_role("super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このロールを付与できるのはシステム管理者のみです",
        )


def _validate_stores(db: Session, role: str, store_ids: list[int]) -> None:
    """担当店舗の指定内容を検証する

    staff / readonly は最低1店舗が必要。担当が空だと、ログインできるのに
    何も見えないユーザーができてしまう。
    """
    if role in SCOPED_ROLES and not store_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="スタッフと閲覧専用ユーザーには担当店舗が必要です",
        )

    if not store_ids:
        return

    if stores_query.count_existing(db, store_ids) != len(set(store_ids)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定された店舗が見つかりません",
        )


def _with_details(db: Session, users: list[Users]) -> list[UserWithStore]:
    """所属店舗名と担当店舗IDを付与する"""
    store_names = stores_query.names_by_ids(db, {u.store_id for u in users if u.store_id})
    stores_by_user = users_query.store_ids_by_user(db, [u.id for u in users])

    result = []
    for user in users:
        detail = UserWithStore.model_validate(user).model_dump()
        detail["store_name"] = store_names.get(user.store_id)
        detail["store_ids"] = stores_by_user.get(user.id, [])
        result.append(UserWithStore(**detail))
    return result
