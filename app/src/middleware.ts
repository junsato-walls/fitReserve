import { hasMinRole as hasMinRoleLevel } from "@/lib/roles";
import { NextRequest, NextResponse } from "next/server";

type JwtPayload = {
  role?: string;
  exp?: number;
};

/** トークンのロールが指定ロール以上かどうか */
function hasMinRole(token: string, minimum: "admin" | "staff"): boolean {
  return hasMinRoleLevel(decodeToken(token)?.role, minimum);
}

/**
 * JWTのペイロードを取り出す（署名検証は行わない）
 *
 * ここでの判定は画面遷移をわかりやすくするための入口チェックであり、
 * 実際の認可はバックエンド(system/permissions.py の require_min_role 等)が行う。
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
  // 開発用のコンポーネントカタログは本番では公開しない。
  // page 側の notFound() はレイアウトのSuspenseでストリーミングが始まった後に
  // 評価されるためステータスが200のままになる。ここで確実に404を返す。
  if (pathname.startsWith("/dev") && process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // ② ログイン済みで /login に来た場合はスタッフ画面へ送る
  //
  // Server Actionは「今表示しているURL」へのPOSTとして届く。
  // /login 上のアクション（logout など）までリダイレクトすると
  // アクション本体が実行されないため、画面遷移(GET)だけを対象にする。
  const isServerAction = req.headers.has("next-action");
  if (pathname.startsWith("/login") && isLoggedIn(token) && !isServerAction) {
    const staffUrl = req.nextUrl.clone();
    staffUrl.pathname = "/staff";
    return NextResponse.redirect(staffUrl);
  }

  // ③ 認証不要パス（/404 を追加）
  // トップページと /reservations は顧客向けの公開画面のため認証不要
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/reservations") ||
    // 開発用のコンポーネントカタログ（本番ビルドでは page 側で404になる）
    pathname.startsWith("/dev") ||
    pathname === "/404" ||
    pathname === "/500" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ④ 顧客向けの予約URL（/[company_slug]/[project_id]/[store_id]）は認証不要
  //
  // ホームページに掲載する公開URLのため、ログインを要求してはいけない。
  // 会社スラッグは任意の文字列なので、パスの形（3階層で後ろ2つが数値）で判定する。
  // 組み合わせが正しいかはAPI側が検証する。
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length === 3 &&
    /^\d+$/.test(segments[1]) &&
    /^\d+$/.test(segments[2])
  ) {
    return NextResponse.next();
  }

  // ⑤ 認証チェック
  if (!isLoggedIn(token)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // ⑥ /admin配下は admin 以上のみ（super_admin も含む）
  if (pathname.startsWith("/admin") && !hasMinRole(token!, "admin")) {
    const staffUrl = req.nextUrl.clone();
    staffUrl.pathname = "/staff";
    return NextResponse.redirect(staffUrl);
  }

  return NextResponse.next();
}

export const config = {
  // public/ 配下の静的ファイル（ロゴ画像など）は認証対象から外す。
  // 除外しないと未ログイン時に /login へリダイレクトされ、
  // next/image の最適化も元画像を取得できず失敗する。
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpe?g|gif|svg|webp|ico|avif|woff2?)$).*)",
  ],
};