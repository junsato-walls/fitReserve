# 技術スタック仕様書

FastAPI + Next.js + PostgreSQL による Web アプリケーション開発

**対象**: FastAPI バックエンド + Next.js フロントエンド + PostgreSQL データベースを使用するプロジェクト  
**バージョン**: 1.0.0  
**最終更新**: 2026-08-01

---

## 目次
1. [技術スタック概要](#技術スタック概要)
2. [バックエンド (FastAPI)](#バックエンド-fastapi)
3. [フロントエンド (Next.js)](#フロントエンド-nextjs)
4. [データベース (PostgreSQL)](#データベース-postgresql)
5. [インフラ (Docker)](#インフラ-docker)
6. [認証・セキュリティ](#認証セキュリティ)
7. [開発環境](#開発環境)
8. [コーディング規約](#コーディング規約)
9. [ディレクトリ構造](#ディレクトリ構造)

---

## 技術スタック概要

### アーキテクチャパターン
- **RESTful API** + **SPA** (Single Page Application)
- バックエンドとフロントエンドの完全分離
- JWT による認証
- Docker による環境統一

### 主要技術
- **バックエンド**: Python 3.10+ / FastAPI 0.110.2+
- **フロントエンド**: TypeScript 5+ / Next.js 15+
- **データベース**: PostgreSQL 16+
- **ストレージ**: MinIO (S3互換)
- **コンテナ**: Docker / Docker Compose

---

## バックエンド (FastAPI)

### 言語・フレームワーク

#### Python 3.10以上
- **型ヒント** (Type Hints) を必須で使用
- **async/await** による非同期処理対応
- **zoneinfo** によるタイムゾーン管理

#### FastAPI 0.110.2以上
- 自動API ドキュメント生成 (Swagger UI / ReDoc)
- Pydantic による自動バリデーション
- 依存性注入 (Dependency Injection) パターン
- CORS ミドルウェア対応

### 必須パッケージ

| パッケージ | バージョン | 用途 |
|----------|----------|------|
| fastapi | 0.110.2+ | Web フレームワーク |
| uvicorn | 0.29.0+ | ASGI サーバー |
| sqlalchemy | 2.0+ | ORM |
| pydantic | 2.0+ | データバリデーション |
| psycopg2-binary | 2.9+ | PostgreSQL ドライバ |
| python-jose | 3.3.0+ | JWT 認証 |
| bcrypt | 4.1.2+ | パスワードハッシュ化 |
| python-dotenv | - | 環境変数管理 |
| boto3 | latest | S3 互換ストレージクライアント |

### ディレクトリ構造

```
api/
├── main.py                 # アプリケーションエントリーポイント
├── routers/               # APIルーター
│   ├── admin/            # 管理者用API
│   ├── public/           # 認証不要API
│   └── generic/          # 認証必須API
├── schemas/              # Pydanticスキーマ
│   ├── admin/
│   ├── public/
│   └── generic/
├── system/               # システム設定
│   ├── db.py            # データベース接続
│   ├── auth.py          # 認証処理
│   ├── models.py        # SQLAlchemyモデル
│   └── api_router.py    # ルーター統合
├── services/             # ビジネスロジック
├── tests/                # テストコード
└── requirements.txt     # 依存パッケージ
```

### API設計パターン

#### RESTful エンドポイント
```
GET    /api/v1/{resource}         # 一覧取得
GET    /api/v1/{resource}/{id}    # 詳細取得
POST   /api/v1/{resource}         # 新規作成
PUT    /api/v1/{resource}/{id}    # 全体更新
PATCH  /api/v1/{resource}/{id}    # 部分更新
DELETE /api/v1/{resource}/{id}    # 削除（論理削除）
```

#### エンドポイント構造
```
/api/v1/
├── /admin/{resource}    # 管理者専用（admin権限必須）
├── /public/{resource}   # 認証不要（公開API）
└── /{resource}          # 認証必須（一般ユーザー）
```

#### レスポンス形式

**成功時**:
```json
{
  "status": "success",
  "data": { },
  "message": "操作が完了しました"
}
```

**エラー時**:
```json
{
  "status": "error",
  "detail": "エラーの詳細メッセージ",
  "code": "ERROR_CODE"
}
```

### データベース接続設定

#### db.py の実装例

```python
# -*- coding: utf-8 -*-
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# 環境変数から接続情報取得
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "database")

# PostgreSQL接続URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# エンジン作成（コネクションプール設定）
ENGINE = create_engine(
    DATABASE_URL,
    echo=True,  # 開発時のみ True
    pool_size=10,  # 常時維持する接続数
    max_overflow=20,  # 追加で作成できる接続数
    pool_pre_ping=True  # 接続前に疎通確認
)

# セッション作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)

# Base クラス
Base = declarative_base()

# 依存性注入用関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### SQLAlchemy モデル設計

#### タイムゾーン対応

```python
from datetime import datetime
from zoneinfo import ZoneInfo

def jst():
    """JST タイムゾーンで現在時刻を返す"""
    return datetime.now(ZoneInfo("Asia/Tokyo"))
```

#### 基本モデルパターン

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime

class BaseModel(Base):
    """すべてのモデルの基底クラス"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True)
    deleted_at = Column(DateTime)  # 論理削除
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)
```

#### データ型マッピング

| SQLAlchemy型 | PostgreSQL型 | 用途 |
|-------------|-------------|------|
| Integer | INTEGER | ID、整数 |
| String(N) | VARCHAR(N) | 文字列 |
| Text | TEXT | 長文 |
| Boolean | BOOLEAN | フラグ |
| DateTime | TIMESTAMP | 日時 |
| Date | DATE | 日付 |
| Time | TIME | 時刻 |
| Numeric(M,D) | NUMERIC(M,D) | 小数 |
| ForeignKey | FOREIGN KEY | 外部キー |

### 認証実装 (JWT)

#### auth.py の実装例

```python
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()

def create_access_token(data: dict):
    """JWT トークンの作成"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """JWT トークンの検証"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました"
        )
```

### ミドルウェア設定

#### main.py の実装例

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import time

app = FastAPI(
    title="API Title",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip圧縮
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 処理時間計測ミドルウェア
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

---

## フロントエンド (Next.js)

### 言語・フレームワーク

#### TypeScript 5以上
- **厳格な型チェック** (`strict: true`)
- **ESNext** 構文対応
- 型定義ファイル (`.d.ts`) の活用

#### Next.js 15以上
- **App Router** パターン使用
- **Server Components** 優先
- **Client Components** は `'use client'` で明示
- 画像最適化 (`next/image`)
- 自動コード分割

### 必須パッケージ

| パッケージ | 用途 |
|----------|------|
| next | React フレームワーク |
| react / react-dom | UI ライブラリ |
| typescript | 型安全な開発 |
| tailwindcss | CSS フレームワーク |
| lucide-react | アイコン |
| zod | バリデーション |
| date-fns | 日付処理 |
| @aws-sdk/client-s3 | S3クライアント |

### ディレクトリ構造

```
app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # トップページ
│   │   ├── login/             # ログインページ
│   │   ├── signup/            # 会員登録ページ
│   │   ├── admin/             # 管理者画面
│   │   └── api/               # API Routes
│   ├── components/            # React コンポーネント
│   │   ├── base/             # 自作の基盤UI部品（外部UIライブラリ非依存）
│   │   ├── layouts/          # ページの骨組み
│   ├── api/                  # Server Actions（FastAPIとの通信層）
│   ├── lib/                  # ユーティリティ
│   │   ├── api.ts           # API クライアント
│   │   ├── auth.ts          # 認証ヘルパー
│   │   └── utils.ts         # 汎用関数
│   └── types/                # TypeScript 型定義
├── public/                    # 静的ファイル
├── tailwind.config.ts        # Tailwind CSS 設定
├── tsconfig.json             # TypeScript 設定
├── next.config.ts            # Next.js 設定
└── package.json
```

### API クライアント実装

#### lib/api.ts の実装例

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
  headers?: Record<string, string>;
  token?: string;
}

async function apiCall<T>(
  method: string,
  path: string,
  body?: any,
  options?: ApiOptions
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // トークンの取得（Server / Client 両対応）
  const token = options?.token || getTokenFromCookie();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'APIエラーが発生しました');
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => 
    apiCall<T>('GET', path, undefined, options),
  post: <T>(path: string, body: any, options?: ApiOptions) => 
    apiCall<T>('POST', path, body, options),
  put: <T>(path: string, body: any, options?: ApiOptions) => 
    apiCall<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: ApiOptions) => 
    apiCall<T>('DELETE', path, undefined, options),
};
```

### UI コンポーネント設計

#### 基本方針
- **外部UIライブラリを使わず `base/` に自作する**（維持コストを避けるため。2026-08-21にshadcn/ui・Radix UIを全廃）
- **`base/` は自由度をなるべく減らし、統一感のある画面を作りやすくする**
- **アクセシビリティは自作コンポーネント側で担保する**（キーボード操作・ARIA・フォーカス管理）
- **Tailwind CSS** でスタイリング
- **Server Components** をデフォルトで使用

> 詳細は [CODING_CONVENTIONS_FRONTEND.md](./CODING_CONVENTIONS_FRONTEND.md) の
> 「コンポーネント設計の基本方針」と [COMPONENT_ORGANIZATION.md](./COMPONENT_ORGANIZATION.md) を参照。

#### コンポーネント分類

```
components/
├── base/          # 最小単位のUI部品（Button, Input等）※自作
├── layouts/       # ページの骨組み（StaffLayout, Sidebar, Breadcrumb）
（画面本体は src/views/ に配置する）
```

---

## データベース (PostgreSQL)

### PostgreSQL 16以上

#### 選定理由
- **標準SQL準拠**: 高い互換性
- **ACID特性**: データの整合性保証
- **豊富な機能**: Window Functions, CTE, JSONB等
- **高性能**: 大規模データ処理に強い
- **オープンソース**: 商用利用可能

### 接続設定

#### 環境変数

```bash
DB_USER=postgres
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name
```

#### 接続URL形式

```
postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}
```

### データベース作成

```sql
CREATE DATABASE your_database
WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'ja_JP.UTF-8'
    LC_CTYPE = 'ja_JP.UTF-8'
    TEMPLATE = template0;
```

### タイムゾーン設定

```sql
-- データベース全体の設定
SET timezone = 'Asia/Tokyo';

-- または postgresql.conf で設定
timezone = 'Asia/Tokyo'
```

### 自動更新トリガー

```sql
-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
CREATE TRIGGER update_tablename_updated_at 
BEFORE UPDATE ON tablename
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### インデックス設計

```sql
-- 単一カラムインデックス
CREATE INDEX idx_table_column ON table_name(column_name);

-- 複合インデックス（検索条件の順序に注意）
CREATE INDEX idx_table_multi ON table_name(col1, col2, col3);

-- 部分インデックス（条件付き）
CREATE INDEX idx_active_records 
ON table_name(id) WHERE deleted_at IS NULL;

-- ユニークインデックス
CREATE UNIQUE INDEX idx_unique_column ON table_name(column_name);
```

### バックアップ・リストア

```bash
# バックアップ（SQL形式）
pg_dump -U username -h localhost database_name > backup.sql

# バックアップ（カスタム形式・圧縮）
pg_dump -U username -h localhost -Fc database_name > backup.dump

# リストア（SQL形式）
psql -U username -h localhost database_name < backup.sql

# リストア（カスタム形式）
pg_restore -U username -h localhost -d database_name backup.dump
```

---

## インフラ (Docker)

### Docker Compose 構成

#### docker-compose.yml の基本構成

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: app_db
    environment:
      POSTGRES_DB: database_name
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      TZ: Asia/Tokyo
      PGTZ: Asia/Tokyo
    ports:
      - "5432:5432"
    volumes:
      - ./docker/postgres/initdb.d:/docker-entrypoint-initdb.d
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  api:
    build: ./docker/api
    container_name: app_api
    depends_on:
      - db
      - minio
    environment:
      DB_USER: postgres
      DB_PASSWORD: password
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: database_name
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./api:/app
    networks:
      - app-network

  frontend:
    build: ./docker/front
    container_name: app_frontend
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    volumes:
      - ./app:/app
      - /app/node_modules
    networks:
      - app-network

  minio:
    image: minio/minio:latest
    container_name: app_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    networks:
      - app-network

volumes:
  postgres_data:
  minio_data:

networks:
  app-network:
    driver: bridge
```

### Dockerfile 例

#### バックエンド (API)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

#### フロントエンド

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
```

---

## 認証・セキュリティ

### JWT認証

- **アルゴリズム**: HS256
- **有効期限**: 24時間
- **トークン保存**: Cookie（HttpOnly推奨）

### パスワードハッシュ化

- **アルゴリズム**: bcrypt
- **ソルトラウンド**: 12回
- **ソルト**: 自動生成

```python
import bcrypt

# ハッシュ化
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# 検証
bcrypt.checkpw(password.encode(), stored_hash)
```

### CORS設定

```python
allow_origins=[
    "http://localhost:3000",
    "https://yourdomain.com"
]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

### HTTPS通信

- 本番環境では必須
- Let's Encrypt による無料SSL証明書

---

## 開発環境

### 必須ツール

- **Python**: 3.10以上
- **Node.js**: 20以上
- **Docker**: 20.10以上
- **Docker Compose**: 3.8以上
- **Git**: 2.30以上

### 環境変数管理

#### .env ファイル

```bash
# データベース
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name

# JWT認証
SECRET_KEY=your-secret-key-here

# MinIO
MINIO_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin

# フロントエンド
NEXT_PUBLIC_API_URL=http://localhost:8000

# 環境
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

### 起動手順

```bash
# 環境変数設定
cp .env.example .env

# コンテナ起動
docker-compose up -d --build

# ログ確認
docker-compose logs -f

# コンテナ停止
docker-compose down

# データも削除する場合
docker-compose down -v
```

---

## コーディング規約

### Python (PEP 8)

```python
# インポート順序
import os  # 標準ライブラリ
import sys

from fastapi import FastAPI  # サードパーティ
from sqlalchemy import Column

from system.db import Base  # ローカルモジュール

# 命名規則
class UserModel:  # クラス: PascalCase
    pass

def get_user_by_id():  # 関数: snake_case
    pass

MAX_RETRY_COUNT = 3  # 定数: UPPER_SNAKE_CASE
user_name = "John"  # 変数: snake_case

# 型ヒント必須
def calculate_total(price: int, quantity: int) -> int:
    return price * quantity
```

### TypeScript

```typescript
// 命名規則
class UserService {}  // クラス: PascalCase
interface User {}  // インターフェース: PascalCase
type UserRole = 'admin' | 'staff';  // 型: PascalCase

function getUserById() {}  // 関数: camelCase
const userName = 'John';  // 変数: camelCase
const MAX_RETRY_COUNT = 3;  // 定数: UPPER_SNAKE_CASE

// 型定義必須
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// インターフェース定義
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
```

### SQL

```sql
-- テーブル名: snake_case
CREATE TABLE user_profiles (
    -- カラム名: snake_case
    id INTEGER PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス名: idx_{table}_{column}
CREATE INDEX idx_user_profiles_user_name ON user_profiles(user_name);
```

---

## ディレクトリ構造

### プロジェクト全体

```
project/
├── api/                    # バックエンド
├── app/                    # フロントエンド
├── docker/                 # Docker設定
│   ├── api/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── front/
│   │   └── Dockerfile
│   └── postgres/
│       └── initdb.d/
│           ├── 01_schema.sql
│           └── 02_testdata.sql
├── docs/                   # ドキュメント
├── .env.example           # 環境変数テンプレート
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## まとめ

この技術スタック仕様書は、FastAPI + Next.js + PostgreSQL を使用する Web アプリケーション開発の標準構成を定義しています。

プロジェクト固有の仕様は別途作成し、この仕様書は技術的な標準として複数のプロジェクトで共有してください。

---

**最終更新日**: 2026-08-01  
**管理者**: 開発チーム
