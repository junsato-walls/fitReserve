// src/app/api/sign-url/[bucket]/[...key]/route.ts
import { NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/minio";

export const runtime = "nodejs"; // aws-sdk v3 は Edge では動かない
export const dynamic = "force-dynamic"; // 念のため常に動的

type Params = { bucket: string; key: string[] };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { bucket, key } = await ctx.params; // ← ここを await

  if (!bucket || !key?.length) {
    return NextResponse.json(
      { error: "bucket and key are required" },
      { status: 400 }
    );
  }

  // Next.js 側でデコード済みなのでそのまま結合
  const objectKey = key.join("/");

  console.log(`bucket ${bucket}`);
  console.log(`objectKey ${objectKey}`);


  try {
    const url = await getPresignedUrl(bucket, objectKey);
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to sign url" }, { status: 500 });
  }
}
