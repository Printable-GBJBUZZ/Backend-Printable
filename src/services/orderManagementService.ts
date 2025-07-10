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
  updatedAt: Date;
  fulfillmentType: string;
  state: string | null;
  city: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  documents: any; // JSONB can be any structure; type it better if needed
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
        updatedAt: orders.updatedAt,
        fulfillmentType: orders.fulfillmentType,
        state: orders.state,
        city: orders.city,
        address: orders.address,
        latitude: orders.latitude,
        longitude: orders.longitude,
        documents: orders.documents,
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
        updatedAt: orders.updatedAt,
        fulfillmentType: orders.fulfillmentType,
        state: orders.state,
        city: orders.city,
        address: orders.address,
        latitude: orders.latitude,
        longitude: orders.longitude,
        documents: orders.documents,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(merchants, eq(orders.merchantId, merchants.id))
      .where(eq(orders.status, status))
      .limit(100); // Adjustable limit to avoid overwhelming response

    return result;
  }
}