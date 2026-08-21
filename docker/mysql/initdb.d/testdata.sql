-- INSERT INTO users (id, personal_id, user_name, name_kana, email, password, salt, admin, icon, memo)
-- VALUES
-- (1, 'U001', 'taro', 'タロウ', 'taro@example.com', 'hashed1', 'salt1', TRUE, 'https://example.com/icon1.png', '管理者ユーザー'),
-- (2, 'U002', 'hanako', 'ハナコ', 'hana@example.com', 'hashed2', 'salt2', FALSE, 'https://example.com/icon2.png', '一般ユーザー');

-- INSERT INTO channels (id, name, tag, is_enabled)
-- VALUES
-- (1, '営業部マニュアル', 'sales', true),
-- (2, '開発部マニュアル', 'dev', true);

-- INSERT INTO rel_channel_user (user_id, channel_id, admin, permission)
-- VALUES
-- (1, 1, TRUE, TRUE),
-- (2, 2, TRUE, FALSE);

-- INSERT INTO manuals (id, channel_id, title, description, step_title, tag, thumbnail, is_enabled, created_by, updated_by)
-- VALUES
-- (1, 1, '営業マニュアルv1', '訪問営業の基本手順', '営業ステップ', 'sales', 'aws.webp', TRUE, 1, 1),
-- (2, 2, '開発マニュアルv1', '開発作業の手順と注意点', '開発ステップ', 'dev', 'python.png', TRUE, 2, 2);

-- INSERT INTO steps (id, manual_id, step_no, title, contents, contents_text, created_by, updated_by)
-- VALUES
-- (1, 1, 1, '訪問準備', '顧客情報の確認', '営業前に顧客情報を十分に確認してください。', 1, 1),
-- (2, 2, 2, '開発環境構築', 'ローカル環境設定', '初期のローカル開発環境をセットアップします。', 2, 2);

-- INSERT INTO step_comments (id, user_id, step_id, comment, created_by)
-- VALUES
-- (1, 1, 1, '資料リンクも追加してください。'),
-- (2, 1, 2, '環境変数の例もあると助かります。');

-- INSERT INTO progress (user_id, manual_id, step_id, is_completed)
-- VALUES
-- (1, 1, 1, true),
-- (2, 2, 2, true);
INSERT INTO users (id, personal_id, user_name, name_kana, email, password, salt, admin, icon, memo)
VALUES
(1, 'U001', 'taro',  'タロウ', 'taro@example.com', 'hashed1', 'salt1', TRUE,  'https://example.com/icon1.png', '管理者ユーザー'),
(2, 'U002', 'hanako','ハナコ', 'hana@example.com', 'hashed2', 'salt2', FALSE, 'https://example.com/icon2.png', '一般ユーザー');

INSERT INTO channels (id, name, tag, is_enabled)
VALUES
(1, '営業部マニュアル', 'sales', TRUE),
(2, '開発部マニュアル', 'dev',   TRUE);

INSERT INTO rel_channel_user (user_id, channel_id, admin, permission)
VALUES
(1, 1, TRUE,  TRUE),
(2, 2, TRUE,  FALSE);

INSERT INTO manuals (id, channel_id, title, description, step_title, tag, thumbnail, is_enabled, created_by, updated_by)
VALUES
(1, 1, '営業マニュアルv1', '訪問営業の基本手順', '営業ステップ', 'sales', 'aws.webp',    TRUE, 1, 1),
(2, 2, '開発マニュアルv1', '開発作業の手順と注意点', '開発ステップ', 'dev',   'python.png', TRUE, 2, 2);

-- ★ contents は JSON を入れる（例：構造化オブジェクト）
INSERT INTO steps (id, manual_id, step_no, title, contents, contents_text, created_by, updated_by)
VALUES
(1, 1, 1, '訪問準備',
   JSON_OBJECT('type','text','body','顧客情報の確認'),
   '営業前に顧客情報を十分に確認してください。', 1, 1),
(2, 2, 2, '開発環境構築',
   JSON_OBJECT('type','text','body','ローカル環境設定'),
   '初期のローカル開発環境をセットアップします。', 2, 2);

-- ★ created_by の値を追加
INSERT INTO step_comments (id, user_id, step_id, comment)
VALUES
(1, 1, 1, '資料リンクも追加してください。'),
(2, 1, 2, '環境変数の例もあると助かります。');

INSERT INTO progress (user_id, manual_id, step_id, is_completed)
VALUES
(1, 1, 1, TRUE),
(2, 2, 2, TRUE);
