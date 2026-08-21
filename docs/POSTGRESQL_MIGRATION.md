# PostgreSQL移行ガイド

fitReserve システムの MySQL から PostgreSQL への移行手順

**移行日**: 2026-08-01  
**対象バージョン**: PostgreSQL 16

---

## 移行概要

### 変更理由

1. **標準SQL準拠**: PostgreSQLはより標準SQLに準拠しており、将来の拡張性が高い
2. **高度な機能**: Window Functions、CTE、JSONB型など、高度な機能が利用可能
3. **パフォーマンス**: 大規模データでの優れたパフォーマンス
4. **ライセンス**: オープンソースで商用利用に制限がない
5. **エンタープライズ対応**: 大規模システムでの実績が豊富

### 主な変更点

| 項目 | MySQL | PostgreSQL |
|------|-------|------------|
| DBMS | MySQL 8.0 | PostgreSQL 16 |
| ポート | 3306 | 5432 |
| 接続ドライバ | mysqlclient / pymysql | psycopg2-binary |
| 自動増分 | AUTO_INCREMENT | SERIAL |
| 文字列型 | VARCHAR(N) | VARCHAR(N) |
| テキスト型 | TEXT | TEXT |
| 真偽値型 | TINYINT(1) | BOOLEAN |
| 列挙型 | ENUM | VARCHAR + CHECK制約 |
| JSON型 | JSON | JSONB |
| 日時型 | DATETIME | TIMESTAMP |

---

## 移行手順

### 1. 環境変数の更新

**.env ファイルの作成**:
```bash
# .env.example をコピー
cp .env.example .env

# .env を編集
DB_USER=fitreserve_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitreserve_db
```

### 2. Docker Composeの確認

**docker-compose.yml** が以下のように更新されていることを確認:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: fitreserve_db
    environment:
      POSTGRES_DB: fitreserve_db
      POSTGRES_USER: fitreserve_user
      POSTGRES_PASSWORD: password
      TZ: Asia/Tokyo
      PGTZ: Asia/Tokyo
    ports:
      - "5432:5432"
    volumes:
      - ./docker/postgres/initdb.d:/docker-entrypoint-initdb.d
      - postgres_data:/var/lib/postgresql/data
```

### 3. 依存パッケージの更新

**requirements.txt** が以下を含むことを確認:

```txt
psycopg2-binary==2.9.9
sqlalchemy==2.0.31
```

削除された依存:
```txt
- mysqlclient==2.2.4
- pymysql
```

### 4. データベース接続設定の確認

**api/system/db.py** が PostgreSQL 用に更新されていることを確認:

```python
# PostgreSQL接続URL
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# コネクションプール設定
ENGINE = create_engine(
    DATABASE_URL,
    connect_args=ssl_args if USE_SSL else {},
    echo=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### 5. スキーマファイルの配置

以下のSQLファイルが作成されていることを確認:

- `docker/postgres/initdb.d/01_schema.sql` - テーブル定義
- `docker/postgres/initdb.d/02_testdata.sql` - 初期データ

### 6. コンテナの起動

```bash
# 既存のコンテナを停止・削除
docker-compose down -v

# 新しいコンテナをビルド・起動
docker-compose up -d --build

# ログ確認
docker-compose logs -f db
```

### 7. データベース接続確認

**PostgreSQL コンテナに接続**:
```bash
docker exec -it fitreserve_db psql -U fitreserve_user -d fitreserve_db
```

**テーブル確認**:
```sql
-- データベース一覧
\l

-- テーブル一覧
\dt

-- 特定テーブルの構造確認
\d users
\d stores
\d schools
\d projects
\d reservations
\d schedules

-- データ確認
SELECT * FROM stores;
SELECT * FROM users;
SELECT * FROM projects;
```

**接続終了**:
```sql
\q
```

### 8. API動作確認

**ヘルスチェック**:
```bash
curl http://localhost:8000/health
```

**Swagger UIでAPI確認**:
- ブラウザで http://localhost:8000/docs にアクセス

---

## SQLAlchemy モデルの移行対応

### 主な変更点

#### 1. AUTO_INCREMENT → SERIAL

**MySQL**:
```python
id = Column(Integer, primary_key=True, autoincrement=True)
```

**PostgreSQL** (変更不要):
```python
id = Column(Integer, primary_key=True)  # SERIAL型として自動認識
```

#### 2. ENUM型の扱い

**MySQL**:
```python
from sqlalchemy import Enum

role = Column(Enum('admin', 'staff', 'readonly'), nullable=False)
```

**PostgreSQL** (CHECK制約を使用):
```python
role = Column(
    String(20), 
    nullable=False, 
    default='readonly',
    # PostgreSQL側でCHECK制約を定義（schema.sqlに記載）
)
```

**schema.sql での定義**:
```sql
CREATE TABLE users (
    role VARCHAR(20) NOT NULL DEFAULT 'readonly' 
        CHECK (role IN ('admin', 'staff', 'readonly')),
    ...
);
```

#### 3. JSON型

**MySQL**:
```python
from sqlalchemy import JSON

data = Column(JSON)
```

**PostgreSQL** (JSONB推奨):
```python
from sqlalchemy.dialects.postgresql import JSONB

data = Column(JSONB)  # より高速なインデックス付きJSON
```

#### 4. DATETIME → TIMESTAMP

**MySQL**:
```python
created_at = Column(DateTime, default=jst)
```

**PostgreSQL** (変更不要):
```python
created_at = Column(DateTime, default=jst)  # TIMESTAMP型として扱われる
```

#### 5. トリガーによる updated_at 自動更新

**PostgreSQL トリガー関数** (schema.sql に記載):
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**SQLAlchemy 側** (変更不要):
```python
updated_at = Column(DateTime, default=jst, onupdate=jst)
```

---

## データ型マッピング一覧

| 用途 | MySQL型 | PostgreSQL型 | SQLAlchemy型 |
|------|---------|--------------|--------------|
| 整数 | INT | INTEGER | Integer |
| 自動増分ID | INT AUTO_INCREMENT | SERIAL | Integer (primary_key=True) |
| 文字列(短) | VARCHAR(N) | VARCHAR(N) | String(N) |
| 文字列(長) | TEXT | TEXT | Text |
| 真偽値 | TINYINT(1) | BOOLEAN | Boolean |
| 日付 | DATE | DATE | Date |
| 時刻 | TIME | TIME | Time |
| 日時 | DATETIME | TIMESTAMP | DateTime |
| 小数 | DECIMAL(M,D) | NUMERIC(M,D) | Numeric(M,D) |
| JSON | JSON | JSONB | JSONB (PostgreSQL方言) |

---

## トラブルシューティング

### 問題1: コンテナが起動しない

**原因**: ポート5432が既に使用されている

**解決策**:
```bash
# 使用中のポートを確認
netstat -ano | findstr :5432

# ポートを使用しているプロセスを終了するか、
# docker-compose.yml でポートを変更
ports:
  - "15432:5432"  # 別のポートにマッピング
```

### 問題2: データベース接続エラー

**エラーメッセージ**:
```
could not connect to server: Connection refused
```

**解決策**:
```bash
# データベースコンテナのログを確認
docker-compose logs db

# コンテナが正常に起動しているか確認
docker-compose ps

# データベースを再起動
docker-compose restart db
```

### 問題3: テーブルが作成されない

**原因**: initdb.d のSQLスクリプトが実行されていない

**解決策**:
```bash
# ボリュームを完全に削除して再作成
docker-compose down -v
docker volume prune -f

# 再度起動
docker-compose up -d --build

# 初期化ログを確認
docker-compose logs db | grep -i "CREATE TABLE"
```

### 問題4: 文字コードエラー

**エラーメッセージ**:
```
invalid byte sequence for encoding "UTF8"
```

**解決策**:
```sql
-- データベースの文字コード確認
SHOW SERVER_ENCODING;

-- 必要に応じてデータベースを再作成
DROP DATABASE IF EXISTS fitreserve_db;
CREATE DATABASE fitreserve_db
WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'ja_JP.UTF-8'
    LC_CTYPE = 'ja_JP.UTF-8';
```

### 問題5: タイムゾーンの不一致

**原因**: PostgreSQL のタイムゾーン設定がJSTになっていない

**解決策**:
```sql
-- 現在のタイムゾーン確認
SHOW timezone;

-- タイムゾーンをJSTに設定
SET timezone = 'Asia/Tokyo';

-- 永続化する場合は docker-compose.yml で設定
environment:
  TZ: Asia/Tokyo
  PGTZ: Asia/Tokyo
```

---

## パフォーマンス最適化

### 1. コネクションプール設定

**db.py**:
```python
ENGINE = create_engine(
    DATABASE_URL,
    pool_size=10,          # 常時維持する接続数
    max_overflow=20,       # 追加で作成できる接続数
    pool_pre_ping=True,    # 接続前に疎通確認
    pool_recycle=3600      # 1時間で接続をリサイクル
)
```

### 2. インデックスの活用

**頻繁に検索されるカラムにインデックスを作成**:
```sql
-- 予約検索の高速化
CREATE INDEX idx_reservations_search 
ON reservations(store_id, reservation_date, status, deleted_at);

-- 複合インデックス（WHERE句の順序に合わせる）
CREATE INDEX idx_reservations_store_date 
ON reservations(store_id, reservation_date, reservation_time);
```

### 3. EXPLAIN ANALYZE の活用

**クエリのパフォーマンス分析**:
```sql
EXPLAIN ANALYZE
SELECT * FROM reservations 
WHERE store_id = 1 
  AND reservation_date = '2026-08-05'
  AND deleted_at IS NULL;
```

---

## バックアップ・リストア

### バックアップ

**論理バックアップ (pg_dump)**:
```bash
# SQL形式（テキスト）
docker exec fitreserve_db pg_dump -U fitreserve_user fitreserve_db > backup_$(date +%Y%m%d).sql

# カスタム形式（圧縮・高速リストア）
docker exec fitreserve_db pg_dump -U fitreserve_user -Fc fitreserve_db > backup_$(date +%Y%m%d).dump
```

### リストア

**SQL形式からリストア**:
```bash
# データベースを再作成
docker exec -it fitreserve_db psql -U fitreserve_user -c "DROP DATABASE IF EXISTS fitreserve_db;"
docker exec -it fitreserve_db psql -U fitreserve_user -c "CREATE DATABASE fitreserve_db;"

# リストア実行
docker exec -i fitreserve_db psql -U fitreserve_user fitreserve_db < backup_20260801.sql
```

**カスタム形式からリストア**:
```bash
docker exec -i fitreserve_db pg_restore -U fitreserve_user -d fitreserve_db backup_20260801.dump
```

---

## 参考資料

### 公式ドキュメント
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [SQLAlchemy 2.0 Documentation](https://docs.sqlalchemy.org/en/20/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)

### 移行ガイド
- [MySQL to PostgreSQL Migration](https://wiki.postgresql.org/wiki/Converting_from_other_Databases_to_PostgreSQL#MySQL)
- [SQLAlchemy PostgreSQL Dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)

---

**最終更新日**: 2026-08-01  
**作成者**: システム開発チーム
