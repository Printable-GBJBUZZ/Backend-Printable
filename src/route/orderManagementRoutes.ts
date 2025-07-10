import express from "express";
import { getOrders, getOrdersByStatus } from "../controller/orderManagementController.ts";

const router = express.Router();

router.get("/", getOrders);
router.get("/status", getOrdersByStatus);

export default router;