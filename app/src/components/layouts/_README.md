# layouts ディレクトリ

ページの骨組み（アプリケーションの外枠）を構成するコンポーネントを置く。

## 役割

- **責務**: サイドバー・パンくずなど、複数の画面で共通して表示される**画面の外枠**
- **スコープ**: 2つ以上の `views/*` から使われるもの
- **含んでよいもの**: `base/` の部品の組み合わせ、ナビゲーション定義

画面の中身そのものは `src/views/` に置く。ここに置くのは「どの画面でも同じように囲む枠」だけ。

## `base/display/` との違い

名前が似ているが**粒度が異なる**ので混同しないこと。

| ディレクトリ | 指すもの | 例 |
|---|---|---|
| `components/base/display/` | **部品**としての表示 | Card, Table, Tabs, Badge |
| `components/layouts/`（ここ） | **ページ全体**の骨組み | StaffLayout, Sidebar, Breadcrumb |

## 構成

```
components/layouts/
├── StaffLayout.tsx   # 管理画面・スタッフ画面の共通レイアウト（Sidebar + Breadcrumb + 本文）
├── Sidebar.tsx       # サイドナビゲーション
├── Breadcrumb.tsx    # パンくずリスト
└── _README.md        # このファイル
```

`Sidebar` と `Breadcrumb` は `StaffLayout` の内部部品であり、
画面から直接使うことは想定していない。

## 使い方

`app/*/page.tsx` で画面コンポーネントを包む。

```tsx
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffDashboard } from "@/views/staff/StaffDashboard"

export default async function StaffPage() {
    return (
        <StaffLayout>
            <StaffDashboard />
        </StaffLayout>
    )
}
```

## 配置ルール

新しくコンポーネントを作るとき、ここに置いてよいか次の順で判断する。

1. **`base/` に相当する部品があるか？** → あればそのまま使う
2. **特定の画面専用か？業務ロジックを含むか？** → Yes なら `views/<domain>/`
3. **2つ以上の画面を共通して囲む枠か？** → Yes ならここ（`components/layouts/`）

枠ではない汎用部品（ボタン、ダイアログなど）は `base/` に作る。
判断に迷ったら [COMPONENT_ORGANIZATION.md](../../../../docs/COMPONENT_ORGANIZATION.md) を参照。

## 実装ルール

- 定義は `export const` + アロー関数
- 見た目は `base/` の部品を使い、独自にスタイルを組み立てない
- API呼び出し・業務ロジックは持たせない（それは `views/` の責務）
