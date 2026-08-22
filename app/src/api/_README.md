# api ディレクトリ（Server Actions）

FastAPIバックエンドとの通信をすべて集約するレイヤー。

## 役割

- **実行環境**: サーバーサイドのみ。全ファイルの先頭に `"use server"` を記述する
- **責務**: HTTPリクエストの発行、認証情報の付与、エラーメッセージの日本語化
- **方針**: Next.js側にRoute Handler（`src/app/api/`）を作らない。
  APIの実体はFastAPI（リポジトリ直下の `api/`）であり、Next.jsはその呼び出し役に徹する

## ファイル構成

ドメインごとに1ファイル。PascalCaseで命名する。

```
src/api/
├── Auth.ts          # ログイン・ログアウト・ログインユーザー取得
├── Project.ts       # プロジェクト管理（管理者向け）
├── Reservation.ts   # 予約（一般利用者向け + スタッフ向け）
├── Schedule.ts      # スケジュール管理（スタッフ向け）
├── School.ts        # 学校マスタ（管理者向け）
├── Store.ts         # 店舗マスタ（管理者向け）
├── User.ts          # ユーザーマスタ（管理者向け）
├── _README.md       # このファイル
└── _RULES.md        # 開発ルール（要点のみ）
```

サブフォルダや `index.ts` による再エクスポートは使わない。
呼び出し側は `@/api/Store` のようにファイルを直接importする。

## 関数の命名規則

実装で使われている命名は以下のとおり。

| パターン | 用途 | 例 |
|----------|------|-----|
| `getXxxAdmin()` | 管理者向けの一覧取得（`/admin/*`） | `getStoresAdmin()` |
| `getXxx()` | 一般利用者向けの一覧取得（`/public/*`） | `getStores()` |
| `getXxxDetail()` | 詳細取得 | `getStoreDetail(storeId)` |
| `createXxx()` | 作成 | `createStore(data)` |
| `updateXxx()` | 更新 | `updateStore(storeId, data)` |
| `deleteXxx()` | 削除（バックエンド側で論理削除） | `deleteStore(storeId)` |

同名の関数が別ファイルに存在する場合がある（例: `Reservation.ts` の `getSchedules()` は
`/public/schedules` を、`Schedule.ts` の `getSchedules()` は `/schedules` を叩く）。
一般利用者向けかスタッフ向けかで参照先ファイルが変わるため、import元に注意すること。

## レスポンス形式

すべての関数が以下の形を返す。例外を投げず、失敗も戻り値で表現する。

```typescript
{
    success: boolean
    data: T | null
    error?: string   // 失敗時のみ。ユーザーにそのまま表示できる日本語メッセージ
}
```

型は共通型を作らず、各関数に直接書く。

```typescript
export async function getStoresAdmin(params?: {
    skip?: number
    limit?: number
    is_enabled?: boolean
}): Promise<{
    success: boolean
    data: Store[] | null
    error?: string
}> {
```

## 実装テンプレート

`Store.ts` が最も素直な実装。新規作成時はこれを写して使う。

```typescript
"use server"

import { api } from "@/lib/httpClient"
import type { Store, StoreCreate, StoreUpdate } from "@/types/admin"

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

/**
 * 店舗一覧を取得（管理者向け）
 */
export async function getStoresAdmin(params?: {
    skip?: number
    limit?: number
    is_enabled?: boolean
}): Promise<{
    success: boolean
    data: Store[] | null
    error?: string
}> {
    try {
        const response = await api.get<Store[]>("/admin/stores", { params })
        return { success: true, data: response.data }
    } catch (error: unknown) {
        console.error("Failed to fetch stores:", error)
        const errorMessage = toErrorMessage(error, "店舗一覧の取得に失敗しました")
        return { success: false, data: null, error: errorMessage }
    }
}
```

守るべき点は次の3つ。

1. `try` / `catch` で必ず囲む
2. `catch` では `console.error` でログを残したうえで、`toErrorMessage()` に**日本語のフォールバック文言**を渡す
3. 成功時は `{ success: true, data: response.data }` のみを返す（`status` は含めない）

## 認証の扱い

トークンはhttpOnly Cookieに保存されており、**クライアントからは読めない**。
`lib/httpClient.ts` がサーバー側でCookieを読み、`Authorization: Bearer` ヘッダーを自動で付与する。
そのため各関数でトークンを意識する必要はない。

作成者・更新者をバックエンドに渡す場合のみ、`getCurrentUser()` でログインユーザーを取得する
（`Schedule.ts` を参照）。

```typescript
const currentUser = await getCurrentUser()
if (!currentUser) {
    return { success: false, data: null, error: "ログインが必要です" }
}

const response = await api.post<Schedule>("/schedules", {
    ...data,
    created_by: currentUser.id,
    updated_by: currentUser.id,
})
```

## バックエンドのエンドポイント区分

| プレフィックス | 認証 | 用途 |
|----------------|------|------|
| `/public/*` | 不要 | 一般利用者向け（予約フォームでの店舗・学校・空き枠の参照） |
| `/admin/*` | 管理者 | マスタ管理（店舗・学校・ユーザー・プロジェクト） |
| `/reservations`, `/schedules` | スタッフ | スタッフ向けの予約・スケジュール操作 |
| `/auth/login` | 不要 | ログイン |

## 呼び出し方

このプロジェクトではClient Componentから直接 `await` する形に統一している。

```tsx
"use client"

import { getStoresAdmin } from "@/api/Store"

const fetchStores = async () => {
    setLoading(true)
    const result = await getStoresAdmin()
    setLoading(false)

    if (result.success && result.data) {
        setStores(result.data)
    } else {
        setError(result.error || "店舗一覧の取得に失敗しました")
    }
}
```

**独立した複数の取得は必ず `Promise.all` で並列化する。**
Server Actionは1回ごとにサーバーへのHTTP往復が発生するため、直列に並べると往復コストがそのまま積み上がる。

```typescript
// ✅ 並列
const [storesResult, schoolsResult] = await Promise.all([
    getStores(),
    getSchools(),
])

// ❌ 直列（依存関係がないのに待たせている）
const storesResult = await getStores()
const schoolsResult = await getSchools()
```

`<form action={...}>` や `useTransition` は現時点では使用していない。

## キャッシュについて

`revalidatePath` / `revalidateTag` は**使用していない**。
データ更新後は、呼び出し側のコンポーネントが取得関数を再実行して画面を更新する。

```typescript
const result = await createStore(data)
if (result.success) {
    setIsDialogOpen(false)
    fetchStores()   // 再取得して一覧を更新する
}
```

## 禁止事項

Server Actionsはサーバー上で実行されるため、以下は動作しない。

```typescript
document.getElementById("element")     // ❌ DOM操作
localStorage.setItem("key", "value")   // ❌ ブラウザAPI
window.location.href = "/redirect"     // ❌ 画面遷移
```

画面遷移が必要な場合は、サーバー側なら `next/navigation` の `redirect()` を使う
（`Auth.ts` の `logout()` を参照）。クライアント側で制御する場合は、
Server Actionは結果を返すだけにとどめ、遷移は呼び出し元の `useRouter()` で行う。

## 既知の課題

- **`toErrorMessage()` が6ファイルに重複定義されている**（`Auth.ts` を除く全ファイル）。
  共通化の余地があるが、現状はファイル単位で自己完結させている
- **件数取得のために一覧を全件取得している箇所がある**（`StaffDashboard` から呼ばれる
  `getReservationsForStaff({ status: "pending" })` など）。データ増加に伴い重くなるため、
  バックエンドにカウント用エンドポイントを追加するのが望ましい
