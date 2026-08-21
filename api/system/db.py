# -*- coding: utf-8 -*-
# DBへの接続設定
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# .envから環境変数を読み込む
load_dotenv()

# 接続したいDBの基本情報を設定
DB_USER = os.getenv("DB_USER", "fitreserve_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "fitreserve_db")
USE_SSL = os.getenv("USE_SSL", "false").lower() == "true"

# PostgreSQL接続URLの作成
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SSLオプションの追加（本番環境用）
ssl_args = {}
if USE_SSL:
    ssl_args = {
        "sslmode": "require",
        "sslrootcert": "/etc/ssl/certs/ca-certificates.crt",
    }

# DBとの接続（PostgreSQL用）
ENGINE = create_engine(
    DATABASE_URL,
    connect_args=ssl_args if USE_SSL else {},
    echo=True,  # 開発時のみ True
    pool_size=10,  # コネクションプールサイズ
    max_overflow=20,  # 最大オーバーフロー接続数
    pool_pre_ping=True,  # 接続前に疎通確認
)

# modelで使用する
Base = declarative_base()

# SQL接続
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
