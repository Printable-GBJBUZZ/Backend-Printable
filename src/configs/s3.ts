import { S3Client } from "@aws-sdk/client-s3";
import "jsr:@std/dotenv/load";

const s3 = new S3Client({
  region: Deno.env.get("REGION"),
  credentials: () => ({
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
  }),
});

export default s3;
