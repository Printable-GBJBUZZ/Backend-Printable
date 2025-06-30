import "jsr:@std/dotenv/load";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import errorHandler from "./mainErrorHandler.ts";
import Routes from "./src/route/index.ts";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api", Routes);

app.use(errorHandler);

// Neon DB connection
import { Pool } from "pg";
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_XRSN6kcE7ylA@ep-rough-glitter-a15ya1tf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: true }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Neon DB connection error:", err.stack);
  } else {
    console.log("Neon DB connected successfully");
  }
  release();
});

const PORT = Deno.env.get("PORT") || 5000;
app.listen(PORT, () => console.log(`Server running on the port ${PORT}`));
