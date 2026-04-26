import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT ?? '',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.S3_BUCKET ?? '';

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

export async function downloadFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
