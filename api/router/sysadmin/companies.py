# -*- coding: utf-8 -*-
"""会社マスタ管理API（super_admin専用）

会社は予約URL（/[company_slug]/...）の起点であり、増減はシステム管理者だけが
行う。admin が選択肢として使う一覧参照は GET /admin/companies にある。
"""

# 標準ライブラリ
from typing import List

# サードパーティ
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from repository.query import companies as companies_query
from schema.companies import CompanyCreate, CompanyDetail, CompanyUpdate
from system.db import get_db
from system.permissions import SuperAdminUser
from usecase.sysadmin import companies as companies_usecase

router = APIRouter()


@router.get("/companies", response_model=List[CompanyDetail])
def get_companies(db: Session = Depends(get_db)):
    """会社一覧取得（管理用）"""
    return companies_query.list_all(db)


@router.get("/companies/{company_id}", response_model=CompanyDetail)
def get_company(company_id: int, db: Session = Depends(get_db)):
    """会社詳細取得（取得して無ければ404のみのため repository を直接呼ぶ）"""
    company = companies_query.find_by_id(db, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=companies_usecase.NOT_FOUND
        )
    return company


@router.post(
    "/companies", response_model=CompanyDetail, status_code=status.HTTP_201_CREATED
)
def create_company(
    company: CompanyCreate, actor: SuperAdminUser, db: Session = Depends(get_db)
):
    """会社新規作成"""
    return companies_usecase.create_company(db, actor, company)


@router.put("/companies/{company_id}", response_model=CompanyDetail)
def update_company(
    company_id: int,
    company: CompanyUpdate,
    actor: SuperAdminUser,
    db: Session = Depends(get_db),
):
    """会社更新"""
    return companies_usecase.update_company(db, actor, company_id, company)


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int, actor: SuperAdminUser, db: Session = Depends(get_db)
):
    """会社削除（論理削除）"""
    companies_usecase.delete_company(db, actor, company_id)
