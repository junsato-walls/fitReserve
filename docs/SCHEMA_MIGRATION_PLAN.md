# schema.sql 修正計画書

制服販売会社の採寸予約管理システムへの移行計画

**作成日**: 2026-08-01  
**対象ファイル**: `docker/mysql/initdb.d/schema.sql`

---

## 目次
1. [修正概要](#修正概要)
2. [削除対象テーブル](#削除対象テーブル)
3. [既存テーブルの修正](#既存テーブルの修正)
4. [新規追加テーブル](#新規追加テーブル)
5. [実装手順](#実装手順)

---

## 修正概要

### 現状
- マニュアル管理システム用のテーブル構成
- 7テーブル: users, channels, rel_channel_user, manuals, steps, step_comments, progress

### 変更後
- 制服販売会社の採寸予約システム用のテーブル構成
- 8テーブル: users, stores, schools, projects, project_stores, project_schools, reservations, schedules

### 影響範囲
- **削除**: 6テーブル(channels, rel_channel_user, manuals, steps, step_comments, progress)
- **修正**: 1テーブル(users)
- **新規追加**: 7テーブル(stores, schools, projects, project_stores, project_schools, reservations, schedules)

---

## 削除対象テーブル

以下のテーブルは制服採寸予約システムでは使用しないため、削除します。

### 1. channels
- **理由**: チャンネル機能は不要
- **影響**: rel_channel_user, manuals も連動して削除

### 2. rel_channel_user
- **理由**: チャンネルとユーザーの関連テーブルは不要
- **影響**: なし

### 3. manuals
- **理由**: マニュアル機能は不要
- **影響**: steps も連動して削除

### 4. steps
- **理由**: ステップ機能は不要
- **影響**: step_comments, progress も連動して削除

### 5. step_comments
- **理由**: ステップコメント機能は不要
- **影響**: なし

### 6. progress
- **理由**: 進捗管理機能は不要
- **影響**: なし

---

## 既存テーブルの修正

### users テーブル

#### 修正内容

**削除するカラム**:
- なし（既存カラムは互換性のため残す）

**追加するカラム**:
```sql
role ENUM('admin', 'staff', 'readonly') NOT NULL DEFAULT 'readonly' AFTER admin,
store_id INT NULL AFTER role,
is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER store_id
```

**変更するカラム**:
```sql
-- admin カラムは残すが、新しいroleカラムを推奨
-- 互換性のため admin は残す（将来的に非推奨）
```

**追加する制約**:
```sql
-- 外部キー制約
ALTER TABLE users ADD CONSTRAINT fk_users_store_id 
FOREIGN KEY (store_id) REFERENCES stores(id);

-- インデックス
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

#### 修正理由
- **role**: より詳細な権限管理のため（admin, staff, readonly）
- **store_id**: ユーザーの所属店舗を管理
- **is_active**: アカウントの有効/無効を明示的に管理

---

## 新規追加テーブル

### 1. stores（店舗マスタ）

```sql
CREATE TABLE stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_code VARCHAR(20) NOT NULL UNIQUE COMMENT '店舗コード',
    name VARCHAR(100) NOT NULL COMMENT '店舗名',
    name_kana VARCHAR(100) COMMENT '店舗名（カナ）',
    postal_code VARCHAR(10) COMMENT '郵便番号',
    address VARCHAR(200) COMMENT '住所',
    phone VARCHAR(20) COMMENT '電話番号',
    email VARCHAR(100) COMMENT 'メールアドレス',
    capacity INT NOT NULL DEFAULT 1 COMMENT '同時対応可能人数',
    business_hours_start TIME COMMENT '営業開始時間',
    business_hours_end TIME COMMENT '営業終了時間',
    regular_holiday VARCHAR(100) COMMENT '定休日',
    description VARCHAR(500) COMMENT '店舗説明',
    image_url VARCHAR(500) COMMENT '店舗画像URL',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '有効フラグ',
    deleted_at DATETIME COMMENT '論理削除日時',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_stores_code (store_code),
    INDEX idx_stores_enabled (is_enabled, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店舗マスタ';
```

### 2. schools（学校マスタ）

```sql
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_code VARCHAR(20) NOT NULL UNIQUE COMMENT '学校コード',
    name VARCHAR(100) NOT NULL COMMENT '学校名',
    name_kana VARCHAR(100) COMMENT '学校名（カナ）',
    school_type ENUM('elementary', 'junior_high', 'high', 'other') NOT NULL COMMENT '学校区分',
    postal_code VARCHAR(10) COMMENT '郵便番号',
    address VARCHAR(200) COMMENT '住所',
    phone VARCHAR(20) COMMENT '電話番号',
    description VARCHAR(500) COMMENT '備考',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '有効フラグ',
    deleted_at DATETIME COMMENT '論理削除日時',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_schools_code (school_code),
    INDEX idx_schools_type (school_type),
    INDEX idx_schools_enabled (is_enabled, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学校マスタ';
```

### 3. projects（プロジェクトテーブル）

```sql
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'プロジェクトコード',
    name VARCHAR(100) NOT NULL COMMENT 'プロジェクト名',
    description VARCHAR(500) COMMENT 'プロジェクト説明',
    start_date DATE NOT NULL COMMENT '開始日',
    end_date DATE NOT NULL COMMENT '終了日',

    reservation_interval INT NOT NULL DEFAULT 30 COMMENT '予約時間間隔（分）',
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '有効フラグ',
    created_by INT NOT NULL COMMENT '作成者',
    updated_by INT NOT NULL COMMENT '更新者',
    deleted_at DATETIME COMMENT '論理削除日時',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_projects_code (project_code),
    INDEX idx_projects_period (start_date, end_date),
    INDEX idx_projects_enabled (is_enabled, deleted_at),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='プロジェクトテーブル';
```

**reservation_interval の説明**:
- 顧客が予約画面で表示される時間枠の間隔を制御
- 値は分単位で設定（20, 30, 60など）
- 例: `reservation_interval = 30` の場合、9:00, 9:30, 10:00... のように30分ごとに予約枠が表示される

### 3-2. project_stores（プロジェクト店舗関連テーブル）

```sql
CREATE TABLE project_stores (
    project_id INT NOT NULL COMMENT 'プロジェクトID',
    store_id INT NOT NULL COMMENT '店舗ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (project_id, store_id),
    INDEX idx_project_stores_store (store_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='プロジェクト店舗関連テーブル';
```

**運用ルール**:
- このテーブルにレコードが存在しない場合、そのプロジェクトは全店舗が対象
- 特定店舗のみに限定する場合のみレコードを登録
- プロジェクト削除時は関連レコードも自動削除（ON DELETE CASCADE）
### 3-3. project_schools(プロジェクト学校関連テーブル)

```sql
CREATE TABLE project_schools (
    project_id INT NOT NULL COMMENT 'プロジェクトID',
    school_id INT NOT NULL COMMENT '学校ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    PRIMARY KEY (project_id, school_id),
    INDEX idx_project_schools_school (school_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='プロジェクト学校関連テーブル';
```

**運用ルール**:
- このテーブルにレコードが存在しない場合、そのプロジェクトは全学校が対象
- 特定学校のみに限定する場合のみレコードを登録
- プロジェクト削除時は関連レコードも自動削除(ON DELETE CASCADE)
### 4. reservations（予約テーブル）

```sql
CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_number VARCHAR(30) NOT NULL UNIQUE COMMENT '予約番号',
    project_id INT COMMENT 'プロジェクトID',
    store_id INT NOT NULL COMMENT '店舗ID',
    school_id INT NOT NULL COMMENT '学校ID',
    reservation_date DATE NOT NULL COMMENT '予約日',
    reservation_time TIME NOT NULL COMMENT '予約時刻',
    customer_name VARCHAR(100) NOT NULL COMMENT 'お客様氏名',
    customer_name_kana VARCHAR(100) COMMENT 'お客様氏名（カナ）',
    gender ENUM('male', 'female', 'other') NOT NULL COMMENT '性別',
    grade INT COMMENT '学年',
    height DECIMAL(5,2) COMMENT '身長（cm）',
    weight DECIMAL(5,2) COMMENT '体重（kg）',
    foot_size DECIMAL(4,1) COMMENT '足のサイズ（cm）',
    phone VARCHAR(20) NOT NULL COMMENT '連絡先電話番号',
    email VARCHAR(100) COMMENT 'メールアドレス',
    guardian_name VARCHAR(100) COMMENT '保護者氏名',
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '予約ステータス',
    memo VARCHAR(800) COMMENT '備考',
    created_by INT COMMENT '作成者',
    updated_by INT COMMENT '更新者',
    deleted_at DATETIME COMMENT '論理削除日時',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_reservations_number (reservation_number),
    INDEX idx_reservations_project (project_id),
    INDEX idx_reservations_store_date (store_id, reservation_date, reservation_time),
    INDEX idx_reservations_school (school_id),
    INDEX idx_reservations_phone (phone),
    INDEX idx_reservations_status (status),
    INDEX idx_reservations_search (store_id, reservation_date, status, deleted_at),
    INDEX idx_reservations_created (created_at),
    INDEX idx_reservations_deleted (deleted_at),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='予約テーブル';
```

### 5. schedules（スケジュールテーブル）

```sql
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL COMMENT '店舗ID',
    schedule_date DATE NOT NULL COMMENT 'スケジュール日',
    start_time TIME NOT NULL COMMENT '開始時刻',
    end_time TIME NOT NULL COMMENT '終了時刻',
    capacity INT NOT NULL DEFAULT 1 COMMENT '予約可能枠数',
    reserved_count INT NOT NULL DEFAULT 0 COMMENT '予約済み件数',
    is_available BOOLEAN NOT NULL DEFAULT TRUE COMMENT '予約可能フラグ',
    memo VARCHAR(500) COMMENT '備考',
    created_by INT NOT NULL COMMENT '作成者',
    updated_by INT NOT NULL COMMENT '更新者',
    deleted_at DATETIME COMMENT '論理削除日時',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    UNIQUE KEY uk_schedules (store_id, schedule_date, start_time),
    INDEX idx_schedules_date (schedule_date, is_available),
    INDEX idx_schedules_availability (store_id, schedule_date, is_available, deleted_at),
    INDEX idx_schedules_deleted (deleted_at),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='スケジュールテーブル';
```

---

## 実装手順

### Step 1: バックアップ
```bash
# 現在のschema.sqlをバックアップ
cp docker/mysql/initdb.d/schema.sql docker/mysql/initdb.d/schema.sql.backup
```

### Step 2: 新しいschema.sqlの作成
1. 既存の不要なテーブル定義を削除
2. usersテーブルの定義を修正
3. 新規テーブルの定義を追加

### Step 3: テーブル作成順序
```
1. users（既存を修正）
2. stores（新規）
3. schools（新規）
4. projects（新規、usersに依存）
5. project_stores（新規、projects/storesに依存）
6. project_schools（新規、projects/schoolsに依存）
7. reservations（新規、projects/stores/schools/usersに依存）
8. schedules（新規、stores/usersに依存）
```

### Step 4: 初期データの準備（testdata.sql）
```sql
-- 管理者ユーザー
INSERT INTO users ...

-- 店舗マスタ
INSERT INTO stores ...

-- 学校マスタ
INSERT INTO schools ...

-- テストプロジェクト
INSERT INTO projects ...

-- テストスケジュール
INSERT INTO schedules ...
```

### Step 5: 検証
```bash
# Dockerコンテナを再ビルド
docker-compose down -v
docker-compose up -d --build

# データベース接続確認
docker exec -it db bash
mysql -u user -p -D fitreserve_db

# テーブル確認
SHOW TABLES;
DESCRIBE users;
DESCRIBE stores;
DESCRIBE schools;
DESCRIBE projects;
DESCRIBE reservations;
DESCRIBE schedules;
```

---

## 注意事項

### 1. 外部キー制約の順序
- テーブル作成時は依存関係に注意
- 外部キー制約は参照先テーブルが存在してから設定

### 2. データ移行
- 既存のusersテーブルのデータは保持可能
- 新しいカラム（role, store_id, is_active）はデフォルト値を設定

### 3. インデックス設計
- よく検索される条件に合わせてインデックスを作成
- 複合インデックスは検索条件の順序を考慮

### 4. 文字コード
- utf8mb4を使用（絵文字対応）
- COLLATE utf8mb4_unicode_ci を推奨

### 5. タイムゾーン
- MySQLのタイムゾーンをJST（Asia/Tokyo）に設定
- アプリケーション側でも統一

---

## チェックリスト

### 実装前
- [ ] DATABASE_DESIGN.md の確認
- [ ] 既存のschema.sqlのバックアップ
- [ ] 依存関係の確認

### 実装中
- [ ] 不要なテーブル定義の削除
- [ ] usersテーブルの修正
- [ ] storesテーブルの追加
- [ ] schoolsテーブルの追加
- [ ] projectsテーブルの追加
- [ ] project_storesテーブルの追加
- [ ] project_schoolsテーブルの追加
- [ ] reservationsテーブルの追加
- [ ] schedulesテーブルの追加

### 実装後
- [ ] 構文エラーのチェック
- [ ] テーブル作成の確認
- [ ] 外部キー制約の確認
- [ ] インデックスの確認
- [ ] 初期データの投入確認

---

## 次のステップ

1. **schema.sqlの修正実装**
   - 本計画書に基づいてschema.sqlを書き換え

2. **testdata.sqlの作成**
   - テスト用の初期データを作成

3. **models.pyの修正**
   - SQLAlchemyのモデル定義を新しいスキーマに合わせて修正

4. **APIの実装**
   - 新しいテーブルに対応したCRUD APIの実装

---

**最終更新日**: 2026-08-01  
**作成者**: システム開発チーム  
**承認者**: （未承認）
