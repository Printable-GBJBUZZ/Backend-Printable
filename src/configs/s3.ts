import { S3Client } from "npm:@aws-sdk/client-s3@3.540.0";
import "jsr:@std/dotenv/load";

// Add type annotation for better TypeScript support
const s3: S3Client = new S3Client({
  region: Deno.env.get("REGION"),
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
  },
});

export default s3;