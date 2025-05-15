import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function testConnection() {
  const sql = neon(
    "postgresql://neondb_owner:npg_XRSN6kcE7ylA@ep-rough-glitter-a15ya1tf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
  );
  const result = await sql`SELECT NOW()`;
  console.log(result);
}

testConnection();
