# Actions Directory

このフォルダには **Server Actions** と **データ取得関数** が含まれています。

## 概要

- **役割**: サーバーサイドでのビジネスロジック実行とデータ操作
- **特徴**: Next.js App Routerのサーバー機能を活用した型安全なAPI層
- **実行環境**: サーバーサイドのみ（Node.js環境）

## 推奨規約

### ファイル命名・拡張子
- **拡張子**: `.ts` を推奨（JSX不要のため）
- **命名規則**: 機能別に分割して管理

```
actions/
├── types.ts                 # 共通型定義
├── manuals/
│   ├── queries.ts          # 取得系（GET操作）
│   ├── mutations.ts        # 変更系（POST/PUT/DELETE操作）
│   ├── validations.ts      # バリデーション関数
│   └── index.ts           # 再エクスポート用
├── auth/
│   ├── authentication.ts   # 認証処理
│   ├── authorization.ts    # 認可処理
│   └── index.ts
└── _README.md             # このファイル
```

### エクスポート方式
```typescript
// ✅ 推奨: 名前付きエクスポート
export async function getManuals() { }
export async function createManual() { }

// ❌ 非推奨: デフォルトエクスポート
export default async function getManuals() { }
```

## 機能別ファイル構成

### queries.ts - データ取得系
```typescript
import { api } from "@/lib/api"
import { Manual } from "@/types/manual"
import type { ActionResponse } from "@/actions/types"

export async function getManuals(): Promise<ActionResponse<Manual[]>> {
  try {
    const response = await api.get<Manual[]>('/manuals')
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function getManualById(id: string): Promise<ActionResponse<Manual>> {
  try {
    const response = await api.get<Manual>(`/manuals/${id}`)
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
```

### mutations.ts - データ変更系
```typescript
"use server"

import { api } from "@/lib/api"
import { Manual } from "@/types/manual"
import type { ActionResponse } from "@/actions/types"
import { revalidatePath } from "next/cache"

export async function createManual(
  data: Omit<Manual, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ActionResponse<Manual>> {
  try {
    const response = await api.post<Manual>('/manuals', data)
    
    // キャッシュの再検証
    revalidatePath('/manuals')
    
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create manual',
    }
  }
}

export async function updateManual(
  id: string, 
  data: Partial<Manual>
): Promise<ActionResponse<Manual>> {
  try {
    const response = await api.put<Manual>(`/manuals/${id}`, data)
    
    // 関連ページのキャッシュ再検証
    revalidatePath('/manuals')
    revalidatePath(`/manuals/${id}`)
    
    return {
      success: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update manual',
    }
  }
}

export async function deleteManual(id: string): Promise<ActionResponse<{ message: string }>> {
  try {
    await api.delete(`/manuals/${id}`)
    
    // キャッシュの再検証
    revalidatePath('/manuals')
    
    return {
      success: true,
      data: { message: 'Manual deleted successfully' },
      status: 200,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete manual',
    }
  }
}
```

### index.ts - 再エクスポート
```typescript
// 取得系
export * from './queries'
// 変更系
export * from './mutations'
// バリデーション
export * from './validations'
```

## 共通型定義

### types.ts
```typescript
export interface ActionResponse<T> {
  success: boolean
  data: T | null
  status?: number
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    limit: number
  } | null
  error?: string
}

export interface ActionError {
  success: false
  data: null
  error: string
  code?: string
  details?: Record<string, unknown>
}
```

## 使用方法

### Server Componentでの使用
```tsx
// app/manuals/page.tsx
import { getManuals } from "@/actions/manuals"

export default async function ManualsPage() {
  const result = await getManuals()
  
  if (!result.success) {
    return <ErrorComponent error={result.error} />
  }
  
  return <ManualsList manuals={result.data} />
}
```

### Server Actionとしてフォームで使用
```tsx
// components/ManualForm.tsx
import { createManual } from "@/actions/manuals"

export function ManualForm() {
  return (
    <form action={createManual}>
      <input name="title" placeholder="タイトル" required />
      <textarea name="content" placeholder="内容" required />
      <button type="submit">作成</button>
    </form>
  )
}
```

### Client Componentでの使用（useTransition）
```tsx
"use client"

import { useTransition } from 'react'
import { deleteManual } from "@/actions/manuals"

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteManual(id)
      if (result.success) {
        // 成功時の処理
        console.log('削除成功')
      } else {
        // エラー処理
        console.error(result.error)
      }
    })
  }
  
  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? '削除中...' : '削除'}
    </button>
  )
}
```

## 実装規約

### ✅ 推奨される実装

#### 1. 統一されたレスポンス形式
```typescript
// 成功時
return {
  success: true,
  data: responseData,
  status: response.status
}

// エラー時
return {
  success: false,
  data: null,
  error: 'わかりやすいエラーメッセージ'
}
```

#### 2. 適切なエラーハンドリング
```typescript
export async function actionFunction() {
  try {
    const result = await apiCall()
    return { success: true, data: result }
  } catch (error) {
    console.error('Action error:', error)
    
    // エラーの種類に応じた適切なメッセージ
    if (error instanceof NetworkError) {
      return { success: false, data: null, error: 'ネットワークエラーが発生しました' }
    }
    
    return { 
      success: false, 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

#### 3. 型安全性の確保
```typescript
interface CreateManualParams {
  title: string
  content: string
  categoryId?: number
}

export async function createManual(
  params: CreateManualParams
): Promise<ActionResponse<Manual>> {
  // 型安全な実装
}
```

#### 4. バリデーション
```typescript
export async function updateManual(id: string, data: Partial<Manual>) {
  // 入力値検証
  if (!id || typeof id !== 'string') {
    return { success: false, data: null, error: '無効なIDです' }
  }
  
  if (data.title && data.title.length > 255) {
    return { success: false, data: null, error: 'タイトルが長すぎます（255文字以内）' }
  }
  
  // メイン処理
  try {
    const response = await api.put(`/manuals/${id}`, data)
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, data: null, error: '更新に失敗しました' }
  }
}
```

### ❌ 避けるべき実装

#### 1. 直接的なDOM操作
```typescript
// ❌ 禁止 - サーバーでは動作しない
export async function badAction() {
  document.getElementById('element').innerHTML = 'value'
}
```

#### 2. ブラウザAPIの使用
```typescript
// ❌ 禁止 - サーバー環境では利用不可
export async function badAction() {
  localStorage.setItem('key', 'value')
  window.location.href = '/redirect'
}
```

#### 3. 一貫性のないレスポンス形式
```typescript
// ❌ 避ける - レスポンス形式が統一されていない
export async function inconsistentAction() {
  if (condition1) return { success: true, result: data }      // ✗
  if (condition2) return { ok: true, data: result }          // ✗
  if (condition3) return data                                // ✗
  
  // ✅ 統一された形式を使用
  return { success: true, data: result, status: 200 }
}
```

## ベストプラクティス

### 1. キャッシュ管理
```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

export async function updateManual(id: string, data: Partial<Manual>) {
  try {
    const response = await api.put(`/manuals/${id}`, data)
    
    // 関連ページのキャッシュを再検証
    revalidatePath('/manuals')           // 一覧ページ
    revalidatePath(`/manuals/${id}`)     // 詳細ページ
    revalidateTag('manuals')             // タグベースの再検証
    
    return { success: true, data: response.data }
  } catch (error) {
    return { success: false, data: null, error: 'Update failed' }
  }
}
```

### 2. ログ出力
```typescript
export async function actionFunction(params: unknown) {
  console.log('Action started:', { 
    action: 'actionFunction',
    params, 
    timestamp: new Date().toISOString() 
  })
  
  try {
    const result = await process()
    console.log('Action completed successfully:', { result })
    return { success: true, data: result }
  } catch (error) {
    console.error('Action failed:', { error, params })
    return { success: false, data: null, error: 'Process failed' }
  }
}
```

### 3. パフォーマンス考慮
```typescript
// 大量データの場合はページネーション対応
export async function getManuals(
  page: number = 1, 
  limit: number = 10
): Promise<PaginatedResponse<Manual>> {
  try {
    const response = await api.get(`/manuals?page=${page}&limit=${limit}`)
    return {
      success: true,
      data: {
        items: response.data.manuals,
        total: response.data.total,
        page,
        limit
      }
    }
  } catch (error) {
    return { success: false, data: null, error: 'Failed to fetch manuals' }
  }
}
```

## フォルダ別詳細

### manuals/ - マニュアル機能
- `queries.ts` - マニュアル取得関連
- `mutations.ts` - マニュアル作成・更新・削除
- `validations.ts` - マニュアルデータのバリデーション
- `index.ts` - 再エクスポート

### auth/ - 認証機能
- `authentication.ts` - ログイン・ログアウト処理
- `authorization.ts` - 権限チェック・ユーザー情報取得
- `index.ts` - 再エクスポート

### users/ - ユーザー管理
- `queries.ts` - ユーザー情報取得
- `mutations.ts` - プロフィール更新・パスワード変更
- `validations.ts` - ユーザーデータのバリデーション
- `index.ts` - 再エクスポート

このディレクトリ構成により、Server Actionsを効率的かつ型安全に管理できます。