import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { personal_id = "", password = "" } = await req.json().catch(() => ({}));

  console.log("login 処理を実施する");

  // バックエンド(routers/custom/auth.py)はBody(...)でJSONを要求する
  const res = await fetch(`${process.env.API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ personal_id, password }),
  });
  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.detail || "ログイン失敗" },
      { status: res.status }
    );
  }

  // バックエンドが返すキー名に合わせて access_token を使う
  const token = data.access_token as string;
  if (!token) {
    return NextResponse.json(
      { error: "トークン取得に失敗しました" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7日間
    sameSite: "lax",
    // ローカル開発はhttpのため、本番(https)でのみsecureを有効にする
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
