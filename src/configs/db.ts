import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import "jsr:@std/dotenv/load";
import * as schema from '../db/schema.ts'
config({ path: ".env" }); 

export const db = drizzle(Deno.env.get("DATABASE_URL")!,{schema});
