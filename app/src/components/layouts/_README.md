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
├── StaffLayout.tsx   # 社内画面の共通レイアウト（Header + Sidebar + Breadcrumb + 本文）
├── Header.tsx        # 共通ヘッダー（左:企業ロゴ / 右:ユーザーメニュー）
├── Sidebar.tsx       # サイドナビゲーション
├── Breadcrumb.tsx    # パンくず（表示は base/navigation/Breadcrumb に任せる）
├── NavLinkGroup.tsx  # リンク一覧の描画（Sidebar と MobileNavMenu で共有）
├── UserMenu.tsx      # Header 右上のアカウントメニュー
├── MobileNavMenu.tsx # スマホ・タブレット用メニュー（全画面モーダル）
├── ThemeToggle.tsx   # 表示テーマ（ライト/ダーク/システム）の切替
├── navLinks.ts       # ナビゲーション定義（Sidebar と MobileNavMenu で共有）
└── _README.md        # このファイル
```

ナビゲーションは、**定義を `navLinks.ts`・描画を `NavLinkGroup.tsx`** に集約する。
サイドバーとスマホ用メニューの2箇所に同じものを書くと、追加漏れや見た目のずれが起きるため。

ヘッダー右側の操作は画面幅で入れ替える。

| 幅 | 右側に出るもの | 中身 |
|---|---|---|
| `lg` 以上 | `UserMenu`（アバター） | ユーザー情報 / 設定 / テーマ / ログアウト |
| `lg` 未満 | ハンバーガーボタン | 上記に加えてスタッフ機能・管理者機能の一覧 |

`lg` 未満ではアバターを出さないため、アカウント操作も `MobileNavMenu` 側に含める。

`Header`・`Sidebar`・`Breadcrumb` は `StaffLayout` の内部部品であり、
画面から直接使うことは想定していない。
**ヘッダーをページ側に置くと、ログアウトやテーマ切替が無い画面が生まれる**ため、
`StaffLayout` に内蔵して選べないようにしてある。
`UserMenu`・`NavLinkGroup` も同様に内部部品として扱う。

## 使い方

`app/*/page.tsx` で画面コンポーネントを包む。

ログイン中のユーザーを渡す。ロールに応じてサイドバーの管理者機能が出し分けられる。

```tsx
import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffDashboard } from "@/views/staff/StaffDashboard"

export default async function StaffPage() {
    // middlewareでトークンを検証済みのため、ここでは表示用に中身を読むだけ
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
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
