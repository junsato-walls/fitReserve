# api ディレクトリ（Server Actions） - 開発ルール

要点のみ。背景や実例は `_README.md` を参照。

## 基本ルール

- **配置**: ドメインごとに1ファイル。PascalCase（`Store.ts`）。サブフォルダ・`index.ts` は作らない
- **先頭**: 全ファイルに `"use server"` を記述する
- **エクスポート**: `export async function` のみ。デフォルトエクスポートは使わない
- **拡張子**: `.ts`（JSX不可）
- **Route Handlerを作らない**: `src/app/api/` は使わない。APIの実体はFastAPI

## 関数の命名

| パターン | 用途 |
|----------|------|
| `getXxxAdmin()` | 管理者向け一覧（`/admin/*`） |
| `getXxx()` | 一般利用者向け一覧（`/public/*`） |
| `getXxxDetail()` | 詳細取得 |
| `createXxx()` / `updateXxx()` / `deleteXxx()` | 作成・更新・削除 |

## レスポンス形式（統一）

例外を投げず、成功も失敗も戻り値で表現する。

```typescript
// 成功時
return { success: true, data: response.data }

// 失敗時（error はユーザーにそのまま表示できる日本語）
return { success: false, data: null, error: errorMessage }
```

- 共通型（`ActionResponse` 等）は作らず、各関数に型を直接書く
- `status` は返さない

## 実装テンプレート

```typescript
"use server"

import { api } from "@/lib/httpClient"
import type { Store, StoreCreate } from "@/types/admin"

/** APIエラーからメッセージを取り出す（lib/httpClient.ts がdetailをErrorに詰めている） */
function toErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback
}

export async function getStoresAdmin(params?: {
    skip?: number
    limit?: number
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

## 必須事項

1. `try` / `catch` で必ず囲む
2. `catch` で `console.error` を残し、`toErrorMessage()` に日本語のフォールバック文言を渡す
3. 戻り値の型を明示する
4. 認証トークンは意識しない（`lib/httpClient.ts` がCookieから自動付与する）
5. 作成者・更新者が必要な場合のみ `getCurrentUser()` を使い、未ログインなら
   `{ success: false, data: null, error: "ログインが必要です" }` を返す

## 呼び出し側のルール

**独立した複数の取得は `Promise.all` で並列化する。**
Server Actionは1回ごとにHTTP往復が発生するため、直列に並べるとコストがそのまま積み上がる。

```typescript
// ✅ 並列
const [storesResult, schoolsResult] = await Promise.all([getStores(), getSchools()])

// ❌ 直列（依存関係がないのに待たせている）
const storesResult = await getStores()
const schoolsResult = await getSchools()
```

更新後の画面反映は、呼び出し側で取得関数を再実行する
（`revalidatePath` / `revalidateTag` は使用していない）。

## 禁止事項

```typescript
document.getElementById("element")     // ❌ DOM操作（サーバーでは動作しない）
localStorage.setItem("key", "value")   // ❌ ブラウザAPI
window.location.href = "/redirect"     // ❌ 画面遷移
return data                            // ❌ レスポンス形式が統一されていない
```

画面遷移はサーバー側なら `next/navigation` の `redirect()`、
クライアント側で制御するなら呼び出し元の `useRouter()` で行う。

---
詳細は `_README.md` を参照
