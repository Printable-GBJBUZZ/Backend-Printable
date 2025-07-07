import { sql } from "npm:drizzle-orm@0.40";
import { db } from "../configs/db.ts";
import { users, merchants, orders, payments, payouts } from "../db/schema.ts";

export class AdminService {
  async getSystemStats() {
    const [userCount, merchantCount, orderCount, paymentCount, payoutCount] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(merchants),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(payments),
      db.select({ count: sql<number>`count(*)` }).from(payouts),
    ]);

    return {
      users: userCount[0].count,
      merchants: merchantCount[0].count,
      orders: orderCount[0].count,
      payments: paymentCount[0].count,
      payouts: payoutCount[0].count,
    };
  }
}