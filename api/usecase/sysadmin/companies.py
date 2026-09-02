# -*- coding: utf-8 -*-
"""会社マスタ管理の業務ロジック（super_admin専用）"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from model import Companies
from repository.command import companies as companies_command
from repository.query import companies as companies_query
from schema.companies import CompanyCreate, CompanyUpdate
from system.permissions import Actor

NOT_FOUND = "会社が見つかりません"


def create_company(db: Session, actor: Actor, payload: CompanyCreate) -> Companies:
    """会社を新規作成する"""
    _assert_unique(db, payload.slug, payload.company_code)

    company = companies_command.create(
        db,
        {
            **payload.model_dump(),
            "created_by": actor.user_id,
            "updated_by": actor.user_id,
        },
    )

    db.commit()
    db.refresh(company)
    return company


def update_company(
    db: Session, actor: Actor, company_id: int, payload: CompanyUpdate
) -> Companies:
    """会社を更新する"""
    company = _find(db, company_id)
    _assert_unique(db, payload.slug, payload.company_code, exclude_id=company_id)

    values = payload.model_dump(exclude_unset=True)
    values["updated_by"] = actor.user_id
    companies_command.update(db, company, values)

    db.commit()
    db.refresh(company)
    return company


def delete_company(db: Session, actor: Actor, company_id: int) -> None:
    """会社を削除する（論理削除）"""
    company = _find(db, company_id)
    companies_command.soft_delete(db, company, actor.user_id)
    db.commit()


def _find(db: Session, company_id: int) -> Companies:
    company = companies_query.find_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return company


def _assert_unique(
    db: Session, slug: str | None, company_code: str | None, exclude_id: int = 0
) -> None:
    """スラッグと会社コードの重複を確認する

    どちらも予約URLと帳票で会社を一意に指すため、重複は許容できない。
    """
    if slug and companies_query.exists_slug(db, slug, exclude_id=exclude_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このスラッグは既に使用されています",
        )

    if company_code and companies_query.exists_company_code(
        db, company_code, exclude_id=exclude_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この会社コードは既に使用されています",
        )
