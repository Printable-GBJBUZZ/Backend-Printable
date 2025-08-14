import { razorpay } from "../utils/razorpay.ts";
import crypto from "node:crypto";
import { db } from "../configs/db.ts"; // your DB instance
import { payments } from "../db/schema.ts"; // table schema from schema.ts
import { eq } from "drizzle-orm"; // if using drizzle

export async function createOrderService(userId: string, amount: number, currency = "INR") {
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency,
    receipt: `receipt_${Date.now()}`,
  });
console.log(crypto.randomUUID())
  // Save initial order in DB with status = created
  await db.insert(payments).values({
    id: crypto.randomUUID(),
    order_id: order.receipt,
    user_id: userId,
    razorpay_order_id: order.id,
    amount,
    currency,
    status: "created",
    timestamp: new Date(),
  });

  return order;
}

export async function verifyPaymentService(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  const isValid = expectedSignature === razorpay_signature;

  if (isValid) {
    // Update DB
    await db
      .update(payments)
      .set({
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
      })
      .where(eq(payments.razorpay_order_id, razorpay_order_id));

    return { success: true };
  } else {
    await db
      .update(payments)
      .set({
        status: "failed",
      })
      .where(eq(payments.razorpay_order_id, razorpay_order_id));

    return { success: false };
  }
}
