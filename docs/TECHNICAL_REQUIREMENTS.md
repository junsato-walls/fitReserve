# fitReserve - 技術要件書

制服販売会社の採寸予約管理システム

**作成日**: 2026-08-01  
**バージョン**: 1.0.0

---

## 目次
1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [バックエンド要件](#バックエンド要件)
4. [フロントエンド要件](#フロントエンド要件)
5. [データベース要件](#データベース要件)
6. [インフラ要件](#インフラ要件)
7. [認証・セキュリティ](#認証セキュリティ)
8. [ストレージ要件](#ストレージ要件)
9. [開発環境](#開発環境)
10. [非機能要件](#非機能要件)

---

## システム概要

### プロジェクト名
fitReserve - 制服採寸予約管理システム

### 目的
制服販売会社において、顧客の採寸予約を効率的に管理するためのWebアプリケーション

### アーキテクチャ
- **パターン**: RESTful API + SPA (Single Page Application)
- **フロントエンド**: Next.js（App Router）
- **バックエンド**: FastAPI（Python）
- **データベース**: PostgreSQL
- **ストレージ**: MinIO（S3互換）
- **コンテナ**: Docker / Docker Compose

---

## 技術スタック

### バックエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|----------|------|
| 言語 | Python | 3.10+ | サーバーサイドロジック |
| フレームワーク | FastAPI | 0.110.2+ | REST API実装 |
| ORM | SQLAlchemy | 2.0+ | データベース操作 |
| ASGI Server | Uvicorn | 0.29.0+ | アプリケーションサーバー |
| 認証 | python-jose | 3.3.0+ | JWT認証 |
| パスワード | bcrypt | 4.1.2+ | パスワードハッシュ化 |
| バリデーション | Pydantic | 2.0+ | データバリデーション |
| DB Driver | psycopg2-binary | 2.9+ | PostgreSQLドライバ |
| 日時 | pytz | 2024.1+ | タイムゾーン管理 |
| 環境変数 | python-dotenv | - | 環境変数管理 |
| S3 Client | boto3 | latest | MinIO接続 |

### フロントエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|----------|------|
| 言語 | TypeScript | 5+ | 型安全な開発 |
| フレームワーク | Next.js | 15.3.5+ | React フレームワーク |
| UI ライブラリ | React | 19.0.0+ | UI コンポーネント |
| ルーティング | App Router | Next.js 15+ | ファイルベースルーティング |
| スタイリング | Tailwind CSS | 4+ | ユーティリティファーストCSS |
| UI コンポーネント | 自作（`components/base/`） | - | 外部UIライブラリ非依存。維持コストを避けるため自作する |
| アイコン | Lucide React | 0.525.0+ | アイコンライブラリ |
| 日付処理 | date-fns | 4.1.0+ | 日付操作 |
| PDF表示 | react-pdf | 10.0.1+ | PDF表示機能 |
| S3 Client | AWS SDK (@aws-sdk) | 3.848.0+ | MinIO接続 |

### データベース

| カテゴリ | 技術 | バージョン | 備考 |
|---------|------|----------|------|
| DBMS | PostgreSQL | 16+ | メインデータベース |
| 文字コード | UTF-8 | - | 絵文字対応 |
| タイムゾーン | JST (Asia/Tokyo) | - | 日本標準時 |
| 接続プール | SQLAlchemy Pool | - | コネクション管理 |

### インフラ

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|----------|------|
| コンテナ | Docker | 20.10+ | アプリケーション実行環境 |
| オーケストレーション | Docker Compose | 3.8+ | マルチコンテナ管理 |
| オブジェクトストレージ | MinIO | latest | 画像・ファイル保存 |
| リバースプロキシ | （未定） | - | 本番環境用 |

---

## バックエンド要件

### 3.1 言語・フレームワーク

**Python 3.10以上**
- 型ヒント (Type Hints) を使用
- async/await によるリアルタイム処理対応
- zoneinfo による日本標準時 (JST) 対応

**FastAPI 0.110.2以上**
- 自動API ドキュメント生成 (Swagger UI)
- Pydantic による入力バリデーション
- 依存性注入 (Dependency Injection) パターン
- CORS 対応（開発: `http://localhost:3000`）

### 3.2 データベース操作

**SQLAlchemy 2.0以上**
- ORM パターンを使用
- 論理削除パターン（`deleted_at` カラム）
- タイムスタンプ自動更新（`created_at`, `updated_at`）
- 外部キー制約による整合性保証
- トランザクション管理

**必須実装**:
```python
# タイムゾーン対応
from zoneinfo import ZoneInfo

def jst():
    return datetime.now(ZoneInfo("Asia/Tokyo"))

# Base モデル
class Base(DeclarativeBase):
    pass

# セッション管理
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 3.3 API設計規約

**RESTful API パターン**:
- GET: データ取得
- POST: 新規作成
- PUT: 全体更新
- PATCH: 部分更新
- DELETE: 削除（論理削除）

**エンドポイント構造**:
```
/api/v1/{resource}
├── /admin/{resource}    # 管理者専用
├── /public/{resource}   # 認証不要（予約フォーム等）
└── /generic/{resource}  # 認証必須（スタッフ用）
```

**レスポンス形式**:
```json
{
  "status": "success",
  "data": {},
  "message": "操作が完了しました"
}
```

**エラーレスポンス**:
```json
{
  "status": "error",
  "detail": "エラー詳細",
  "code": "ERROR_CODE"
}
```

### 3.4 必須ミドルウェア

1. **CORS ミドルウェア**
   - 許可オリジン: `http://localhost:3000`（開発）
   - 認証情報の送信: 許可
   - 許可メソッド: すべて

2. **処理時間ミドルウェア**
   - レスポンスヘッダーに `X-Process-Time` を追加

3. **認証ミドルウェア**
   - JWT トークン検証
   - ユーザー情報の依存性注入

### 3.5 パッケージ構成

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
└── requirements.txt     # 依存パッケージ
```

---

## フロントエンド要件

### 4.1 言語・フレームワーク

**TypeScript 5以上**
- 厳格な型チェック有効化（`strict: true`）
- 型定義ファイル（`.d.ts`）の活用
- ESNext 対応

**Next.js 15以上**
- App Router パターン使用
- Server Components 優先
- Client Components は `'use client'` で明示
- 画像最適化（next/image）
- 自動コード分割

### 4.2 ディレクトリ構成

```
app/src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # トップページ
│   ├── login/             # ログインページ
│   ├── signup/            # 会員登録ページ
│   ├── admin/             # 管理者画面
│   ├── user/              # スタッフ画面
│   ├── manuals/           # 予約管理画面
│   └── api/               # API Routes（NextAuth等）
├── components/            # Reactコンポーネント
│   ├── base/             # 基本UI部品
│   ├── common/           # 共通コンポーネント
│   ├── features/         # 機能別コンポーネント
│   └── base/             # 自作の基盤UI部品
├── actions/              # Server Actions
│   ├── Auth.ts          # 認証処理
│   ├── Manual.ts        # 予約操作
│   └── Storage.ts       # ファイルアップロード
├── lib/                  # ユーティリティ
│   ├── api.ts           # API クライアント
│   ├── auth.ts          # 認証ヘルパー
│   └── utils.ts         # 汎用関数
├── types/                # TypeScript型定義
│   ├── manual.ts
│   └── user.ts
└── hooks/                # カスタムフック
    └── useMe.ts
```

### 4.3 UI要件

**デザインシステム**:
- Tailwind CSS によるユーティリティファーストアプローチ
- 自作コンポーネント側でアクセシビリティを担保（キーボード操作・ARIA・フォーカス管理）
- レスポンシブデザイン（モバイルファースト）

**必須コンポーネント**:
- Button, Input, Select, Checkbox, Radio
- Dialog, Alert, Toast（通知）
- Table, Pagination
- Calendar, DatePicker（予約日選択）
- Avatar, Badge
- Loading, Spinner

**アクセシビリティ**:
- ARIA 属性の適切な使用
- キーボードナビゲーション対応
- スクリーンリーダー対応

### 4.4 状態管理

**Server State**:
- Server Components でデータフェッチ
- Server Actions でデータ更新

**Client State**:
- React Hooks（useState, useEffect）
- Cookie によるトークン管理

### 4.5 API通信

**api.ts によるHTTPクライアント**:
```typescript
interface ApiOptions {
  headers?: Record<string, string>;
  token?: string;
}

// メソッド
apiCall<T>(method, path, body?, options?)
api.get<T>(path, options?)
api.post<T>(path, body, options?)
api.put<T>(path, body, options?)
api.delete<T>(path, options?)
```

**認証トークン管理**:
- Server Side: `cookies()` から取得
- Client Side: `document.cookie` から取得
- 自動的にAuthorizationヘッダーに付与

---

## データベース要件

### 5.1 DBMS: PostgreSQL 16以上

**選定理由**:
- オープンソースで商用利用可能
- ACID特性による高い信頼性
- JSON型対応（将来の拡張性）
- 優れたパフォーマンス
- 豊富なデータ型（ARRAY、JSONB等）

**MySQL からの移行理由**:
- より標準SQL準拠
- 高度な機能（Window Functions、CTE等）
- ライセンスの明確性
- エンタープライズレベルの拡張性

### 5.2 接続設定

**接続文字列**:
```python
DATABASE_URL = "postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"
```

**環境変数**:
```bash
DB_USER=fitreserve_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitreserve_db
```

**SQLAlchemy 設定**:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"

engine = create_engine(
    DATABASE_URL,
    echo=True,  # 開発時のみ
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # 接続チェック
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)
```

### 5.3 データ型マッピング

| SQLAlchemy型 | PostgreSQL型 | 用途 |
|-------------|-------------|------|
| Integer | INTEGER | ID、数値 |
| String(N) | VARCHAR(N) | 文字列 |
| Text | TEXT | 長文 |
| Boolean | BOOLEAN | フラグ |
| DateTime | TIMESTAMP | 日時 |
| Date | DATE | 日付 |
| Time | TIME | 時刻 |
| Numeric(M,D) | NUMERIC(M,D) | 小数（身長、体重） |
| Enum | VARCHAR or ENUM | 列挙型 |
| JSON | JSONB | JSON データ |

### 5.4 文字コード・照合順序

```sql
-- データベース作成時
CREATE DATABASE fitreserve_db
WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'ja_JP.UTF-8'
    LC_CTYPE = 'ja_JP.UTF-8'
    TEMPLATE = template0;
```

### 5.5 タイムゾーン設定

**PostgreSQL設定**:
```sql
-- postgresql.conf
timezone = 'Asia/Tokyo'

-- または実行時設定
SET timezone = 'Asia/Tokyo';
```

**Python側**:
```python
from zoneinfo import ZoneInfo

def jst():
    return datetime.now(ZoneInfo("Asia/Tokyo"))
```

### 5.6 インデックス戦略

**基本方針**:
- PRIMARY KEY には自動的に B-Tree インデックス
- 外部キーには明示的にインデックス作成
- 検索条件に頻繁に使用されるカラムにインデックス
- 複合インデックスは検索条件の順序を考慮

**例**:
```sql
-- 単一カラムインデックス
CREATE INDEX idx_reservations_phone ON reservations(phone);

-- 複合インデックス（検索条件順）
CREATE INDEX idx_reservations_search 
ON reservations(store_id, reservation_date, status, deleted_at);

-- 部分インデックス（条件付き）
CREATE INDEX idx_active_users 
ON users(id) WHERE deleted_at IS NULL;
```

### 5.7 バックアップ・リストア

**pg_dump によるバックアップ**:
```bash
# 論理バックアップ
pg_dump -U fitreserve_user -h localhost fitreserve_db > backup.sql

# カスタム形式（圧縮）
pg_dump -U fitreserve_user -h localhost -Fc fitreserve_db > backup.dump
```

**リストア**:
```bash
# SQL形式
psql -U fitreserve_user -h localhost fitreserve_db < backup.sql

# カスタム形式
pg_restore -U fitreserve_user -h localhost -d fitreserve_db backup.dump
```

---

## インフラ要件

### 6.1 Docker構成

**docker-compose.yml 構成**:
```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: fitreserve_db
    environment:
      POSTGRES_DB: fitreserve_db
      POSTGRES_USER: fitreserve_user
      POSTGRES_PASSWORD: secure_password
      TZ: Asia/Tokyo
    ports:
      - "5432:5432"
    volumes:
      - ./docker/postgres/initdb.d:/docker-entrypoint-initdb.d
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fitreserve-net

  api:
    build: ./docker/api
    container_name: fitreserve_api
    depends_on:
      - db
      - minio
    environment:
      DB_USER: fitreserve_user
      DB_PASSWORD: secure_password
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: fitreserve_db
      MINIO_ENDPOINT: http://minio:9000
      AWS_ACCESS_KEY_ID: minioadmin
      AWS_SECRET_ACCESS_KEY: minioadmin
      SECRET_KEY: ${SECRET_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./api:/usr/src/server
    networks:
      - fitreserve-net

  frontend:
    build: ./docker/front
    container_name: fitreserve_frontend
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    volumes:
      - ./app:/usr/src/app
      - /usr/src/app/node_modules
    networks:
      - fitreserve-net

  minio:
    image: minio/minio:latest
    container_name: fitreserve_minio
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
      - fitreserve-net

networks:
  fitreserve-net:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local
```

### 6.2 コンテナ要件

**API コンテナ**:
- ベースイメージ: `python:3.10-slim` または `python:3.11-slim`
- ポート: 8000
- ヘルスチェック: `/health` エンドポイント

**Frontend コンテナ**:
- ベースイメージ: `node:20-alpine`
- ポート: 3000
- ビルド: マルチステージビルド推奨

**PostgreSQL コンテナ**:
- イメージ: `postgres:16-alpine`
- ポート: 5432
- データ永続化: Docker Volume

**MinIO コンテナ**:
- イメージ: `minio/minio:latest`
- ポート: 9000（API）, 9001（Console）
- データ永続化: Docker Volume

---

## 認証・セキュリティ

### 7.1 認証方式

**JWT (JSON Web Token)**:
- アルゴリズム: HS256
- トークン有効期限: 24時間（調整可能）
- リフレッシュトークン: 将来実装予定

**トークン構造**:
```json
{
  "id": 1,
  "personal_id": "EMP001",
  "user_name": "tanaka",
  "role": "admin",
  "exp": 1722480000
}
```

### 7.2 パスワード管理

**ハッシュ化**:
- アルゴリズム: bcrypt
- ソルト: 自動生成（ユーザーごと）
- ラウンド数: 12（デフォルト）

**パスワードポリシー**:
- 最小長: 8文字
- 推奨: 英大文字・小文字・数字・記号を含む
- 検証: Pydantic バリデーター

### 7.3 権限管理

**ロール定義**:
- `admin`: 管理者（全機能アクセス）
- `staff`: スタッフ（予約管理、閲覧）
- `readonly`: 閲覧のみ

**実装例**:
```python
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    READONLY = "readonly"

# 権限チェックデコレータ
def require_role(required_role: UserRole):
    def decorator(func):
        async def wrapper(current_user: DecodedToken, *args, **kwargs):
            if current_user.role != required_role:
                raise HTTPException(status_code=403, detail="権限がありません")
            return await func(current_user, *args, **kwargs)
        return wrapper
    return decorator
```

### 7.4 セキュリティヘッダー

**必須ヘッダー**:
```python
# CORS設定
allow_origins = ["http://localhost:3000", "https://yourdomain.com"]
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]

# セキュリティヘッダー
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-XSS-Protection"] = "1; mode=block"
```

### 7.5 環境変数管理

**必須環境変数**:
```bash
# データベース
DB_USER=fitreserve_user
DB_PASSWORD=***********
DB_HOST=db
DB_PORT=5432
DB_NAME=fitreserve_db

# JWT
SECRET_KEY=***********  # 32文字以上のランダム文字列

# MinIO
MINIO_ENDPOINT=http://minio:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=***********

# その他
ENVIRONMENT=development  # development | staging | production
```

**管理方法**:
- `.env` ファイル（開発環境）
- Docker Secrets（本番環境）
- `.env.example` をテンプレートとして提供

---

## ストレージ要件

### 8.1 MinIO（S3互換ストレージ）

**用途**:
- プロフィール画像
- 店舗写真
- アップロードファイル

**バケット構成**:
```
fitreserve-storage/
├── users/              # ユーザープロフィール画像
│   └── {user_id}/
│       └── avatar.jpg
├── stores/             # 店舗画像
│   └── {store_id}/
│       └── photo.jpg
└── uploads/            # その他アップロード
    └── {year}/{month}/
        └── {filename}
```

**アクセスポリシー**:
- Private: デフォルト（署名付きURL必須）
- Public Read: 店舗画像など一部のみ

### 8.2 署名付きURL生成

**Python (boto3)**:
```python
import boto3
from botocore.client import Config

s3_client = boto3.client(
    's3',
    endpoint_url=MINIO_ENDPOINT,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4')
)

# アップロード用URL生成
presigned_url = s3_client.generate_presigned_url(
    'put_object',
    Params={'Bucket': 'fitreserve-storage', 'Key': object_key},
    ExpiresIn=3600
)
```

**TypeScript (AWS SDK v3)**:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: 'us-east-1',
  forcePathStyle: true,
});

const command = new PutObjectCommand({
  Bucket: 'fitreserve-storage',
  Key: objectKey,
});

const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
```

### 8.3 ファイルアップロード要件

**許可ファイル形式**:
- 画像: JPEG, PNG, GIF, WebP
- 最大サイズ: 5MB

**バリデーション**:
```python
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file(file):
    # 拡張子チェック
    ext = file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("許可されていないファイル形式です")
    
    # サイズチェック
    file.seek(0, 2)  # ファイル末尾に移動
    size = file.tell()
    file.seek(0)  # 先頭に戻す
    if size > MAX_FILE_SIZE:
        raise ValueError("ファイルサイズが大きすぎます")
```

---

## 開発環境

### 9.1 必須ツール

| ツール | バージョン | 用途 |
|-------|----------|------|
| Python | 3.10+ | バックエンド開発 |
| Node.js | 20+ | フロントエンド開発 |
| Docker | 20.10+ | コンテナ実行 |
| Docker Compose | 3.8+ | マルチコンテナ管理 |
| Git | 2.0+ | バージョン管理 |

### 9.2 推奨IDE・エディタ

**Visual Studio Code**:
- 拡張機能:
  - Python (Microsoft)
  - Pylance
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Docker
  - PostgreSQL (cweijan.vscode-postgresql-client2)

**設定例 (.vscode/settings.json)**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "python.linting.enabled": true,
  "python.formatting.provider": "black",
  "eslint.validate": ["javascript", "typescript"],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 9.3 開発サーバー起動

**バックエンド**:
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**フロントエンド**:
```bash
cd app
npm install
npm run dev
```

**Docker Compose（推奨）**:
```bash
docker-compose up -d
```

### 9.4 コーディング規約

**Python (PEP 8準拠)**:
- インデント: 4スペース
- 行の最大長: 88文字（Black デフォルト）
- 命名規則:
  - 変数・関数: `snake_case`
  - クラス: `PascalCase`
  - 定数: `UPPER_SNAKE_CASE`
- フォーマッター: Black

**TypeScript / JavaScript**:
- インデント: 2スペース
- セミコロン: 使用
- クォート: シングルクォート推奨
- 命名規則:
  - 変数・関数: `camelCase`
  - コンポーネント: `PascalCase`
  - 定数: `UPPER_SNAKE_CASE`
- フォーマッター: Prettier

---

## 非機能要件

### 10.1 パフォーマンス

**レスポンスタイム**:
- API: 平均 200ms 以下
- ページ表示: 初回 2秒以内、以降 1秒以内

**同時接続数**:
- 想定: 100ユーザー
- 最大: 500ユーザー

**データベース**:
- クエリ最適化（N+1問題の回避）
- インデックス活用
- コネクションプーリング

### 10.2 可用性

**稼働率**: 99.5% 以上（メンテナンス時間を除く）

**ダウンタイム**:
- 計画メンテナンス: 月1回、深夜帯
- 緊急メンテナンス: 必要に応じて

### 10.3 拡張性

**水平スケーリング**:
- アプリケーション層: ロードバランサー対応
- データベース層: リードレプリカ対応（将来）

**垂直スケーリング**:
- CPU: 必要に応じて増強
- メモリ: 最低 4GB（推奨 8GB以上）

### 10.4 保守性

**ログ管理**:
- アプリケーションログ: stdout/stderr
- アクセスログ: Uvicorn
- エラーログ: Sentry等の導入検討

**モニタリング**:
- ヘルスチェックエンドポイント: `/health`, `/ready`
- メトリクス: Prometheus 対応検討

### 10.5 テスト要件

**バックエンド**:
- 単体テスト: pytest（カバレッジ 80%以上）
- 統合テスト: TestClient（FastAPI）
- E2Eテスト: 主要フロー

**フロントエンド**:
- 単体テスト: Jest / React Testing Library
- E2Eテスト: Playwright（検討中）

### 10.6 ドキュメント

**必須ドキュメント**:
- [ ] README.md（プロジェクト概要）
- [ ] DEVELOPMENT.md（開発ガイド）
- [ ] DATABASE_DESIGN.md（DB設計書）
- [ ] SCHEMA_MIGRATION_PLAN.md（移行計画）
- [ ] TECHNICAL_REQUIREMENTS.md（本書）
- [ ] API仕様書（Swagger UI自動生成）

---

## 付録

### A. PostgreSQL ドライバ変更手順

**requirements.txt 更新**:
```diff
- mysqlclient==2.2.4
- pymysql
+ psycopg2-binary==2.9.9
```

**db.py 更新**:
```python
# 接続URLの作成（PostgreSQL用）
DATABASE_URL = f"postgresql://{USER_NAME}:{PASSWORD}@{HOST}:{PORT}/{DATABASE_NAME}"

# SSLオプション（本番環境）
ssl_args = {}
if USE_SSL:
    ssl_args = {
        "sslmode": "require",
        "sslrootcert": "/path/to/ca-cert.pem"
    }

ENGINE = create_engine(
    DATABASE_URL, 
    connect_args=ssl_args if USE_SSL else {},
    echo=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### B. 環境変数テンプレート

**.env.example**:
```bash
# Database (PostgreSQL)
DB_USER=fitreserve_user
DB_PASSWORD=change_this_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitreserve_db

# JWT
SECRET_KEY=generate_random_32_chars_or_more

# MinIO
MINIO_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin

# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

---

**最終更新日**: 2026-08-01  
**作成者**: システム開発チーム  
**承認者**: （未承認）
