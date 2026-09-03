# -*- coding: utf-8 -*-
"""プロジェクトの業務ロジック"""

# サードパーティ
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ローカル
from datetime import timedelta

from model import Projects
from repository.command import projects as projects_command
from repository.command import schedules as schedules_command
from repository.query import projects as projects_query
from repository.query import schedules as schedules_query
from repository.query import stores as stores_query
from schema.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectSearchQuery,
    ProjectUpdate,
    SchoolDivisionPeriod,
)
from system.clock import to_dow, today

NOT_FOUND = "プロジェクトが見つかりません"
DUPLICATED_CODE = "このプロジェクトコードは既に使用されています"

# 一度に生成できる日数の上限。誤入力で数年分を作ってしまうのを防ぐ
MAX_GENERATED_DAYS = 400


def list_projects(
    db: Session, query: ProjectSearchQuery
) -> list[ProjectResponse]:
    """プロジェクト一覧を取得する（対象店舗・受付期間つき）"""
    projects = projects_query.search(
        db,
        skip=query.skip,
        limit=query.limit,
        include_deleted=query.include_deleted,
    )
    return [_to_response(db, project) for project in projects]


def get_project(db: Session, project_id: int) -> ProjectResponse:
    """プロジェクトを1件取得する"""
    return _to_response(db, _find(db, project_id))


def create_project(db: Session, payload: ProjectCreate) -> ProjectResponse:
    """プロジェクトを新規作成する"""
    if projects_query.exists_project_code(db, payload.project_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATED_CODE
        )

    project = projects_command.create(
        db,
        payload.model_dump(
            exclude={"store_ids", "school_divisions", "daily_capacity"}
        ),
    )

    # 対象店舗・受付期間は指定がある場合のみ登録する
    if payload.store_ids:
        projects_command.replace_store_ids(db, project.id, payload.store_ids)
    if payload.school_divisions:
        projects_command.replace_division_periods(
            db, project.id, payload.school_divisions
        )

    # 受付期間の各日に、その日の同時予約数を入れておく
    _generate_schedules(db, project, payload)

    db.commit()
    db.refresh(project)
    return _to_response(db, project)


def update_project(
    db: Session, project_id: int, payload: ProjectUpdate
) -> ProjectResponse:
    """プロジェクトを更新する"""
    project = _find(db, project_id)

    if payload.project_code and payload.project_code != project.project_code:
        if projects_query.exists_project_code(
            db, payload.project_code, exclude_id=project_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=DUPLICATED_CODE
            )

    projects_command.update(
        db,
        project,
        payload.model_dump(
            exclude_unset=True, exclude={"store_ids", "school_divisions"}
        ),
    )

    # 未指定なら変更しない
    if payload.store_ids is not None:
        projects_command.replace_store_ids(db, project_id, payload.store_ids)
    if payload.school_divisions is not None:
        projects_command.replace_division_periods(
            db, project_id, payload.school_divisions
        )

    db.commit()
    db.refresh(project)
    return _to_response(db, project)


def delete_project(db: Session, project_id: int) -> None:
    """プロジェクトを削除する（論理削除）"""
    project = _find(db, project_id)
    projects_command.soft_delete(db, project)
    db.commit()


def _find(db: Session, project_id: int) -> Projects:
    project = projects_query.find_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=NOT_FOUND)
    return project


def _to_response(db: Session, project: Projects) -> ProjectResponse:
    """プロジェクトに対象店舗と区分別受付期間を添えて組み立てる"""
    values = ProjectResponse.model_validate(project).model_dump()
    values["store_ids"] = stores_query.list_project_store_ids(db, project.id)
    values.update(_summarize_periods(_division_periods(db, project.id), project.is_enabled))
    return ProjectResponse(**values)


def _division_periods(db: Session, project_id: int) -> list[SchoolDivisionPeriod]:
    """学校区分ごとの予約受付期間を取得する"""
    return [
        SchoolDivisionPeriod(
            school_divisions_id=period.school_divisions_id,
            start_date=period.start_date,
            end_date=period.end_date,
        )
        for period in projects_query.list_division_periods(db, project_id)
    ]


def _summarize_periods(
    periods: list[SchoolDivisionPeriod], is_enabled: bool
) -> dict:
    """区分別の受付期間から、一覧表示用のまとめを作る

    プロジェクト自体は期間を持たないため、全区分の最も早い開始日と
    最も遅い終了日を「プロジェクトの期間」として扱う。
    受付中かどうかは、プロジェクトが有効で、かついずれか1つの区分が
    本日を含んでいれば真とする（無効なプロジェクトは顧客側に出ないため）。
    """
    if not periods:
        return {
            "school_divisions": [],
            "start_date": None,
            "end_date": None,
            "is_accepting": False,
        }

    current = today()
    return {
        "school_divisions": periods,
        "start_date": min(p.start_date for p in periods),
        "end_date": max(p.end_date for p in periods),
        "is_accepting": is_enabled
        and any(p.start_date <= current <= p.end_date for p in periods),
    }


def _generate_schedules(db: Session, project: Projects, payload: ProjectCreate) -> None:
    """受付期間内の各日に、店舗ごとの受付設定を作る

    - 期間は学校区分ごとの受付期間をまとめた「最も早い開始日〜最も遅い終了日」
    - 同時予約数は daily_capacity。未指定なら店舗の同時対応可能人数
    - 定休日は is_available = False で作る（枠は出ないが、後から個別に開ける）
    - 既に設定がある日は触らない（複数プロジェクトの期間が重なるため）
    """
    periods = payload.school_divisions or []
    if not periods:
        return

    date_from = min(period.start_date for period in periods)
    date_to = max(period.end_date for period in periods)
    if (date_to - date_from).days + 1 > MAX_GENERATED_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"受付期間が長すぎます（最大{MAX_GENERATED_DAYS}日）",
        )

    stores = (
        [stores_query.find_by_id(db, store_id) for store_id in payload.store_ids]
        if payload.store_ids
        else stores_query.list_enabled(db, None)
    )

    rows = []
    for store in stores:
        if store is None:
            continue

        holidays = set(stores_query.list_regular_holidays(db, store.id))
        existing = schedules_query.list_existing_dates(db, store.id, date_from, date_to)

        for offset in range((date_to - date_from).days + 1):
            target = date_from + timedelta(days=offset)
            if target in existing:
                continue

            rows.append(
                {
                    "store_id": store.id,
                    "schedule_date": target,
                    "capacity": payload.daily_capacity or store.capacity,
                    "slot_minutes": project.reservation_interval,
                    "is_available": to_dow(target) not in holidays,
                    "created_by": payload.created_by,
                    "updated_by": payload.updated_by,
                }
            )

    schedules_command.create_many(db, rows)
