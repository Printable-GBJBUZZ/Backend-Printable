import { blogs } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { desc } from "drizzle-orm";

export interface BlogCreatePayload {
  title: string;
  img: string;
  description: string;
  content: { title: string; bulletpoint: string[] }[];
}

export class BlogService {
  public async createBlog(payload: BlogCreatePayload) {
    const id = crypto.randomUUID();
    const result = await db
      .insert(blogs)
      .values({
        id,
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  public async getAllBlogs() {
    return await db
      .select()
      .from(blogs)
      .orderBy(desc(blogs.createdAt)); // Latest first
  }
}