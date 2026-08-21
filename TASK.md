# フロントエンド画面作成タスク

fitReserve予約管理システムのフロントエンド画面作成タスク一覧

**作成日**: 2026-08-05  
**最終更新**: 2026-08-19（P0〜P2 完了）  
**参照**: [SPECIFICATION.md](./docs/SPECIFICATION.md)

> ✅ **ステータス**: 2026-08-18 時点では画面は実装済みだったが**ビルドが通らずAPI接続も全滅**していた。
> **2026-08-19 に P0（動作必須）・P1（実害バグ）・P2（品質改善）をすべて完了**。
> 型エラー0件 / ESLintクリーン / 本番ビルド成功 / 全API疎通確認済み。
> 経緯と実施内容は **[7章](#7-修正が必要な箇所2026-08-18-調査結果)**、最終状態は **[8章](#8-最終状態2026-08-19)** を参照。

---

## タスクステータス

- ✅ 完了
- 🚧 作業中
- ⏳ 未着手

---

## 1. 顧客向け画面（認証不要）

### ✅ 1-1. 予約フォーム (`/reservations/new`)

**画面概要**: 顧客が採寸予約を新規登録するフォーム

**主要機能**:
- プロジェクト選択ドロップダウン
- 店舗選択ドロップダウン（プロジェクトに紐づく店舗のみ）
- 学校選択ドロップダウン（プロジェクトに紐づく学校のみ）
- カレンダー表示（空き状況確認）
- 時間帯選択（〇予約可能/×予約不可）(時間は予約時間間隔の設定値による)20分単位、30分単位、1時間単位
- 顧客情報入力フォーム（氏名、電話番号、メールなど）
- 採寸情報入力（身長、体重、足のサイズ）
- 確認画面
- 完了画面（予約番号表示）

**実装状況**:
- ✅ バックエンドAPI作成（GET /public/projects, stores, schools, schedules, POST /public/reservations）
- ✅ Server Actions作成（Reservation.ts）
- ✅ コンポーネント作成（ReservationForm.tsx）
- ✅ ページ作成（/reservations/new/page.tsx）

**優先度**: 🔴 高（顧客向けのメイン機能）

---

### ✅ 1-2. 予約確認 (`/reservations/check`)

**画面概要**: 予約番号で予約内容を確認する画面

**主要機能**:
- 予約番号入力フォーム
- 予約詳細表示（氏名、日時、店舗、学校、ステータス）

**実装状況**:
- ✅ バックエンドAPI確認（GET /public/reservations/{reservation_number}）
- ✅ Server Actions作成（getReservationByNumber）
- ✅ コンポーネント作成（ReservationCheck.tsx）
- ✅ ページ作成（/reservations/check/page.tsx）

**優先度**: 🟡 中

---

## 2. スタッフ向け画面（認証必要）

### ✅ 2-1. ダッシュボード (`/staff`)

**画面概要**: スタッフ向けダッシュボード（本日の予約件数、ステータス別件数など）

**主要機能**:
- 本日の予約件数表示
- 今週の予約件数表示
- ステータス別件数（pending/confirmed/completed/cancelled）
- 最近の予約一覧（5件程度）

**実装状況**:
- ✅ Server Actions作成（getReservationsForStaff）
- ✅ コンポーネント作成（StaffDashboard.tsx）
- ✅ ページ作成（/staff/page.tsx）

**API**:
- `GET /reservations` - 予約一覧（フィルター機能使用）

**優先度**: 🟡 中

---

### ✅ 2-2. 予約一覧 (`/staff/reservations`)

**画面概要**: 予約の一覧表示・検索・フィルター

**主要機能**:
- 予約一覧テーブル（予約番号、日時、顧客名、学校、ステータス）
- 検索フィルター（日付範囲、店舗、学校、ステータス）
- ページネーション
- 予約詳細へのリンク

**実装状況**:
- ✅ Server Actions作成（getReservationsForStaff）
- ✅ コンポーネント作成（StaffReservationList.tsx）
- ✅ ページ作成（/staff/reservations/page.tsx）

**API**:
- `GET /reservations` - 予約一覧取得（フィルター、ソート、ページネーション）

**優先度**: 🔴 高

---

### ✅ 2-3. 予約詳細 (`/staff/reservations/[id]`)

**画面概要**: 予約の詳細表示・編集・ステータス変更

**主要機能**:
- 予約情報表示（全項目）
- ステータス変更ボタン（pending→confirmed→completed、または cancelled）
- キャンセルボタン（確認ダイアログ付き）

**実装状況**:
- ✅ Server Actions作成（getReservationDetail, updateReservation, cancelReservation）
- ✅ コンポーネント作成（StaffReservationDetail.tsx）
- ✅ ページ作成（/staff/reservations/[id]/page.tsx）

**API**:
- `GET /reservations/{id}` - 予約詳細取得
- `PUT /reservations/{id}` - 予約更新
- `DELETE /reservations/{id}` - 予約キャンセル

**優先度**: 🔴 高

---

### ✅ 2-4. スケジュール管理 (`/staff/schedules`)

**画面概要**: スケジュール枠の一覧表示・登録・編集・削除（基本機能）

**主要機能**:
- スケジュール一覧テーブル（日付、時間帯、店舗、受付可能数、予約済数、残り枠数）
- フィルター機能（店舗、日付範囲、予約可否）
- 単一スケジュール登録フォーム（店舗、日付、開始時刻、終了時刻、受付可能数、備考）
- スケジュール編集（受付可能数は予約済数以上に制限）
- スケジュール削除（予約が入っている場合は削除不可）
- 空き状況の視覚的表示（残り枠数で色分け）

**実装状況**:
- ✅ 型定義作成（schedule.ts）
- ✅ Server Actions作成（Schedule.ts）
- ✅ コンポーネント作成（StaffScheduleList.tsx）
- ✅ ページ作成（/staff/schedules/page.tsx）

**API**:
- `GET /schedules` - スケジュール一覧（フィルター: store_id, date_from, date_to, is_available）
- `GET /schedules/{id}` - スケジュール詳細取得
- `POST /schedules` - スケジュール登録（重複チェックあり）
- `PUT /schedules/{id}` - スケジュール更新
- `DELETE /schedules/{id}` - スケジュール削除（論理削除）

**将来的な拡張**（Phase 3以降）:
- カレンダービュー（月次・週次・日次）
- 一括登録機能（日付範囲＋時間間隔指定）
- ドラッグ&ドロップ編集

**優先度**: 🟡 中

---

## 3. 管理者向け画面（認証必要・admin権限）

### ✅ 3-1. 店舗管理 (`/admin/stores`)

**画面概要**: 店舗マスタの一覧・登録・編集・削除

**主要機能**:
- 店舗一覧テーブル（店舗コード、店舗名、住所、電話番号、有効フラグ）
- 新規登録ボタン
- 編集ボタン
- 削除ボタン（論理削除）
- 店舗登録フォーム（全項目）

**実装状況**:
- ✅ 型定義作成（admin.ts - Store, StoreCreate, StoreUpdate）
- ✅ Server Actions作成（Store.ts）
- ✅ コンポーネント作成（StoreManagement.tsx）
- ✅ ページ作成（/admin/stores/page.tsx）

**API**:
- `GET /admin/stores` - 店舗一覧
- `POST /admin/stores` - 店舗登録
- `PUT /admin/stores/{id}` - 店舗更新
- `DELETE /admin/stores/{id}` - 店舗削除

**優先度**: 🔴 高

---

### ✅ 3-2. 学校管理 (`/admin/schools`)

**画面概要**: 学校マスタの一覧・登録・編集・削除

**主要機能**:
- 学校一覧テーブル（学校コード、学校名、学校区分、住所、有効フラグ）
- 新規登録ボタン
- 編集ボタン
- 削除ボタン（論理削除）
- 学校登録フォーム（全項目）

**実装状況**:
- ✅ 型定義作成（admin.ts - School, SchoolCreate, SchoolUpdate）
- ✅ Server Actions作成（School.ts）
- ✅ コンポーネント作成（SchoolManagement.tsx）
- ✅ ページ作成（/admin/schools/page.tsx）
  ※テーブル・フォームは SchoolManagement.tsx 内にインライン実装（独立コンポーネントは無し）

**API**:
- `GET /admin/schools` - 学校一覧
- `POST /admin/schools` - 学校登録
- `PUT /admin/schools/{id}` - 学校更新
- `DELETE /admin/schools/{id}` - 学校削除

**優先度**: 🔴 高

---

### ✅ 3-3. プロジェクト管理 (`/admin/projects`)

**画面概要**: プロジェクトの一覧・登録・編集・削除

**主要機能**:
- プロジェクト一覧テーブル（コード、名前、期間、有効フラグ）
- 新規登録ボタン
- 編集ボタン
- 削除ボタン（論理削除）
- プロジェクト登録フォーム（全項目）
- 対象店舗選択（複数選択可）
- 対象学校選択（複数選択可）

**実装状況**:
- ✅ 型定義作成（admin.ts - Project, ProjectCreate, ProjectUpdate）
- ✅ Server Actions作成（Project.ts）
- ✅ コンポーネント作成（ProjectManagement.tsx - Checkbox UI使用）
- ✅ ページ作成（/admin/projects/page.tsx）
  ※複数店舗・学校の選択は ProjectManagement.tsx 内に Checkbox でインライン実装

**API**:
- `GET /admin/projects` - プロジェクト一覧
- `POST /admin/projects` - プロジェクト登録
- `PUT /admin/projects/{id}` - プロジェクト更新
- `DELETE /admin/projects/{id}` - プロジェクト削除

**優先度**: 🔴 高

---

### ✅ 3-4. ユーザー管理 (`/admin/users`)

**画面概要**: スタッフアカウントの一覧・登録・編集・削除

**主要機能**:
- ユーザー一覧テーブル（社員番号、ユーザー名、氏名、権限、所属店舗、有効フラグ）
- 新規登録ボタン
- 編集ボタン
- 削除ボタン（論理削除）
- ユーザー登録フォーム（全項目）

**実装状況**:
- ✅ 型定義作成（admin.ts - User, UserCreate, UserUpdate）
- ✅ Server Actions作成（User.ts）
- ✅ コンポーネント作成（UserManagement.tsx）
- ✅ ページ作成（/admin/users/page.tsx）

**API**:
- `GET /admin/users` - ユーザー一覧
- `POST /admin/users` - ユーザー登録
- `PUT /admin/users/{id}` - ユーザー更新
- `DELETE /admin/users/{id}` - ユーザー削除

**優先度**: 🟡 中

---

## 4. 共通機能

### ✅ 4-1. ログイン (`/login`)

**ステータス**: 既存（要確認・改修の可能性あり）

---

### ✅ 4-2. サインアップ (`/signup`)

**ステータス**: 既存（要確認・改修の可能性あり）

---

### ✅ 4-3. レイアウト・ナビゲーション

**実装状況**:
- ✅ コンポーネント作成（Sidebar.tsx - ロール別メニュー表示）
- ✅ コンポーネント作成（Breadcrumb.tsx - 自動パンくずリスト）
- ✅ コンポーネント作成（StaffLayout.tsx - サイドバー＋パンくず統合）
- ✅ 全ページへのレイアウト適用完了

**必要なコンポーネント**:
- ✅ `Sidebar` - サイドバーメニュー（権限別表示）
- ✅ `Breadcrumb` - 自動パンくずリスト
- ✅ `StaffLayout` - 統合レイアウト
- ➖ `Header` - 旧システムのHeader.tsxはSidebarと重複するため削除（2026-08-19）
- ⏳ `Footer` - フッター（必要に応じて）

**優先度**: 🔴 高

---

### ✅ 4-4. エラーハンドリング

**実装状況**（2026-08-18 調査で実装済みを確認）:
- ✅ `app/src/app/error.tsx`（100行） - エラー境界（`'use client'` + `error`/`reset`）
- ✅ `app/src/app/not-found.tsx`（100行） - 404ページ
- ✅ `app/src/app/loading.tsx`（18行） - ローディング
- ✅ `global-error.tsx` - 作成済み（2026-08-19）
- ⏳ セグメント単位の `error.tsx` / `loading.tsx` - 未作成（ルートのみ）

**優先度**: 🟡 中

---

## 5. 開発順序の推奨

### フェーズ1: 基礎（管理者向け）
1. ✅ ログイン・認証（既存）
2. 店舗管理 (`/admin/stores`) - マスタデータの基盤
3. 学校管理 (`/admin/schools`) - マスタデータの基盤
4. プロジェクト管理 (`/admin/projects`) - 予約の前提条件

### フェーズ2: 顧客向け（メイン機能）
5. 予約フォーム (`/reservations/new`) - 最重要機能
6. 予約確認 (`/reservations/check`)

### フェーズ3: スタッフ向け
7. 予約一覧 (`/reservations`) - 予約管理の基本
8. 予約詳細 (`/reservations/[id]`) - 予約管理の基本
9. ダッシュボード (`/`)

### フェーズ4: 追加機能
10. スケジュール管理 (`/schedules`)
11. ユーザー管理 (`/admin/users`)
12. 共通レイアウト・ナビゲーション改善

---

## 6. 技術要件

### コーディング規約
- [CODING_CONVENTIONS_FRONTEND.md](./docs/CODING_CONVENTIONS_FRONTEND.md) に準拠

### 主要ルール
- コンポーネント: `export const ComponentName = () =>` 形式
- ページ: `export default async function PageName()` 形式
- Server Actions: ファイル先頭に `"use server"`
- 拡張子: コンポーネント `.tsx`、Server Actions `.ts`

### 使用ライブラリ
- UI: shadcn/ui
- スタイリング: Tailwind CSS + `cn()` ユーティリティ
- フォーム: React Hook Form（推奨）
- バリデーション: Zod（推奨）
- 日付: date-fns または dayjs
- カレンダー: react-big-calendar または shadcn/ui Calendar

---

## 7. 修正が必要な箇所（2026-08-18 調査結果）

### 調査サマリ

**画面・コンポーネントはすべて実装済み**（スタブは1つも無し）。`ReservationForm.tsx` 591行、`StaffScheduleList.tsx` 535行など作り込まれている。
一方で **フロントとバックエンドの接続部分が全滅しており、現状はビルドも起動もできない**。
上記1〜4章の ✅ は「画面が作られたか」としては正しいが、「動作するか」は別問題である。

**方針決定**（2026-08-18）:
- スタッフAPIのパス二重問題は **バックエンド側を1行修正** して解決する
- 今回のスコープは **「まず動く状態まで」= 下記 🔴 P0 の6件**

---

### ✅ 🔴 P0: 動作に必須（2026-08-19 完了）

**すべて修正済み。以下の状態を実機で確認した。**

| 検証項目 | 結果 |
|---|---|
| TypeScript型エラー | **0件**（修正前: 構文エラー11件＋隠れていた型エラー41件） |
| バックエンドAPI疎通 | 認証・公開・スタッフ・管理者API **全て200** |
| ログイン | `POST /auth/login` **200**（修正前の方式は422） |
| 画面表示 | 全画面 **200**、未ログイン時は `/staff`・`/admin/*` のみ307で`/login`へ |
| 公開画面 | `/reservations/new`・`/reservations/check` が**未ログインで200** |
| Server Actions | 全10種が**実データ取得成功**（公開4・スタッフ2・管理者4） |
| dev サーバーエラー | **0件** |

> 調査時点では判明しておらず、実機検証で追加発見した問題が2件あった（P0-7・P0-8）。とくにP0-7は**全ページ404**の直接原因だった。

---

#### ⏳ P0-1. ビルドが通らない（構文エラー）

**対象**: `app/src/app/signup/page.tsx` の **145〜172行目**

shadcn/ui へリファクタした際の**旧実装の消し残し**がトップレベルに残存。コンポーネント本体は143行目で正常に閉じており、以降28行は完全な残骸。

```
signup/page.tsx(147,13): error TS1136: Property assignment expected.
...計11件の構文エラー
```

**修正**: 145〜172行目を**丸ごと削除**。同内容（パスワード確認欄・エラー表示・送信ボタン・ログインリンク）は110〜137行目に shadcn/ui 版として実装済みのため機能欠落なし。

> ⚠️ `tsc` は構文エラーがあると型チェック段階に進まないため、**この修正後に `npx tsc --noEmit` を再実行して隠れた型エラーを洗い出す必要がある**。

---

#### ⏳ P0-2. スタッフAPIのパスが全て404（バックエンド修正）

**原因**: `api/system/api_router.py` の `load_modules()` は `route_prefix=None` のときモジュール名をプレフィックスに自動付与する（45〜49行目）。generic のみこれが効いて**パスが二重**になっている。

起動中のバックエンドの `/openapi.json` で確認した実パス:

| フロントが呼ぶパス | バックエンドの実パス |
|---|---|
| `/reservations` | `/reservation/reservations` |
| `/schedules` | `/schedule/schedules` |

**修正**: `api/system/api_router.py:55` を1行変更

```python
- load_modules(generic_path, "routers.generic", None)   # 認証必須API
+ load_modules(generic_path, "routers.generic", "")     # 認証必須API
```

修正後は `/reservations`, `/schedules` となり、仕様書・`MIGRATION_GUIDE.md`・フロントの想定すべてと一致する。バックエンドの再起動が必要。

> 補足: `/admin/*` と `/public/*` は正しく一致している。`MIGRATION_GUIDE.md` に書かれた `/api/v1` プレフィックスは**実際には存在しない**（同文書の記載が誤り）。

---

#### ⏳ P0-3. ログインが必ず失敗する（422）

バックエンド `api/routers/custom/auth.py:79-84` は `form_data: OAuth2PasswordRequestFormCustom = Body(...)` で **JSONボディ** を要求。
一方フロントは**3箇所すべてクエリ文字列**で送信しており、ボディが空のため 422。パスワードがURLに載る点もセキュリティ上の問題。

**修正対象**:
- `app/src/actions/Auth.ts:30-32`
- `app/src/app/api/auth/login/route.ts:11-15`
- `app/src/app/login/page.tsx:24-32`

**修正**: `{ personal_id, password }` を JSON ボディで POST する形に統一。

---

#### ⏳ P0-4. 環境変数欠落でURLが壊れる

`app/.env` に **`NEXT_PUBLIC_API_URL` が未定義**（定義されているのは `API_URL` のみ）。
`app/src/lib/api.ts:14` のフォールバック `'http://localhost:8000/'`（末尾スラッシュ）と連結され `http://localhost:8000//public/projects` になる。

さらに **先頭スラッシュの有無が不統一**で、どちらの値を設定しても必ずどこかが壊れる:
- 他のActions: `"/public/projects"`（先頭スラッシュ**あり**）
- `Auth.ts:31,105`: `"auth/login"`, `"auth/me"`（先頭スラッシュ**なし**）

**修正**:
1. `app/.env` に `NEXT_PUBLIC_API_URL=http://localhost:8000`（末尾スラッシュ**なし**）を追加
2. `app/src/actions/Auth.ts:31,105` を先頭スラッシュ付きに統一

---

#### ⏳ P0-5. クエリパラメータが送信されない

`app/src/lib/api.ts` の `ApiOptions`（3〜6行目）に `params` が無く、`apiCall()`（39〜91行目）もURLに反映していない。
しかし Server Actions は `api.get(path, { params })` を多用（`Reservation.ts:43,64,88,167` / `Schedule.ts:22` / `Store.ts:19` / `School.ts:19` / `Project.ts:19` / `User.ts:19`）。

**影響**:
1. `strict: true` の余剰プロパティチェックで**型エラー**
2. クエリが送られないため、`store_id`/`start_date`/`end_date` が `Query(...)` 必須の `/public/schedules` が **422** → **予約フォームの空き枠取得が機能しない**

**修正**: `ApiOptions` に `params?: Record<string, unknown>` を追加し、`URLSearchParams` でURLに連結する。

---

#### ⏳ P0-6. 顧客向け画面が未ログインで開けない

`app/src/middleware.ts:12-21` の認証不要パス除外リストに `/reservations` が無く、matcher（35行目）が実質全パスを対象にしている。
そのため**認証不要のはずの** `/reservations/new`・`/reservations/check`、およびトップページ `/` が `/login` にリダイレクトされる。

**修正**: 除外リストに `pathname.startsWith("/reservations")` を追加。

---

#### ✅ P0-7. 空の `app/app/` が全ページを404にしていた（実機検証で発見）

**現象**: dev サーバー起動後、`/login` を含む**全ページが404**。

**原因**: プロジェクトルート直下に空の `app/app/` ディレクトリが存在していた。
Next.js は `app/` と `src/app/` の両方がある場合 **`app/` を優先し `src/app/` を完全に無視する**。
中身が0ファイルだったため、全ルートが存在しない状態になっていた。

**修正**: `app/app/` を削除（ファイル0件のため影響なし）。`.next` キャッシュを削除して再起動。

> 事前調査では「空ディレクトリなので無害」と判断していたが、実際にはルーティングを完全に破壊していた。**起動して確認しないと分からない類の問題**だった。

---

#### ✅ P0-8. DELETE系APIが必ず失敗していた（コード確認で発見）

**原因**: `app/src/lib/api.ts` が全レスポンスに対し無条件で `response.json()` を実行していた。
バックエンドの削除APIは **204 No Content**（ボディ無し）を返すため、JSONパースが例外になり、
削除が成功していても**フロント側は必ず失敗扱い**になっていた。

**修正**: 204 と非JSONレスポンスを判定してパースをスキップするよう `apiCall()` を修正。

---

### 実施した修正の一覧（2026-08-19）

| ファイル | 内容 |
|---|---|
| `api/system/api_router.py` | generic を `route_prefix=""` に変更。あわせて `if route_prefix:` → `if route_prefix is not None:` に修正（**空文字はfalsyのため、条件を直さないと1行変更が効かなかった**） |
| `app/src/app/signup/page.tsx` | 旧実装の残骸145〜172行を削除。API URL連結のスラッシュ修正 |
| `app/src/lib/api.ts` | `params`のクエリ文字列化、BASE_URL末尾スラッシュ正規化、先頭スラッシュ有無の吸収、204対応、FastAPIの`detail`をエラーに載せる、FormData時のContent-Type自動化 |
| `app/src/actions/Auth.ts` | ログインをJSONボディ化。`/auth/me`依存をやめ、**JWTペイロードから`getCurrentUser()`を実装** |
| `app/src/app/api/auth/login/route.ts`<br>`app/src/app/login/page.tsx` | ログインをJSONボディ送信に統一 |
| `app/.env` | `NEXT_PUBLIC_API_URL=http://localhost:8000` を追加 |
| `app/src/middleware.ts` | 認証不要パスに `/reservations` を追加 |
| `app/src/types/admin.ts` | `Project`に`store_ids`/`school_ids`追加、`reservation_interval`を任意化 |
| `app/src/actions/Project.ts`<br>`app/src/actions/Schedule.ts` | `created_by`/`updated_by`を**ログインユーザーから自動補完**。エラー抽出を修正 |
| `app/src/actions/Store.ts`,`School.ts`,`User.ts`,`Reservation.ts` | axios用の`error.response?.data?.detail`（常に効かない）を修正、`any`除去（計21箇所） |
| `app/src/components/.../UserManagement.tsx` | `name`→`user_name`、存在しない`phone`を削除しフリガナ表示に変更、ロール`viewer`→`readonly` |
| `app/src/components/.../ProjectManagement.tsx` | 予約時間間隔（20/30/60分）の選択UIを追加 |
| `app/src/components/.../ReservationForm.tsx`<br>`ReservationCheck.tsx` | `customer_kana`→`customer_name_kana`、学年を数値入力に修正 |
| `app/src/components/.../StaffScheduleList.tsx` | `created_by: 1`のハードコードを解消（P1-3も完了） |
| `app/src/components/features/user/UserInfo.tsx` | Breadcrumbのimport/props修正 |
| 削除 | `app/app/`（空・全404の原因）、`app/src/components/zdelete/`（参照0件） |

---
### ✅ 🟡 P1: 実害のあるバグ（2026-08-19 完了）

| # | 内容 | 対応 |
|---|---|---|
| P1-1 | 日付がJSTで1日ずれる | `src/lib/formatDate.ts` に `formatDateForApi()` を新設し、`toISOString()` を全廃（**調査時の3箇所ではなく実際は6箇所**あった） |
| P1-2 | `/auth/me` が存在しない | `actions/Auth.ts` をJWTデコード方式に変更。依存していた `lib/auth.ts`・`hooks/useMe.ts`・`api/user/` は旧システム由来のため削除 |
| P1-3 | `created_by: 1` のハードコード | Server Action側でログインユーザーから補完 |
| P1-4 | `getClientToken` のデッドコード | 削除。httpOnly Cookieはサーバー側でのみ読む方針をコメントで明示 |
| P1-5 | ログアウトCookieの属性非対称 | 発行・失効の3箇所すべてを `secure: process.env.NODE_ENV === "production"` で統一 |
| P1-6 | バックエンドの権限チェック未実装 | `system/auth.py` に `require_admin` / `require_staff` / `require_viewer` を追加し全ルーターに適用。**さらに middleware でも `/admin` を管理者限定にした** |

---

### ✅ 🟢 P2: 整理・品質改善（2026-08-19 完了）

| # | 内容 | 対応 |
|---|---|---|
| P2-1 | 型定義の重複 | 「重複」ではなく**公開API用と管理API用で別スキーマ**と判明。`types/reservation.ts` 側を `StorePublic`/`SchedulePublic`/`SchoolPublic`/`ProjectPublic` にリネームして区別を明確化。`StaffReservationList` 内のローカル型定義も共通型に統合 |
| P2-2 | 旧システムの残骸削除 | `zdelete/`・空の`app/app/`・`api/step_comment/`・`api/user/`・`app/user/`・`features/user/`・`hooks/useMe.ts`・`lib/auth.ts`・`Header.tsx`(362行) を削除。404ページの旧リンク（/manuals・/profile・/contact）も差し替え |
| P2-3 | ルートレイアウトが旧Headerを描画 | `layout.tsx` から除去。metadataの説明文も「制服採寸の予約管理システム」に修正 |
| P2-4 | `/admin` だけレイアウト非適用 | `StaffLayout` を適用。旧チャンネル管理だった `AdminDashboard.tsx` をマスタ件数サマリ＋各管理画面へのリンクに作り直し |
| P2-5 | lintエラーでビルド失敗 | `any` を全廃（21箇所）、未使用変数を削除、exhaustive-depsは意図をコメントで明示。**`No ESLint warnings or errors` かつ `npm run build` 成功** |
| P2-6 | .envにシークレットが平文 | `.env` は既に`.gitignore`済みだった。古い認証情報をローカル用の`minioadmin`に置換し、未使用の旧変数を削除。`api/.env`の旧MySQL設定も現行構成に修正 |
| P2-7 | バリデーション不在 | **zodを導入**し `src/lib/validation.ts` にPydantic制約と対応するスキーマを定義。店舗・学校・プロジェクト・ユーザー・スケジュール・予約の全フォームで送信前検証を実施 |
| P2-8 | 予約のレースコンディション | 空き確認〜`reserved_count`加算を `with_for_update()` の行ロックで直列化。予約番号の採番も `pg_advisory_xact_lock` で排他制御 |
| P2-9 | 本ドキュメントの誤記 | 3章の `SchoolTable`/`SchoolForm`/`MultiStoreSelector`/`MultiSchoolSelector` は実在しない（各Management内にインライン実装）。見出しの Markdown 崩れも修正済み |

---

### 追加で発見・修正した問題（調査時には未検出）

| 内容 | 対応 |
|---|---|
| **公開APIの営業時間が常にnull** | `schemas/public/stores.py` の `opening_time`/`closing_time`/`store_image` がモデルの `business_hours_start`/`business_hours_end`/`image_url` と名前不一致で、DBに値があっても取得できていなかった。フィールド名を修正し `regular_holiday` も追加 |
| **ユーザーのロール値が不正** | フォームの選択肢が `viewer` だったが、バックエンドは `readonly`。登録・表示ともに不整合だったため修正 |
| **トップページが認証必須だった** | 顧客向けの入口のため middleware の認証不要パスに `/` を追加 |
| **予約時間間隔の入力欄が無かった** | 仕様（20/30/60分）に対しフォームに項目が存在しなかったため追加 |

---

## 8. 最終状態（2026-08-19）

| 検証項目 | 結果 |
|---|---|
| TypeScript型エラー | **0件** |
| ESLint | **No ESLint warnings or errors** |
| 本番ビルド `npm run build` | **成功**（19ルート生成） |
| バックエンドAPI | 公開・認証・スタッフ・管理者API **全て疎通確認済み** |
| ロール別権限（API） | admin=200 / staff=403 / readonly=403（管理者API）、更新系は readonly のみ403 |
| ロール別権限（画面） | `/admin/*` は admin のみ200、staff・readonly は `/staff` へ307 |
| 公開画面 | `/`・`/reservations/new`・`/reservations/check` が未ログインで200 |
| dev サーバーエラー | **0件** |

### 残課題（今後の拡張）

- スタッフの**所属店舗によるデータ絞り込み**（SPECIFICATION.md BL-7）は未実装。現状 staff は全店舗の予約を参照できる
- `global-error.tsx` は追加済みだが、**セグメント単位の `error.tsx`/`loading.tsx`** は未作成
- スケジュールの**カレンダービュー・一括登録**（TASK 2-4 の将来拡張）
- メール通知・レポート機能（SPECIFICATION.md F-8）

### 動作確認手順

```bash
# バックエンド
docker compose up -d
curl -s http://localhost:8000/openapi.json | grep -o '"/reservations"'

# フロントエンド
cd app
npx tsc --noEmit     # 型チェック
npm run build        # 本番ビルド
npm run dev          # 起動
```

**確認する画面**:
1. ログアウト状態で `/` → `/reservations/new` で予約フォームが動くか
2. `/login` で ADM001 / EMP001 / EMP003 それぞれログインできるか
3. staff・readonly で `/admin/stores` を開くと `/staff` にリダイレクトされるか
4. フォームに不正値（学年99、パスワード3文字など）を入れると送信前にエラーが出るか
