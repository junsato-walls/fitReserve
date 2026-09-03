# fitReserve - データベース設計書

制服販売会社の採寸予約管理システム

**作成日**: 2026-08-01  
**最終更新**: 2026-08-28  
**バージョン**: 1.1.0

---

## 目次
1. [ER図概要](#er図概要)
2. [テーブル定義](#テーブル定義)
3. [リレーション](#リレーション)
4. [インデックス設計](#インデックス設計)

---

## ER図概要

```
users (ユーザーマスタ)
  ↓ user_stores (ユーザー担当店舗関連) → stores (店舗マスタ)
  ↓ created_by
projects (プロジェクトマスタ)
  ↓ ↑ ↑
  │ │ project_schools (プロジェクト学校関連) ← schools (学校マスタ)
  │ project_stores (プロジェクト店舗関連) ← stores (店舗マスタ)
  ↓                                        ↓
reservations (予約テーブル) ←──────────────┘

stores (店舗マスタ)
  ↓ store_regular_holidays (店舗定休日)
  ↓ schedules (スケジュール＝店舗×日の受付設定)
  ↓ schedule_blocks (枠止め)
```

### 予約枠の考え方

**予約枠はテーブルに持たず、計算で作る。**

```
店舗の営業時間（stores.business_hours_start / end）
  └ その日の受付時間で上書きできる（schedules.start_time / end_time）
      └ schedules.slot_minutes で分割 ── ここが予約枠
          ├ schedules.break_start / break_end に重なる枠を除く（休憩・任意）
          ├ schedule_blocks に重なる枠を除く（棚卸し・研修など）
          └ schedules.is_available = FALSE の日は枠なし（定休日・臨時休業）
```

枠を行として持つと、営業時間や定休日を変えたときに作り直しが必要になり、
実体とのずれが起きる。導出にすることで設定を1か所に集約している。

導出の実装は `api/usecase/slots.py` にあり、顧客向け・社内向けの両方から使う。

**予約件数も列に持たない。** `reservations` を数える。
列に持つと、予約の取り消しや日時変更で実体とずれるため。

---

## テーブル定義

### 1. ユーザーマスタ (users)

**概要**: ログインするユーザーのアカウント管理を行います。管理者、店舗スタッフの情報を管理します。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| personal_id | 社員番号 | VARCHAR(50) | NO | - | 社員番号・個人ID（ユニーク） |
| user_name | ユーザー名 | VARCHAR(50) | NO | - | ユーザー名（ログインID） |
| name_kana | 氏名（カナ） | VARCHAR(100) | YES | NULL | 氏名（カナ） |
| email | メールアドレス | VARCHAR(100) | YES | NULL | メールアドレス |
| password | パスワード | VARCHAR(100) | NO | - | パスワード（ハッシュ化） |
| salt | ソルト | VARCHAR(100) | NO | - | パスワードソルト |
| role | 権限 | ENUM('super_admin', 'admin', 'staff', 'readonly') | NO | 'readonly' | ユーザー権限（下記「権限の考え方」を参照） |
| store_id | 所属店舗ID | INT | YES | NULL | 所属店舗ID（表示用の主店舗。権限の対象店舗は user_stores が持つ） |
| is_active | 有効フラグ | BOOLEAN | NO | TRUE | アカウント有効フラグ |
| icon | アイコンURL | VARCHAR(500) | YES | NULL | プロフィール画像URL |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |
| memo | 備考 | VARCHAR(800) | YES | NULL | 備考 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (personal_id)
- UNIQUE KEY (user_name)
- INDEX (store_id)
- INDEX (deleted_at)

**権限の考え方**:

権限は「ロール（何ができるか）」と「担当店舗（どの店舗のデータに触れるか）」の
2軸で決まります。ロールは上下関係を持つ階層で、上位は下位の操作をすべて行えます。

| ロール | 日本語名 | できること | 対象店舗 |
|-------|---------|-----------|---------|
| super_admin | システム管理者 | 会社マスタの管理、adminユーザーの作成 | 全店舗 |
| admin | システム利用責任者 | プロジェクト作成、マスタ管理、予約・スケジュールの更新 | 全店舗 |
| staff | 店舗責任者 | 予約・スケジュールの参照と更新 | user_stores の店舗のみ |
| readonly | 閲覧のみ | 予約・スケジュールの参照 | user_stores の店舗のみ |
| （未ログイン） | お客様 | 予約の登録・照会 | - |

- `super_admin` / `admin` は全店舗が対象のため、`user_stores` にレコードを持ちません
- `staff` / `readonly` は `user_stores` に最低1件の登録が必要です
  （0件だと、ログインできるのに何も参照できないユーザーになるため）

---

### 1-2. ユーザー担当店舗テーブル (user_stores)

**概要**: ユーザーが操作・参照できる店舗を管理します。1ユーザーが複数店舗を担当できます。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| user_id | ユーザーID | INT | NO | - | ユーザーID（外部キー） |
| store_id | 店舗ID | INT | NO | - | 店舗ID（外部キー） |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス**:
- PRIMARY KEY (user_id, store_id)
- INDEX (store_id)

**運用ルール**:
- `users.store_id`（所属店舗）は画面表示用であり、権限判定には使いません
- 権限判定は必ずこのテーブルを参照します
- ユーザーまたは店舗が物理削除された場合、関連レコードも削除されます（ON DELETE CASCADE）

---

### 2. 店舗マスタ (stores)

**概要**: 店舗の情報を管理します。各店舗の基本情報、営業時間、定休日を保持します。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| store_code | 店舗コード | VARCHAR(20) | NO | - | 店舗コード（ユニーク） |
| name | 店舗名 | VARCHAR(100) | NO | - | 店舗名 |
| name_kana | 店舗名（カナ） | VARCHAR(100) | YES | NULL | 店舗名（カナ） |
| postal_code | 郵便番号 | VARCHAR(10) | YES | NULL | 郵便番号 |
| address | 住所 | VARCHAR(200) | YES | NULL | 住所 |
| phone | 電話番号 | VARCHAR(20) | YES | NULL | 電話番号 |
| email | メールアドレス | VARCHAR(100) | YES | NULL | メールアドレス |
| capacity | 対応可能人数 | INT | NO | 1 | 同時対応可能人数 |
| business_hours_start | 営業開始時間 | TIME | NO | '10:00' | 営業開始時間（予約枠の生成範囲） |
| business_hours_end | 営業終了時間 | TIME | NO | '19:00' | 営業終了時間（予約枠の生成範囲） |

**制約**: `business_hours_start < business_hours_end`

定休日は自由文字列では判定できないため、`store_regular_holidays` に曜日で持つ。
| description | 店舗説明 | VARCHAR(500) | YES | NULL | 店舗説明 |
| image_url | 画像URL | VARCHAR(500) | YES | NULL | 店舗画像URL |
| is_enabled | 有効フラグ | BOOLEAN | NO | TRUE | 有効フラグ |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (store_code)
- INDEX (is_enabled, deleted_at)

---

### 2-2. 店舗定休日テーブル (store_regular_holidays)

**概要**: 店舗の定休日を曜日で持ちます。
「水曜日」のような自由文字列ではプログラムで判定できないため、行に分けています。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| store_id | 店舗ID | INT | NO | - | 店舗ID（外部キー） |
| weekday | 曜日 | SMALLINT | NO | - | 0=日曜 〜 6=土曜 |

**インデックス**: PRIMARY KEY (store_id, weekday)

**注意**: `weekday` は PostgreSQL の `EXTRACT(DOW)` に合わせた日曜始まり。
Python の `date.weekday()` は月曜始まりでずれるため、
比較する前に `system/clock.py` の `to_dow()` で必ず揃えること。
JavaScript の `Date.getDay()` は同じ並びなのでそのまま使える。

特定の日だけ休む「臨時休業」は `schedules.is_available = FALSE` で表します。

---

### 3. 学校マスタ (schools)

**概要**: 取り扱っている学校の情報を管理します。学校制服の対応校のみ登録します。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| school_code | 学校コード | VARCHAR(20) | NO | - | 学校コード（ユニーク） |
| name | 学校名 | VARCHAR(100) | NO | - | 学校名 |
| name_kana | 学校名（カナ） | VARCHAR(100) | YES | NULL | 学校名（カナ） |
| school_type | 学校区分 | ENUM('elementary', 'junior_high', 'high', 'other') | NO | - | 学校区分（小学校/中学校/高校/その他） |
| postal_code | 郵便番号 | VARCHAR(10) | YES | NULL | 郵便番号 |
| address | 住所 | VARCHAR(200) | YES | NULL | 住所 |
| phone | 電話番号 | VARCHAR(20) | YES | NULL | 電話番号 |
| description | 備考 | VARCHAR(500) | YES | NULL | 備考 |
| is_enabled | 有効フラグ | BOOLEAN | NO | TRUE | 有効フラグ |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**school_type 値**:
- `elementary`: 小学校
- `junior_high`: 中学校
- `high`: 高校
- `other`: その他

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (school_code)
- INDEX (school_type)
- INDEX (is_enabled, deleted_at)

---

### 4. プロジェクトテーブル (projects)

**概要**: 予約受付のプロジェクト（キャンペーン期間など）を管理します。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| project_code | プロジェクトコード | VARCHAR(20) | NO | - | プロジェクトコード（ユニーク） |
| name | プロジェクト名 | VARCHAR(100) | NO | - | プロジェクト名 |
| description | 説明 | VARCHAR(500) | YES | NULL | プロジェクト説明 |
| start_date | 開始日 | DATE | NO | - | 開始日 |
| end_date | 終了日 | DATE | NO | - | 終了日 |
| reservation_interval | 予約時間間隔 | INT | NO | 30 | 予約時間間隔（分単位: 20, 30, 60など） |
| is_enabled | 有効フラグ | BOOLEAN | NO | TRUE | 有効フラグ |
| created_by | 作成者 | INT | NO | - | 作成者（ユーザーID） |
| updated_by | 更新者 | INT | NO | - | 更新者（ユーザーID） |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**reservation_interval 値例**:
- `20`: 20分間隔（例: 9:00, 9:20, 9:40...）
- `30`: 30分間隔（例: 9:00, 9:30, 10:00...）
- `60`: 1時間間隔（例: 9:00, 10:00, 11:00...）

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (project_code)
- INDEX (start_date, end_date)
- INDEX (is_enabled, deleted_at)

---

### 4-2. プロジェクト店舗関連テーブル (project_stores)

**概要**: プロジェクトと店舗の多対多リレーションを管理します。レコードがない場合は全店舗が対象です。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| project_id | プロジェクトID | INT | NO | - | プロジェクトID（外部キー） |
| store_id | 店舗ID | INT | NO | - | 店舗ID（外部キー） |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス**:
- PRIMARY KEY (project_id, store_id)
- INDEX (store_id)

**運用ルール**:
- このテーブルにレコードが存在しない場合、そのプロジェクトは全店舗が対象
- 特定店舗のみに限定する場合のみレコードを登録

---

### 4-3. プロジェクト学校関連テーブル (project_schools)

**概要**: プロジェクトと学校の多対多リレーションを管理します。レコードがない場合は全学校が対象です。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| project_id | プロジェクトID | INT | NO | - | プロジェクトID（外部キー） |
| school_id | 学校ID | INT | NO | - | 学校ID（外部キー） |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

**インデックス**:
- PRIMARY KEY (project_id, school_id)
- INDEX (school_id)

**運用ルール**:
- このテーブルにレコードが存在しない場合、そのプロジェクトは全学校が対象
- 特定学校のみに限定する場合のみレコードを登録

---

### 5. 予約テーブル (reservations)

**概要**: お客様の採寸予約情報を管理します。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| reservation_number | 予約番号 | VARCHAR(30) | NO | - | 予約番号（ユニーク、自動生成） |
| project_id | プロジェクトID | INT | YES | NULL | プロジェクトID（外部キー） |
| store_id | 店舗ID | INT | NO | - | 店舗ID（外部キー） |
| school_id | 学校ID | INT | NO | - | 学校ID（外部キー） |
| reservation_date | 予約日 | DATE | NO | - | 予約日 |
| reservation_time | 予約時刻 | TIME | NO | - | 予約時刻 |
| customer_name | 氏名 | VARCHAR(100) | NO | - | お客様氏名 |
| customer_name_kana | 氏名（カナ） | VARCHAR(100) | YES | NULL | お客様氏名（カナ） |
| gender | 性別 | ENUM('male', 'female', 'other') | NO | - | 性別（男性/女性/その他） |
| grade | 学年 | INT | YES | NULL | 学年 |
| height | 身長 | DECIMAL(5,2) | YES | NULL | 身長（cm） |
| weight | 体重 | DECIMAL(5,2) | YES | NULL | 体重（kg） |
| foot_size | 足のサイズ | DECIMAL(4,1) | YES | NULL | 足のサイズ（cm） |
| phone | 電話番号 | VARCHAR(20) | NO | - | 連絡先電話番号 |
| email | メールアドレス | VARCHAR(100) | YES | NULL | メールアドレス |
| guardian_name | 保護者氏名 | VARCHAR(100) | YES | NULL | 保護者氏名 |
| status | ステータス | ENUM('pending', 'confirmed', 'completed', 'cancelled') | NO | 'pending' | 予約ステータス |
| memo | 備考 | VARCHAR(800) | YES | NULL | 備考 |
| created_by | 作成者 | INT | YES | NULL | 作成者（ユーザーID） |
| updated_by | 更新者 | INT | YES | NULL | 更新者（ユーザーID） |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**status 値**:
- `pending`: 予約受付（未確認）
- `confirmed`: 予約確定
- `completed`: 採寸完了
- `cancelled`: キャンセル

**gender 値**:
- `male`: 男性
- `female`: 女性
- `other`: その他

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE KEY (reservation_number)
- INDEX (project_id)
- INDEX (store_id, reservation_date, reservation_time)
- INDEX (school_id)
- INDEX (phone)
- INDEX (status)
- INDEX (created_at)
- INDEX (deleted_at)

---

### 7. スケジュールテーブル (schedules)

**概要**: 店舗×日の受付設定を管理します。**時間枠そのものは持ちません**（上記「予約枠の考え方」を参照）。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| store_id | 店舗ID | INT | NO | - | 店舗ID（外部キー） |
| schedule_date | 日付 | DATE | NO | - | スケジュール日 |
| capacity | 同時予約数 | INT | NO | 1 | その日の1枠あたりの受付可能人数 |
| slot_minutes | 枠の刻み | INT | NO | 30 | 予約枠の長さ（分）。5〜480 |
| start_time | 受付開始時刻 | TIME | YES | NULL | NULLなら店舗の営業開始時間 |
| end_time | 受付終了時刻 | TIME | YES | NULL | NULLなら店舗の営業終了時間 |
| break_start | 休憩開始時刻 | TIME | YES | NULL | 任意。この間は枠を作らない |
| break_end | 休憩終了時刻 | TIME | YES | NULL | 任意 |
| is_available | 予約可能フラグ | BOOLEAN | NO | TRUE | 定休日・臨時休業はFALSE |
| memo | 備考 | VARCHAR(500) | YES | NULL | 備考（臨時休業など） |
| created_by | 作成者 | INT | NO | - | 作成者（ユーザーID） |
| updated_by | 更新者 | INT | NO | - | 更新者（ユーザーID） |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**制約**:
- 受付時間は「両方NULL（＝営業時間に従う）」か「両方指定で start < end」
- 休憩は「両方NULL」か「両方指定で start < end」

**インデックス**:
- PRIMARY KEY (id)
- UNIQUE INDEX (store_id, schedule_date) WHERE deleted_at IS NULL
- INDEX (schedule_date, is_available)
- INDEX (deleted_at)

**行の作られ方**: プロジェクト作成時に、受付期間（全学校区分の最も早い開始日〜
最も遅い終了日）× 対象店舗の各日にまとめて作る。定休日は `is_available = FALSE`。
**既に設定がある日は上書きしない**（複数プロジェクトの期間が重なるため）。

---

### 7-2. 枠止めテーブル (schedule_blocks)

**概要**: 予約以外の用途で時間を埋めます（棚卸し・研修・来客など）。
ここに重なる予約枠は受付から外れます。
毎日決まった休憩は `schedules.break_start / break_end` のほうが手間が少なくて済みます。

| カラム名 | 日本語名 | 型 | NULL | デフォルト | 説明 |
|---------|---------|---|------|-----------|-----|
| id | ID | INT | NO | AUTO_INCREMENT | 主キー |
| store_id | 店舗ID | INT | NO | - | 店舗ID（外部キー） |
| block_date | 対象日 | DATE | NO | - | 対象日 |
| start_time | 開始時刻 | TIME | NO | - | 開始時刻 |
| end_time | 終了時刻 | TIME | NO | - | 終了時刻 |
| title | 用件 | VARCHAR(100) | NO | - | 昼休み・棚卸しなど |
| memo | 備考 | VARCHAR(500) | YES | NULL | 備考 |
| created_by | 作成者 | INT | NO | - | 作成者（ユーザーID） |
| updated_by | 更新者 | INT | NO | - | 更新者（ユーザーID） |
| deleted_at | 削除日時 | DATETIME | YES | NULL | 論理削除日時 |
| created_at | 作成日時 | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | 更新日時 | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

**制約**: `start_time < end_time`

**インデックス**:
- PRIMARY KEY (id)
- INDEX (store_id, block_date) WHERE deleted_at IS NULL

**業務ルール**: 予約が入っている時間には作れない（予約だけが残って実体と食い違うため）。

---

## リレーション

### 外部キー制約

```sql
-- user_stores → users / stores
-- 中間テーブルのため、親が消えたら関連も消す
ALTER TABLE user_stores
ADD CONSTRAINT fk_user_stores_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_stores
ADD CONSTRAINT fk_user_stores_store_id
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- users → stores
ALTER TABLE users
ADD CONSTRAINT fk_users_store_id 
FOREIGN KEY (store_id) REFERENCES stores(id);

-- projects → users (created_by)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_created_by 
FOREIGN KEY (created_by) REFERENCES users(id);

-- projects → users (updated_by)
ALTER TABLE projects
ADD CONSTRAINT fk_projects_updated_by 
FOREIGN KEY (updated_by) REFERENCES users(id);

-- project_stores → projects
ALTER TABLE project_stores
ADD CONSTRAINT fk_project_stores_project_id 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- project_stores → stores
ALTER TABLE project_stores
ADD CONSTRAINT fk_project_stores_store_id 
FOREIGN KEY (store_id) REFERENCES stores(id);

-- project_schools → projects
ALTER TABLE project_schools
ADD CONSTRAINT fk_project_schools_project_id 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- project_schools → schools
ALTER TABLE project_schools
ADD CONSTRAINT fk_project_schools_school_id 
FOREIGN KEY (school_id) REFERENCES schools(id);

-- reservations → projects
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_project_id 
FOREIGN KEY (project_id) REFERENCES projects(id);

-- reservations → stores
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_store_id 
FOREIGN KEY (store_id) REFERENCES stores(id);

-- reservations → schools
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_school_id 
FOREIGN KEY (school_id) REFERENCES schools(id);

-- reservations → users (created_by)
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_created_by 
FOREIGN KEY (created_by) REFERENCES users(id);

-- reservations → users (updated_by)
ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_updated_by 
FOREIGN KEY (updated_by) REFERENCES users(id);

-- store_regular_holidays → stores
ALTER TABLE store_regular_holidays
ADD CONSTRAINT fk_store_regular_holidays_store_id
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

-- schedule_blocks → stores
ALTER TABLE schedule_blocks
ADD CONSTRAINT fk_schedule_blocks_store_id
FOREIGN KEY (store_id) REFERENCES stores(id);

-- schedules → stores
ALTER TABLE schedules
ADD CONSTRAINT fk_schedules_store_id 
FOREIGN KEY (store_id) REFERENCES stores(id);

-- schedules → users (created_by)
ALTER TABLE schedules
ADD CONSTRAINT fk_schedules_created_by 
FOREIGN KEY (created_by) REFERENCES users(id);

-- schedules → users (updated_by)
ALTER TABLE schedules
ADD CONSTRAINT fk_schedules_updated_by 
FOREIGN KEY (updated_by) REFERENCES users(id);
```

---

## インデックス設計

### パフォーマンス最適化のための追加インデックス

```sql
-- 予約検索の高速化
CREATE INDEX idx_reservations_search 
ON reservations(store_id, reservation_date, status, deleted_at);

-- スケジュール検索の高速化
CREATE UNIQUE INDEX idx_schedules_day
ON schedules(store_id, schedule_date) WHERE deleted_at IS NULL;

CREATE INDEX idx_schedule_blocks_store_date
ON schedule_blocks(store_id, block_date) WHERE deleted_at IS NULL;

-- プロジェクト期間検索の高速化
CREATE INDEX idx_projects_period 
ON projects(start_date, end_date, is_enabled, deleted_at);

-- 学校区分検索の高速化
CREATE INDEX idx_schools_type 
ON schools(school_type, is_enabled, deleted_at);

-- 電話番号検索（予約確認用）
CREATE INDEX idx_reservations_phone 
ON reservations(phone, deleted_at);
```

---

## データ整合性ルール

### 1. 論理削除
- すべてのマスタテーブルとトランザクションテーブルは論理削除を使用
- `deleted_at` が NULL の場合は有効、NULL 以外の場合は削除済み

### 2. タイムゾーン
- すべての日時データは **日本標準時 (JST)** で統一

### 3. 文字コード
- UTF-8 (utf8mb4) を使用
- 絵文字対応

### 4. 予約番号の生成ルール
```
{店舗コード(3桁)}-{YYYYMMDD}-{連番(4桁)}
例: STO-20260801-0001
```

### 5. 権限と担当店舗

- ロールの強さは `super_admin > admin > staff > readonly`
- API側の権限判定はトークンの値ではなく、リクエストごとにDBの
  `users.role` と `user_stores` を引き直して行う
  （権限を落としてもトークンが切れるまで旧権限で操作できてしまうのを防ぐため）
- 担当外の店舗のデータを要求された場合は 403 ではなく 404 を返す
  （403だと、そのIDのデータが存在すること自体が分かってしまうため）

---

### 6. ステータス遷移ルール

**予約ステータス (reservations.status)**:
```
pending → confirmed → completed
   ↓          ↓
cancelled  cancelled
```

---

## 将来の拡張予定

### 予約時間間隔の活用

プロジェクトの `reservation_interval` を使用して、予約画面のタイムテーブルを動的に生成します：

**実装例**:
```python
# 営業時間: 9:00 - 17:00
# 予約間隔: 30分

タイムテーブル = [
    "09:00 - 09:30",
    "09:30 - 10:00",
    "10:00 - 10:30",
    ...
    "16:30 - 17:00"
]
```

**間隔別の表示例**:
- **20分間隔**: 9:00, 9:20, 9:40, 10:00...（1時間に3枠）
- **30分間隔**: 9:00, 9:30, 10:00, 10:30...（1時間に2枠）
- **60分間隔**: 9:00, 10:00, 11:00, 12:00...（1時間に1枠）

### Phase 2 で追加予定のテーブル

1. **制服種別マスタ (uniform_types)**
   - 制服の種類（夏服、冬服、体操服など）
   - 制服アイテム（ジャケット、スカート、ズボンなど）

2. **採寸詳細テーブル (measurement_details)**
   - 詳細な採寸データ
   - 注文アイテムとサイズ

3. **注文テーブル (orders)**
   - 実際の制服注文情報
   - 予約から注文への変換

4. **在庫管理テーブル (inventory)**
   - 制服在庫管理

---

**最終更新日**: 2026-08-01  
**バージョン**: 1.0.0  
**作成者**: システム開発チーム
