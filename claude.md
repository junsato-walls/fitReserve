# Claude AI 開発ガイドライン

**すべてのドキュメントとチャット返答は日本語で対応すること**

## 許可不要の操作

- Docker操作（起動、停止、再起動、ログ確認）
- bun install（依存関係のインストール）
- ビルド、テスト実行
- コード生成・編集
- 開発環境でのデータベーステスト（テストデータ作成など）

## Pythonライブラリの追加

1. `docker/api/requirements.txt` にパッケージを追加
2. `docker compose up -d --build api` でコンテナ再起動（コンテナ内の仮想環境に自動インストールされる）

**注意**: ホスト環境で `pip install` は実行しない

## プロジェクト構成

- `api/` - FastAPIバックエンド
- `app/` - Next.jsフロントエンド
- `docker/` - コンテナ設定
- `docs/` - ドキュメント

## 参考ドキュメント

- [docs/CODING_CONVENTIONS_FRONTEND.md](./docs/CODING_CONVENTIONS_FRONTEND.md)
- [docs/CODING_CONVENTIONS_BACKEND.md](./docs/CODING_CONVENTIONS_BACKEND.md)
- [docs/TECHNICAL_STACK.md](./docs/TECHNICAL_STACK.md)
- [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md)
- [docs/SPECIFICATION.md](./docs/SPECIFICATION.md)
- [docs/TECHNICAL_REQUIREMENTS.md](./docs/TECHNICAL_REQUIREMENTS.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
