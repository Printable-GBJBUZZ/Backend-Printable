import { db } from '../configs/db.ts';
import { reviews } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

export class FetchReviewService {
  public async getReviewsByMerchantId(merchantId: string) {
    try {
      console.log(`Fetching reviews for merchantId: ${merchantId}`);
      
      // Test minimal query
      const testQuery = db.select({ count: sql`count(*)` }).from(reviews);
      console.log('Test Query SQL:', testQuery.toSQL().sql);
      const testResult = await testQuery;
      console.log('Test Query Result:', testResult);

      // Main query
      const query = db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          merchantId: reviews.merchantId,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
        })
        .from(reviews)
        .where(eq(reviews.merchantId, merchantId))
        .orderBy(reviews.createdAt);

      console.log('Main Query SQL:', query.toSQL().sql);
      const result = await query;

      console.log(`Fetched ${result.length} reviews for merchantId: ${merchantId}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching reviews by merchantId:', error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  }

  public async getReviewsByUserId(userId: string) {
    try {
      console.log(`Fetching reviews for userId: ${userId}`);
      
      // Test minimal query
      const testQuery = db.select({ count: sql`count(*)` }).from(reviews);
      console.log('Test Query SQL:', testQuery.toSQL().sql);
      const testResult = await testQuery;
      console.log('Test Query Result:', testResult);

      // Main query
      const query = db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          merchantId: reviews.merchantId,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
          updatedAt: reviews.updatedAt,
        })
        .from(reviews)
        .where(eq(reviews.userId, userId))
        .orderBy(reviews.createdAt);

      console.log('Main Query SQL:', query.toSQL().sql);
      const result = await query;

      console.log(`Fetched ${result.length} reviews for userId: ${userId}`);
      return result;
    } catch (error: any) {
      console.error('Error fetching reviews by userId:', error);
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  }
}