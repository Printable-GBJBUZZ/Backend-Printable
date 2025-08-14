import { Router } from "express";
import { createOrder, verifyPayment } from "../controller/payment.ts";

const router = Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

export default router;
