import "dotenv/config";
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand
} from "@aws-sdk/client-s3";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_BUCKET = process.env.S3_BUCKET || "deskos-media";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minioadmin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minioadmin";
const STORAGE_PUBLIC = process.env.STORAGE_PUBLIC === "true";

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY
  }
});

async function bucketExists() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (await bucketExists()) {
    console.log(`Bucket "${S3_BUCKET}" already exists.`);
  } else {
    await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    console.log(`Created bucket "${S3_BUCKET}".`);
  }

  if (STORAGE_PUBLIC) {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${S3_BUCKET}/products/*`]
        }
      ]
    };

    await s3.send(
      new PutBucketPolicyCommand({
        Bucket: S3_BUCKET,
        Policy: JSON.stringify(policy)
      })
    );
    console.log(`Enabled public read on "${S3_BUCKET}/products/*".`);
  } else {
    console.log("STORAGE_PUBLIC is not \"true\" - skipping public read policy.");
  }
}

main().catch((err) => {
  console.error("Failed to set up bucket:", err.message);
  process.exit(1);
});
