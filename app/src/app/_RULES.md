# App Directory - 開発ルール

## 🎯 基本ルール

### エクスポート方式
- `page.tsx` → `export default async function`（データ取得・認証あり）
- その他 → `export default function`（静的コンテンツ・page.tsx以外のファイル）

### 禁止事項
1. **"use client" 使用禁止**（page.tsxのみ）
2. **直接 fetch() 禁止** → `actions/` から取得
3. **エラーハンドリング省略禁止**

## 📁 ファイル別役割

| ファイル | 役割 | async | 主な処理 |
|----------|------|-------|----------|
| `page.tsx` | ページ | ✅ | データ取得・認証 |
| `layout.tsx` | レイアウト | ❌ | 静的構造 |
| `loading.tsx` | ローディング | ❌ | 読み込み表示 |
| `error.tsx` | エラー | ❌ | エラー表示 |
| `not-found.tsx` | 404 | ❌ | 404表示 |

## 📝 実装テンプレート

```tsx
// ✅ page.tsx の基本形
export default async function Page() {
  // 1. 認証チェック（必要に応じて）
  const token = (await cookies()).get("token")?.value
  if (!token) redirect("/login")
  
  // 2. データ取得（actions から）
  const data = await getDataFromActions()
  
  // 3. エラーハンドリング（必須）
  if (!data.success) {
    return <ErrorMessage error={data.error} />
  }
  
  // 4. コンポーネント返却
  return <Component data={data.data} />
}
```

```tsx
// ✅ その他ファイルの基本形
export default function Layout({ children }) {
  return <div>{children}</div>
}
```

---
詳細は `_README.md` を参照