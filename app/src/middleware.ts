import { NextRequest, NextResponse } from "next/server";

type JwtPayload = {
  role?: string;
  exp?: number;
};

/**
 * JWTのペイロードを取り出す（署名検証は行わない）
 *
 * ここでの判定は画面遷移をわかりやすくするための入口チェックであり、
 * 実際の認可はバックエンド(system/auth.py の require_admin 等)が行う。
 */
function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/**
 * ログイン済みとみなせるトークンか（形式が正しく、有効期限内か）
 *
 * 期限切れのトークンを「ログイン済み」と扱うと、
 * /login からリダイレクトされた先で認証エラーになり操作できなくなるため、
 * expまで確認する。
 */
function isLoggedIn(token: string | undefined): boolean {
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload) return false;

  // exp はUNIX秒
  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ① API はここでスキップ（API で 401 を返すため）
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // ② ログイン済みで /login に来た場合はスタッフ画面へ送る
  if (pathname.startsWith("/login") && isLoggedIn(token)) {
    const staffUrl = req.nextUrl.clone();
    staffUrl.pathname = "/staff";
    return NextResponse.redirect(staffUrl);
  }

  // ③ 認証不要パス（/404 を追加）
  // トップページと /reservations は顧客向けの公開画面のため認証不要
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/reservations") ||
    pathname === "/404" ||
    pathname === "/500" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ④ 認証チェック
  if (!isLoggedIn(token)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // ⑤ /admin配下は管理者のみ（SPECIFICATION.mdのロール定義に準拠）
  if (pathname.startsWith("/admin") && decodeToken(token!)?.role !== "admin") {
    const staffUrl = req.nextUrl.clone();
    staffUrl.pathname = "/staff";
    return NextResponse.redirect(staffUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};