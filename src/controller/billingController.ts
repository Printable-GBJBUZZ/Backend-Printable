import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.1";
import { BillingService } from "../services/billingService.ts";
import { db } from "../configs/db.ts";
import { payments, payouts } from "../db/schema.ts";
import { eq } from "drizzle-orm";

const billingService = new BillingService();

export const processPayment = async (req: any, res: any, next: any) => {
  try {
    console.log("Received request body:", req.body);
    const { userId, orderId, amount, currency = "INR" } = req.body;

    if (!userId || !orderId || !amount) {
      return res.status(400).json({ error: "userId, orderId, and amount are required" });
    }

    const payment = await billingService.createPayment({
      userId,
      orderId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
    });

    res.json({ success: true, payment });
  } catch (error: any) {
    console.error("Process payment error:", error.message || error, "Stack:", error.stack);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const getPaymentStatus = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;

    const payment = await db.select().from(payments).where(eq(payments.id, id)).limit(1);

    if (!payment.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const status = await billingService.getPaymentStatus(payment[0].razorpayPaymentId);

    res.json({ success: true, payment: { ...payment[0], externalStatus: status } });
  } catch (error: any) {
    console.error("Get payment status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const processPayout = async (req: any, res: any, next: any) => {
  try {
    const { merchantId, amount, currency = "INR" } = req.body;

    if (!merchantId || !amount) {
      return res.status(400).json({ error: "merchantId and amount are required" });
    }

    const payout = await billingService.createPayout({
      merchantId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
    });

    res.json({ success: true, payout });
  } catch (error: any) {
    console.error("Process payout error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPayoutStatus = async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;

    const payout = await db.select().from(payouts).where(eq(payouts.id, id)).limit(1);

    if (!payout.length) {
      return res.status(404).json({ error: "Payout not found" });
    }

    const status = await billingService.getPayoutStatus(payout[0].razorpayPayoutId);

    res.json({ success: true, payout: { ...payout[0], externalStatus: status } });
  } catch (error: any) {
    console.error("Get payout status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const applyReferral = async (req: any, res: any, next: any) => {
  try {
    const { referrerId, referredId, bonusAmount } = req.body;

    if (!referrerId || !referredId || !bonusAmount) {
      return res.status(400).json({ error: "referrerId, referredId, and bonusAmount are required" });
    }

    const referral = await billingService.applyReferral({
      referrerId,
      referredId,
      bonusAmount,
    });

    res.json({ success: true, referral });
  } catch (error: any) {
    console.error("Apply referral error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserTransactions = async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await billingService.getUserTransactions(userId, parseInt(page), parseInt(limit));

    res.json({ success: true, transactions });
  } catch (error: any) {
    console.error("Get user transactions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};