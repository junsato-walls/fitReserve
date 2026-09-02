-- ===========================================
-- fitReserve - データベース初期化スクリプト
-- PostgreSQL 16 対応
-- ===========================================

-- タイムゾーン設定
SET timezone = 'Asia/Tokyo';

-- ===========================================
-- 1. ユーザーマスタ (users)
-- ===========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    personal_id VARCHAR(50) NOT NULL UNIQUE,
    user_name VARCHAR(50) NOT NULL UNIQUE,
    name_kana VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(100) NOT NULL,
    salt VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'readonly'
        CHECK (role IN ('super_admin', 'admin', 'staff', 'readonly')),
    store_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    icon VARCHAR(500),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    memo VARCHAR(800)
);

CREATE INDEX idx_users_personal_id ON users(personal_id);
CREATE INDEX idx_users_user_name ON users(user_name);
CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_deleted ON users(deleted_at);

COMMENT ON TABLE users IS 'ユーザーマスタ';
COMMENT ON COLUMN users.id IS '主キー';
COMMENT ON COLUMN users.personal_id IS '社員番号・個人ID';
COMMENT ON COLUMN users.user_name IS 'ユーザー名（ログインID）';
COMMENT ON COLUMN users.name_kana IS '氏名（カナ）';
COMMENT ON COLUMN users.email IS 'メールアドレス';
COMMENT ON COLUMN users.password IS 'パスワード（ハッシュ化）';
COMMENT ON COLUMN users.salt IS 'パスワードソルト';
COMMENT ON COLUMN users.role IS 'ユーザー権限（super_admin/admin/staff/readonly）';
COMMENT ON COLUMN users.store_id IS '所属店舗ID（表示用の主店舗。権限の対象店舗は user_stores が持つ）';
COMMENT ON COLUMN users.is_active IS 'アカウント有効フラグ';
COMMENT ON COLUMN users.icon IS 'プロフィール画像URL';
COMMENT ON COLUMN users.deleted_at IS '論理削除日時';
COMMENT ON COLUMN users.created_at IS '作成日時';
COMMENT ON COLUMN users.updated_at IS '更新日時';
COMMENT ON COLUMN users.memo IS '備考';

-- ===========================================
-- 2. 店舗マスタ (stores)
-- ===========================================
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    store_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    postal_code VARCHAR(10),
    address VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    capacity INTEGER NOT NULL DEFAULT 1,
    business_hours_start TIME,
    business_hours_end TIME,
    regular_holiday VARCHAR(100),
    description VARCHAR(500),
    image_url VARCHAR(500),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_code ON stores(store_code);
CREATE INDEX idx_stores_enabled ON stores(is_enabled, deleted_at);

COMMENT ON TABLE stores IS '店舗マスタ';
COMMENT ON COLUMN stores.id IS '主キー';
COMMENT ON COLUMN stores.store_code IS '店舗コード';
COMMENT ON COLUMN stores.name IS '店舗名';
COMMENT ON COLUMN stores.name_kana IS '店舗名（カナ）';
COMMENT ON COLUMN stores.postal_code IS '郵便番号';
COMMENT ON COLUMN stores.address IS '住所';
COMMENT ON COLUMN stores.phone IS '電話番号';
COMMENT ON COLUMN stores.email IS 'メールアドレス';
COMMENT ON COLUMN stores.capacity IS '同時対応可能人数';
COMMENT ON COLUMN stores.business_hours_start IS '営業開始時間';
COMMENT ON COLUMN stores.business_hours_end IS '営業終了時間';
COMMENT ON COLUMN stores.regular_holiday IS '定休日';
COMMENT ON COLUMN stores.description IS '店舗説明';
COMMENT ON COLUMN stores.image_url IS '店舗画像URL';
COMMENT ON COLUMN stores.is_enabled IS '有効フラグ';
COMMENT ON COLUMN stores.deleted_at IS '論理削除日時';
COMMENT ON COLUMN stores.created_at IS '作成日時';
COMMENT ON COLUMN stores.updated_at IS '更新日時';

-- ===========================================
-- 2-2. ユーザー担当店舗テーブル (user_stores)
-- ===========================================
-- staff / readonly が操作・参照できる店舗を表す。1ユーザーが複数店舗を持てる。
-- super_admin / admin は全店舗が対象のため、このテーブルにレコードを作らない。
-- users.store_id は「所属店舗」の表示用で、権限判定にはこちらを使う。
CREATE TABLE user_stores (
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_stores_store ON user_stores(store_id);

COMMENT ON TABLE user_stores IS 'ユーザー担当店舗テーブル（権限の対象店舗）';
COMMENT ON COLUMN user_stores.user_id IS 'ユーザーID';
COMMENT ON COLUMN user_stores.store_id IS '店舗ID';
COMMENT ON COLUMN user_stores.created_at IS '作成日時';

-- ===========================================
-- 3. 学校マスタ (schools)
-- ===========================================
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    school_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    school_divisions_id INTEGER NOT NULL,
    postal_code VARCHAR(10),
    address VARCHAR(200),
    phone VARCHAR(20),
    description VARCHAR(500),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_code ON schools(school_code);
CREATE INDEX idx_schools_division ON schools(school_divisions_id);
CREATE INDEX idx_schools_enabled ON schools(is_enabled, deleted_at);

COMMENT ON TABLE schools IS '学校マスタ';
COMMENT ON COLUMN schools.id IS '主キー';
COMMENT ON COLUMN schools.school_code IS '学校コード';
COMMENT ON COLUMN schools.name IS '学校名';
COMMENT ON COLUMN schools.name_kana IS '学校名（カナ）';
COMMENT ON COLUMN schools.school_divisions_id IS '学校区分ID';
COMMENT ON COLUMN schools.postal_code IS '郵便番号';
COMMENT ON COLUMN schools.address IS '住所';
COMMENT ON COLUMN schools.phone IS '電話番号';
COMMENT ON COLUMN schools.description IS '備考';
COMMENT ON COLUMN schools.is_enabled IS '有効フラグ';
COMMENT ON COLUMN schools.deleted_at IS '論理削除日時';
COMMENT ON COLUMN schools.created_at IS '作成日時';
COMMENT ON COLUMN schools.updated_at IS '更新日時';

-- ===========================================
-- 3-2. 学校区分マスタ (school_divisions)
-- ===========================================
-- 小学校・中学校・高等学校などの区分。schools から参照する。
CREATE TABLE school_divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

COMMENT ON TABLE school_divisions IS '学校区分マスタ';
COMMENT ON COLUMN school_divisions.id IS '主キー';
COMMENT ON COLUMN school_divisions.name IS '区分名';

-- ===========================================
-- 4. プロジェクトテーブル (projects)
-- ===========================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    project_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    reservation_interval INTEGER NOT NULL DEFAULT 30,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_projects_enabled ON projects(is_enabled, deleted_at);

COMMENT ON TABLE projects IS 'プロジェクトテーブル';
COMMENT ON COLUMN projects.id IS '主キー';
COMMENT ON COLUMN projects.company_id IS '会社ID';
COMMENT ON COLUMN projects.project_code IS 'プロジェクトコード';
COMMENT ON COLUMN projects.name IS 'プロジェクト名';
COMMENT ON COLUMN projects.description IS 'プロジェクト説明';
COMMENT ON COLUMN projects.reservation_interval IS '予約時間間隔（分）';
COMMENT ON COLUMN projects.is_enabled IS '有効フラグ';
COMMENT ON COLUMN projects.created_by IS '作成者（ユーザーID）';
COMMENT ON COLUMN projects.updated_by IS '更新者（ユーザーID）';
COMMENT ON COLUMN projects.deleted_at IS '論理削除日時';
COMMENT ON COLUMN projects.created_at IS '作成日時';
COMMENT ON COLUMN projects.updated_at IS '更新日時';

-- ===========================================
-- 5. プロジェクト店舗関連テーブル (project_stores)
-- ===========================================
CREATE TABLE project_stores (
    project_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, store_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

CREATE INDEX idx_project_stores_store ON project_stores(store_id);

COMMENT ON TABLE project_stores IS 'プロジェクト店舗関連テーブル';
COMMENT ON COLUMN project_stores.project_id IS 'プロジェクトID';
COMMENT ON COLUMN project_stores.store_id IS '店舗ID';
COMMENT ON COLUMN project_stores.created_at IS '作成日時';

-- ===========================================
-- 5-2. プロジェクト学校区分関連テーブル (project_school_divisions)
-- ===========================================
-- 予約受付期間は学校区分ごとに異なるため、期間はここが持つ。
-- プロジェクト自体は期間を持たない。
CREATE TABLE project_school_divisions (
    project_id INTEGER NOT NULL,
    school_divisions_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, school_divisions_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (school_divisions_id) REFERENCES school_divisions(id)
);

CREATE INDEX idx_project_school_divisions_period
    ON project_school_divisions(start_date, end_date);

COMMENT ON TABLE project_school_divisions IS 'プロジェクト学校区分関連テーブル（学校区分ごとの予約受付期間）';
COMMENT ON COLUMN project_school_divisions.project_id IS 'プロジェクトID';
COMMENT ON COLUMN project_school_divisions.school_divisions_id IS '学校区分ID';
COMMENT ON COLUMN project_school_divisions.start_date IS '受付開始日';
COMMENT ON COLUMN project_school_divisions.end_date IS '受付終了日';
COMMENT ON COLUMN project_school_divisions.created_at IS '作成日時';

-- ===========================================
-- 6. 店舗学校関連テーブル (store_schools)
-- ===========================================
-- どの店舗がどの学校の制服を取り扱っているかを表す。
CREATE TABLE store_schools (
    store_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (store_id, school_id),
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX idx_store_schools_school ON store_schools(school_id);

COMMENT ON TABLE store_schools IS '店舗学校関連テーブル（店舗が取り扱う学校の制服）';
COMMENT ON COLUMN store_schools.store_id IS '店舗ID';
COMMENT ON COLUMN store_schools.school_id IS '学校ID';
COMMENT ON COLUMN store_schools.created_at IS '作成日時';

-- ===========================================
-- 7. 予約テーブル (reservations)
-- ===========================================
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    reservation_number VARCHAR(30) NOT NULL UNIQUE,
    project_id INTEGER,
    store_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_name_kana VARCHAR(100),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    grade INTEGER,
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    foot_size NUMERIC(4,1),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    guardian_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    memo VARCHAR(800),
    created_by INTEGER,
    updated_by INTEGER,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_reservations_number ON reservations(reservation_number);
CREATE INDEX idx_reservations_project ON reservations(project_id);
CREATE INDEX idx_reservations_store_date ON reservations(store_id, reservation_date, reservation_time);
CREATE INDEX idx_reservations_school ON reservations(school_id);
CREATE INDEX idx_reservations_phone ON reservations(phone);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_search ON reservations(store_id, reservation_date, status, deleted_at);
CREATE INDEX idx_reservations_created ON reservations(created_at);
CREATE INDEX idx_reservations_deleted ON reservations(deleted_at);

COMMENT ON TABLE reservations IS '予約テーブル';
COMMENT ON COLUMN reservations.id IS '主キー';
COMMENT ON COLUMN reservations.reservation_number IS '予約番号';
COMMENT ON COLUMN reservations.project_id IS 'プロジェクトID';
COMMENT ON COLUMN reservations.store_id IS '店舗ID';
COMMENT ON COLUMN reservations.school_id IS '学校ID';
COMMENT ON COLUMN reservations.reservation_date IS '予約日';
COMMENT ON COLUMN reservations.reservation_time IS '予約時刻';
COMMENT ON COLUMN reservations.customer_name IS 'お客様氏名';
COMMENT ON COLUMN reservations.customer_name_kana IS 'お客様氏名（カナ）';
COMMENT ON COLUMN reservations.gender IS '性別（male/female/other）';
COMMENT ON COLUMN reservations.grade IS '学年';
COMMENT ON COLUMN reservations.height IS '身長（cm）';
COMMENT ON COLUMN reservations.weight IS '体重（kg）';
COMMENT ON COLUMN reservations.foot_size IS '足のサイズ（cm）';
COMMENT ON COLUMN reservations.phone IS '連絡先電話番号';
COMMENT ON COLUMN reservations.email IS 'メールアドレス';
COMMENT ON COLUMN reservations.guardian_name IS '保護者氏名';
COMMENT ON COLUMN reservations.status IS '予約ステータス（pending/confirmed/completed/cancelled）';
COMMENT ON COLUMN reservations.memo IS '備考';
COMMENT ON COLUMN reservations.created_by IS '作成者（ユーザーID）';
COMMENT ON COLUMN reservations.updated_by IS '更新者（ユーザーID）';
COMMENT ON COLUMN reservations.deleted_at IS '論理削除日時';
COMMENT ON COLUMN reservations.created_at IS '作成日時';
COMMENT ON COLUMN reservations.updated_at IS '更新日時';

-- ===========================================
-- 8. スケジュールテーブル (schedules)
-- ===========================================
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    reserved_count INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    memo VARCHAR(500),
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 同一店舗・同一日時の枠は1つだけ。
-- テーブル制約(UNIQUE)ではなく部分インデックスにするのは、論理削除した枠が
-- その日時を永久に塞いでしまうのを防ぐため（削除済みは重複判定に含めない）。
CREATE UNIQUE INDEX idx_schedules_slot
    ON schedules(store_id, schedule_date, start_time)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_schedules_date ON schedules(schedule_date, is_available);
CREATE INDEX idx_schedules_availability ON schedules(store_id, schedule_date, is_available, deleted_at);
CREATE INDEX idx_schedules_deleted ON schedules(deleted_at);

COMMENT ON TABLE schedules IS 'スケジュールテーブル';
COMMENT ON COLUMN schedules.id IS '主キー';
COMMENT ON COLUMN schedules.store_id IS '店舗ID';
COMMENT ON COLUMN schedules.schedule_date IS 'スケジュール日';
COMMENT ON COLUMN schedules.start_time IS '開始時刻';
COMMENT ON COLUMN schedules.end_time IS '終了時刻';
COMMENT ON COLUMN schedules.capacity IS '予約可能枠数';
COMMENT ON COLUMN schedules.reserved_count IS '予約済み件数';
COMMENT ON COLUMN schedules.is_available IS '予約可能フラグ';
COMMENT ON COLUMN schedules.memo IS '備考';
COMMENT ON COLUMN schedules.created_by IS '作成者（ユーザーID）';
COMMENT ON COLUMN schedules.updated_by IS '更新者（ユーザーID）';
COMMENT ON COLUMN schedules.deleted_at IS '論理削除日時';
COMMENT ON COLUMN schedules.created_at IS '作成日時';
COMMENT ON COLUMN schedules.updated_at IS '更新日時';

-- ===========================================
-- 9. 会社マスタ (companies)
-- ===========================================
-- 他テーブルからの外部キーは後日追加する。
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    company_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    postal_code VARCHAR(10),
    address VARCHAR(200),
    phone VARCHAR(20),
    created_by INTEGER NOT NULL,
    updated_by INTEGER,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_code ON companies(company_code);
CREATE INDEX idx_companies_deleted ON companies(deleted_at);

COMMENT ON TABLE companies IS '会社マスタ';
COMMENT ON COLUMN companies.id IS '主キー';
COMMENT ON COLUMN companies.slug IS 'URL等で使う識別子';
COMMENT ON COLUMN companies.company_code IS '会社コード';
COMMENT ON COLUMN companies.name IS '会社名';
COMMENT ON COLUMN companies.name_kana IS '会社名（カナ）';
COMMENT ON COLUMN companies.postal_code IS '郵便番号';
COMMENT ON COLUMN companies.address IS '住所';
COMMENT ON COLUMN companies.phone IS '電話番号';
COMMENT ON COLUMN companies.created_by IS '作成者（ユーザーID）';
COMMENT ON COLUMN companies.updated_by IS '更新者（ユーザーID）';
COMMENT ON COLUMN companies.deleted_at IS '論理削除日時';
COMMENT ON COLUMN companies.created_at IS '作成日時';
COMMENT ON COLUMN companies.updated_at IS '更新日時';

-- ===========================================
-- トリガー関数: updated_at 自動更新
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 外部キー制約の追加（users → stores）
-- ===========================================
ALTER TABLE users
ADD CONSTRAINT fk_users_store_id 
FOREIGN KEY (store_id) REFERENCES stores(id);

-- ===========================================
-- 外部キー制約の追加（schools → school_divisions）
-- ===========================================
-- school_divisions は schools より後に定義しているため、ここで付ける。
ALTER TABLE schools
ADD CONSTRAINT fk_schools_school_divisions_id
FOREIGN KEY (school_divisions_id) REFERENCES school_divisions(id);

-- ===========================================
-- 外部キー制約の追加（projects → companies）
-- ===========================================
-- companies は projects より後に定義しているため、ここで付ける。
ALTER TABLE projects
ADD CONSTRAINT fk_projects_company_id
FOREIGN KEY (company_id) REFERENCES companies(id);

-- ===========================================
-- 初期化完了
-- ===========================================
