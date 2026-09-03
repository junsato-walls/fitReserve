# -*- coding: utf-8 -*-
"""DB定義（SQLAlchemyモデル）

テーブルの正は docker/postgres/initdb.d/01_schema.sql が持つ。
このパッケージはそれを写したものなので、DDLを変更したらここも合わせること。
（create_all は持たない。二重管理でDDLと食い違うテーブルができるため）

1テーブル1クラスで、ファイルはリソース単位に分ける。
利用側が並びを気にせず import できるよう、ここで全モデルを再公開する。
"""

from model.companies import Companies
from model.projects import Projects, ProjectSchoolDivisions, ProjectStores
from model.reservations import Reservations
from model.schedules import ScheduleBlocks, Schedules
from model.school_divisions import SchoolDivisions
from model.schools import Schools
from model.stores import StoreRegularHolidays, Stores, StoreSchools
from model.users import Users, UserStores

__all__ = [
    "Companies",
    "Projects",
    "ProjectSchoolDivisions",
    "ProjectStores",
    "Reservations",
    "ScheduleBlocks",
    "Schedules",
    "SchoolDivisions",
    "Schools",
    "StoreRegularHolidays",
    "Stores",
    "StoreSchools",
    "Users",
    "UserStores",
]
