# バックエンド コーディング規約

FastAPI (Python) のコーディング規約

**対象**: api/配下のPythonコード  
**最終更新**: 2026-09-02

---

## 基本方針

- **PEP 8** に準拠
- **型ヒント** を必須とする (Python 3.10+の記法を推奨)
- **文字コード**: UTF-8

## 命名規則

| 対象 | 形式 | 例 |
|------|------|------|
| 変数・関数 | snake_case | `user_name`, `get_user_by_id()` |
| クラス | PascalCase | `Users`, `ReservationService` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| プライベート変数・メソッド | `_`プレフィックス | `_internal_method()` |

## インポート順序

1. 標準ライブラリ
2. サードパーティライブラリ
3. ローカルモジュール

```python
# 標準ライブラリ
import time
from datetime import datetime
from zoneinfo import ZoneInfo

# サードパーティ
from fastapi import FastAPI, Request
from sqlalchemy import Column, Integer, String

# ローカル
from system.db import Base, get_db
from schemas.users import UserResponse
```

## 関数定義

```python
# 型ヒントを必ず付ける
def get_user_by_id(user_id: int, db: Session) -> Users | None:
    """ユーザーIDからユーザー情報を取得
    
    Args:
        user_id: ユーザーID
        db: データベースセッション
    
    Returns:
        ユーザー情報、存在しない場合はNone
    """
    return db.query(Users).filter(Users.id == user_id).first()
```

## エラーハンドリング

```python
from fastapi import HTTPException, status

@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )
    return user
```

## HTTPステータスコード一覧

FastAPIで使用する主要なHTTPステータスコードとその用途：

### 成功レスポンス (2xx)

| コード | 定数 | 用途 | 使用例 |
|--------|------|------|--------|
| 200 | `status.HTTP_200_OK` | 成功 | GET, PUT, PATCH の成功 |
| 201 | `status.HTTP_201_CREATED` | 作成成功 | POST でリソース作成成功 |
| 204 | `status.HTTP_204_NO_CONTENT` | 成功（本文なし） | DELETE の成功 |

### クライアントエラー (4xx)

| コード | 定数 | 用途 | 使用例 |
|--------|------|------|--------|
| 400 | `status.HTTP_400_BAD_REQUEST` | リクエストが不正 | バリデーションエラー |
| 401 | `status.HTTP_401_UNAUTHORIZED` | 認証が必要 | 未ログイン、トークン無効 |
| 403 | `status.HTTP_403_FORBIDDEN` | アクセス権限なし | 権限不足 |
| 404 | `status.HTTP_404_NOT_FOUND` | リソースが存在しない | ID指定で見つからない |
| 409 | `status.HTTP_409_CONFLICT` | リソースの競合 | 重複登録、楽観的ロック失敗 |
| 422 | `status.HTTP_422_UNPROCESSABLE_ENTITY` | 処理できないエンティティ | Pydanticバリデーションエラー |

### サーバーエラー (5xx)

| コード | 定数 | 用途 | 使用例 |
|--------|------|------|--------|
| 500 | `status.HTTP_500_INTERNAL_SERVER_ERROR` | サーバー内部エラー | 予期しないエラー |
| 503 | `status.HTTP_503_SERVICE_UNAVAILABLE` | サービス利用不可 | メンテナンス中、DB接続不可 |

### 使用例

```python
from fastapi import HTTPException, status

# 201 Created - リソース作成成功
@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return created_user

# 204 No Content - 削除成功
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    # 削除処理
    return

# 400 Bad Request - バリデーションエラー
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="入力値が不正です"
)

# 401 Unauthorized - 認証エラー
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="認証が必要です",
    headers={"WWW-Authenticate": "Bearer"}
)

# 403 Forbidden - 権限エラー
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="この操作を実行する権限がありません"
)

# 404 Not Found - リソース未存在
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="ユーザーが見つかりません"
)

# 409 Conflict - 重複エラー
raise HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="このメールアドレスは既に登録されています"
)
```

## レイヤー構成

責務を層で分ける。**上の層は下の層だけを呼び、下から上は呼ばない。**

```
router  →  usecase  →  repository  →  model
   ↓          ↓            ↓
        schema（リクエスト・レスポンスの型）
```

```
api/
├── main.py
├── router/             # ルート管理層（HTTPの入り口）
│   ├── __init__.py     #   URLと権限の一覧表。ここで全ルーターを明示的に登録する
│   ├── auth/           #   /auth     認証不要（ログイン前。面に属さない）
│   ├── public/         #   /public   認証不要
│   ├── staff/          #   /         readonly以上。担当店舗で絞る
│   ├── admin/          #   /admin    admin以上
│   └── sysadmin/       #   /sysadmin super_admin専用
├── usecase/            # 業務ロジック層
│   ├── auth.py
│   ├── public/ staff/ admin/ sysadmin/   #   routerと同じ面で分ける
├── repository/         # DBアクセス層
│   ├── query/          #   SELECT のみ
│   └── command/        #   INSERT / UPDATE / DELETE
├── schema/             # バリデーション、リクエスト・レスポンスの定義
├── model/              # DB定義（SQLAlchemyモデル）
└── system/             # 基盤（層をまたいで使う土台）
    ├── db.py           #   DB接続とセッション
    ├── auth.py         #   トークンの発行・検証
    ├── permissions.py  #   ロールと担当店舗による認可
    └── clock.py        #   JSTの現在時刻
```

### 各層の責務

| 層 | 置くもの | 置かないもの |
|---|---|---|
| `router` | パス・HTTPメソッド・クエリパラメータの受け取り、`response_model` の指定、見つからないときの404 | 業務ロジック、SQLの組み立て、`db.commit()` |
| `usecase` | 業務ルールの判定とHTTPエラーの送出、トランザクション境界、複数repositoryの呼び出し、外部API参照 | SQLの組み立て |
| `repository` | SQLの組み立てと実行 | 業務ルール、`HTTPException`、`db.commit()` |
| `schema` | Pydanticによる入出力の型とバリデーション | DBアクセス |
| `model` | テーブル定義 | 業務ロジック |

### router のルール

**1つのハンドラから呼ぶのは、usecase か repository の「どちらか1つだけ」。**

```python
# ✅ 業務ロジックがあるので usecase を1つ呼ぶ
@router.post("/reservations", response_model=ReservationResponse)
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db)):
    return reservations_usecase.create_reservation(db, reservation)

# ✅ 絞り込みだけで業務ルールが無いので repository を1つ直接呼ぶ
@router.get("/school-divisions", response_model=list[SchoolDivisionResponse])
def get_school_divisions(db: Session = Depends(get_db)):
    return school_divisions_query.list_all(db)

# ❌ routerが2つ呼んで結果を組み立てている＝業務ロジックが漏れている
@router.get("/stores/{store_id}")
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = stores_query.find_by_id(db, store_id)
    store.school_ids = stores_query.list_school_ids(db, store_id)   # usecaseへ移す
    return store
```

**repository を直接呼んでよいのは、次をすべて満たす場合だけ。**

- 呼び出しが1回で済む
- 受け取ったパラメータをそのまま検索条件として渡すだけ
- 値の計算・付加・業務ルールの判定が要らない
  （「取得して見つからなければ404」はHTTPの作法なので router に書いてよい）

```python
# ✅ 取得して無ければ404だけ。usecaseを挟まない
@router.get("/schools/{school_id}", response_model=SchoolResponse)
def get_school(school_id: int, db: Session = Depends(get_db)):
    school = schools_query.find_by_id(db, school_id)
    if not school:
        raise HTTPException(status_code=404, detail=schools_usecase.NOT_FOUND)
    return school
```

### usecase を作らない基準

**usecase は業務ロジックを書く場所であり、routerとrepositoryの間の通し穴にしない。**
受け取った引数をrepositoryへ渡して返すだけの関数は作らず、routerから直接呼ぶ。
関数が1つ増えるたびに、呼び出し元・シグネチャ・テストの3つが増えるため。

| 中身 | 置き場所 |
|---|---|
| repositoryを1回呼んで返すだけ | router（usecaseを作らない） |
| 取得して無ければ404 | router |
| 関連データの付加、値の計算、重複・期間・権限の判定 | usecase |
| 複数のrepositoryを呼ぶ、書き込みを伴う | usecase |

### usecase のルール

- **トランザクションの境界はここだけ。** `db.commit()` を書いてよいのは usecase のみ
- 業務ルールに反する場合は `HTTPException` を送出する（HTTPの語彙を持ってよい最下層）
- 面（public / staff / admin / sysadmin）ごとにフォルダを分ける。同じテーブルでも面によって守るべきルールが違うため

### repository のルール

- `query/` は **SELECT のみ**。`command/` は **それ以外**（INSERT / UPDATE / DELETE）
- ファイルはテーブル（リソース）単位。面では分けない。同じテーブルを複数の面から使うため
- **`db.commit()` を書かない。** 採番などでIDが必要な場合に限り `db.flush()` までを行う
- 業務ルールを持たない。「担当店舗で絞る」は `store_ids` を引数で受け取るだけにして、
  何を渡すかは呼び出し側が決める

```python
# repository/query/schedules.py
def search(db: Session, store_ids: Optional[list[int]] = None, ...) -> list[Schedules]:
    """store_ids は担当店舗による絞り込み。None は全店舗を表す"""
```

### schema のルール（リクエストの定義）

**リクエストは、ボディもクエリも schema に定義する。** router の引数に直接書かない。
書くと同じ項目が複数のエンドポイントにコピペされ、上限や型の制約も付け忘れる。

| リクエストの種類 | 定義 | routerでの受け取り方 |
|---|---|---|
| ボディ（POST） | `XxxCreate` | `xxx: XxxCreate` |
| ボディ（PUT / PATCH） | `XxxUpdate` | `xxx: XxxUpdate` |
| クエリ文字列（GET） | `XxxQuery` | `query: Annotated[XxxQuery, Query()]` |
| パスパラメータ | 定義しない | `xxx_id: int`（識別子1〜2個なのでモデル化しない） |

同じリソースにクエリが複数ある場合は用途を挟む。例: `SchoolSearchQuery`（管理用の一覧）と
`SchoolPublicQuery`（顧客向けの一覧）。

**ページングは `schema/common.py` の `PaginationQuery` を継承する。**
`skip` / `limit` を各所で定義し直さない。`limit` には必ず上限（`MAX_LIMIT`）を付ける。

```python
# schema/users.py
class UserSearchQuery(PaginationQuery):
    """ユーザー一覧の検索クエリ"""

    role: Optional[UserRole] = Field(None, description="ロールで絞る")
    is_active: Optional[bool] = Field(None, description="有効フラグで絞る")

# router/admin/users.py
@router.get("/users", response_model=List[UserWithStore])
def get_users(
    query: Annotated[UserSearchQuery, Query()], db: Session = Depends(get_db)
):
    return users_usecase.list_users(db, query)
```

**どこで検証するか**

| 内容 | 場所 | 返るもの |
|---|---|---|
| 型・必須・範囲・列挙（1項目で完結） | schema | 422（Pydanticの検証結果） |
| 複数項目にまたがる業務的な前後関係、DBを見ないと分からない条件 | usecase | 400 + 読める日本語の文言 |

例えば「開始日 > 終了日」は schema でも書けるが、422は配列形式で画面に出しにくいため
usecase で 400 と文言を返している。利用者に見せる文言が要るかどうかで決める。

**usecase / repository への渡し方**

- usecase は `XxxQuery` をそのまま受け取ってよい
- repository は引数を明示する（HTTPのリクエスト形に依存させない）。
  項目名を揃えたうえで `**query.model_dump()` で渡してもよい

### 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| ファイル名 | リソースの複数形（snake_case） | `reservations.py`, `school_divisions.py` |
| query の関数 | `find_*`（1件）/ `list_*`・`search`（複数）/ `exists_*`・`count_*`（判定） | `find_by_id`, `list_open`, `exists_slug` |
| command の関数 | `create` / `update` / `soft_delete` / `replace_*` | `replace_store_ids` |
| usecase の関数 | 操作を表す動詞 | `create_reservation`, `list_availability` |
| リクエストのスキーマ | `XxxCreate` / `XxxUpdate` / `XxxQuery` | `UserSearchQuery`, `StorePublicQuery` |
| import の別名 | `<リソース>_<層>` | `from repository.query import users as users_query` |

同名モジュールが層をまたいで存在するため、`import ... as` で層が分かる別名を付ける。

## エンドポイント命名規則

### 使用するHTTPメソッド

REST APIでは以下の **5つのHTTPメソッドのみ** を使用してください：

- **GET** - リソースの取得
- **POST** - リソースの作成
- **PUT** - リソースの完全更新（全フィールド必須）
- **PATCH** - リソースの部分更新（一部フィールドのみ）
- **DELETE** - リソースの削除

❌ 使用禁止：HEAD, OPTIONS, TRACE, CONNECT など

### エンドポイントパターン

| 操作 | HTTPメソッド | エンドポイント例 | 関数名例 |
|------|------------|----------------|---------|
| 一覧取得 | GET | `/users` | `get_users()` |
| 単体取得 | GET | `/users/{id}` | `get_user()` |
| 作成 | POST | `/users` | `create_user()` |
| 完全更新 | PUT | `/users/{id}` | `update_user()` |
| 部分更新 | PATCH | `/users/{id}` | `patch_user()` |
| 削除 | DELETE | `/users/{id}` | `delete_user()` |

### PUT vs PATCH の使い分け

```python
# PUT - 完全更新（全フィールド必須）
@router.put("/users/{user_id}")
async def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    # すべてのフィールドを更新
    pass

# PATCH - 部分更新（指定フィールドのみ）
@router.patch("/users/{user_id}")
async def patch_user(user_id: int, user: UserPartialUpdate, db: Session = Depends(get_db)):
    # 指定されたフィールドのみ更新
    pass
```

## Pydanticスキーマ

```python
from pydantic import BaseModel, Field
from datetime import datetime

class UserBase(BaseModel):
    """ユーザーの基本情報"""
    email: str = Field(..., description="メールアドレス")
    name: str = Field(..., min_length=1, max_length=50, description="ユーザー名")

class UserCreate(UserBase):
    """ユーザー作成リクエスト"""
    password: str = Field(..., min_length=8, description="パスワード")

class UserResponse(UserBase):
    """ユーザーレスポンス"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

## データベース

### テーブル命名規則
- snake_case（複数形）: `users`, `reservations`

### カラム命名規則
- snake_case: `user_name`, `created_at`
- 主キー: `id`
- 外部キー: `{テーブル名単数}_id` (例: `user_id`, `store_id`)

### タイムゾーン
- すべての日時データは **日本標準時 (JST)** で統一
- 現在時刻は `system/clock.py` から取得する。各モジュールで `datetime.now()` を
  書くとタイムゾーンの指定漏れが起きるため、独自に定義しない

```python
from system.clock import now, today

created_at = now()      # JSTの現在日時
target = today()        # JSTの今日の日付
```
