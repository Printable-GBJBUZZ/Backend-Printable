import Pusher from "pusher";
import { orders, merchants } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { eq, sql } from "drizzle-orm";

export interface OrderCreatePayload {
  userId: string;
  merchantId: string;
  totalAmount: number;
  paymentMethod: string;
  documents: any;
  scheduledPrintTime?: string | Date; // Accept string or Date
  fulfillmentType?: string; // "delivery" or "takeaway", default "delivery"
  state?: string;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export interface OrderUpdatePayload {
  status?: "pending" | "printing" | "ready for pickup" | "completed";
  totalAmount?: number;
  paymentMethod?: string;
  scheduledPrintTime?: string | Date; // Accept string or Date
  fulfillmentType?: string;
  state?: string;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  documents?: any;
}

export class OrderService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: Deno.env.get("PUSHER_APP_ID") || "",
      key: Deno.env.get("PUSHER_KEY") || "",
      secret: Deno.env.get("PUSHER_SECRET") || "",
      cluster: Deno.env.get("PUSHER_CLUSTER") || "",
      useTLS: true,
    });
  }

  public async getOrder(orderId: string) {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return result.length > 0 ? result[0] : null;
  }

  public async getOrdersByMerchantId(merchantId: string) {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.merchantId, merchantId));
    return result;
  }

  public async getOrdersByUserId(userId: string) {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
    return result;
  }

  public async createOrder(payload: OrderCreatePayload) {
    const id = crypto.randomUUID();
    // Convert scheduledPrintTime to a Date if it's a string
    const scheduledPrintTime = payload.scheduledPrintTime
      ? typeof payload.scheduledPrintTime === "string"
        ? new Date(payload.scheduledPrintTime)
        : payload.scheduledPrintTime
      : undefined;

    const result = await db
      .insert(orders)
      .values({
        id,
        ...payload,
        scheduledPrintTime, // Use the converted Date
      })
      .returning();
    const order = result[0];

    // Update merchant metrics: increment totalOrders and pendingOrders
    await db
      .update(merchants)
      .set({
        totalOrders: sql`${merchants.totalOrders} + 1`,
        pendingOrders: sql`${merchants.pendingOrders} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, payload.merchantId));

    // Trigger a realtime event to notify the merchant
    await this.pusher.trigger(
      `private-merchant-${payload.merchantId}`,
      "new-order",
      {
        orderId: order.id,
        userId: payload.userId,
        totalAmount: payload.totalAmount,
        documents: payload.documents,
        scheduledPrintTime: order.scheduledPrintTime,
      }
    );

    return order;
  }

  public async updateOrder(orderId: string, payload: OrderUpdatePayload) {
    // Convert scheduledPrintTime to a Date if it's a string
    const scheduledPrintTime = payload.scheduledPrintTime
      ? typeof payload.scheduledPrintTime === "string"
        ? new Date(payload.scheduledPrintTime)
        : payload.scheduledPrintTime
      : undefined;

    const result = await db
      .update(orders)
      .set({
        ...payload,
        scheduledPrintTime, // Use the converted Date
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
    const order = result[0];

    // If status changes to completed, update merchant metrics
    if (payload.status === "completed") {
      await db
        .update(merchants)
        .set({
          acceptedOrders: sql`${merchants.acceptedOrders} + 1`,
          pendingOrders: sql`${merchants.pendingOrders} - 1`,
          totalRevenue: sql`CAST(${merchants.totalRevenue} AS NUMERIC) + ${order.totalAmount}`,
          updatedAt: new Date(),
        })
        .where(eq(merchants.id, order.merchantId));
    }

    if (
      payload.status &&
      (payload.status === "accepted" ||
       payload.status === "declined" ||
       payload.status === "completed" ||
       payload.status === "cancelled")
    ) {
      await this.pusher.trigger(
        `private-user-${order.userId}`,
        "order-updated",
        {
          orderId: order.id,
          status: order.status,
        }
      );
    }

    return order;
  }
}