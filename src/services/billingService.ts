import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.1";
import Razorpay from "https://esm.sh/razorpay@2.9.2";
import { db } from "../configs/db.ts";
import { payments, payouts, referrals, users, orders, merchants } from "../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";

export class BillingService {
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_7TyZL5TEpLytmQ",
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") || "3Ks7TGo9RjkagnRDcJ4ALih0",
    });
  }

  async createPayment({ userId, orderId, amount, currency }: { userId: string; orderId: string; amount: number; currency: string }) {
    const userExists = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userExists.length) {
      throw new Error("User not found");
    }

    const orderExists = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!orderExists.length) {
      throw new Error("Order not found");
    }

    const receipt = `order_${orderId.substring(0, 34)}`; // Truncate to 34 chars + "order_" = 39 chars
    const razorpayOrder = await this.razorpay.orders.create({
      amount,
      currency,
      receipt,
      payment_capture: 1, // Auto-capture
    });

    const payment = {
      id: uuidv4(),
      userId,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency,
      status: "created",
    };

    await db.insert(payments).values(payment);

    return { ...payment, razorpayOrder };
  }

  async getPaymentStatus(razorpayPaymentId: string | null) {
    if (!razorpayPaymentId) {
      return "pending";
    }

    try {
      const payment = await this.razorpay.payments.fetch(razorpayPaymentId);
      return payment.status;
    } catch (error: any) {
      console.error("Razorpay fetch payment error:", error);
      return "error";
    }
  }

  async createPayout({ merchantId, amount, currency }: { merchantId: string; amount: number; currency: string }) {
    const merchantExists = await db.select().from(merchants).where(eq(merchants.id, merchantId)).limit(1);
    if (!merchantExists.length) {
      throw new Error("Merchant not found");
    }

    const payout = await this.razorpay.payouts.create({
      account_number: "2323230033223323",
      amount,
      currency,
      mode: "IMPS",
      purpose: "payout",
    });

    const payoutRecord = {
      id: uuidv4(),
      merchantId,
      razorpayPayoutId: payout.id,
      amount,
      currency,
      status: payout.status,
    };

    await db.insert(payouts).values(payoutRecord);

    return payoutRecord;
  }

  async getPayoutStatus(razorpayPayoutId: string) {
    try {
      const payout = await this.razorpay.payouts.fetch(razorpayPayoutId);
      return payout.status;
    } catch (error: any) {
      console.error("Razorpay fetch payout error:", error);
      return "error";
    }
  }

  async applyReferral({ referrerId, referredId, bonusAmount }: { referrerId: string; referredId: string; bonusAmount: number }) {
    const referrerExists = await db.select().from(users).where(eq(users.id, referrerId)).limit(1);
    if (!referrerExists.length) {
      throw new Error("Referrer not found");
    }

    const referredExists = await db.select().from(users).where(eq(users.id, referredId)).limit(1);
    if (!referredExists.length) {
      throw new Error("Referred user not found");
    }

    if (referrerId === referredId) {
      throw new Error("Referrer and referred user cannot be the same");
    }

    const referral = {
      id: uuidv4(),
      referrerId,
      referredId,
      bonusAmount,
      status: "applied",
    };

    await db.insert(referrals).values(referral);

    return referral;
  }

  async getUserTransactions(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(payments.createdAt));

    const userPayouts = await db
      .select()
      .from(payouts)
      .where(eq(payouts.merchantId, userId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(payouts.createdAt));

    return {
      payments: userPayments,
      payouts: userPayouts,
      page,
      limit,
    };
  }
}