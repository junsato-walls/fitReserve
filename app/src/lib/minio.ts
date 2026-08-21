// src/lib/minio.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function getPresignedUrl(
  bucket: string,
  key: string,
  expiresIn = 300
): Promise<string> {
  if (!bucket) throw new Error("bucket is required");
  if (!key) throw new Error("key is required");

  // 開発時のみ詳細ログ（本番では抑制）
  if (process.env.NODE_ENV !== "production") {
    console.log("[minio.getPresignedUrl]", {
      endpoint: process.env.MINIO_ENDPOINT,
      bucket,
      key,
      expiresIn,
    });
  }

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, cmd, { expiresIn });
}
