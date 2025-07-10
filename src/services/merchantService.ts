import { merchants, orders } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { eq } from "drizzle-orm";

export interface MerchantPayload {
  id: string;
  name: string;
  userId: string;
  email: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  shopName: string;
  shopImages: string[];
}

export class MerchantService {
  public async getMerchant(merchantId: string) {
    const result = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }
  public async getAverageRatingAndCountByMerchantService(merchantId: string) {
    const merchantReviews = await db
      .select({
        average_review: merchants.average_rating,
        reviewCount: merchants.rating_count,
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);
    return merchantReviews;
  }
  public async createMerchant(payload: MerchantPayload) {
    const result = await db
      .insert(merchants)
      .values({
        ...payload,
      })
      .returning();
    return result[0];
  }

  public async getMerchantWithOrder(merchant_id: string) {
    const merchantWithOrders = await db.query.merchants.findFirst({
      where: (merchants, { eq }) => eq(merchants.id, merchant_id),
      with: {
        orders: true,
      },
    });

    console.log(merchantWithOrders);
    return merchantWithOrders;
  }

  public async updateMerchant(merchantId: string, payload: MerchantPayload) {
    const result = await db
      .update(merchants)
      .set(payload)
      .where(eq(merchants.id, merchantId))
      .returning();
    return result[0];
  }
}
