import { db } from "../configs/db.ts";
import { merchants, orders } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";

export interface MerchantManagementResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  shopName: string | null;
  shopImages: string[] | null;
  average_rating: number;
  rating_count: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  acceptedOrders: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export class MerchantManagementService {
  public async getMerchants(): Promise<MerchantManagementResponse[]> {
    const result = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        email: merchants.email,
        phone: merchants.phone,
        state: merchants.state,
        city: merchants.city,
        address: merchants.address,
        latitude: merchants.latitude,
        longitude: merchants.longitude,
        shopName: merchants.shopName,
        shopImages: merchants.shopImages,
        average_rating: merchants.average_rating,
        rating_count: merchants.rating_count,
        totalOrders: merchants.totalOrders,
        totalRevenue: merchants.totalRevenue,
        pendingOrders: merchants.pendingOrders,
        acceptedOrders: merchants.acceptedOrders,
        createdAt: merchants.createdAt,
        updatedAt: merchants.updatedAt,
      })
      .from(merchants)
      .limit(10);

    return result;
  }
}