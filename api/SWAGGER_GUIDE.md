# Swagger UI 動作確認ガイド

## 📍 アクセス

http://localhost:8000/docs

## 🚀 クイックスタート

### 1. 新規ユーザー登録（サインアップ）

**POST /signup** を使って新規ユーザーを作成します。

1. `POST /signup` セクションを展開
2. **Try it out** をクリック
3. サンプルデータが自動入力されます:
   ```json
   {
     "personal_id": "staff001",
     "user_name": "佐藤一郎",
     "name_kana": "サトウイチロウ",
     "email": "sato@example.com",
     "role": "staff",
     "store_id": 1,
     "is_active": true,
     "password": "password123"
   }
   ```
4. **Execute** をクリック
5. レスポンスでユーザーIDが返されます

### 2. ログイン（認証）

**POST /login** でログインしてトークンを取得します。

1. `POST /login` セクションを展開
2. **Try it out** をクリック
3. サンプルデータが自動入力されます:
   ```json
   {
     "personal_id": "staff001",
     "password": "password123"
   }
   ```
4. **Execute** をクリック
5. アクセストークンが返されます

### 3. 各種マスタデータの登録

#### 店舗登録（管理者のみ）

**POST /admin/stores** で店舗を登録します。

サンプルデータ:
```json
{
  "store_code": "STORE001",
  "name": "東京本店",
  "name_kana": "トウキョウホンテン",
  "postal_code": "100-0001",
  "address": "東京都千代田区千代田1-1-1",
  "phone": "03-1234-5678",
  "email": "tokyo@example.com",
  "capacity": 5,
  "business_hours_start": "09:00:00",
  "business_hours_end": "18:00:00",
  "regular_holiday": "水曜日",
  "description": "東京エリアの本店です",
  "is_enabled": true
}
```

#### 学校登録（管理者のみ）

**POST /admin/schools** で学校を登録します。

サンプルデータ:
```json
{
  "school_code": "SCH001",
  "name": "東京第一中学校",
  "name_kana": "トウキョウダイイチチュウガッコウ",
  "school_type": "junior_high",
  "postal_code": "100-0001",
  "address": "東京都千代田区千代田2-1-1",
  "phone": "03-2345-6789",
  "description": "千代田区の中学校",
  "is_enabled": true
}
```

#### プロジェクト登録（管理者のみ）

**POST /admin/projects** でプロジェクトを登録します。

サンプルデータ:
```json
{
  "project_code": "PRJ2026",
  "name": "2026年度春季採寸会",
  "description": "新入生向け制服採寸プロジェクト",
  "start_date": "2026-03-01",
  "end_date": "2026-03-31",
  "reservation_interval": 30,
  "is_enabled": true,
  "created_by": 1,
  "updated_by": 1,
  "store_ids": [1, 2],
  "school_ids": [1, 2, 3]
}
```

#### スケジュール登録（スタッフ）

**POST /schedules** で予約枠を登録します。

サンプルデータ:
```json
{
  "store_id": 1,
  "schedule_date": "2026-03-15",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "capacity": 3,
  "is_available": true,
  "memo": "午前の枠",
  "created_by": 1,
  "updated_by": 1
}
```

### 4. 予約登録（顧客向け・認証不要）

**POST /public/reservations** で予約を登録します。

サンプルデータ:
```json
{
  "project_id": 1,
  "store_id": 1,
  "school_id": 1,
  "reservation_date": "2026-03-15",
  "reservation_time": "10:00:00",
  "customer_name": "山田太郎",
  "customer_name_kana": "ヤマダタロウ",
  "gender": "male",
  "grade": 1,
  "height": 165.5,
  "weight": 55.0,
  "foot_size": 26.5,
  "phone": "090-1234-5678",
  "email": "yamada@example.com",
  "guardian_name": "山田花子",
  "memo": "午前中希望"
}
```

## 📋 APIエンドポイント一覧

### 認証・ユーザー管理
- `POST /signup` - サインアップ（新規ユーザー登録）
- `POST /login` - ログイン
- `POST /logout` - ログアウト
- `GET /admin/users` - ユーザー一覧
- `POST /admin/users` - ユーザー作成
- `PUT /admin/users/{id}` - ユーザー更新
- `DELETE /admin/users/{id}` - ユーザー削除

### 店舗管理（管理者専用）
- `GET /admin/stores` - 店舗一覧
- `GET /admin/stores/{id}` - 店舗詳細
- `POST /admin/stores` - 店舗作成
- `PUT /admin/stores/{id}` - 店舗更新
- `DELETE /admin/stores/{id}` - 店舗削除

### 学校管理（管理者専用）
- `GET /admin/schools` - 学校一覧
- `GET /admin/schools/{id}` - 学校詳細
- `POST /admin/schools` - 学校作成
- `PUT /admin/schools/{id}` - 学校更新
- `DELETE /admin/schools/{id}` - 学校削除

### プロジェクト管理（管理者専用）
- `GET /admin/projects` - プロジェクト一覧
- `GET /admin/projects/{id}` - プロジェクト詳細
- `POST /admin/projects` - プロジェクト作成
- `PUT /admin/projects/{id}` - プロジェクト更新
- `DELETE /admin/projects/{id}` - プロジェクト削除

### スケジュール管理（認証必須）
- `GET /schedules` - スケジュール一覧
- `GET /schedules/availability` - 空き状況確認
- `GET /schedules/{id}` - スケジュール詳細
- `POST /schedules` - スケジュール作成
- `PUT /schedules/{id}` - スケジュール更新
- `DELETE /schedules/{id}` - スケジュール削除

### 予約管理

#### 公開API（認証不要）
- `POST /public/reservations` - 予約登録
- `GET /public/reservations/{reservation_number}` - 予約番号で検索

#### 認証必須API（スタッフ向け）
- `GET /reservations` - 予約一覧
- `GET /reservations/{id}` - 予約詳細
- `PUT /reservations/{id}` - 予約更新
- `DELETE /reservations/{id}` - 予約キャンセル

## 🎯 動作確認フロー

### 完全な予約フローの確認

1. **管理者でサインアップ**
   - `POST /signup` で管理者ユーザーを作成（role: admin）

2. **ログイン**
   - `POST /login` でログイン

3. **店舗登録**
   - `POST /admin/stores` で店舗を作成

4. **学校登録**
   - `POST /admin/schools` で学校を作成

5. **プロジェクト登録**
   - `POST /admin/projects` でプロジェクトを作成

6. **スタッフ登録**
   - `POST /admin/users` でスタッフユーザーを作成（role: staff, store_id指定）

7. **スケジュール登録**
   - `POST /schedules` で予約枠を作成

8. **空き状況確認**
   - `GET /schedules/availability` で空き状況を確認

9. **予約登録（顧客として）**
   - `POST /public/reservations` で予約を作成

10. **予約一覧確認**
    - `GET /reservations` で予約一覧を確認

## 💡 Tips

### サンプルデータの活用
- すべてのPOST/PUTエンドポイントにサンプルデータが設定済み
- **Try it out** ボタンを押すだけで自動入力されます

### エラーが出た場合
1. データベースの状態を確認
   ```bash
   docker exec -it fitreserve_db psql -U fitreserve_user -d fitreserve_db
   ```

2. テーブルのデータを確認
   ```sql
   SELECT * FROM stores;
   SELECT * FROM schools;
   SELECT * FROM projects;
   SELECT * FROM users;
   ```

3. コンテナを再起動
   ```bash
   docker-compose restart
   ```

### 学校区分（school_type）
- `elementary` - 小学校
- `junior_high` - 中学校
- `high` - 高校
- `other` - その他

### ユーザーロール（role）
- `admin` - 管理者（全権限）
- `staff` - スタッフ（店舗限定）
- `readonly` - 閲覧専用

### 予約ステータス（status）
- `pending` - 未確認
- `confirmed` - 確定
- `completed` - 完了
- `cancelled` - キャンセル

### 性別（gender）
- `male` - 男性
- `female` - 女性
- `other` - その他

---

**作成日**: 2026-08-01  
**最終更新**: 2026-08-01
