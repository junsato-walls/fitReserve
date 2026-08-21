# フロントエンド共通コンポーネント整理ルール

**作成日**: 2026-08-19
**最終更新**: 2026-08-21
**関連**: [CODING_CONVENTIONS_FRONTEND.md](./CODING_CONVENTIONS_FRONTEND.md)

> このドキュメントは**これから守るルール**を書く場所であり、作業ログは残さない。
> 完了した移行作業の経緯は本ドキュメントから削除済み（最終節の変更履歴に要約のみ残す）。

---

## 1. 基本方針

コンポーネント設計の二本柱。詳細は [CODING_CONVENTIONS_FRONTEND.md](./CODING_CONVENTIONS_FRONTEND.md) の「コンポーネント設計の基本方針」に定義する。

1. **`base/` は自由度をなるべく減らし、統一感のある画面を作りやすくする。**
2. **外部UIライブラリを使わず自作する。** バージョン追従などの維持コストを避けるため。

これに加えて、本プロジェクト固有の前提が2つある。

- **共通コンポーネントは今後の別システム開発でも再利用する資産である。** そのため `base/` に fitReserve 固有のドメイン知識・API呼び出し・命名を持ち込まない。
- **「未使用」を削除の理由にしない。** 現時点で画面が使っていなくても、将来の再利用資産として意図的に残す。

---

## 2. レイヤー構成

```
components/
├── base/                # 自作・外部UIライブラリ非依存の基盤コンポーネント（正式な基盤）
├── common/              # fitReserve内で複数機能から使う複合コンポーネント（base/を組み合わせて作る）
└── features/<domain>/   # 特定機能に紐づくコンポーネント（Server Actions・業務ルールを含む）
```

### 2-1. `base/`

最小単位のUI部品。**外部UIライブラリに依存しない**（React本体・`react-dom`・`next/image` のみ）。

実フォルダ構成:

```
base/
├── buttons/    # Button, IconButton, LinkButton, Pagination, Breadcrumb, BottomNavigation, CopyButton
├── feedback/   # Alert, Toast, Spinner
├── forms/      # Input, Textarea, Select, Dropdown, Checkbox(+Group), Radio(+Group), Datepicker, FileInput, CommentBox, CustomCalendar
├── icons/      # ArrowLeft, ArrowRight, Delete, Download, Edit
├── layouts/    # Table, Card, Badge, Tabs, Avatar, Carousel, ChatBubble
└── overlays/   # Modal, Drawer, Tooltips, Banner, Loading
```

### 2-2. `common/`

`base/` を組み合わせて作る、fitReserve内の複数機能から使う部品（ページ骨組み、確認ダイアログなど）。

**配置条件**: 2つ以上の `features/*` から使われる見込みがあるか自問する。見込みが無ければ `features/<domain>/` に置く。

### 2-3. `features/<domain>/`

特定のドメイン（`reservation`・`staff`・`admin`）に紐づくコンポーネント。**UIの見た目を自前で組まず、`base/` の部品をそのまま使う。**

---

## 3. 配置判断フローチャート

1. **`base/` に相当する部品があるか？**
   → あれば**そのまま使う**（propsで足りなければ 4章の原則に沿って `base/` 側を拡張する）。
2. **特定の機能専用か？業務ロジックを含むか？**
   → Yes → `features/<domain>/`
   → No（2機能以上で使う純粋なUI合成）→ 次へ
3. **`common/` に同名・類似コンポーネントが既に無いか検索したか？**
   → 検索済みで無ければ `common/` に新規作成。あれば流用・拡張する。

---

## 4. `base/` のAPI設計原則

**「自由度を減らして統一感を出す」を具体化した設計ルール。** 新規作成・拡張時はこれに従う。

### 4-1. 見た目の指定を画面側に書かせない

生のカラークラス（`bg-yellow-100 text-yellow-800` 等）を props で受け取らない。
代わりに**用途を表す語彙**を受け取り、実際の配色は `base/` 側が一元管理する。

```tsx
// ❌ 画面ごとに微妙に違う黄色が生まれる
<Badge className="bg-yellow-100 text-yellow-800">予約受付</Badge>

// ✅ 用途だけ指定する。配色は base/Badge が持つ
<Badge tone="warning">予約受付</Badge>
```

バッジの用途語彙 `BadgeTone` は `base/layouts/Badge.tsx` が定義し、`base/layouts/Table.tsx` もそれを参照する。

| tone | 用途 |
|---|---|
| `neutral` | 無効・キャンセル済みなど中立 |
| `info` | 確定・進行中 |
| `success` | 完了・正常 |
| `warning` | 要対応・残りわずか |
| `danger` | エラー・満席 |

### 4-2. JSXを受け取る「逃げ道」を作らない

`children` や `render` 関数でJSXを渡せるようにすると自由度は上がるが、表現がばらついて統一感が失われる。
**用途が限られる部品では、値を渡す形（`label` / `type` など）に限定する。**

```tsx
// ❌ ボタンの中身を自由に組める＝画面ごとにアイコン位置も文字サイズもばらつく
<Button><Icon /> <span className="text-xs">保存</span></Button>

// ✅ 渡せるのは値だけ
<Button label="保存" leftIcon={<Save />} isLoading={saving} loadingLabel="保存中..." />
```

同じ理由で `Table` の列定義は `accessor` に関数を渡せない。表示形式は `type` で宣言する。

```tsx
columns={[
  { id: "name", header: "店舗名", accessor: "name" },                       // text（既定）
  { id: "is_enabled", header: "状態", accessor: "is_enabled", type: "boolean" },
  {
    id: "status", header: "ステータス", accessor: "status", type: "badge",
    format: (v) => getStatusLabel(String(v)),      // 文言だけ画面側が決める（戻り値はstring限定）
    badgeTone: (v) => getStatusTone(String(v)),    // 色ではなく用途
  },
]}
```

### 4-3. 述語関数ではなく宣言的なpropsにする

`disabled={(date) => ...}` のような述語関数は画面側に任意のロジックを書かせるため避ける。

```tsx
// ✅ 何を許すかを宣言する
<Datepicker inline minDate={new Date()} availableDates={selectableDates} />
```

### 4-4. ラベルは部品に内蔵する

`<Label>` を独立した部品として提供しない。`base/forms/*` は `label` prop を内蔵し、
`htmlFor`/`id` の結び付けと必須マーク（`required` で `*` を付与）を**部品側が保証する**。
画面側に書かせると `htmlFor` の付け忘れや `*` の書式ゆれが起きる。

```tsx
// ❌ htmlFor の付け忘れが起きうる
<div><Label>店舗コード *</Label><Input value={...} /></div>

// ✅
<Input label="店舗コード" required fullWidth value={...} />
```

### 4-5. 自由度を残してよいもの

「機能不足で不自由」にならないよう、以下は意図的に残す。

- **文言変換の関数**（`format`）… `"pending"→"予約受付"` は画面固有のドメイン知識なので `base/` では持てない。ただし**戻り値は `string` に限定**しJSXは返せない。
- **レイアウト指定**（`width` / `align` / `fullWidth` / `size`）… 可読性に直結し、色と違って統一感を損なわない。
- **行ごとの状態**（`TableAction.disabled` など）… 「予約が入っている枠は削除できない」のような業務ルールは宣言できないと機能が退化する。

---

## 5. アクセシビリティの完成基準（Definition of Done）

`base/` を新規作成・改修する際は最低限これを満たす。

- キーボードだけで全操作が完結する（Tab / Shift+Tab / Enter / Space / Esc / 矢印キー）
- 適切な `role` / `aria-*` が付与されている
- モーダル・ドロワー等の重なるUIは、開いている間フォーカスを内部に閉じ込め（フォーカストラップ）、閉じたら元の要素に戻す。背景は `inert` で隠す
- スクリーンリーダーで一通り操作して違和感が無い（VoiceOver か Narrator での簡易確認）

### 5-1. Listbox と Menu を混同しない

ARIAでは「**値を選ぶ**」Listboxパターンと「**操作を実行する**」Menuパターンは別物として定義されている。

| 用途 | 使うもの | ARIA |
|---|---|---|
| 店舗・ステータスなど**値の選択** | `base/forms/Select.tsx` | `role="listbox"` / `option` / `aria-selected` |
| 「編集」「削除」など**操作の実行** | `base/forms/Dropdown.tsx` | `role="menu"` / `menuitem` |

### 5-2. フォーカスの持たせ方

ポップアップを持つ部品（Select・Datepicker・CustomCalendar）は、
**DOMフォーカスをトリガー（入力欄・ボタン）に残したまま `aria-activedescendant` で位置を伝える**方式で統一している。
入力しながらのキーボード操作が競合しないため。

例外は `Datepicker` のインライン表示。入力欄が無くフォーカスの置き場所がないため、
**ハイライト中のセルだけをタブ移動の対象にする**（ローミングtabindex）。

---

## 6. 重複防止のルール

1. **新規コンポーネント作成前に必ず `base/` を検索する。**
2. **同じ役割のコンポーネントを複数レイヤーで新規に作らない。**
3. **`common/` に置く前に「2機能以上で使うか」を自問する。**

---

## 7. 既知の課題・バックログ

| # | 内容 | 状況 |
|---|---|---|
| 1 | **`base/README.md` と実フォルダ構成の不一致。** READMEは `actions/`・`overlay/`・`layout/` と記載しているが実体は `buttons/`・`overlays/`・`layouts/`。`icons/` はREADMEに記載が無い | 未着手 |
| 2 | `common/` 配下の重複（`common/buttons/Button.tsx`・`common/table/Table.tsx`）を `base/` に寄せるか判断する | 未着手 |
| 3 | `base/forms/CustomCalendar.tsx` と `base/forms/Datepicker.tsx` の用途重複。画面では `Datepicker` に一本化済みで `CustomCalendar` は未使用 | 判断待ち |
| 4 | `react-pdf` が参照0件。帳票機能（F-8）で使う想定が無ければ削除できる | 判断待ち |
| 5 | `base/` の `next/image` 依存。Next.js以外への持ち出しを想定するなら要検討 | 認識のみ |

### 既知の制約（対応不要と判断したもの）

- **`base/forms/Select.tsx` のタイプアヘッドはIME経由の日本語入力では効かない。** keydownベース実装全般の制約。

---

## 8. 変更履歴（要約）

| 日付 | 内容 |
|---|---|
| 2026-08-19 | ドキュメント作成。`base/`（38ファイル）が外部ライブラリ非依存の先行実装であることを確認し、これを正式な基盤とする方針を決定 |
| 2026-08-20 | `base/` 全38ファイルのアクセシビリティ監査を実施し、判明した要対応項目をすべて解消。`base/forms/Select.tsx` を Listbox パターンで新規作成 |
| 2026-08-20 | `features/` の Dialog・AlertDialog・Select・Button・Table を `base/` へ移行 |
| 2026-08-21 | `features/` の `ui/` 依存を全廃（card・input・label・alert・checkbox・textarea・calendar・button・dialog） |
| 2026-08-21 | **`src/components/ui/`（shadcn/ui 33ファイル）を削除。** 併せて `@radix-ui/*` 19パッケージ・`react-day-picker`・`vaul`・`class-variance-authority` を削除し、`dependencies` は31個→11個になった |
