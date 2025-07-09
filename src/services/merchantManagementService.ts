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
      })
      .from(merchants)
      .limit(10);

    return result;
  }
}