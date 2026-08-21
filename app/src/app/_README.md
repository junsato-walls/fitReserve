# App Directory

このフォルダには **Next.js App Router** のページコンポーネントとレイアウトが含まれています。

## 概要

- **役割**: アプリケーションのルーティングとページレンダリング
- **特徴**: ファイルベースルーティングによる自動ルート生成
- **レンダリング**: Server Components（SSR）がデフォルト

## エクスポート方式の推奨事項

### ✅ page.tsx - `export default async function` を推奨
```tsx
// ✅ 推奨: page.tsx はデータ取得・認証チェックを行うため async
export default async function HomePage() {
  const data = await fetchData()
  return <Component data={data} />
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser(id)
  return <UserProfile user={user} />
}
```

### ✅ その他のファイル - `export default function` を推奨
```tsx
// ✅ 推奨: layout.tsx は通常 async 不要
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}

// ✅ 推奨: loading.tsx は静的コンテンツ
export default function Loading() {
  return <div>読み込み中...</div>
}

// ✅ 推奨: error.tsx は静的コンテンツ
export default function Error() {
  return <div>エラーが発生しました</div>
}

// ✅ 推奨: not-found.tsx は静的コンテンツ
export default function NotFound() {
  return <div>ページが見つかりません</div>
}
```

### async の使用基準

#### async が必要な場合（page.tsx）
- **サーバーサイドでのデータ取得**: `await getManuals()`
- **Cookie/Headers へのアクセス**: `await cookies()`
- **認証状態の確認**: `await getCurrentUser()`
- **パラメータの取得**: `await params`

```tsx
// ✅ async 必要
export default async function Page() {
  const cookie = await cookies()              // Cookie取得
  const { id } = await params                 // パラメータ取得
  const data = await fetchData()              // データ取得
  return <Component data={data} />
}
```

#### async が不要な場合（その他のファイル）
- **静的なコンテンツのみ**: レイアウト、ローディング、エラーページ
- **Client Component への委譲**: データ取得をクライアント側で行う場合

```tsx
// ✅ async 不要
export default function Layout({ children }) {
  return <div>{children}</div>
}

export default function Loading() {
  return <div>読み込み中...</div>
}
```

## フォルダ構成

### ルートファイル
- `layout.tsx` - アプリケーション全体のレイアウト
- `loading.tsx` - ローディング画面（全ページ共通）
- `error.tsx` - エラー画面（全ページ共通）
- `not-found.tsx` - 404エラー画面
- `page.tsx` - ホームページ（`/`）

### ページディレクトリ
- `login/` - ログインページ（`/login`）
- `manuals/` - マニュアル関連ページ（`/manuals/*`）
- `profile/` - プロフィールページ（`/profile`）

### 特殊ファイル
- `globals.css` - グローバルCSS
- `favicon.ico` - ファビコン

## page.tsx のルール

### ✅ 推奨される処理

#### 1. 初期化処理
```tsx
export default async function Page() {
  // 認証状態の確認
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    redirect("/login");
  }

  // 表示用データの取得
  const data = await fetchData();
  
  return <PageComponent data={data} />;
}
```

#### 2. 認証チェック
```tsx
// 認証が必要なページ
const user = await getCurrentUser();
if (!user) {
  redirect("/login");
}

// 権限チェック
if (!user.hasPermission('read:manuals')) {
  return <Unauthorized />;
}
```

#### 3. データ取得
```tsx
// サーバー側でのデータ取得
const manuals = await getManuals();
const user = await getUser(params.id);

// エラーハンドリング
if (!manuals.success) {
  return <ErrorMessage error={manuals.error} />;
}
```

#### 4. パラメータ処理
```tsx
export default async function Page({ 
  params, 
  searchParams 
}: {
  params: Promise<{ id: string }>
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { id } = await params;
  const { search, filter } = searchParams;
  
  // パラメータを使った処理
  const data = await fetchDataWithParams(id, { search, filter });
}
```

### ❌ 禁止事項

#### 1. "use client" の使用
```tsx
// ❌ 禁止
"use client";

export default function Page() {
  // Client Component は禁止
}
```

#### 2. ビジネスロジックの直接実装
```tsx
// ❌ 禁止 - 複雑なビジネスロジック
export default async function Page() {
  const result = await fetch('/api/data');
  const data = await result.json();
  
  // 複雑な計算処理やデータ変換
  const processedData = data.map(item => {
    // 複雑な処理...
    return transformedItem;
  });
}

// ✅ 推奨 - actionsで処理
export default async function Page() {
  const processedData = await processDataAction();
  return <Component data={processedData} />;
}
```

#### 3. 状態管理の直接実装
```tsx
// ❌ 禁止 - useState等の使用
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
```

#### 4. イベントハンドラーの実装
```tsx
// ❌ 禁止 - onClick等のイベント処理
const handleClick = () => {
  // イベント処理
};
```

## レイアウトファイル（layout.tsx）

### 役割
- 子ページ共通のレイアウト定義
- フォント設定
- メタデータ設定
- プロバイダーの配置

### 例
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

## 特殊ファイル

### loading.tsx
- ページ読み込み中の表示
- Suspense境界で自動表示
- Server Componentの処理中に表示

### error.tsx
- エラー発生時の表示
- Error Boundaryとして機能
- "use client" が必要

### not-found.tsx
- 404エラー時の表示
- notFound()関数で明示的に呼び出し可能

## ディレクトリ構造例

```
app/
├── README.md              # このファイル
├── layout.tsx              # ルートレイアウト
├── page.tsx               # ホームページ
├── loading.tsx            # 共通ローディング
├── error.tsx              # 共通エラー
├── globals.css            # グローバルCSS
├── login/
│   └── page.tsx          # ログインページ
├── manuals/
│   ├── page.tsx          # マニュアル一覧
│   ├── [id]/
│   │   └── page.tsx      # マニュアル詳細
│   └── create/
│       └── page.tsx      # マニュアル作成
└── profile/
    └── page.tsx          # プロフィール
```

## ベストプラクティス

### 1. データ取得はServer Componentで
```tsx
// ✅ 推奨
export default async function Page() {
  const data = await getServerData();
  return <ClientComponent data={data} />;
}
```

### 2. エラーハンドリングの実装
```tsx
export default async function Page() {
  const result = await fetchData();
  
  if (!result.success) {
    return <ErrorComponent error={result.error} />;
  }
  
  return <SuccessComponent data={result.data} />;
}
```

### 3. 適切なメタデータ設定
```tsx
export const metadata: Metadata = {
  title: 'ページタイトル',
  description: 'ページの説明',
};
```

### 4. 型安全性の確保
```tsx
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  // 型安全な実装
}
```

## まとめ

- **page.tsx**: `export default async function` でサーバーサイド処理
- **その他のファイル**: `export default function` で静的コンテンツ
- **データ取得・認証**: page.tsx で実行
- **ビジネスロジック**: actions/ で分離
- **UI操作**: components/ で実装