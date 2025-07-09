import { db } from "../configs/db.ts";
import { orders, users, merchants } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface OrderManagementResponse {
  id: string;
  userId: string;
  userName: string | null;
  merchantId: string;
  merchantShopName: string | null;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  scheduledPrintTime: Date | null;
  createdAt: Date;
}

export class OrderManagementService {
  public async getOrders(): Promise<OrderManagementResponse[]> {
    const result = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        userName: users.name,
        merchantId: orders.merchantId,
        merchantShopName: merchants.shopName,
        status: orders.status,
        totalAmount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        scheduledPrintTime: orders.scheduledPrintTime,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(merchants, eq(orders.merchantId, merchants.id));

    return result;
  }

  public async getOrdersByStatus(status: string): Promise<OrderManagementResponse[]> {
    const result = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        userName: users.name,
        merchantId: orders.merchantId,
        merchantShopName: merchants.shopName,
        status: orders.status,
        totalAmount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        scheduledPrintTime: orders.scheduledPrintTime,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(merchants, eq(orders.merchantId, merchants.id))
      .where(eq(orders.status, status))
      .limit(100); // Adjustable limit to avoid overwhelming response

    return result;
  }
}