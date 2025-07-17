import { Request, Response, NextFunction } from "express";
import { OrderManagementService } from "../services/orderManagementService.ts";

const orderManagementService = new OrderManagementService();

export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await orderManagementService.getOrders();
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

export const getOrdersByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = req.query.status as string || "";
    const orders = await orderManagementService.getOrdersByStatus(status);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};