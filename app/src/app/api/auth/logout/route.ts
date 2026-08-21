// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // 204 No Content を返しつつ、'token' を確実に失効させる
  const res = new NextResponse(null, { status: 204 });

  // 発行時（actions/Auth.ts・api/auth/login）と同じ属性でないと失効しないため揃える
  res.cookies.set("token", "", {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    // ローカル開発はhttpのため、本番(https)でのみsecureを有効にする
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // 失効
    maxAge: 0,
  });

  // キャッシュさせない
  res.headers.set("Cache-Control", "no-store");

  return res;
}
