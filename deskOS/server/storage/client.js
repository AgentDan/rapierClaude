import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_BUCKET = process.env.S3_BUCKET || "deskos-media";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || `${S3_ENDPOINT}/${S3_BUCKET}`;

// Works against MinIO, AWS S3, or Cloudflare R2 - only S3_ENDPOINT changes.
const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY
  }
});

async function uploadFile(key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );
  return getPublicUrl(key);
}

function getPublicUrl(key) {
  return `${S3_PUBLIC_BASE_URL}/${key}`;
}

async function fileExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err.$metadata && err.$metadata.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

export { s3, uploadFile, getPublicUrl, fileExists, S3_BUCKET };
