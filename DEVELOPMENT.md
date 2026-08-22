# fitReserve - 開発ガイドライン

制服販売会社の採寸予約管理システム

---

## 📚 ドキュメント構成

このプロジェクトのドキュメントは以下のように整理されています：

### 仕様書
- **[SPECIFICATION.md](docs/SPECIFICATION.md)** - fitReserve固有の機能仕様・ビジネス要件
  - システム概要
  - ビジネス要件
  - 主要機能
  - 画面仕様
  - ビジネスルール

### 技術資料
- **[TECHNICAL_STACK.md](docs/TECHNICAL_STACK.md)** - 汎用的な技術仕様（他プロジェクトでも使用可能）
  - FastAPI + Next.js + PostgreSQL の標準構成
  - コーディング規約
  - ディレクトリ構造のベストプラクティス
  - 開発環境セットアップ

- **[DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)** - データベース設計
  - ER図
  - テーブル定義
  - インデックス設計

- **[POSTGRESQL_MIGRATION.md](docs/POSTGRESQL_MIGRATION.md)** - PostgreSQL移行ガイド
  - MySQL から PostgreSQL への移行手順
  - データ型マッピング
  - トラブルシューティング

### その他
- **[README.md](README.md)** - プロジェクト概要とクイックスタート

---

## プロジェクト概要

fitReserve は、制服販売会社における採寸予約を管理するWebアプリケーションです。

詳細な仕様は **[SPECIFICATION.md](docs/SPECIFICATION.md)** を参照してください。

### 主な機能
- 採寸予約管理（新規登録、確認、変更、キャンセル）
- 店舗管理
- 学校管理
- プロジェクト（キャンペーン期間）管理
- スケジュール・予約枠管理
- ユーザー管理（スタッフアカウント）

---

## プロジェクト構造

### 全体構成
```
fitReserve/
├── api/              # バックエンド (FastAPI)
├── app/              # フロントエンド (Next.js)
├── docker/           # Docker設定ファイル
├── docs/             # ドキュメント (任意)
├── README.md         # プロジェクト概要
└── DEVELOPMENT.md    # 本ドキュメント
```

### バックエンド構成 (`api/`)
```
api/
├── main.py                # FastAPIアプリケーションのエントリーポイント
├── routers/               # APIルーター
│   ├── admin/            # 管理者向けエンドポイント
│   │   ├── channel.py    # チャンネル管理（要リファクタリング）
│   │   └── user.py       # ユーザー管理
│   ├── custom/           # カスタムエンドポイント
│   │   └── auth.py       # 認証関連
│   └── generic/          # 汎用エンドポイント（要整理）
│       ├── channel.py
│       ├── manual.py     # 削除予定（予約システムに不要）
│       ├── progress.py   # 削除予定（予約システムに不要）
│       ├── rel_channel_user.py
│       ├── step_comment.py  # 削除予定（予約システムに不要）
│       ├── step.py       # 削除予定（予約システムに不要）
│       └── user.py
├── schemas/               # Pydanticスキーマ (リクエスト/レスポンス)
│   ├── step.py           # 削除予定（予約システムに不要）
│   ├── admin/
│   ├── custom/
│   │   └── auth.py
│   └── generic/
│       ├── channels.py
│       ├── manuals.py    # 削除予定（予約システムに不要）
│       ├── progress.py   # 削除予定（予約システムに不要）
│       ├── rel_channel_user.py
│       ├── step_comment.py  # 削除予定（予約システムに不要）
│       └── users.py
├── system/                # システム基盤
│   ├── api_router.py      # ルーター統合
│   ├── auth.py            # 認証ロジック
│   ├── db.py              # データベース接続設定
│   └── models.py          # SQLAlchemyモデル
├── services/              # ビジネスロジック（今後実装）
└── tests/                 # テストコード（今後実装）
```

**⚠️ 注意**: 現在のコードは他システムからコピーしたものです。制服採寸予約システムに不要なファイル(manual, step, progressなど)は順次削除し、以下のような構成に整理していきます:

```
api/
├── routers/
│   ├── admin/
│   │   ├── store.py          # 店舗管理（新規作成予定）
│   │   ├── timeslot.py       # 予約枠管理（新規作成予定）
│   │   ├── uniform_type.py   # 制服種別管理（新規作成予定）
│   │   └── user.py           # 顧客・スタッフ管理
│   ├── custom/
│   │   └── auth.py           # 認証
│   └── public/               # 公開エンドポイント（新規作成予定）
│       ├── store.py          # 店舗一覧・詳細
│       ├── reservation.py    # 採寸予約CRUD
│       └── user.py           # プロフィール管理
└── schemas/
    ├── stores.py              # 店舗スキーマ（新規作成予定）
    ├── reservations.py        # 採寸予約スキーマ（新規作成予定）
    ├── timeslots.py           # 予約枠スキーマ（新規作成予定）
    ├── uniform_types.py       # 制服種別スキーマ（新規作成予定）
    └── users.py
```

### フロントエンド構成 (`app/`)
```
app/
├── src/
│   ├── middleware.ts      # Next.js ミドルウェア（認証など）
│   ├── api/               # Server Actions（FastAPIとの通信層）
│   │   ├── Auth.ts
│   │   ├── Manual.ts      # 削除予定（制服採寸予約システムに不要）
│   │   ├── Progress.ts    # 削除予定（制服採寸予約システムに不要）
│   │   ├── StepComment.ts # 削除予定（制服採寸予約システムに不要）
│   │   └── Storage.ts
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # ルートレイアウト
│   │   ├── page.tsx       # トップページ
│   │   ├── login/         # ログインページ
│   │   ├── signup/        # サインアップページ
│   │   ├── admin/         # 管理者ページ
│   │   ├── user/          # ユーザーページ
│   │   ├── manuals/       # 削除予定（制服採寸予約システムに不要）
│   │   └── api/           # APIルート
│   ├── components/        # Reactコンポーネント
│   │   ├── base/          # 基本コンポーネント
│   │   ├── layouts/       # ページの骨組み
│   │   │   ├── admin/
│   │   │   ├── comments/  # 削除予定
│   │   │   ├── manual/    # 削除予定
│   │   │   ├── manualLists/ # 削除予定
│   │   │   └── user/
│   │   └── base/          # 自作の基盤コンポーネント（外部UIライブラリ非依存）
│   ├── lib/               # ユーティリティ関数
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── minio.ts
│   │   └── utils.ts
│   └── types/             # TypeScript型定義
│       ├── manual.ts      # 削除予定
│       └── step_comment.ts # 削除予定
├── public/                # 静的ファイル
│   ├── images/
│   └── pdf/
├── package.json
├── tsconfig.json
└── next.config.ts
```

**⚠️ 注意**: 現在のコードは他システムからコピーしたものです。制服採寸予約システムに必要な構成に整理していきます:

```
app/src/
├── api/
│   ├── Auth.ts
│   ├── Store.ts           # 店舗関連アクション（新規作成予定）
│   ├── Reservation.ts     # 採寸予約アクション（新規作成予定）
│   └── User.ts
├── app/
│   ├── stores/            # 店舗一覧・詳細（新規作成予定）
│   ├── reservations/      # 予約管理（新規作成予定）
│   │   ├── page.tsx       # 予約一覧
│   │   ├── new/           # 新規採寸予約
│   │   └── [id]/          # 予約詳細
│   └── admin/
│       ├── stores/        # 店舗管理（新規作成予定）
│       ├── reservations/  # 予約管理（新規作成予定）
│       └── uniforms/      # 制服種別管理（新規作成予定）
├── views/
│   ├── store/             # 店舗関連画面（新規作成予定）
│   ├── reservation/       # 予約関連画面（新規作成予定）
│   └── user/
└── types/
    ├── store.ts           # 店舗型定義（新規作成予定）
    ├── reservation.ts     # 採寸予約型定義（新規作成予定）
    ├── timeslot.ts        # 予約枠型定義（新規作成予定）
    └── uniform_type.ts    # 制服種別型定義（新規作成予定）
```

### ディレクトリ命名規則
- **小文字+アンダースコア**: Python関連ディレクトリ (`api/routers/`, `schemas/`)
- **小文字+ハイフン**: フロントエンド関連 (`app/components/`)
- **単数形/複数形**:
  - 複数のモジュールを含むディレクトリ: 複数形 (`routers/`, `schemas/`, `services/`)
  - 設定・システム関連: 単数形 (`system/`, `infra/`)

---

## 技術スタック

詳細な技術仕様は **[TECHNICAL_STACK.md](docs/TECHNICAL_STACK.md)** を参照してください。

### 概要
- **バックエンド**: Python 3.10+ / FastAPI 0.110+
- **フロントエンド**: TypeScript 5+ / Next.js 15+
- **データベース**: PostgreSQL 16+
- **ORM**: SQLAlchemy 2.0+
- **認証**: JWT (python-jose)
- **ストレージ**: MinIO (S3互換)
- **コンテナ**: Docker / Docker Compose

### アーキテクチャ
- RESTful API + SPA (Single Page Application)
- バックエンドとフロントエンドの完全分離
- JWT による認証
- Docker による環境統一

---

## fitReserve 固有の開発ルール

### データモデル設計

#### 論理削除の徹底
すべてのテーブルに `deleted_at` カラムを用意し、物理削除ではなく論理削除を実施します。

```python
class SomeModel(Base):
    __tablename__ = "some_table"
    
    id = Column(Integer, primary_key=True)
    deleted_at = Column(DateTime, nullable=True)  # NULL = 有効
    # ...
```

#### タイムスタンプの自動管理
`created_at` と `updated_at` は自動設定します。

```python
from datetime import datetime
from zoneinfo import ZoneInfo

def jst():
    return datetime.now(ZoneInfo("Asia/Tokyo"))

class SomeModel(Base):
    created_at = Column(DateTime, default=jst, nullable=False)
    updated_at = Column(DateTime, default=jst, onupdate=jst, nullable=False)
```

### API設計

#### エンドポイント命名規則

- `/api/v1/admin/{resource}` - 管理者専用API
- `/api/v1/public/{resource}` - 認証不要API（予約フォームなど）
- `/api/v1/{resource}` - 認証必須API

#### レスポンス形式

```json
{
  "status": "success",
  "data": {},
  "message": "操作が完了しました"
}
```

### プロジェクト固有のビジネスルール

詳細は **[SPECIFICATION.md](docs/SPECIFICATION.md)** の「ビジネスルール」セクションを参照してください。

---

## コーディング規約

基本的なコーディング規約は **[TECHNICAL_STACK.md](docs/TECHNICAL_STACK.md)** を参照してください。

### Python (Backend)

#### 基本方針
- **PEP 8** に準拠
- **型ヒント** を必須とする (Python 3.10+の記法を推奨)
- **文字コード**: UTF-8 (ファイル先頭に `# -*- coding: utf-8 -*-` を記載)

#### 命名規則
| 対象 | 形式 | 例 |
|------|------|------|
| 変数・関数 | snake_case | `user_name`, `get_user_by_id()` |
| クラス | PascalCase | `Users`, `ReservationService` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| プライベート変数・メソッド | `_`プレフィックス | `_internal_method()` |

#### インポート順序
1. 標準ライブラリ
2. サードパーティライブラリ
3. ローカルモジュール

```python
# 標準ライブラリ
import time
from datetime import datetime
from zoneinfo import ZoneInfo

# サードパーティ
from fastapi import FastAPI, Request
from sqlalchemy import Column, Integer, String

# ローカル
from system.db import Base, get_db
from schemas.users import UserResponse
```

#### 関数定義
```python
# 型ヒントを必ず付ける
def get_user_by_id(user_id: int, db: Session) -> Users | None:
    """ユーザーIDからユーザー情報を取得
    
    Args:
        user_id: ユーザーID
        db: データベースセッション
    
    Returns:
        ユーザー情報、存在しない場合はNone
    """
    return db.query(Users).filter(Users.id == user_id).first()
```

#### エラーハンドリング
```python
# 適切な例外クラスを使用
from fastapi import HTTPException, status

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )
    return user
```

### TypeScript (Frontend)

#### 基本方針
- **厳格な型チェック** を有効化 (`strict: true`)
- **any型の使用を禁止** (やむを得ない場合は `unknown` を使用)
- **関数コンポーネント** を優先 (クラスコンポーネントは使用しない)

#### 命名規則
| 対象 | 形式 | 例 |
|------|------|------|
| 変数・関数 | camelCase | `userName`, `fetchUserData()` |
| コンポーネント | PascalCase | `UserProfile`, `ReservationList` |
| 型・インターフェース | PascalCase | `User`, `ReservationData` |
| 定数 | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_ITEMS` |

#### ファイル命名
- **コンポーネント**: `UserProfile.tsx` (PascalCase)
- **ユーティリティ**: `formatDate.ts` (camelCase)
- **型定義**: `types.ts`, `user.types.ts`

---

## データモデル設計ルール

### 基本原則

#### 1. タイムゾーン管理
- すべての日時データは **日本標準時 (JST)** で統一
- `datetime` 型には `ZoneInfo("Asia/Tokyo")` を使用

```python
from datetime import datetime
from zoneinfo import ZoneInfo

def jst():
    return datetime.now(ZoneInfo("Asia/Tokyo"))

class Users(Base):
    created_at = Column(DateTime, default=jst)
    updated_at = Column(DateTime, default=jst, onupdate=jst)
```

#### 2. 論理削除
- すべてのマスターテーブルには `deleted_at` カラムを設ける
- 物理削除は行わず、`deleted_at` に削除日時を記録

```python
class Users(Base):
    deleted_at = Column(DateTime, nullable=True)  # NULL = 未削除
```

#### 3. 監査ログ
- 主要テーブルには以下のカラムを必須とする:
  - `created_at`: 作成日時
  - `updated_at`: 更新日時
  - `deleted_at`: 削除日時 (論理削除用)

### テーブル命名規則

| 種類 | 形式 | 例 |
|------|------|------|
| マスターテーブル | 複数形 | `users`, `channels`, `reservations` |
| リレーションテーブル | `rel_` プレフィックス | `rel_channel_user` |
| 履歴テーブル | `_history` サフィックス | `reservations_history` |

### カラム命名規則

| 種類 | 形式 | 例 |
|------|------|------|
| 主キー | `id` | `id` (Integer, AutoIncrement) |
| 外部キー | `<テーブル名>_id` | `user_id`, `channel_id` |
| 真偽値 | `is_` プレフィックス | `is_enabled`, `is_active` |
| 日時 | `_at` サフィックス | `created_at`, `deleted_at` |

### 予約管理システムのデータモデル設計

#### 想定されるテーブル構成

```python
# 顧客情報（既存のUsersテーブルを流用）
class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    personal_id = Column(String(50), nullable=False, unique=True)
    user_name = Column(String(50), nullable=False)
    name_kana = Column(String(100))
    email = Column(String(100), unique=True)
    password = Column(String(100))
    salt = Column(String(100), nullable=False)
    admin = Column(Boolean, default=False, nullable=False)  # スタッフ・管理者権限
    icon = Column(String(500))
    school_name = Column(String(100))  # 学校名（追加予定）
    grade = Column(Integer)  # 学年（追加予定）
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst)
    updated_at = Column(DateTime, default=jst, onupdate=jst)
    memo = Column(String(800))

# 店舗情報（新規作成予定）
class Stores(Base):
    __tablename__ = "stores"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # 店舗名
    address = Column(String(200))  # 住所
    phone = Column(String(20))  # 電話番号
    capacity = Column(Integer, nullable=False)  # 同時対応可能人数
    description = Column(String(500))  # 店舗説明
    image_url = Column(String(500))  # 店舗画像
    is_enabled = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst)
    updated_at = Column(DateTime, default=jst, onupdate=jst)

# 予約枠設定（新規作成予定）
class TimeSlots(Base):
    __tablename__ = "time_slots"
    id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=月, 1=火, ..., 6=日
    start_time = Column(String(5), nullable=False)  # "09:00"形式
    end_time = Column(String(5), nullable=False)    # "10:00"形式
    is_enabled = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst)
    updated_at = Column(DateTime, default=jst, onupdate=jst)

# 制朏種別マスタ（新規作成予定）
class UniformTypes(Base):
    __tablename__ = "uniform_types"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)  # 制服名（例：学生服、作業服）
    category = Column(String(50))  # カテゴリ（例：学校、企業）
    description = Column(String(500))
    is_enabled = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst)
    updated_at = Column(DateTime, default=jst, onupdate=jst)

# 採寸予約情報（新規作成予定）
class Reservations(Base):
    __tablename__ = "reservations"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    uniform_type_id = Column(Integer, ForeignKey("uniform_types.id"))  # 制朏種別
    reservation_date = Column(DateTime, nullable=False)  # 予約日時
    start_time = Column(String(5), nullable=False)  # 開始時刻
    end_time = Column(String(5), nullable=False)  # 終了時刻
    status = Column(String(20), default="pending", nullable=False)  # pending, confirmed, cancelled
    memo = Column(String(500))  # 備考
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=jst)
    updated_at = Column(DateTime, default=jst, onupdate=jst)
```

**⚠️ 現在のmodels.pyには以下のテーブルが定義されていますが、制朏採寸予約システムでは使用しません:**
- `Channels` - 削除予定
- `RelChannelUser` - 削除予定
- `Manuals` - 削除予定
- `Steps` - 削除予定
- `StepComments` - 削除予定
- `Progress` - 削除予定

### データ型の使用基準

| 用途 | SQLAlchemy型 | 備考 |
|------|--------------|------|
| ID (主キー) | `Integer` | AutoIncrementを使用 |
| 短いテキスト | `String(N)` | N: 最大長を明示 (例: 50, 100) |
| 長いテキスト | `Text` | コメント、説明文など |
| 真偽値 | `Boolean` | デフォルト値を明示 |
| 日時 | `DateTime` | タイムゾーン付き |
| JSON | `JSON` | 構造化データの保存 |

---

## API設計ルール

### RESTful設計原則

#### エンドポイント命名規則（制朏採寸予約システム）

**顧客管理**
```
GET     /api/users              # 顧客一覧取得（管理者のみ）
GET     /api/users/{id}         # 特定顧客取得
POST    /api/users              # 顧客作成（サインアップ）
PUT     /api/users/{id}         # 顧客更新（全体）
PATCH   /api/users/{id}         # 顧客更新（部分）
DELETE  /api/users/{id}         # 顧客削除（論理削除）
```

**店舗管理（実装予定）**
```
GET     /api/stores             # 店舗一覧取得
GET     /api/stores/{id}        # 特定店舗取得
POST    /api/stores             # 店舗作成（管理者のみ）
PUT     /api/stores/{id}        # 店舗更新（管理者のみ）
DELETE  /api/stores/{id}        # 店舗削除（管理者のみ）
```

**採寸予約管理（実装予定）**
```
GET     /api/reservations           # 予約一覧取得
GET     /api/reservations/{id}      # 特定予約取得
POST    /api/reservations           # 採寸予約作成
PUT     /api/reservations/{id}      # 予約更新
DELETE  /api/reservations/{id}      # 予約キャンセル（論理削除）

# 顧客別予約一覧
GET     /api/users/{user_id}/reservations

# 店舗別予約一覧
GET     /api/stores/{store_id}/reservations

# 空き状況確認
GET     /api/stores/{store_id}/availability?date=2026-08-01
```

**制服種別管理（実装予定）**
```
GET     /api/uniform-types      # 制服種別一覧
GET     /api/uniform-types/{id} # 制服種別詳細
POST    /api/uniform-types      # 制服種別作成（管理者）
PUT     /api/uniform-types/{id} # 制服種別更新（管理者）
DELETE  /api/uniform-types/{id} # 制服種別削除（管理者）
```

**認証関連（既存）**
```
POST    /api/auth/login         # ログイン
POST    /api/auth/logout        # ログアウト
POST    /api/auth/refresh       # トークンリフレッシュ
```

- **複数形を使用**: `/api/stores` (単数形 `/api/store` は使用しない)
- **小文字+ハイフン**: `/api/uniform-types` (snake_caseは使用しない)
- **バージョニング**: 将来的に `/api/v1/reservations` のように変更可能

#### HTTPメソッドの使い分け

| メソッド | 用途 | べき等性 | リクエストボディ |
|----------|------|----------|------------------|
| GET | データ取得 | ○ | × |
| POST | データ作成 | × | ○ |
| PUT | データ全体更新 | ○ | ○ |
| PATCH | データ部分更新 | × | ○ |
| DELETE | データ削除 | ○ | × |

### レスポンス形式

#### 成功レスポンス（顧客取得）
```json
{
  "id": 1,
  "user_name": "tanaka_taro",
  "email": "tanaka@example.com",
  "school_name": "○○高等学校",
  "grade": 2,
  "created_at": "2026-08-01T10:00:00+09:00"
}
```

#### 成功レスポンス（店舗一覧）
```json
{
  "data": [
    {
      "id": 1,
      "name": "新宿店",
      "address": "東京都新宿区...",
      "capacity": 5,
      "is_enabled": true
    },
    {
      "id": 2,
      "name": "渋谷店",
      "address": "東京都渋谷区...",
      "capacity": 3,
      "is_enabled": true
    }
  ],
  "total": 2,
  "page": 1,
  "per_page": 20
}
```

#### 成功レスポンス（採寸予約作成）
```json
{
  "id": 101,
  "user_id": 1,
  "store_id": 1,
  "uniform_type_id": 3,
  "reservation_date": "2026-08-05T00:00:00+09:00",
  "start_time": "14:00",
  "end_time": "15:00",
  "status": "confirmed",
  "created_at": "2026-08-01T10:00:00+09:00"
}
```

#### エラーレスポンス
```json
{
  "detail": "ユーザーが見つかりません",
  "error_code": "USER_NOT_FOUND",
  "timestamp": "2026-08-01T10:00:00+09:00"
}
```

### ステータスコード

| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 | OK | データ取得成功 |
| 201 | Created | データ作成成功 |
| 204 | No Content | 削除成功 (レスポンスボディなし) |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | データが存在しない |
| 409 | Conflict | データ競合 (重複など) |
| 500 | Internal Server Error | サーバーエラー |

### ページネーション

クエリパラメータを使用:
```
GET /api/users?page=1&per_page=20&sort=created_at&order=desc
```

- `page`: ページ番号 (デフォルト: 1)
- `per_page`: 1ページあたりの件数 (デフォルト: 20, 最大: 100)
- `sort`: ソート対象カラム
- `order`: ソート順 (`asc` or `desc`)

### フィルタリング

クエリパラメータを使用:

**顧客一覧のフィルタリング**
```
GET /api/users?email=example.com&school_name=○○高校&grade=2
```

**予約一覧のフィルタリング（実装予定）**
```
GET /api/reservations?user_id=1&status=confirmed&date_from=2026-08-01&date_to=2026-08-31
GET /api/reservations?store_id=1&uniform_type_id=3
```

**店舗の空き状況確認（実装予定）**
```
GET /api/stores/1/availability?date=2026-08-05
```

### CORS設定

- 開発環境: `http://localhost:3000` のみ許可
- 本番環境: 環境変数で指定されたオリジンのみ許可

```python
origins = ["http://localhost:3000"]  # 開発環境

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 付録

### 環境変数設定 (`.env`)

バックエンド用の環境変数（`api/.env`）:

```bash
# データベース接続
user_name=your_db_user
password=your_db_password
host=localhost:3306
database_name=fitreserve_db
sql=mysql+pymysql
USE_SSL=false

# JWT認証（実装予定）
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# MinIO設定（画像保存用）
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fitreserve
```

フロントエンド用の環境変数（`app/.env.local`）:

```bash
# APIエンドポイント
NEXT_PUBLIC_API_URL=http://localhost:8000

# MinIO
NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000
```

### 開発コマンド

#### Docker環境での起動

```bash
# コンテナのビルドと起動
docker-compose up -d --build

# ログ確認
docker-compose logs -f

# コンテナの停止
docker-compose down

# データベースに接続
docker exec -it db bash
mysql -u user -h 127.0.0.1 -D fitreserve_db -p
```

#### ローカル開発（Docker未使用）

```bash
# バックエンド起動
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# フロントエンド起動
cd app
bun install
bun run dev

# API ドキュメント確認
# http://localhost:8000/docs
```

#### テスト実行（今後実装）

```bash
# バックエンドテスト
cd api
pytest tests/

# フロントエンドテスト
cd app
bun test
```

### 開発の進め方

1. **不要なファイルの削除**
   - マニュアル管理システムの残骸を削除
   - `routers/generic/manual.py`, `step.py`, `progress.py` など

2. **データモデルの作成**
   - `models.py` から不要なモデル削除
   - 制服採寸予約システム用のモデル追加
     - `Stores` (店舗)
     - `TimeSlots` (予約枠)
     - `UniformTypes` (制服種別)
     - `Reservations` (採寸予約)

3. **API実装**
   - 店舗管理API作成（`routers/admin/store.py`）
   - 採寸予約管理API作成（`routers/public/reservation.py`）
   - 制服種別管理API作成（`routers/admin/uniform_type.py`）

4. **フロントエンド実装**
   - 店舗一覧・詳細画面
   - 採寸予約作成・管理画面
   - 顧客マイページ
   - 管理者画面

---

**最終更新日**: 2026-08-01
**プロジェクト名**: fitReserve
**ステータス**: 開発準備中（制服採寸予約システムへの移行・整理フェーズ）
