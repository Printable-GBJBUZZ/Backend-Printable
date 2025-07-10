import { Request, Response, NextFunction } from "express";
import { MerchantManagementService } from "../services/merchantManagementService.ts";

const merchantManagementService = new MerchantManagementService();

export const getMerchants = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const merchants = await merchantManagementService.getMerchants();
    res.status(200).json(merchants);
  } catch (error) {
    next(error);
  }
};