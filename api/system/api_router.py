import importlib
import pkgutil
from fastapi import APIRouter
from routers.generic import __path__ as generic_path
from routers.custom import __path__ as custom_path
from routers.admin import __path__ as admin_path
from routers.public import __path__ as public_path
import re

api_router = APIRouter()


def to_kebab_case(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()


def load_modules(package_path, package_prefix, route_prefix=None):
    """
    指定されたパッケージからルーターモジュールを動的にロードする

    Args:
        package_path: パッケージのパス
        package_prefix: パッケージのプレフィックス（例: "routers.admin"）
        route_prefix: ルートのプレフィックス（例: "/admin", "/public"）
                     Noneの場合はモジュール名から自動生成
    """
    for _, module_name, ispkg in pkgutil.iter_modules(package_path):
        if module_name in ("api_router", "__init__") or ispkg:
            continue

        module = importlib.import_module(f"{package_prefix}.{module_name}")

        if hasattr(module, "router"):
            tag = getattr(module, "tag_name", module_name)

            # 空文字はプレフィックス無しの指定として扱うため is not None で判定する
            if route_prefix is not None:
                # プレフィックスが指定されている場合
                api_router.include_router(
                    module.router,
                    prefix=route_prefix,
                    tags=[tag],
                )
            else:
                # プレフィックスが指定されていない場合はモジュール名から生成
                api_router.include_router(
                    module.router,
                    prefix=f"/{to_kebab_case(module_name)}",
                    tags=[tag],
                )


# ルーターをロード
load_modules(public_path, "routers.public", "/public")  # 公開API
load_modules(custom_path, "routers.custom", None)  # カスタムAPI（auth等）
load_modules(generic_path, "routers.generic", "")  # 認証必須API
load_modules(admin_path, "routers.admin", "/admin")  # 管理者専用API
