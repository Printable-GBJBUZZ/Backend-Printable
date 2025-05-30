import Pusher from "pusher";
import { orders } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { eq } from "drizzle-orm";

export interface OrderCreatePayload {
  userId: string;
  merchantId: string;
  totalAmount: number;
  paymentMethod: string;
  documents: any;
  scheduledPrintTime?: Date;
  fulfillmentType?: string; // "delivery" or "takeaway", default "delivery"
  state?: string;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

export interface OrderUpdatePayload {
  status?: string;
  totalAmount?: number;
  paymentMethod?: string;
  scheduledPrintTime?: Date;
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
    console.log(payload);
    const id = crypto.randomUUID();
    const result = await db
      .insert(orders)
      .values({ id, ...payload })
      .returning();
    const order = result[0];

    // Trigger a realtime event to notify the merchant
    await this.pusher.trigger(
      `private-merchant-${payload.merchantId}`,
      "new-order",
      {
        orderId: order.id,
        userId: payload.userId,
        totalAmount: payload.totalAmount,
        documents: payload.documents,
        scheduledPrintTime: payload.scheduledPrintTime,
      },
    );

    return order;
  }

  public async updateOrder(orderId: string, payload: OrderUpdatePayload) {
    const result = await db
      .update(orders)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    const order = result[0];

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
        },
      );
    }

    return order;
  }
}
