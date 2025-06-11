import { Request, Response, NextFunction } from "express";
import {
  OrderService,
  OrderCreatePayload,
  OrderUpdatePayload,
} from "../services/orderService.ts";

const orderService = new OrderService();

export const getOrder = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) res.status(400).json({ error: "Order ID is required" });

    const order = await orderService.getOrder(id);
    if (!order) res.status(404).json({ error: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

export const getOrdersByMerchant = async (
  req: Request<{ merchantId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { merchantId } = req.params;
    if (!merchantId) res.status(400).json({ error: "Merchant ID is required" });

    const orders = await orderService.getOrdersByMerchantId(merchantId);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrdersByUserId = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    if (!userId) res.status(400).json({ error: "user ID is required" });

    const orders = await orderService.getOrdersByUserId(userId);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (
  req: Request<{}, {}, OrderCreatePayload>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload: OrderCreatePayload = req.body;
    const newOrder = await orderService.createOrder(payload);
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrder = async (
  req: Request<{ id: string }, {}, OrderUpdatePayload>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (!id) res.status(400).json({ error: "Order ID is required" });

    // Validate status if provided
    if (payload.status) {
      const validStatuses = [
        "pending",
        "printing",
        "cancelled",
        "completed",
        "accepted",
        "denied",
      ];
      if (!validStatuses.includes(payload.status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
    }

    const updatedOrder = await orderService.updateOrder(id, payload);
    if (!updatedOrder)
      res.status(404).json({ error: "Order not found or update failed" });

    res.status(200).json({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
