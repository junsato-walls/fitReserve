-- ===========================================
-- fitReserve - テストデータ投入スクリプト
-- PostgreSQL 16 対応
-- ===========================================

-- ===========================================
-- 1. 店舗マスタ (stores)
-- ===========================================
INSERT INTO stores (
    store_code, name, name_kana, postal_code, address, phone, email,
    capacity, business_hours_start, business_hours_end, regular_holiday,
    description, is_enabled
) VALUES
('S001', '渋谷店', 'シブヤテン', '150-0041', '東京都渋谷区神南1-1-1', '03-1234-5678', 'shibuya@fitreserve.example.com',
 3, '09:00:00', '18:00:00', '水曜日', '渋谷駅から徒歩5分。制服の採寸・販売を行っています。', TRUE),
 
('S002', '新宿店', 'シンジュクテン', '160-0022', '東京都新宿区新宿3-1-1', '03-2345-6789', 'shinjuku@fitreserve.example.com',
 5, '09:00:00', '19:00:00', '月曜日', '新宿駅東口から徒歩3分。広々とした店内でゆっくり試着いただけます。', TRUE),
 
('S003', '横浜店', 'ヨコハマテン', '220-0011', '神奈川県横浜市西区高島2-1-1', '045-123-4567', 'yokohama@fitreserve.example.com',
 2, '10:00:00', '18:00:00', '火曜日', '横浜駅西口から徒歩7分。駐車場完備。', TRUE);

-- ===========================================
-- 2. 学校マスタ (schools)
-- ===========================================
INSERT INTO schools (
    school_code, name, name_kana, school_type, postal_code, address, phone, description, is_enabled
) VALUES
('SC001', '渋谷第一中学校', 'シブヤダイイチチュウガッコウ', 'junior_high', '150-0001', '東京都渋谷区神宮前1-1-1', '03-1111-2222', '制服: ブレザー（紺）、スカート/スラックス', TRUE),
('SC002', '新宿高等学校', 'シンジュクコウトウガッコウ', 'high', '160-0001', '東京都新宿区西新宿1-1-1', '03-3333-4444', '制服: ブレザー（黒）、チェックスカート/スラックス', TRUE),
('SC003', '横浜市立南小学校', 'ヨコハマシリツミナミショウガッコウ', 'elementary', '220-0001', '神奈川県横浜市西区南幸1-1-1', '045-555-6666', '体操服・帽子のみ取り扱い', TRUE),
('SC004', '東京第一高等学校', 'トウキョウダイイチコウトウガッコウ', 'high', '150-0002', '東京都渋谷区渋谷1-1-1', '03-7777-8888', '制服: セーラー服（白襟）、スカート/スラックス', TRUE),
('SC005', '横浜商業高等学校', 'ヨコハマショウギョウコウトウガッコウ', 'high', '220-0002', '神奈川県横浜市西区みなとみらい1-1-1', '045-999-0000', '制服: ブレザー（グレー）、ネクタイ/リボン選択可', TRUE);

-- ===========================================
-- 3. ユーザーマスタ (users)
-- ===========================================
-- パスワード: password (bcrypt ハッシュ化)
INSERT INTO users (
    personal_id, user_name, name_kana, email, password, salt, role, store_id, is_active, memo
) VALUES
('ADM001', 'admin', 'カンリシャ', 'admin@fitreserve.example.com', 
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2', 
 '', 'admin', NULL, TRUE, 'システム管理者'),

('EMP001', 'tanaka', 'タナカタロウ', 'tanaka@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 1, TRUE, '渋谷店 店長'),

('EMP002', 'suzuki', 'スズキハナコ', 'suzuki@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 2, TRUE, '新宿店 スタッフ'),

('EMP003', 'sato', 'サトウジロウ', 'sato@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'readonly', 3, TRUE, '横浜店 アルバイト');

-- ===========================================
-- 4. プロジェクトテーブル (projects)
-- ===========================================
INSERT INTO projects (
    project_code, name, description, start_date, end_date, reservation_interval,
    is_enabled, created_by, updated_by
) VALUES
('PRJ2026-01', '2026年度 新入生制服採寸キャンペーン', 
 '2026年4月入学の新入生向け制服採寸予約を受付中です。', 
 '2026-01-01', '2026-03-31', 30, TRUE, 1, 1),

('PRJ2026-02', '在校生 制服サイズ交換', 
 '在校生の成長に伴う制服サイズ交換を随時受付中。', 
 '2026-04-01', '2026-12-31', 20, TRUE, 1, 1),

('PRJ2026-03', '夏服採寸 早期予約キャンペーン', 
 '夏服の早期予約で10%割引！6月までの採寸予約受付中。', 
 '2026-03-01', '2026-06-30', 60, TRUE, 1, 1);

-- ===========================================
-- 5. プロジェクト店舗関連 (project_stores)
-- ===========================================
-- PRJ2026-01: 全店舗対象（レコードなし = 全店舗）
-- PRJ2026-02: 渋谷店・新宿店のみ
INSERT INTO project_stores (project_id, store_id) VALUES
(2, 1),  -- PRJ2026-02 → 渋谷店
(2, 2);  -- PRJ2026-02 → 新宿店

-- PRJ2026-03: 横浜店のみ
INSERT INTO project_stores (project_id, store_id) VALUES
(3, 3);  -- PRJ2026-03 → 横浜店

-- ===========================================
-- 6. プロジェクト学校関連 (project_schools)
-- ===========================================
-- PRJ2026-01: 渋谷第一中学校、新宿高等学校
INSERT INTO project_schools (project_id, school_id) VALUES
(1, 1),  -- PRJ2026-01 → 渋谷第一中学校
(1, 2);  -- PRJ2026-01 → 新宿高等学校

-- PRJ2026-02: 全学校対象（レコードなし = 全学校）

-- PRJ2026-03: 横浜商業高等学校のみ
INSERT INTO project_schools (project_id, school_id) VALUES
(3, 5);  -- PRJ2026-03 → 横浜商業高等学校

-- ===========================================
-- 7. スケジュールテーブル (schedules)
-- ===========================================
-- 渋谷店: 2026-08-05 の予約枠
INSERT INTO schedules (
    store_id, schedule_date, start_time, end_time, capacity, reserved_count, 
    is_available, created_by, updated_by
) VALUES
(1, '2026-08-05', '09:00:00', '09:30:00', 3, 0, TRUE, 1, 1),
(1, '2026-08-05', '09:30:00', '10:00:00', 3, 1, TRUE, 1, 1),
(1, '2026-08-05', '10:00:00', '10:30:00', 3, 2, TRUE, 1, 1),
(1, '2026-08-05', '10:30:00', '11:00:00', 3, 3, FALSE, 1, 1),  -- 満席
(1, '2026-08-05', '11:00:00', '11:30:00', 3, 0, TRUE, 1, 1);

-- 新宿店: 2026-08-05 の予約枠
INSERT INTO schedules (
    store_id, schedule_date, start_time, end_time, capacity, reserved_count,
    is_available, created_by, updated_by
) VALUES
(2, '2026-08-05', '09:00:00', '09:30:00', 5, 0, TRUE, 1, 1),
(2, '2026-08-05', '09:30:00', '10:00:00', 5, 2, TRUE, 1, 1),
(2, '2026-08-05', '10:00:00', '10:30:00', 5, 3, TRUE, 1, 1);

-- 予約フォームの動作確認用に、実行日を基準とした将来の予約枠を生成する。
--
-- 固定日付だけにすると時間の経過でテストデータが「すべて過去日」になり、
-- 予約フォームで選べる日が1つも無くなってしまうため、CURRENT_DATE基準で作る。
--
-- 対象: 有効な全店舗（店舗を追加しても枠が作られるようにテーブルから引く）
-- 期間: 翌日から30日間の平日
-- 時間帯: 09:00〜12:00 の30分刻み（6枠）
INSERT INTO schedules (
    store_id, schedule_date, start_time, end_time, capacity, reserved_count,
    is_available, created_by, updated_by, memo
)
SELECT
    store.id,
    day::date,
    (TIME '09:00' + slot * INTERVAL '30 minutes'),
    (TIME '09:30' + slot * INTERVAL '30 minutes'),
    store.capacity,
    -- 一部の枠を満席・残りわずかにして表示確認できるようにする
    CASE (slot + EXTRACT(DAY FROM day)::int) % 5
        WHEN 0 THEN store.capacity      -- 満席
        WHEN 1 THEN store.capacity - 1  -- 残りわずか
        ELSE 0
    END,
    TRUE,
    1, 1,
    '自動生成'
FROM (
    SELECT id, capacity FROM stores WHERE is_enabled AND deleted_at IS NULL
) AS store
CROSS JOIN generate_series(
    CURRENT_DATE + 1, CURRENT_DATE + 30, INTERVAL '1 day'
) AS day
CROSS JOIN generate_series(0, 5) AS slot
-- 土日は営業しない
WHERE EXTRACT(ISODOW FROM day) < 6
-- 手動で登録済みの枠とぶつかった場合はそちらを優先する
ON CONFLICT (store_id, schedule_date, start_time) DO NOTHING;

-- ===========================================
-- 8. 予約テーブル (reservations)
-- ===========================================
INSERT INTO reservations (
    reservation_number, project_id, store_id, school_id, 
    reservation_date, reservation_time,
    customer_name, customer_name_kana, gender, grade,
    height, weight, foot_size, phone, email, guardian_name,
    status, memo, created_by, updated_by
) VALUES
('S001-20260805-0001', 1, 1, 1, '2026-08-05', '09:30:00',
 '山田太郎', 'ヤマダタロウ', 'male', 1, 165.5, 55.0, 26.0,
 '090-1234-5678', 'yamada@example.com', '山田花子',
 'confirmed', '新入生', 2, 2),

('S001-20260805-0002', 1, 1, 1, '2026-08-05', '10:00:00',
 '佐藤美咲', 'サトウミサキ', 'female', 1, 158.0, 48.5, 23.5,
 '090-2345-6789', 'sato@example.com', '佐藤健',
 'confirmed', '転入生', 2, 2),

('S001-20260805-0003', 1, 1, 2, '2026-08-05', '10:00:00',
 '鈴木一郎', 'スズキイチロウ', 'male', 1, 170.0, 60.0, 27.0,
 '090-3456-7890', NULL, '鈴木恵子',
 'pending', NULL, 2, 2),

('S002-20260805-0001', 1, 2, 2, '2026-08-05', '09:30:00',
 '高橋愛', 'タカハシアイ', 'female', 1, 160.0, 50.0, 24.0,
 '090-4567-8901', 'takahashi@example.com', '高橋誠',
 'confirmed', NULL, 3, 3),

('S002-20260805-0002', 1, 2, 2, '2026-08-05', '09:30:00',
 '田中健太', 'タナカケンタ', 'male', 1, 172.0, 62.0, 27.5,
 '090-5678-9012', NULL, '田中由美',
 'confirmed', NULL, 3, 3);

-- ===========================================
-- テストデータ投入完了
-- ===========================================
