# Actions Directory - 開発ルール

## 🎯 基本ルール

### ファイル・エクスポート方式
- **拡張子**: `.ts` 推奨（JSX不可）
- **エクスポート**: `export async function`
- **構成**: 機能別フォルダで分割

### 必須事項
1. **統一レスポンス形式**
2. **エラーハンドリング必須**
3. **型安全性確保**

## 📁 ファイル別役割

| ファイル | 役割 | "use server" | 主な処理 |
|----------|------|--------------|----------|
| `queries.ts` | 取得系 | ❌ | データ取得・検索 |
| `mutations.ts` | 変更系 | ✅ | 作成・更新・削除 |
| `validations.ts` | 検証 | ❌ | バリデーション |
| `index.ts` | 再エクスポート | ❌ | 関数のまとめ |

## 📋 レスポンス形式（統一）

```typescript
// ✅ 成功時
return {
  success: true,
  data: responseData,
  status: 200
}

// ✅ エラー時
return {
  success: false,
  data: null,
  error: 'わかりやすいエラーメッセージ'
}
```

## ❌ 禁止事項

```typescript
// ❌ DOM操作（サーバーでは動作しない）
document.getElementById('element')

// ❌ ブラウザAPI（サーバー環境では利用不可）
localStorage.setItem('key', 'value')

// ❌ 一貫性のないレスポンス形式
return data  // 統一されていない
```

## 📝 実装テンプレート

```typescript
// ✅ データ取得系（queries.ts）
export async function getManuals(): Promise<ActionResponse<Manual[]>> {
  try {
    const response = await api.get<Manual[]>('/manuals')
    return {
      success: true,
      data: response.data,
      status: response.status
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

```typescript
// ✅ データ変更系（mutations.ts）
"use server"

export async function createManual(data: CreateManualData): Promise<ActionResponse<Manual>> {
  try {
    const response = await api.post<Manual>('/manuals', data)
    revalidatePath('/manuals')  // キャッシュ再検証
    return {
      success: true,
      data: response.data,
      status: response.status
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: 'Failed to create manual'
    }
  }
}
```

---
詳細は `_README.md` を参照