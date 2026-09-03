# views ディレクトリ

画面（ページ本体）を構成するコンポーネントを置く。

## 役割

- **責務**: 1つの画面のUIと画面固有のロジックをまとめる
- **スコープ**: 特定の画面専用。他の画面から使い回すことは想定しない
- **含んでよいもの**: Server Actions（`@/api/*`）の呼び出し、業務ルール、画面の状態管理

`src/app/` 配下の `page.tsx` は薄く保ち、実装は views に置く。

```tsx
// app/staff/page.tsx
import { getCurrentUser } from "@/api/Auth"
import { StaffLayout } from "@/components/layouts/StaffLayout"
import { StaffDashboard } from "@/views/staff/StaffDashboard"

export default async function StaffPage() {
    const user = await getCurrentUser()

    return (
        <StaffLayout user={user}>
            <StaffDashboard />
        </StaffLayout>
    )
}
```

## フォルダ構成

画面の役割区分ごとにフォルダを切る。

```
src/views/
├── auth/            # 認証画面
│   └── LoginForm.tsx             # ログインフォーム
├── admin/           # 管理者向け画面
│   ├── AdminDashboard.tsx        # 管理ダッシュボード
│   ├── ProjectManagement.tsx     # プロジェクト管理
│   ├── SchoolManagement.tsx      # 学校マスタ管理
│   ├── StoreManagement.tsx       # 店舗マスタ管理
│   └── UserManagement.tsx        # ユーザーマスタ管理
├── reservation/     # 一般利用者向け画面
│   ├── ReservationCheck.tsx      # 予約確認
│   └── ReservationForm.tsx       # 予約申込フォーム
├── staff/           # スタッフ向け画面
│   ├── StaffDashboard.tsx        # スタッフダッシュボード
│   ├── StaffReservationDetail.tsx # 予約詳細
│   ├── StaffReservationList.tsx  # 予約一覧
│   └── StaffScheduleList.tsx     # スケジュール管理
├── dev/             # 開発用（本番では404）
│   └── ComponentCatalog.tsx      # base/ の見本カタログ
└── _README.md       # このファイル
```

## 実装ルール

### 定義方法

`export const` + アロー関数（`page.tsx` のみ `export default async function`）。

```tsx
export const StaffDashboard = () => { }
```

### UIは自前で組まない

見た目は `@/components/base/*` の部品をそのまま使う。
**`base/` は `className` を受け取らない**ので、調整が必要なら `base/` 側に props を足す。
設計原則は [COMPONENT_ORGANIZATION.md](../../../docs/COMPONENT_ORGANIZATION.md) を参照。

```tsx
import { Table } from "@/components/base/display/Table"
import { Button } from "@/components/base/buttons/Button"
import { Card } from "@/components/base/display/Card"
```

### データ取得

`@/api/*` の Server Actions を呼ぶ。**独立した取得は必ず `Promise.all` で並列化する。**

```tsx
const [storesResult, schoolsResult] = await Promise.all([
    getStores(),
    getSchools(),
])
```

詳細は `src/api/_RULES.md` を参照。

### 画面をまたぐ共有をしない

views 配下のコンポーネントを別の views から import しない。
複数画面で使う部品が必要になった場合は、`base/` に汎用部品として作るか、
レイアウト骨組みであれば `components/layouts/` に置く。

## フォルダを追加する場合

新しい画面区分が増えたら、役割名でフォルダを作る（例: `customer/`）。
1画面しかない場合でも、既存の区分に無理に押し込まない。
