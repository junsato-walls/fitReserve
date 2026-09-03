# フロントエンド コーディング規約

Next.js (TypeScript/React) のコーディング規約

**対象**: app/配下のTypeScript/Reactコード  
**最終更新**: 2026-09-02

---

## ルールの置き場所

同じルールを何箇所にも書くと必ずずれる。**話題ごとに正となる場所を1つに決める。**

| 話題 | 正となるドキュメント |
|---|---|
| 言語・書式・命名・関数定義・スタイリング | **このファイル** |
| `base/` のAPI設計、配置判断、アクセシビリティ基準 | [COMPONENT_ORGANIZATION.md](./COMPONENT_ORGANIZATION.md) |
| 色・大きさの語彙の定義そのもの | `app/src/components/base/tokens.ts`（コードが正） |
| 各ディレクトリに何を置くか | 各ディレクトリの `_README.md` |
| 実装時に見る要点 | 各ディレクトリの `_RULES.md`（`api/`・`app/`） |

`_README.md` には**その場所固有の事情**だけを書き、設計原則は上位ドキュメントへリンクする。

---

## 基本方針

- **厳格な型チェック** (`strict: true`)
- **any型の使用を禁止** (やむを得ない場合は `unknown`)
- **関数コンポーネント** を使用

---

## コンポーネント設計の基本方針

**このプロジェクトで最も重要な2つの決定。新規実装・改修の際は必ずこれに従うこと。**

### 1. 外部ライブラリを使わず自作する

UIコンポーネントは**外部UIライブラリを使わず、`components/base/` に自作する。**

**理由**: 外部ライブラリはバージョン追従・破壊的変更への対応が継続的に発生する。
共通コンポーネントは fitReserve 単体でなく**今後の別システム開発でも再利用する資産**であり、
その維持コストを各システムで繰り返すより、自作して保守する方が最終的に安い。

- **新規に外部UIライブラリを追加しない。** 必要な部品は `base/` に自作する。
- `base/` が依存してよいのは React本体・`react-dom`・`next/image` のみ。
- 2026-08-21 に shadcn/ui と Radix UI をすべて削除済み。**復活させない。**
- **「未使用」を削除の理由にしない。** 今使っていない `base/` のコンポーネントも、将来の再利用資産として残す。

### 2. `base/` は自由度をなるべく減らす

**統一感のある画面を作りやすくすることを、書きやすさより優先する。**

**理由**: `children` や述語関数で自由に組めるAPIは自由度が高い一方、
画面ごとに表現がばらついて統一感が失われていく。

具体的なルールは4つ。

| ルール | 例 |
|---|---|
| **`className` を受け取らない。** 見た目の指定を画面側に書かせない | ❌ `<Card className="max-w-2xl mx-auto">` → ✅ `<Card maxWidth="2xl" center>` |
| **色は「用途」の語彙（`tone`）で受け取る** | ❌ `<Badge color="yellow">` → ✅ `<Badge tone="warning">` |
| **JSXを受け取る逃げ道を作らない。** 値を渡す形に限定する | ❌ `<Button><Icon/>保存</Button>` → ✅ `<Button label="保存" leftIcon={<Save/>} />` |
| **述語関数ではなく宣言的なpropsにする** | ❌ `disabled={(date)=>...}` → ✅ `availableDates={[...]}` |
| **ラベルは部品に内蔵する。** `<Label>` は提供しない | ❌ `<Label>氏名</Label><Input/>` → ✅ `<Input label="氏名" required />` |

### 共通の語彙（`components/base/tokens.ts`）

部品ごとに色やサイズの言葉がばらつくと「同じ意味なのに名前が違う」状態になる。
**語彙は `base/tokens.ts` にだけ定義し、部品はそれを参照する。**

| prop | 意味 | 値 |
|---|---|---|
| `tone` | 用途を表す**色** | `neutral`（中立・無効）/ `info`（主要操作・進行中）/ `success` / `warning` / `danger` |
| `variant` | **形**。色の意味は持たせない | `filled` / `outlined` / `soft` / `ghost` |
| `size` | 大きさ | `sm` / `md` / `lg` |

```tsx
// ❌ 色と形が同じ prop に混ざり、部品ごとに名前も違う
<Button variant="danger" />  <Alert type="error" />  <Spinner color="red" />

// ✅ 色は tone、形は variant
<Button tone="danger" />  <Alert tone="danger" />  <Spinner tone="danger" />
```

例外は幅の段階が必要な `Modal` / `Drawer` / `Avatar` の `size` と、
影の有無を持つ `Card` の `variant`。いずれも**色は混ぜない**。

ただし**機能不足で不自由にはしない。** 文言変換（`format`）・レイアウト指定（`width`/`align`/`size`/`maxWidth`/`fullWidth`）・
行ごとの業務ルール（`disabled`）などは意図的に残している。
**レイアウトも `className` ではなく専用の props で受け取る**（`maxWidth` / `center` / `fullHeight` / `scrollableBody` など）。

**`base/` に無い機能が必要になったら、画面側で独自に組まず `base/` 側を拡張する。**

> 配置ルール・カテゴリ分け・API設計の詳細は
> **[COMPONENT_ORGANIZATION.md](./COMPONENT_ORGANIZATION.md)** を参照。

## 命名規則

| 対象 | 形式 | 例 |
|------|------|------|
| 変数・関数 | camelCase | `userName`, `fetchUserData()` |
| コンポーネント | PascalCase | `UserProfile`, `ReservationList` |
| 型・インターフェース | PascalCase | `User`, `ReservationData` |
| 定数 | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_ITEMS` |

## ファイル命名

- **コンポーネント**: `UserProfile.tsx` (PascalCase)
- **ユーティリティ**: `formatDate.ts` (camelCase、拡張子は必ず `.ts`)
- **Server Actions**: `Auth.ts`, `Manual.ts` (PascalCase、拡張子は必ず `.ts`)

## ディレクトリ構造

```
app/src/
├── app/                # App Router（ページ）
├── components/
│   ├── base/          # 自作の基盤コンポーネント（★正式な基盤。他システムでも再利用）
│   └── layouts/       # ページの骨組み（Sidebar, Breadcrumb などの外枠）
├── views/             # 画面（ページ本体のコンポーネント）
│                       ページの実装は必ずここに置き、page.tsx は薄く保つ
├── api/               # Server Actions（FastAPIバックエンドとの通信層）
├── types/             # 型定義
└── lib/               # ユーティリティ
```

**テーマ（ライト / ダーク）**:

- 設定値は Cookie（`theme`）に `light` / `dark` / `system` のいずれかで保存する
- `layout.tsx` がサーバー側でCookieを読み、`<html>` に `dark` クラスを出力する。
  明示選択時は初回描画からテーマが確定するためちらつきが起きない
- `system` はサーバーがOSの配色を知り得ないため、`lib/theme.ts` の
  `THEME_INIT_SCRIPT` が描画前に `prefers-color-scheme` を見て解決する
- 部品の配色は `dark:` クラスで指定する。対応関係は Flowbite 系に揃える
  （`text-X-600` → `dark:text-X-400`、`bg-X-700` → `dark:bg-X-600`、
  `focus:ring-X-300` → `dark:focus:ring-X-800`）
- 見え方の確認は開発用カタログ `/dev/components` で行う（本番では404）
- テーマ切替UI（`ThemeToggle`）は `UserMenu`（PC）と `MobileNavMenu`（スマホ）に置く。
  どちらもヘッダー配下のため、社内画面ならどの幅でも到達できる
- ページの地色は `body`（`--background`）に任せる。画面のルート要素に
  `bg-gray-50` などを直接指定しない（ダーク時に取り残される）
- 濃いグレーの文字（`text-gray-900`）のダーク側は `dark:text-white` に揃える
- `global-error.tsx` は `layout.tsx` を置き換えて描画されるため、
  `globals.css` の読み込みと `THEME_INIT_SCRIPT` を自前で持つ
- ログイン画面など未ログインの画面は切替UIを持たず、
  Cookie未設定の既定値である `system`（OSの配色）に従う

**方針**:
- **`api/`**: バックエンド通信はすべてServer Actionsに集約する。
  Next.js側にRoute Handler（`app/api/`）を作ってAPIサーバーのように振る舞わせない。
  APIの実体はFastAPI（`api/`）であり、Next.jsはその呼び出し役に徹する。
- **グローバルな `hooks/` は作らない**: フックが乱立すると可読性が落ちるため、
  特定機能でのみ使うフックは、その機能のコンポーネントと同じ場所に置く。

**共通コンポーネントの配置ルール・カテゴリ分けの詳細は [COMPONENT_ORGANIZATION.md](./COMPONENT_ORGANIZATION.md) を参照。**

## 関数定義の方式

以下の形式を厳格に守ること：

| 対象 | 形式 | 例 |
|------|------|------|
| ページ (page.tsx) | `export default async function` | `export default async function UserPage()` |
| Server Actions | `export async function` | `export async function getManuals()` |
| コンポーネント | `export const` + アロー関数 | `export const UserProfile = () =>` |

**重要なルール**:
- **Server Actions**: ファイル先頭に必ず `"use server"` を記述
- **page.tsx**: `"use client"` は記述しない（Server Componentとして扱う）

```tsx
// ✅ ページ（Server Component、"use client"なし）
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <UserProfile user={user} />
}

// ✅ Server Actions（必ず"use server"を記述）
"use server"

export async function getManuals(): Promise<Manual[]> { }

// ✅ コンポーネント（constアロー関数）
export const UserProfile = ({ user }: { user: User }) => {
  return <div>{user.name}</div>
}
```

## Server Components vs Client Components

```tsx
// Server Component（デフォルト）
// データ取得、機密情報、バックエンドアクセス
export default async function Page() { }

// Client Component
// インタラクティブ、イベントハンドラ、useState/useEffect
"use client"
export function Counter() { }
```

## 型定義

```typescript
interface User {
  id: number
  name: string
}

type UserRole = 'admin' | 'staff' | 'customer'
```

## スタイリング

Tailwind CSS + `cn()` ユーティリティを使用する。**クラスの組み立ては必ず `cn()` を通す。**
テンプレートリテラルで連結すると、条件が偽のときに `false` や余分な空白が混ざり、
`tailwind-merge` による重複解決も効かない。

```tsx
import { cn } from "@/lib/utils"

className={cn("base-class", condition && "conditional-class")}
```

**クラス名を変数から組み立てない。** Tailwind はソースを文字列として走査するため、
`z-${zIndex}` や `bg-${color}-500` のように動的に作ったクラスはCSSが生成されず、
**エラーも出ないまま無効になる**。値を可変にしたい場合は次のどちらかにする。

```tsx
// ✅ 値そのものを変えたい → style で渡す
<div style={{ zIndex }} />

// ✅ 数種類から選ぶ → クラス名を丸ごと書いた表を引く
const TONE = { danger: "bg-red-700", success: "bg-green-700" } as const
<div className={cn(TONE[tone])} />
```

重なり順（z-index）の一覧は `app/src/components/base/tokens.ts` の `Z_INDEX` にある。

## 書式（Prettier）

書式は **Prettier に任せる**。設定は `app/.prettierrc.json`。

| 項目 | 設定 |
|---|---|
| クォート | ダブル |
| セミコロン | 付けない |
| インデント | 4スペース |
| 1行の長さ | 100 |
| 末尾カンマ | あり |

```bash
bun run format         # 整形する
bun run format:check   # 整形済みか確認する（CI向け）
```

ESLint は `eslint-config-prettier` を読み込み、書式に関するルールを無効化している。
**書式は Prettier、コードの誤りは ESLint** と役割を分ける。
