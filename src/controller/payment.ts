import { Request, Response } from "express";
import { createOrderService, verifyPaymentService } from "../services/payment.ts";

export async function createOrder(req: Request, res: Response) {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ message: "userId and amount are required" });
    }

    const order = await createOrderService(userId, amount);
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const result = await verifyPaymentService(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (result.success) {
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
