import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { reviews, users, merchants } from "../db/schema.ts";
import { eq, and } from "drizzle-orm"; // ✅ ADD THIS
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { availableMemory } from "node:process";
config({ path: ".env" });

const url = neon(Deno.env.get("DATABASE_URL")!);
const db = drizzle(url);

interface ReviewInput {
  userId: string;
  merchantId: string;
  rating: number;
  comment?: string;
}

export async function createReviewService(input: ReviewInput) {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (user.length === 0) {
    throw new Error("User not found");
  }

  const merchant = await db
    .select()
    .from(merchants)
    .where(eq(merchants.id, input.merchantId))
    .limit(1);
  if (merchant.length === 0) {
    throw new Error("Merchant not found");
  }

  const [newReview] = await db
    .insert(reviews)
    .values({
      userId: input.userId,
      merchantId: input.merchantId,
      rating: input.rating,
      comment: input.comment,
    })
    .returning();
  try {
    const updatedMerchant = await db
      .update(merchants)
      .set({
        average_rating: sql`(average_rating * rating_count + ${newReview.rating}) / (rating_count + 1)`,
        rating_count: sql`rating_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, input.merchantId))
      .returning()
      .execute();
    console.log(updatedMerchant);
  } catch (error) {
    console.error(error);
  }
}

export async function getReviewsByMerchantService(merchantId: string) {
  const merchantReviews = await db
    .select({
      id: reviews.id,
      userId: reviews.userId,
      merchantId: reviews.merchantId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.merchantId, merchantId))
    .innerJoin(users, eq(reviews.userId, users.id));

  return merchantReviews;
}

interface FetchReviewsParams {
  merchantId?: string;
  userId?: string;
}
