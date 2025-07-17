import { db } from "../configs/db.ts";
import { merchants, orders } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";

export interface MerchantManagementResponse {
  id: string;
  shopName: string;
  email: string;
  role: string;
  status: string;
  joinDate: Date;
  orders: number;
  name: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
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
        shopName: merchants.shopName,
        email: merchants.email,
        role: sql<string>`'merchant'`.as("role"),
        status: sql<string>`CASE WHEN EXISTS (SELECT 1 FROM ${orders} WHERE ${orders.merchantId} = ${merchants.id} AND ${orders.status} = 'pending') THEN 'Pending' ELSE 'Completed' END`.as("status"),
        joinDate: merchants.createdAt,
        orders: sql<number>`(SELECT COUNT(*) FROM ${orders} WHERE ${orders.merchantId} = ${merchants.id})`.as("orders"),

        name: merchants.name,
        phone: merchants.phone,
        state: merchants.state,
        city: merchants.city,
        address: merchants.address,
        latitude: merchants.latitude,
        longitude: merchants.longitude,
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