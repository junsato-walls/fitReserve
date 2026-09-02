# Swagger UI 動作確認ガイド

## 📍 アクセス

http://localhost:8000/docs

---

## 🔑 テストアカウント

パスワードは**全アカウント共通で `password`** です（`docker/postgres/initdb.d/02_testdata.sql`）。

| personal_id | ロール | 担当店舗 | 用途 |
|---|---|---|---|
| SYS001 | super_admin | 全店舗 | 会社マスタ管理、adminユーザーの作成 |
| ADM001 | admin | 全店舗 | マスタ管理、プロジェクト作成 |
| ADM002 | admin | 全店舗 | エリアマネージャー |
| EMP001 | staff | 渋谷店・新宿店 | 複数店舗を担当するケースの確認用 |
| EMP003 | readonly | 横浜店 | 参照のみのケースの確認用 |
| EMP008 | staff | 新宿店 | 無効アカウント（ログインできないことの確認用） |

**新規登録（サインアップ）はありません。** 認証不要でロールを指定してユーザーを作れると、
誰でも管理者アカウントを作成できてしまうためです。
ユーザーの作成は `POST /admin/users`（admin以上）で行います。

---

## 🚀 クイックスタート

### 1. ログイン

**POST /auth/login** でアクセストークンを取得します。

1. `POST /auth/login` を展開 → **Try it out**
2. サンプルデータが自動入力されます:
   ```json
   {
     "personal_id": "ADM001",
     "password": "password"
   }
   ```
3. **Execute** → レスポンスの `access_token` をコピー

### 2. Swagger UI に認証を通す

1. 画面右上の **Authorize** をクリック
2. コピーした `access_token` を貼り付けて **Authorize**
3. 以降のリクエストに `Authorization: Bearer ...` が自動で付きます

トークンの中身は **GET /auth/me** で確認できます（`role` と担当店舗 `store_ids`）。

---

## 🔐 権限の考え方

エンドポイントはURLのプレフィックスで必要な権限が決まります（`api/routers/__init__.py`）。

| プレフィックス | 必要な権限 | 担当店舗の絞り込み |
|---|---|---|
| `/auth` | なし | - |
| `/public` | なし | - |
| （なし） | readonly 以上 | **あり** |
| `/admin` | admin 以上 | なし（全店舗） |
| `/sysadmin` | super_admin | なし（全店舗） |

- ロールは階層です（`super_admin > admin > staff > readonly`）。上位は下位の操作をすべて行えます
- `staff` / `readonly` は `user_stores` に登録された店舗のデータしか見えません
- **担当外の店舗のデータは 403 ではなく 404** が返ります（IDの総当たりで存在を知られないため）
- 未ログインは 401、権限不足は 403 です

確認例: `EMP001`（渋谷店・新宿店）でログインして `GET /reservations` を実行すると、
その2店舗の予約しか返りません。`ADM001` なら全店舗が返ります。

---

## 📝 主なリクエストのサンプル

### 会社登録（super_admin のみ）

**POST /sysadmin/companies**

```json
{
  "slug": "example-co",
  "company_code": "C002",
  "name": "サンプル洋服株式会社",
  "name_kana": "サンプルヨウフク",
  "postal_code": "100-0001",
  "address": "東京都千代田区千代田1-1-1",
  "phone": "03-1234-5678"
}
```

`slug` は予約URL `/[company_slug]/[project_id]/[store_id]` の先頭に入ります（英小文字・数字・ハイフン）。

### 店舗登録（admin以上）

**POST /admin/stores**

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
  "is_enabled": true,
  "school_ids": [1, 2]
}
```

`school_ids` はその店舗が制服を**取り扱う学校**です（`store_schools`）。
顧客の予約フォームは「店舗を選んでから学校を選ぶ」流れなので、ここが空の店舗は学校を選べません。

### 学校登録（admin以上）

**POST /admin/schools**

```json
{
  "school_code": "SCH001",
  "name": "東京第一中学校",
  "name_kana": "トウキョウダイイチチュウガッコウ",
  "school_divisions_id": 2,
  "postal_code": "100-0001",
  "address": "東京都千代田区千代田2-1-1",
  "phone": "03-2345-6789",
  "is_enabled": true
}
```

`school_divisions_id` は学校区分マスタのIDです（`GET /admin/school-divisions` で取得）。

### プロジェクト登録（admin以上）

**POST /admin/projects**

```json
{
  "company_id": 1,
  "project_code": "PRJ2026",
  "name": "2026年度春季採寸会",
  "description": "新入生向け制服採寸プロジェクト",
  "reservation_interval": 30,
  "is_enabled": true,
  "created_by": 1,
  "updated_by": 1,
  "store_ids": [1, 2],
  "school_divisions": [
    { "school_divisions_id": 1, "start_date": "2026-03-01", "end_date": "2026-03-31" },
    { "school_divisions_id": 2, "start_date": "2026-03-10", "end_date": "2026-04-10" }
  ]
}
```

- **予約受付期間はプロジェクトではなく学校区分ごとに持ちます**。`school_divisions` に無い区分は受付対象外です
- `store_ids` を空にすると全店舗が対象になります
- 対象の学校はプロジェクトではなく**店舗**が持ちます（上記の `school_ids`）

### ユーザー登録（admin以上）

**POST /admin/users**

```json
{
  "personal_id": "staff001",
  "user_name": "佐藤一郎",
  "name_kana": "サトウイチロウ",
  "email": "sato@example.com",
  "role": "staff",
  "store_id": 1,
  "store_ids": [1, 2],
  "is_active": true,
  "password": "password123"
}
```

- `store_ids` が**権限の対象店舗**です。`staff` / `readonly` は最低1件必要（0件だとログインできても何も見えません）
- `store_id` は所属店舗で、画面表示に使うだけです
- `role` に `admin` / `super_admin` を指定できるのは **super_admin のみ**（admin が実行すると403）

### スケジュール登録（staff以上）

**POST /schedules**

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

担当外の店舗を指定すると404になります。

### 予約登録（認証不要・顧客向け）

**POST /public/reservations**

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

登録には次の条件をすべて満たす必要があります。
- 指定日時に空きのある `schedules` のレコードがある
- その店舗が指定学校の制服を取り扱っている（`store_schools`）
- 指定学校の区分がプロジェクトの受付期間内（`project_school_divisions`）

---

## 📋 APIエンドポイント一覧

### 認証（認証不要）
- `POST /auth/login` - ログイン（アクセストークン発行）
- `POST /auth/logout` - ログアウト
- `GET /auth/me` - ログイン中のユーザー情報

### 公開API（認証不要・顧客向け）
- `GET /public/projects/{id}` - 予約受付用のプロジェクト情報
- `GET /public/stores` / `GET /public/stores/{id}` - 店舗
- `GET /public/schools` - 学校（店舗・プロジェクトで絞り込み）
- `GET /public/school-divisions` - 学校区分
- `GET /public/schedules` - 空き状況
- `POST /public/reservations` - 予約登録
- `GET /public/reservations/{reservation_number}` - 予約番号で照会

### 予約管理（readonly以上・担当店舗のみ）
- `GET /reservations` - 予約一覧
- `GET /reservations/{id}` - 予約詳細
- `PUT /reservations/{id}` - 予約更新（staff以上）
- `DELETE /reservations/{id}` - 予約キャンセル（staff以上）

### スケジュール管理（readonly以上・担当店舗のみ）
- `GET /schedules` - スケジュール一覧
- `GET /schedules/availability` - 空き状況確認
- `GET /schedules/{id}` - スケジュール詳細
- `POST /schedules` - スケジュール作成（staff以上）
- `PUT /schedules/{id}` - スケジュール更新（staff以上）
- `DELETE /schedules/{id}` - スケジュール削除（staff以上）

### マスタ管理（admin以上）
- `GET /admin/companies` - 会社一覧（プロジェクトの所属会社の選択用）
- `GET|POST /admin/stores`, `GET|PUT|DELETE /admin/stores/{id}` - 店舗
- `GET|POST /admin/schools`, `GET|PUT|DELETE /admin/schools/{id}` - 学校
- `GET /admin/school-divisions` - 学校区分（参照のみの固定マスタ）
- `GET|POST /admin/projects`, `GET|PUT|DELETE /admin/projects/{id}` - プロジェクト
- `GET|POST /admin/users`, `GET|PUT|DELETE /admin/users/{id}` - ユーザー

### システム管理（super_admin のみ）
- `GET|POST /sysadmin/companies` - 会社一覧・作成
- `GET|PUT|DELETE /sysadmin/companies/{id}` - 会社詳細・更新・削除

---

## 🎯 動作確認フロー

1. **ログイン** — `POST /auth/login` を `SYS001` / `password` で実行し、**Authorize** にトークンを設定
2. **会社登録** — `POST /sysadmin/companies`
3. **ADM ユーザーでログインし直す** — 以降はマスタ管理なので `ADM001` で十分
4. **店舗登録** — `POST /admin/stores`（`school_ids` で取り扱い学校を指定）
5. **学校登録** — `POST /admin/schools`
6. **プロジェクト登録** — `POST /admin/projects`（`school_divisions` で区分ごとの受付期間を指定）
7. **スタッフ登録** — `POST /admin/users`（`role: staff`, `store_ids` を指定）
8. **スケジュール登録** — `POST /schedules` で予約枠を作成
9. **空き状況確認** — `GET /public/schedules`（顧客が見る画面と同じデータ）
10. **予約登録** — `POST /public/reservations`
11. **予約一覧確認** — 7で作ったスタッフでログインし直して `GET /reservations`。
    **担当店舗の予約だけが返ること**を確認する

---

## 💡 Tips

### サンプルデータの活用
- 主なPOST/PUTエンドポイントにはサンプルデータが設定済みです
- **Try it out** を押すと自動入力されます

### エラーが出た場合

| ステータス | 意味 | 主な原因 |
|---|---|---|
| 401 | 未認証 | トークン未設定・期限切れ。**Authorize** をやり直す |
| 403 | 権限不足 | ロールが足りない。上位ロールでログインし直す |
| 404 | 見つからない | IDが誤り。または**担当外の店舗のデータ**を要求している |
| 400 | 入力エラー | 重複するコード、担当店舗が空、受付期間外など |
| 422 | 形式エラー | 必須項目の未入力・型違い。`detail` に該当項目が出る |

データベースの確認:
```bash
docker exec -it fitreserve_db psql -U fitreserve_user -d fitreserve_db
```
```sql
SELECT id, personal_id, role FROM users;
SELECT * FROM user_stores;   -- 担当店舗
SELECT * FROM stores;
```

コンテナの再起動:
```bash
docker compose restart api
```

### ユーザーロール（role）
- `super_admin` - システム管理者（会社マスタ、adminユーザーの作成）
- `admin` - システム利用責任者（マスタ管理、プロジェクト作成、全店舗の予約更新）
- `staff` - 店舗責任者（担当店舗の予約・スケジュールの更新）
- `readonly` - 閲覧専用（担当店舗の予約の参照）

### 学校区分（school_divisions_id）
- `1` - 小学校
- `2` - 中学校
- `3` - 高等学校
- `4` - その他

### 予約ステータス（status）
- `pending` - 未確認
- `confirmed` - 確定
- `completed` - 完了
- `cancelled` - キャンセル

`completed` からは変更できません。`pending` から直接 `completed` にもできません（先に `confirmed` へ）。

### 性別（gender）
- `male` - 男性
- `female` - 女性
- `other` - その他

---

**作成日**: 2026-08-01  
**最終更新**: 2026-08-31
