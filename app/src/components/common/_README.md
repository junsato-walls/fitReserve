# Common Components

このフォルダには **アプリ全体で共通利用されるコンポーネント** が含まれています。

## 概要

- **役割**: 複数の画面・機能で再利用される共通部品
- **特徴**: ビジネスロジックを含む可能性がある汎用コンポーネント
- **スコープ**: アプリケーション全体

## フォルダ構成

### layout/
アプリケーションの基本レイアウトに関連するコンポーネント

- `HeaderGate.tsx` - 認証状態に応じたヘッダー制御
- `Header.tsx` - アプリケーションヘッダー
- `Footer.tsx` - アプリケーションフッター  
- `Navigation.tsx` - ナビゲーションメニュー
- `Sidebar.tsx` - サイドバー

### atoms/
基本的なUIコンポーネント（単体で機能する最小単位）

- `Button.tsx` - 基本ボタンコンポーネント
- `Input.tsx` - 基本入力フィールド
- `Label.tsx` - ラベルコンポーネント
- `Badge.tsx` - バッジ表示
- `Avatar.tsx` - アバター表示

### feedback/
フィードバック・状態表示に関するコンポーネント

- `LoadingSpinner.tsx` - ローディング表示
- `ErrorMessage.tsx` - エラーメッセージ表示
- `EmptyState.tsx` - 空状態の表示
- `ConfirmDialog.tsx` - 確認ダイアログ

## 使用方法

```tsx
import { HeaderGate } from "@/components/common/layout/HeaderGate"
import { LoadingSpinner } from "@/components/common/feedback/LoadingSpinner"

export function Layout({ children }) {
  return (
    <>
      <HeaderGate />
      <main>
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
    </>
  )
}
```

## 作成基準

以下の場合に common コンポーネントを作成してください：

- ✅ 3つ以上の機能・画面で使用される
- ✅ 特定のビジネス機能に依存しない
- ✅ アプリケーション全体の一貫性に寄与する

以下の場合は features フォルダを検討してください：

- ❌ 特定の機能・画面でのみ使用される
- ❌ ビジネスロジックが特定ドメインに特化している