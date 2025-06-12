import Pusher from "pusher";
import { orders, merchants, users } from "../db/schema.ts";
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
      .select({
        userPhoneNumber: users.phone,
        userEmail: users.email,
        ...orders,
      })
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
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
    const result = await db
      .insert(orders)
      .values({ id, ...payload })
      .returning();
    const order = result[0];

    await db
      .update(merchants)
      .set({
        totalOrders: sql`${merchants.totalOrders} + 1`,
        pendingOrders: sql`${merchants.pendingOrders} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, payload.merchantId));

    // Trigger a realtime event to notify the merchant
    const res = await this.pusher.trigger(
      `merchant-${payload.merchantId}`,
      "new-order",
      { order },
    );
    console.log(res);

    return order;
  }

  public async updateOrder(orderId: string, payload: OrderUpdatePayload) {
    const result = await db
      .update(orders)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    const order = result[0];

    if (payload.status === "queued") {
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
        payload.status === "queued" ||
        payload.status === "cancelled" ||
        payload.status === "printing")
    ) {
      await this.pusher.trigger(`user-${order.userId}`, "order-updated", {
        orderId: order.id,
        status: order.status,
      });
    }

    return order;
  }
}
