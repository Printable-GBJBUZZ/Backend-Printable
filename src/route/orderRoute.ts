import express from "express";
import {
  getOrder,
  getOrdersByMerchant,
  getOrdersByUserId,
  createOrder,
  updateOrder,
} from "../controller/orderController.ts";

const router = express.Router();

router.get("/:id", getOrder);
router.get("/merchant/:merchantId", getOrdersByMerchant);
router.get("/user/:userId", getOrdersByUserId);

router.post("/", createOrder);
router.patch("/:id", updateOrder);

export default router;