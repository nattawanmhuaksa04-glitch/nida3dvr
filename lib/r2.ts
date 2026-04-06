import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function getPresignedPutUrl(key: string, contentType: string, expiresIn = 3600) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(R2, cmd, { expiresIn });
}

export async function getPresignedGetUrl(key: string, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(R2, cmd, { expiresIn });
}

export async function deleteObject(key: string) {
  await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function getPublicUrl(key: string) {
  const base = process.env.R2_PUBLIC_DOMAIN;
  if (!base) return null;
  const origin = base.startsWith("http") ? base.replace(/\/$/, "") : `https://${base}`;
  return `${origin}/${key}`;
}
