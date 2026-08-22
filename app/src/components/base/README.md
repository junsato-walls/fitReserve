# base ディレクトリ

自作の基盤UIコンポーネント。**外部UIライブラリに依存しない**（React本体・`react-dom`・`next/image` のみ）。

fitReserve固有のドメイン知識・API呼び出し・命名を持ち込まないこと。
このディレクトリは今後の別システム開発でも再利用する資産として扱う。

## 分類

| フォルダ | 用途 | 含まれるもの |
|---|---|---|
| `buttons/` | 操作を促す | Button, CopyButton, IconButton, LinkButton |
| `display/` | データ・情報の見せ方を決める | Avatar, Badge, Card, Carousel, ChatBubble, Table, Tabs |
| `navigation/` | 画面間の移動・現在位置を示す | BottomNavigation, Breadcrumb, Pagination |
| `feedback/` | 状態や結果を伝える | Alert, Spinner, Toast |
| `forms/` | ユーザー入力を受け取る | Checkbox, CheckboxGroup, CommentBox, Datepicker, Dropdown, FileInput, Input, Radio, RadioGroup, Select, Textarea |
| `icons/` | アイコン | ArrowLeft, ArrowRight, Delete, Download, Edit |
| `overlays/` | 元の画面に重ねて表示する | Banner, Drawer, Loading, Modal, Tooltips, useOverlayA11y |

## `components/layouts/` との違い

`display/` は**部品**としての見せ方を担う（Card, Table など）。
ページ全体の骨組み（Sidebar, Breadcrumb を含む共通レイアウト）は
`src/components/layouts/` に置く。粒度が異なるので混同しないこと。

## 設計原則

**自由度をなるべく減らし、統一感のある画面を作りやすくする。**
見た目の指定を画面側に書かせず、propsで用途を受け取って `base/` 側が配色や余白を決める。

詳細な設計ルールは [COMPONENT_ORGANIZATION.md](../../../../docs/COMPONENT_ORGANIZATION.md) の
「`base/` のAPI設計原則」を参照。

## 使い方

```tsx
import { Table } from "@/components/base/display/Table"
import { Card } from "@/components/base/display/Card"
import { Button } from "@/components/base/buttons/Button"
```

画面側で不足があれば、`base/` 側にpropsを追加して拡張する。
画面側で独自にスタイルを組み立てない。
