import { users, merchants } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDistanceMatrix } from "./distanceMatrixService.ts";

export interface UserUpdatePayload {
  id: string;
  name: string;
  email: string;
  phone?: string;
  state?: string;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export class UserService {
  public async getUser(id: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  public async updateUser(payload: UserUpdatePayload, id: string) {
    const { name, email, phone, state, city, address, latitude, longitude } =
      payload;

    const result = await db
      .update(users)
      .set({
        name,
        email,
        phone,
        state,
        city,
        address,
        latitude,
        longitude,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return result;
  }

  public async getNearestMerchants(lat: string, long: string) {
    const distanceExpression = sql<string>`(
      6371 * acos(
        cos(radians(${lat})) * cos(radians(cast(${users}.latitude as numeric))) *
        cos(radians(cast(${users}.longitude as numeric)) - radians(${long})) +
        sin(radians(${lat})) * sin(radians(cast(${users}.latitude as numeric)))
      )
    )`;
    console.log({ lat, long });

    const nearestMerchantsQuery = db
      .select({
        merchantId: merchants.id,
        shopName: merchants.shopName,
        MerchantImages: merchants.shopImages,
        totalOrders: merchants.totalOrders,
        totalRevenue: merchants.totalRevenue,
        pendingOrders: merchants.pendingOrders,
        acceptedOrders: merchants.acceptedOrders,
        distance: distanceExpression,
        lat: merchants.latitude,
        long: merchants.longitude,
        average_rating: merchants.average_rating,
        rating_count: merchants.rating_count,
      })
      .from(merchants)
      .innerJoin(users, sql`${merchants.userId} = ${users.id}`)
      .orderBy(distanceExpression)
      .limit(10);

    const nearestMerchants = await nearestMerchantsQuery.execute();
    console.log(
      "NEAREST MERCHANTS@@@@@@@@@@@@@@@@@@@@@@@@@@@",
      nearestMerchants,
    );
    const distanceMatrix = await getDistanceMatrix(
      [Number(lat), Number(long)],
      nearestMerchants,
    );
    return distanceMatrix;
  }
}