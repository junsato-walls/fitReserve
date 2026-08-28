-- ===========================================
-- fitReserve - テストデータ投入スクリプト
-- PostgreSQL 16 対応
-- ===========================================
--
-- 【方針】日付は原則 CURRENT_DATE 基準で組み立てる
--
-- 固定日付で書くと、時間の経過とともにプロジェクトが受付期間外になり、
-- スケジュールもすべて過去日になって「予約できる日が1つも無い」状態に陥る。
-- （公開APIはプロジェクトの start_date <= 今日 <= end_date で絞り込むため）
-- そのため、いつ初期化しても使える状態になるよう相対日付で生成する。
--
-- 【データ量の目安】
--   会社1 / 店舗6 / 学校11 / 学校区分4 / ユーザー10 / プロジェクト6
--   スケジュール 約3,300枠（過去14日〜未来45日）
--   予約         約1,900件（ステータス4種）
-- ===========================================

-- ===========================================
-- 0. 学校区分マスタ (school_divisions)
-- ===========================================
-- schools から参照するため、学校マスタより先に投入する。
INSERT INTO school_divisions (name) VALUES
('小学校'),      -- id: 1
('中学校'),      -- id: 2
('高等学校'),    -- id: 3
('その他');      -- id: 4

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
 2, '10:00:00', '18:00:00', '火曜日', '横浜駅西口から徒歩7分。駐車場完備。', TRUE),

('S004', '池袋店', 'イケブクロテン', '171-0022', '東京都豊島区南池袋1-1-1', '03-3456-7890', 'ikebukuro@fitreserve.example.com',
 4, '10:00:00', '19:00:00', '木曜日', '池袋駅東口直結。土日も営業しています。', TRUE),

('S005', '川崎店', 'カワサキテン', '210-0007', '神奈川県川崎市川崎区駅前本町1-1-1', '044-234-5678', 'kawasaki@fitreserve.example.com',
 3, '09:00:00', '17:00:00', '水曜日', '川崎駅東口から徒歩4分。学校説明会と連携した採寸会を実施。', TRUE),

-- 無効な店舗（一覧から除外されることの確認用）
('S006', '町田店（閉店）', 'マチダテン', '194-0013', '東京都町田市原町田1-1-1', '042-345-6789', NULL,
 2, '10:00:00', '18:00:00', '月曜日', '2024年3月に閉店しました。', FALSE);

-- ===========================================
-- 2. 学校マスタ (schools)
-- ===========================================
INSERT INTO schools (
    school_code, name, name_kana, school_divisions_id, postal_code, address, phone, description, is_enabled
) VALUES
('SC001', '渋谷第一中学校', 'シブヤダイイチチュウガッコウ', 2, '150-0001', '東京都渋谷区神宮前1-1-1', '03-1111-2222', '制服: ブレザー（紺）、スカート/スラックス', TRUE),
('SC002', '新宿高等学校', 'シンジュクコウトウガッコウ', 3, '160-0001', '東京都新宿区西新宿1-1-1', '03-3333-4444', '制服: ブレザー（黒）、チェックスカート/スラックス', TRUE),
('SC003', '横浜市立南小学校', 'ヨコハマシリツミナミショウガッコウ', 1, '220-0001', '神奈川県横浜市西区南幸1-1-1', '045-555-6666', '体操服・帽子のみ取り扱い', TRUE),
('SC004', '東京第一高等学校', 'トウキョウダイイチコウトウガッコウ', 3, '150-0002', '東京都渋谷区渋谷1-1-1', '03-7777-8888', '制服: セーラー服（白襟）、スカート/スラックス', TRUE),
('SC005', '横浜商業高等学校', 'ヨコハマショウギョウコウトウガッコウ', 3, '220-0002', '神奈川県横浜市西区みなとみらい1-1-1', '045-999-0000', '制服: ブレザー（グレー）、ネクタイ/リボン選択可', TRUE),
('SC006', '池袋中学校', 'イケブクロチュウガッコウ', 2, '171-0021', '東京都豊島区西池袋2-2-2', '03-2222-3333', '制服: 学ラン/セーラー服', TRUE),
('SC007', '川崎西高等学校', 'カワサキニシコウトウガッコウ', 3, '210-0006', '神奈川県川崎市川崎区砂子1-2-3', '044-444-5555', '制服: ブレザー（濃紺）、指定カバンあり', TRUE),
('SC008', '目黒学園中等部', 'メグロガクエンチュウトウブ', 2, '153-0051', '東京都目黒区上目黒3-3-3', '03-6666-7777', '私立。制服の採寸は指定日のみ。', TRUE),
('SC009', '品川第二小学校', 'シナガワダイニショウガッコウ', 1, '140-0001', '東京都品川区北品川4-4-4', '03-8888-9999', '体操服・上履きのみ', TRUE),
('SC010', '青葉インターナショナルスクール', 'アオバインターナショナルスクール', 4, '227-0055', '神奈川県横浜市青葉区つつじが丘5-5-5', '045-777-8888', '通年で採寸を受け付け。英語対応が必要。', TRUE),
-- 無効な学校（一覧から除外されることの確認用）
('SC011', '北町中学校（廃校）', 'キタマチチュウガッコウ', 2, '114-0002', '東京都北区王子6-6-6', NULL, '2023年3月に統合により廃校。', FALSE);

-- ===========================================
-- 3. ユーザーマスタ (users)
-- ===========================================
-- パスワードは全アカウント共通で "password" （bcrypt ハッシュ化）
INSERT INTO users (
    personal_id, user_name, name_kana, email, password, salt, role, store_id, is_active, memo
) VALUES
('ADM001', 'admin', 'カンリシャ', 'admin@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'admin', NULL, TRUE, 'システム管理者'),

('ADM002', 'yamamoto', 'ヤマモトケンジ', 'yamamoto@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'admin', 1, TRUE, 'エリアマネージャー（渋谷店 兼務）'),

('EMP001', 'tanaka', 'タナカタロウ', 'tanaka@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 1, TRUE, '渋谷店 店長'),

('EMP002', 'suzuki', 'スズキハナコ', 'suzuki@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 2, TRUE, '新宿店 スタッフ'),

('EMP003', 'sato', 'サトウジロウ', 'sato@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'readonly', 3, TRUE, '横浜店 アルバイト'),

('EMP004', 'ito', 'イトウミサキ', 'ito@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 3, TRUE, '横浜店 店長'),

('EMP005', 'watanabe', 'ワタナベケンタ', 'watanabe@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 4, TRUE, '池袋店 店長'),

('EMP006', 'kobayashi', 'コバヤシユイ', 'kobayashi@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 5, TRUE, '川崎店 スタッフ'),

('EMP007', 'nakamura', 'ナカムラアオイ', 'nakamura@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'readonly', 4, TRUE, '池袋店 アルバイト'),

-- 無効なアカウント（ログインできないことの確認用）
('EMP008', 'furukawa', 'フルカワシン', 'furukawa@fitreserve.example.com',
 '$2b$12$DqXrp0JdJcK.xDIiTH/RTufo6YzEMkvlrPw2jYhLKxtXbuNDkLtU2',
 '', 'staff', 2, FALSE, '退職済み（2025年12月）');

-- ===========================================
-- 3-2. 会社マスタ (companies)
-- ===========================================
-- created_by が users を参照するため、ユーザー登録の後に入れる。
INSERT INTO companies (
    slug, company_code, name, name_kana, postal_code, address, phone,
    created_by, updated_by
) VALUES
('nonoyama', 'C001', 'ノノヤマ洋服株式会社', 'ノノヤマヨウフク', '123-4567', '愛知県名古屋市中区1-1-1', '090-1234-5678',
 1, 1);

-- ===========================================
-- 4. プロジェクトテーブル (projects)
-- ===========================================
-- プロジェクトが持つのは「会社・名称・対象店舗」まで。
-- 予約受付期間は学校区分ごとに異なるため project_school_divisions が持つ。
-- 対象学校はプロジェクトではなく店舗が持つ（store_schools）。
INSERT INTO projects (
    company_id, project_code, name, description, reservation_interval,
    is_enabled, created_by, updated_by
) VALUES
-- 受付中：全店舗が対象（project_stores にレコードを作らない）
(1, 'PRJ-001', '通年 制服採寸・サイズ相談',
 '在校生・新入生を問わず、制服の採寸とサイズ相談を通年で受け付けています。',
 30, TRUE, 1, 1),

-- 受付中：対象店舗を限定
(1, 'PRJ-002', '新入生 制服採寸キャンペーン',
 '来春入学の新入生向け採寸予約。対象校の生徒さまは指定店舗でご予約ください。',
 30, TRUE, 1, 1),

-- 受付中：予約間隔が20分（枠の刻みが他と違う場合の確認用）
(1, 'PRJ-003', '在校生 制服サイズ交換',
 '成長に伴う制服のサイズ交換を承ります。神奈川県内の店舗が対象です。',
 20, TRUE, 1, 1),

-- 開始前：まだ受付期間に入っていない
(1, 'PRJ-004', '夏服採寸 早期予約キャンペーン',
 '夏服の早期予約で10%割引。受付開始までしばらくお待ちください。',
 60, TRUE, 1, 1),

-- 終了済み：受付期間を過ぎている
(1, 'PRJ-005', '昨年度 新入生制服採寸',
 '昨年度の新入生向け採寸キャンペーン。受付は終了しました。',
 30, TRUE, 1, 1),

-- 無効：期間内だが is_enabled が FALSE
(1, 'PRJ-006', '（準備中）体操服リニューアル対応',
 '公開前の下書き。管理画面には出るが顧客側には出ない。',
 30, FALSE, 1, 1);

-- ===========================================
-- 5. プロジェクト店舗関連 (project_stores)
-- ===========================================
-- レコードが無いプロジェクトは「全店舗が対象」という仕様。
-- PRJ-001 / PRJ-006 は意図的にレコードを作らない。
INSERT INTO project_stores (project_id, store_id) VALUES
-- PRJ-002: 都内3店舗
(2, 1), (2, 2), (2, 4),
-- PRJ-003: 神奈川県内2店舗
(3, 3), (3, 5),
-- PRJ-004: 全店舗を明示的に指定
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5),
-- PRJ-005: 渋谷店のみ
(5, 1);

-- ===========================================
-- 5-2. プロジェクト学校区分関連 (project_school_divisions)
-- ===========================================
-- 学校区分ごとの予約受付期間。ここに行が無い区分は受付対象外。
-- 区分ID: 1=小学校 / 2=中学校 / 3=高等学校 / 4=その他
INSERT INTO project_school_divisions (project_id, school_divisions_id, start_date, end_date) VALUES
-- PRJ-001 通年：全区分を受付中。区分ごとに期間をずらしてある
(1, 1, CURRENT_DATE - 90, CURRENT_DATE + 180),
(1, 2, CURRENT_DATE - 60, CURRENT_DATE + 150),
(1, 3, CURRENT_DATE - 30, CURRENT_DATE + 120),
(1, 4, CURRENT_DATE - 90, CURRENT_DATE + 180),

-- PRJ-002 新入生：中学校・高等学校のみ受付中（小学校とその他は対象外）
(2, 2, CURRENT_DATE - 30, CURRENT_DATE + 60),
(2, 3, CURRENT_DATE - 30, CURRENT_DATE + 45),

-- PRJ-003 サイズ交換：小学校・中学校のみ受付中
(3, 1, CURRENT_DATE - 7, CURRENT_DATE + 45),
(3, 2, CURRENT_DATE - 7, CURRENT_DATE + 45),

-- PRJ-004 開始前：全区分がまだ受付前
(4, 1, CURRENT_DATE + 30, CURRENT_DATE + 120),
(4, 2, CURRENT_DATE + 30, CURRENT_DATE + 120),
(4, 3, CURRENT_DATE + 30, CURRENT_DATE + 120),

-- PRJ-005 終了済み：受付期間を過ぎている
(5, 3, CURRENT_DATE - 180, CURRENT_DATE - 90),

-- PRJ-006 無効：期間内だがプロジェクトが is_enabled = FALSE
(6, 2, CURRENT_DATE - 10, CURRENT_DATE + 60);

-- ===========================================
-- 6. 店舗学校関連 (store_schools)
-- ===========================================
-- 店舗がどの学校の制服を取り扱っているかを表す。
-- 有効な学校（id 1〜10）がいずれかの店舗に必ず含まれるようにしている。
INSERT INTO store_schools (store_id, school_id) VALUES
-- 渋谷店
(1, 1), (1, 4), (1, 8), (1, 9),
-- 新宿店
(2, 1), (2, 2), (2, 4), (2, 6),
-- 横浜店
(3, 3), (3, 5), (3, 10),
-- 池袋店
(4, 2), (4, 6), (4, 8),
-- 川崎店
(5, 3), (5, 5), (5, 7);

-- ===========================================
-- 7. スケジュールテーブル (schedules)
-- ===========================================
-- 有効な全店舗について、営業時間から30分刻みの枠を生成する。
--
--   期間       : 過去14日〜未来45日（過去分はスタッフ画面の実績確認用）
--   休業日     : 各店舗の定休日のみ（stores.regular_holiday）。
--                制服採寸は土日が繁忙のため週末も営業扱いにする。
--   昼休み     : 12:00〜13:00 は枠を作らない
--   受付可能数 : 店舗の capacity をそのまま使う
--
-- reserved_count は後段の予約データ投入後にまとめて再計算するため、
-- ここでは 0 のまま入れる。
INSERT INTO schedules (
    store_id, schedule_date, start_time, end_time, capacity, reserved_count,
    is_available, created_by, updated_by, memo
)
SELECT
    store.id,
    ts::date,
    ts::time,
    (ts + INTERVAL '30 minutes')::time,
    store.capacity,
    0,
    TRUE,
    1, 1,
    '自動生成'
FROM (
    SELECT
        id,
        capacity,
        business_hours_start,
        business_hours_end,
        -- 定休日の曜日名を ISO の曜日番号（月=1 … 日=7）に変換する
        CASE regular_holiday
            WHEN '月曜日' THEN 1
            WHEN '火曜日' THEN 2
            WHEN '水曜日' THEN 3
            WHEN '木曜日' THEN 4
            WHEN '金曜日' THEN 5
            WHEN '土曜日' THEN 6
            WHEN '日曜日' THEN 7
            ELSE 0
        END AS holiday_dow
    FROM stores
    WHERE is_enabled AND deleted_at IS NULL
) AS store
CROSS JOIN LATERAL generate_series(
    (CURRENT_DATE - 14) + store.business_hours_start,
    (CURRENT_DATE + 45) + store.business_hours_end - INTERVAL '30 minutes',
    INTERVAL '30 minutes'
) AS ts
WHERE
    -- 営業時間内の枠だけを残す（generate_series は日をまたいで刻み続けるため）
    ts::time >= store.business_hours_start
    AND ts::time < store.business_hours_end
    -- 定休日は休業（それ以外は土日も営業する）
    AND EXTRACT(ISODOW FROM ts) <> store.holiday_dow
    -- 昼休み
    AND (ts::time < TIME '12:00' OR ts::time >= TIME '13:00')
ON CONFLICT (store_id, schedule_date, start_time) DO NOTHING;

-- ===========================================
-- 8. 予約テーブル (reservations)
-- ===========================================
-- 生成済みの枠から一定の規則で予約を作る。
-- 実在する枠にしか予約を作らないため、reserved_count と矛盾しない。
--
--   過去日 : completed（一部 cancelled）
--   当日   : confirmed
--   未来日 : confirmed（一部 pending）
WITH slot AS (
    SELECT
        s.store_id,
        s.schedule_date,
        s.start_time,
        s.capacity,
        ROW_NUMBER() OVER (ORDER BY s.store_id, s.schedule_date, s.start_time) AS rn
    FROM schedules s
    WHERE s.schedule_date BETWEEN CURRENT_DATE - 14 AND CURRENT_DATE + 21
),
picked AS (
    SELECT
        slot.*,
        -- 枠ごとの予約人数を散らす（空き・残りわずか・満席が混ざるようにする）
        CASE slot.rn % 7
            WHEN 0 THEN LEAST(2, slot.capacity)
            WHEN 1 THEN 1
            WHEN 3 THEN 1
            WHEN 5 THEN LEAST(3, slot.capacity)
            ELSE 0
        END AS booking_count
    FROM slot
),
gen AS (
    SELECT
        p.store_id,
        p.schedule_date,
        p.start_time,
        (p.rn + seq)::int AS idx,
        ROW_NUMBER() OVER (
            PARTITION BY p.store_id, p.schedule_date
            ORDER BY p.start_time, seq
        )::int AS num
    FROM picked p
    CROSS JOIN LATERAL generate_series(1, p.booking_count) AS seq
),
person AS (
    SELECT * FROM (VALUES
        (0,  '山田太郎',   'ヤマダタロウ',   '山田花子'),
        (1,  '佐藤美咲',   'サトウミサキ',   '佐藤健'),
        (2,  '鈴木一郎',   'スズキイチロウ', '鈴木恵子'),
        (3,  '高橋愛',     'タカハシアイ',   '高橋誠'),
        (4,  '田中健太',   'タナカケンタ',   '田中由美'),
        (5,  '伊藤さくら', 'イトウサクラ',   '伊藤大輔'),
        (6,  '渡辺蓮',     'ワタナベレン',   '渡辺明日香'),
        (7,  '小林結衣',   'コバヤシユイ',   '小林隆'),
        (8,  '中村陽翔',   'ナカムラハルト', '中村千尋'),
        (9,  '加藤莉子',   'カトウリコ',     '加藤直樹'),
        (10, '吉田悠真',   'ヨシダユウマ',   '吉田美和'),
        (11, '山本芽依',   'ヤマモトメイ',   '山本浩二'),
        (12, '松本颯太',   'マツモトソウタ', '松本香織'),
        (13, '井上凛',     'イノウエリン',   '井上和彦'),
        (14, '木村大和',   'キムラヤマト',   '木村真理'),
        (15, '林ひなた',   'ハヤシヒナタ',   '林正人'),
        (16, '清水湊',     'シミズミナト',   '清水典子'),
        (17, '山口紬',     'ヤマグチツムギ', '山口賢一'),
        (18, '森田朝陽',   'モリタアサヒ',   '森田久美'),
        (19, '池田結菜',   'イケダユイナ',   '池田茂'),
        (20, '橋本律',     'ハシモトリツ',   '橋本彩'),
        (21, '石川咲良',   'イシカワサクラ', '石川康弘'),
        (22, '前田陽菜',   'マエダヒナ',     '前田良平'),
        (23, '藤田悠斗',   'フジタユウト',   '藤田志保')
    ) AS t(k, name, kana, guardian)
),
school_pool AS (
    -- 店舗ごとに、その店舗が取り扱う学校を並べる。
    -- 店舗と無関係な学校の予約ができてしまうと、予約フォームの
    -- 「店舗→学校」の絞り込みと食い違うため store_schools から引く。
    SELECT
        ss.store_id,
        ss.school_id,
        (ROW_NUMBER() OVER (PARTITION BY ss.store_id ORDER BY ss.school_id) - 1)::int AS k,
        COUNT(*) OVER (PARTITION BY ss.store_id)::int AS total
    FROM store_schools ss
    JOIN schools sc ON sc.id = ss.school_id
    WHERE sc.is_enabled AND sc.deleted_at IS NULL
)
INSERT INTO reservations (
    reservation_number, project_id, store_id, school_id,
    reservation_date, reservation_time,
    customer_name, customer_name_kana, gender, grade,
    height, weight, foot_size, phone, email, guardian_name,
    status, memo, created_by, updated_by
)
SELECT
    st.store_code || '-' || to_char(g.schedule_date, 'YYYYMMDD') || '-' || lpad(g.num::text, 4, '0'),
    -- 全店舗・全学校が対象の通年プロジェクトに紐付ける（組み合わせが必ず成立する）
    1,
    g.store_id,
    sp.school_id,
    g.schedule_date,
    g.start_time,
    pr.name,
    pr.kana,
    CASE
        WHEN g.idx % 10 = 9 THEN 'other'
        WHEN g.idx % 2 = 0 THEN 'female'
        ELSE 'male'
    END,
    1 + g.idx % 3,
    145 + (g.idx % 35) + 0.5,
    38 + (g.idx % 30) + 0.5,
    22 + (g.idx % 8) + 0.5,
    '090-' || lpad(((g.idx * 37) % 10000)::text, 4, '0') || '-' || lpad(((g.idx * 91) % 10000)::text, 4, '0'),
    -- 4件に1件はメールアドレス未登録（任意項目の確認用）
    CASE WHEN g.idx % 4 = 0 THEN NULL ELSE 'customer' || g.idx || '@example.com' END,
    pr.guardian,
    CASE
        WHEN g.schedule_date < CURRENT_DATE
            THEN CASE WHEN g.idx % 6 = 0 THEN 'cancelled' ELSE 'completed' END
        WHEN g.schedule_date = CURRENT_DATE
            THEN 'confirmed'
        ELSE CASE WHEN g.idx % 4 = 0 THEN 'pending' ELSE 'confirmed' END
    END,
    CASE WHEN g.idx % 9 = 0 THEN '自動生成のテストデータ' ELSE NULL END,
    NULL, NULL
FROM gen g
JOIN stores st ON st.id = g.store_id
JOIN person pr ON pr.k = g.idx % (SELECT COUNT(*)::int FROM person)
JOIN school_pool sp ON sp.store_id = g.store_id AND sp.k = g.idx % sp.total;

-- --------------------------------------------
-- 個別確認用の予約（表示崩れ・任意項目の確認）
--
-- 日付を直接書くと、初期化した曜日によっては定休日・日曜に当たり、
-- 存在しない枠を指す予約ができてしまう。
-- そのため実在する空き枠から選ぶ。
-- 予約番号は自動生成分と衝突しないよう 9001 番にする。
-- --------------------------------------------
WITH target AS (
    -- 店舗ごとの「未来で最初の、まだ誰も予約していない枠」
    --
    -- reserved_count はこの後の工程でまとめて再計算するため、
    -- この時点ではすべて0で判定に使えない。実データの有無で判断する。
    SELECT DISTINCT ON (s.store_id) s.store_id, s.schedule_date, s.start_time
    FROM schedules s
    WHERE s.schedule_date > CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.store_id = s.store_id
            AND r.reservation_date = s.schedule_date
            AND r.reservation_time = s.start_time
      )
    ORDER BY s.store_id, s.schedule_date, s.start_time
),
sample AS (
    SELECT * FROM (VALUES
        -- 採寸情報・カナ・メール・保護者名がすべて未入力（最小構成）
        (1, 1, 1,
         '最小 太郎', NULL::varchar, 'male', NULL::int,
         NULL::numeric, NULL::numeric, NULL::numeric,
         '090-0000-0001', NULL::varchar, NULL::varchar,
         'pending', NULL::varchar, NULL::int),

        -- 長い氏名・長い備考（折り返しとレイアウト崩れの確認）
        (2, 1, 2,
         '長名 スーパーカリフラジリスティックエクスピアリドーシャス',
         'ナガナスーパーカリフラジリスティックエクスピアリドーシャス', 'female', 3,
         172.50, 58.30, 24.5,
         '090-0000-0002', 'very.long.email.address.for.layout.check@example.com', '長名 保護者',
         'confirmed',
         '折り返し表示の確認用。アレルギー対応が必要なため、試着時は綿素材の見本をご用意ください。当日は保護者が同伴します。前回の採寸から身長が8cm伸びているため、袖丈・着丈ともに再測定が必要です。',
         2),

        -- 性別 other
        (3, 1, 10,
         'テスト 中性', 'テストチュウセイ', 'other', 2,
         165.00, 52.00, 25.0,
         '090-0000-0003', 'other@example.com', 'テスト 保護者',
         'confirmed', '性別 other の表示確認', 6),

        -- キャンセル済み（未来日）
        (4, 2, 6,
         'キャンセル 花子', 'キャンセルハナコ', 'female', 1,
         155.00, 45.00, 23.0,
         '090-0000-0004', NULL, 'キャンセル 太郎',
         'cancelled', '顧客都合によりキャンセル', 7),

        -- 論理削除済み（一覧に出ないことの確認）
        (5, 1, 7,
         '削除 済', 'サクジョズミ', 'male', 3,
         168.00, 57.00, 26.5,
         '090-0000-0005', NULL, NULL,
         'cancelled', '論理削除の確認用', 8)
    ) AS t(
        store_id, project_id, school_id,
        customer_name, customer_name_kana, gender, grade,
        height, weight, foot_size,
        phone, email, guardian_name,
        status, memo, staff_id
    )
)
INSERT INTO reservations (
    reservation_number, project_id, store_id, school_id,
    reservation_date, reservation_time,
    customer_name, customer_name_kana, gender, grade,
    height, weight, foot_size, phone, email, guardian_name,
    status, memo, created_by, updated_by
)
SELECT
    st.store_code || '-' || to_char(tg.schedule_date, 'YYYYMMDD') || '-9001',
    sp.project_id, sp.store_id, sp.school_id,
    tg.schedule_date, tg.start_time,
    sp.customer_name, sp.customer_name_kana, sp.gender, sp.grade,
    sp.height, sp.weight, sp.foot_size, sp.phone, sp.email, sp.guardian_name,
    sp.status, sp.memo, sp.staff_id, sp.staff_id
FROM sample sp
JOIN target tg ON tg.store_id = sp.store_id
JOIN stores st ON st.id = sp.store_id;

-- 本日の予約（ダッシュボードの当日件数の確認）
-- 全店が定休日に当たる日は対象の枠が無いため作られない。
INSERT INTO reservations (
    reservation_number, project_id, store_id, school_id,
    reservation_date, reservation_time,
    customer_name, customer_name_kana, gender, grade,
    height, weight, foot_size, phone, email, guardian_name,
    status, memo, created_by, updated_by
)
SELECT
    st.store_code || '-' || to_char(sc.schedule_date, 'YYYYMMDD') || '-9002',
    1, sc.store_id,
    (SELECT MIN(school_id) FROM store_schools WHERE store_id = sc.store_id),
    sc.schedule_date, sc.start_time,
    '本日 予約', 'ホンジツヨヤク', 'female', 2,
    160.00, 50.00, 24.0, '090-0000-0006', 'today@example.com', '本日 保護者',
    'confirmed', 'ダッシュボードの当日件数確認用', 3, 3
FROM (
    SELECT s.store_id, s.schedule_date, s.start_time
    FROM schedules s
    WHERE s.schedule_date = CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM reservations r
          WHERE r.store_id = s.store_id
            AND r.reservation_date = s.schedule_date
            AND r.reservation_time = s.start_time
      )
    ORDER BY s.store_id, s.start_time
    LIMIT 1
) sc
JOIN stores st ON st.id = sc.store_id;

-- 論理削除の確認用レコードに削除日時を入れる
UPDATE reservations
SET deleted_at = CURRENT_TIMESTAMP
WHERE reservation_number LIKE 'S005-%-9001';

-- ===========================================
-- 9. 予約済み件数の再計算
-- ===========================================
-- 予約データと schedules.reserved_count がずれていると、
-- 空き枠の表示と実際の予約件数が食い違ってしまう。
-- ここで実データから数え直して整合させる。
-- キャンセル・論理削除分は枠を専有しない（APIのキャンセル処理と同じ扱い）。
UPDATE schedules s
SET reserved_count = COALESCE((
    SELECT COUNT(*)
    FROM reservations r
    WHERE r.store_id = s.store_id
      AND r.reservation_date = s.schedule_date
      AND r.reservation_time = s.start_time
      AND r.status IN ('pending', 'confirmed', 'completed')
      AND r.deleted_at IS NULL
), 0);

-- 満席の枠は予約不可にする
UPDATE schedules
SET is_available = (reserved_count < capacity);

-- ===========================================
-- 10. 臨時休業（手動で枠を閉じた状態の確認用）
-- ===========================================
-- 渋谷店の「1週間後以降で最初の営業日」の午後を休業扱いにする。
-- 定休日や日曜に当たると対象が消えてしまうため、日付を直接指定せず
-- 実在する営業日から選ぶ。
UPDATE schedules
SET is_available = FALSE,
    memo = '臨時休業（棚卸し）'
WHERE store_id = 1
  AND schedule_date = (
      SELECT MIN(schedule_date) FROM schedules
      WHERE store_id = 1 AND schedule_date >= CURRENT_DATE + 7
  )
  AND start_time >= TIME '13:00'
  AND reserved_count = 0;

-- ===========================================
-- テストデータ投入完了
-- ===========================================
