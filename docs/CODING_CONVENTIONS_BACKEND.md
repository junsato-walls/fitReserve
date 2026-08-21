# バックエンド コーディング規約

FastAPI (Python) のコーディング規約

**対象**: api/配下のPythonコード  
**最終更新**: 2026-08-05

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

## ディレクトリ構造

```
api/
├── routers/
│   ├── admin/          # 管理者用エンドポイント
│   ├── generic/        # 汎用エンドポイント
│   ├── public/         # 公開エンドポイント
│   └── custom/         # カスタムエンドポイント
├── schemas/            # Pydanticスキーマ
│   ├── admin/
│   ├── generic/
│   └── public/
└── system/             # システム共通モジュール
    ├── models.py       # SQLAlchemyモデル
    ├── db.py          # DB接続
    └── auth.py        # 認証
```

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
- `datetime` 型には `ZoneInfo("Asia/Tokyo")` を使用

```python
from datetime import datetime
from zoneinfo import ZoneInfo

JST = ZoneInfo("Asia/Tokyo")
now = datetime.now(JST)
```
