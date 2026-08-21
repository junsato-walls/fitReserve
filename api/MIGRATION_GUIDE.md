# fitReserve バックエンド移行ガイド

SPECIFICATION.mdの要件に基づき、バックエンドAPIを再構築しました。

## 📦 新規作成されたファイル

### スキーマ (schemas/)
- ✅ `schemas/stores.py` - 店舗マスタのスキーマ
- ✅ `schemas/schools.py` - 学校マスタのスキーマ
- ✅ `schemas/projects.py` - プロジェクトのスキーマ
- ✅ `schemas/reservations.py` - 予約のスキーマ
- ✅ `schemas/schedules.py` - スケジュールのスキーマ

### ルーター (routers/)

#### 管理者専用API (routers/admin/)
- ✅ `routers/admin/store.py` - 店舗管理API
- ✅ `routers/admin/school.py` - 学校管理API
- ✅ `routers/admin/project.py` - プロジェクト管理API
- ✅ `routers/admin/user.py` - ユーザー管理API

#### 公開API（認証不要） (routers/public/)
- ✅ `routers/public/__init__.py` - パッケージ初期化
- ✅ `routers/public/reservation.py` - 予約登録API（顧客向け）

#### 認証必須API (routers/generic/)
- ✅ `routers/generic/reservation.py` - 予約管理API（スタッフ向け）
- ✅ `routers/generic/schedule.py` - スケジュール管理API

### システム設定
- ✅ `system/api_router.py` - ルーター統合（public対応）

---

## ✅ 削除完了した旧ファイル

以下の旧マニュアルシステムのファイルは削除済みです。

### ルーター (routers/)
- ✅ `routers/admin/channel.py` - チャンネル管理（削除済み）
- ✅ `routers/generic/channel.py` - チャンネル（削除済み）
- ✅ `routers/generic/manual.py` - マニュアル（削除済み）
- ✅ `routers/generic/progress.py` - 進捗管理（削除済み）
- ✅ `routers/generic/rel_channel_user.py` - チャンネルユーザー関連（削除済み）
- ✅ `routers/generic/step.py` - ステップ（削除済み）
- ✅ `routers/generic/step_comment.py` - ステップコメント（削除済み）
- ✅ `routers/generic/user.py` - ユーザー（削除済み）

### スキーマ (schemas/)
- ✅ `schemas/step.py` - ステップスキーマ（削除済み）
- ✅ `schemas/generic/channels.py` - チャンネルスキーマ（削除済み）
- ✅ `schemas/generic/manuals.py` - マニュアルスキーマ（削除済み）
- ✅ `schemas/generic/progress.py` - 進捗スキーマ（削除済み）
- ✅ `schemas/generic/rel_channel_user.py` - チャンネルユーザースキーマ（削除済み）
- ✅ `schemas/generic/step_comment.py` - ステップコメントスキーマ（削除済み）

---

## 📋 APIエンドポイント一覧

### 公開API（認証不要）
```
POST   /api/v1/public/reservations        # 予約新規作成
GET    /api/v1/public/reservations/{number} # 予約番号で検索
```

### 認証必須API（スタッフ向け）
```
GET    /api/v1/reservations                # 予約一覧（フィルター付き）
GET    /api/v1/reservations/{id}           # 予約詳細
PUT    /api/v1/reservations/{id}           # 予約更新
DELETE /api/v1/reservations/{id}           # 予約キャンセル

GET    /api/v1/schedules                   # スケジュール一覧
GET    /api/v1/schedules/availability      # 空き状況確認
GET    /api/v1/schedules/{id}              # スケジュール詳細
POST   /api/v1/schedules                   # スケジュール作成
PUT    /api/v1/schedules/{id}              # スケジュール更新
DELETE /api/v1/schedules/{id}              # スケジュール削除
```

### 管理者専用API
```
# 店舗管理
GET    /api/v1/admin/stores                # 店舗一覧
GET    /api/v1/admin/stores/{id}           # 店舗詳細
POST   /api/v1/admin/stores                # 店舗作成
PUT    /api/v1/admin/stores/{id}           # 店舗更新
DELETE /api/v1/admin/stores/{id}           # 店舗削除

# 学校管理
GET    /api/v1/admin/schools               # 学校一覧
GET    /api/v1/admin/schools/{id}          # 学校詳細
POST   /api/v1/admin/schools               # 学校作成
PUT    /api/v1/admin/schools/{id}          # 学校更新
DELETE /api/v1/admin/schools/{id}          # 学校削除

# プロジェクト管理
GET    /api/v1/admin/projects              # プロジェクト一覧
GET    /api/v1/admin/projects/{id}         # プロジェクト詳細
POST   /api/v1/admin/projects              # プロジェクト作成
PUT    /api/v1/admin/projects/{id}         # プロジェクト更新
DELETE /api/v1/admin/projects/{id}         # プロジェクト削除

# ユーザー管理
GET    /api/v1/admin/users                 # ユーザー一覧
GET    /api/v1/admin/users/{id}            # ユーザー詳細
POST   /api/v1/admin/users                 # ユーザー作成
PUT    /api/v1/admin/users/{id}            # ユーザー更新
DELETE /api/v1/admin/users/{id}            # ユーザー削除
```

---

## 🚀 次のステップ

1. **✅ 不要ファイルの削除（完了）**
   旧マニュアルシステムのファイルは全て削除済みです。

2. **✅ ユーザー管理APIの更新（完了）**
   - `routers/admin/user.py` の実装を更新済み
   - `schemas/generic/users.py` の更新済み

3. **認証機能の統合**
   - `routers/custom/auth.py` は既存のものを使用
   - 必要に応じて権限チェック機能を追加

4. **動作確認**
   ```bash
   docker-compose up -d --build
   ```
   - Swagger UI で各APIをテスト: http://localhost:8000/docs

5. **テストデータ確認**
   - PostgreSQLに接続して初期データを確認
   ```bash
   docker exec -it fitreserve_db psql -U fitreserve_user -d fitreserve_db
   ```

---

## 📌 実装済み機能

### ✅ 完全実装
- 店舗管理API（CRUD完備）
- 学校管理API（CRUD完備）
- プロジェクト管理API（CRUD完備、店舗・学校関連対応）
- 予約登録API（公開、予約番号自動生成）
- 予約管理API（一覧、詳細、更新、キャンセル、ステータス遷移バリデーション）
- スケジュール管理API（CRUD完備、空き状況確認）
- ユーザー管理API（CRUD完備、ロール・所属店舗対応）

### ⚠️ 要実装
- 認証・権限チェックの統合
- メール通知機能（将来実装）
- レポート機能（将来実装）

---

**作成日**: 2026-08-01  
**最終更新**: 2026-08-01
