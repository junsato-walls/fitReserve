# fitReserve - 制服採寸予約管理システム

制服販売会社向けの採寸予約を管理するWebアプリケーション

---

## � ドキュメント

- **[SPECIFICATION.md](docs/SPECIFICATION.md)** - システム仕様書（機能要件・ビジネスルール）
- **[TECHNICAL_STACK.md](docs/TECHNICAL_STACK.md)** - 技術スタック仕様（汎用的な技術仕様）
- **[DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md)** - データベース設計書
- **[POSTGRESQL_MIGRATION.md](docs/POSTGRESQL_MIGRATION.md)** - PostgreSQL移行ガイド
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - 開発ガイドライン

---

## 📋 概要

fitReserveは、制服販売会社における採寸予約を効率的に管理するためのシステムです。
店舗での採寸予約、オンライン予約受付、予約状況の一元管理を実現します。

詳細な機能仕様は **[SPECIFICATION.md](docs/SPECIFICATION.md)** を参照してください。

### 主な機能

- **採寸予約管理**: 予約の新規登録、確認、変更、キャンセル
- **店舗管理**: 店舗情報、営業時間、予約枠設定
- **学校管理**: 取り扱い学校の情報管理
- **プロジェクト管理**: キャンペーン期間ごとの予約受付管理
- **スケジュール管理**: 店舗ごとの予約可能枠設定
- **ユーザー管理**: スタッフアカウント管理（管理者/スタッフ/閲覧専用）

---

## 🚀 技術スタック

詳細な技術仕様は **[TECHNICAL_STACK.md](docs/TECHNICAL_STACK.md)** を参照してください。

### 概要

- **バックエンド**: Python 3.10+ / FastAPI 0.110+
- **フロントエンド**: TypeScript 5+ / Next.js 15+ (App Router)
- **データベース**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **認証**: JWT (python-jose)
- **ストレージ**: MinIO (S3互換)
- **コンテナ**: Docker / Docker Compose

---

## 🛠️ セットアップ

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd fitReserve
```

### 2. 環境変数の設定

```bash
# .env.example をコピー
cp .env.example .env

# 必要に応じて .env を編集
```

### 3. Docker環境の起動

```bash
# コンテナのビルドと起動
docker-compose up -d --build

# ログ確認
docker-compose logs -f
```

### 3. アクセス

- **フロントエンド**: http://localhost:3000
- **API ドキュメント**: http://localhost:8000/docs
- **MinIO コンソール**: http://localhost:9001
  - ユーザー: `minioadmin`
  - パスワード: `minioadmin`
- **データベース (PostgreSQL)**: localhost:5432
  - データベース: `fitreserve_db`
  - ユーザー: `fitreserve_user`
  - パスワード: `password`

---

## 📂 プロジェクト構造

```
fitReserve/
├── api/              # FastAPI バックエンド
│   ├── main.py       # エントリーポイント
│   ├── routers/      # APIエンドポイント
│   ├── schemas/      # Pydanticスキーマ
│   └── system/       # DB接続、認証など
├── app/              # Next.js フロントエンド
│   └── src/
│       ├── app/      # App Router
│       ├── components/ # Reactコンポーネント
│       └── lib/      # ユーティリティ
├── docker/           # Dockerファイル
└── DEVELOPMENT.md    # 開発ガイドライン
```

詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

---

## 🔧 開発コマンド

### Docker環境

```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# ログ確認
docker-compose logs -f api
docker-compose logs -f front

# データベース接続
docker exec -it db bash
mysql -u user -h 127.0.0.1 -D fitreserve_db -p
```

### ローカル開発（Docker未使用）

```bash
# バックエンド
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# フロントエンド
cd app
bun install
bun run dev
```

---

## 📖 API仕様

### 認証
```
POST   /api/auth/login     # ログイン
POST   /api/auth/logout    # ログアウト
```

### ユーザー管理
```
GET    /api/users          # ユーザー一覧（管理者のみ）
GET    /api/users/{id}     # ユーザー詳細
POST   /api/users          # ユーザー作成
PUT    /api/users/{id}     # ユーザー更新
DELETE /api/users/{id}     # ユーザー削除
```

### 店舗管理（実装予定）
```
GET    /api/stores             # 店舗一覧
GET    /api/stores/{id}        # 店舗詳細
POST   /api/stores             # 店舗作成（管理者）
PUT    /api/stores/{id}        # 店舗更新（管理者）
DELETE /api/stores/{id}        # 店舗削除（管理者）
```

### 採寸予約管理（実装予定）
```
GET    /api/reservations           # 予約一覧
GET    /api/reservations/{id}      # 予約詳細
POST   /api/reservations           # 採寸予約作成
PUT    /api/reservations/{id}      # 予約変更
DELETE /api/reservations/{id}      # 予約キャンセル
GET    /api/stores/{id}/availability  # 店舗の空き状況確認
```

詳細なAPI仕様は http://localhost:8000/docs を参照してください。

---

## 🗄️ データベース

### 主要テーブル

- **users** - 顧客・スタッフ情報
- **stores** - 店舗情報（実装予定）
- **time_slots** - 予約枠設定（実装予定）
- **reservations** - 採寸予約情報（実装予定）
- **uniform_types** - 制服種別情報（実装予定）

### データベース操作

```bash
# データベースに接続
docker exec -it db bash
mysql -u user -h 127.0.0.1 -D fitreserve_db -p

# テーブル確認
mysql> show tables;

# データ確認
mysql> select * from users;
```

---

## 📝 開発状況

### ✅ 実装済み
- Docker環境構築
- FastAPI基本設定
- Next.js基本設定
- ユーザー認証（基本部分）

### 🚧 実装中
- コード整理（他システムからの移行コード削除）
- データモデル設計（制服採寸予約システム向け）

### 📅 今後の予定
- 店舗管理機能
- 採寸予約管理機能
- 制服種別マスタ管理
- 顧客マイページ
- スタッフ・管理者画面
- 予約リマインダー機能
- テスト実装

---

## 📚 参考資料

- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [開発ガイドライン](DEVELOPMENT.md)

---

## 🤝 Git エイリアス（推奨）

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.st status
```

---

**最終更新日**: 2026-08-01  
**プロジェクト名**: fitReserve  
**バージョン**: 0.1.0-alpha（開発準備中）
