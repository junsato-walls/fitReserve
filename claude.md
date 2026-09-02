# Claude AI 開発ガイドライン

fitReserveプロジェクトでClaude AIを活用するための最小限のガイド。

## 基本ルール

**すべてのドキュメントとチャット返答は日本語で対応すること**

### 許可不要の操作

以下の操作は確認なしで実行可能：

- Docker操作（起動、停止、再起動、ログ確認）
- bun install（依存関係のインストール）
- ビルド、テスト実行
- コード生成・編集
- 開発環境でのデータベーステスト（テストデータ作成など）

### Pythonライブラリの追加

Pythonライブラリが必要な場合：

1. `docker/api/requirements.txt` にパッケージを追加
2. Dockerコンテナを再起動（`docker compose restart api` または `docker compose up -d --build api`）
3. コンテナ内の仮想環境に自動インストールされる

**注意**: ホスト環境で `pip install` は実行しない

## プロジェクト構成

- `api/` - FastAPIバックエンド
- `app/` - Next.jsフロントエンド
- `docker/` - コンテナ設定
- `docs/` - ドキュメント

## 依頼例

```
api/router/admin/配下に[機能名]エンドポイントを作成
- 既存パターンに従う（router → usecase → repository の層構成）
- スキーマはapi/schema/に作成
```

```
app/src/views/配下に[画面名]コンポーネントを作成
- app/src/components/base/ の自作コンポーネントを使用（外部UIライブラリは使わない）
- TypeScript型定義含む
```

## 参考ドキュメント

- **[CODING_CONVENTIONS_FRONTEND.md](./docs/CODING_CONVENTIONS_FRONTEND.md)** - フロントエンド コーディング規約（TypeScript, React, Next.js）
- **[CODING_CONVENTIONS_BACKEND.md](./docs/CODING_CONVENTIONS_BACKEND.md)** - バックエンド コーディング規約（Python, FastAPI）
- **[TECHNICAL_STACK.md](./docs/TECHNICAL_STACK.md)** - 技術スタック仕様書（FastAPI, Next.js, PostgreSQL）
- **[DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)** - データベース設計書（テーブル定義、ER図）
- **[SPECIFICATION.md](./docs/SPECIFICATION.md)** - システム仕様書（機能要件、画面仕様）
- **[TECHNICAL_REQUIREMENTS.md](./docs/TECHNICAL_REQUIREMENTS.md)** - 技術要件書（非機能要件）
- **[POSTGRESQL_MIGRATION.md](./docs/POSTGRESQL_MIGRATION.md)** - PostgreSQL移行ガイド
- **[SCHEMA_MIGRATION_PLAN.md](./docs/SCHEMA_MIGRATION_PLAN.md)** - スキーマ修正計画書
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 開発環境セットアップ手順
