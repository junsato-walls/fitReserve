# Feature Components

このフォルダには **特定の機能・ドメインに特化したコンポーネント** が含まれています。

## 概要

- **役割**: 特定のビジネス機能を実現するコンポーネント
- **特徴**: ドメイン知識とビジネスロジックを含む
- **スコープ**: 特定の機能領域内

## フォルダ構成

### manual/
マニュアル機能に関連するコンポーネント

- `ManualsList.tsx` - マニュアル一覧表示
- `ManualsClient.tsx` - マニュアル一覧のクライアント側制御
- `ManualCard.tsx` - マニュアルカード表示
- `ManualDetail.tsx` - マニュアル詳細表示
- `ManualForm.tsx` - マニュアル作成・編集フォーム

### auth/
認証機能に関連するコンポーネント

- `LoginForm.tsx` - ログインフォーム
- `SignupForm.tsx` - サインアップフォーム
- `AuthProvider.tsx` - 認証状態管理
- `AuthGuard.tsx` - 認証ガード

### comments/
コメント機能に関連するコンポーネント

- `CommentPanel.tsx` - コメントパネル
- `CommentItem.tsx` - コメント項目表示
- `CommentForm.tsx` - コメント作成・編集フォーム

### dashboard/
ダッシュボード機能に関連するコンポーネント

- `DashboardStats.tsx` - 統計情報表示
- `RecentActivity.tsx` - 最近のアクティビティ
- `QuickActions.tsx` - クイックアクション

## 使用方法

```tsx
import { ManualsList } from "@/components/features/manual/ManualsList"
import { LoginForm } from "@/components/features/auth/LoginForm"

export function ManualsPage({ manuals }) {
  return (
    <div>
      <ManualsList manuals={manuals} />
    </div>
  )
}
```

## 作成基準

以下の場合に features コンポーネントを作成してください：

- ✅ 特定のビジネス機能に特化している
- ✅ ドメイン知識を含んでいる
- ✅ 特定のデータ構造に依存している
- ✅ 機能固有のビジネスロジックがある

## フォルダの追加

新しい機能を追加する場合：

1. 機能名でフォルダを作成 (例: `user/`, `settings/`)
2. 関連コンポーネントをまとめて配置
3. 必要に応じて README.md を追加

## 依存関係

- `ui/` コンポーネントを基盤として利用
- `common/` コンポーネントを適宜利用
- 他の features フォルダへの依存は最小限に