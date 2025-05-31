import { Request, Response, NextFunction } from "express";
import {
  MerchantService,
  MerchantPayload,
} from "../services/merchantService.ts";

const merchantService = new MerchantService();

export const getMerchant = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) res.status(400).json({ error: "Merchant ID is required" });

    const merchant = await merchantService.getMerchantWithOrder(id);
    console.log(merchant);
    // if (!merchant) res.status(404).json({ error: "Merchant not found" });

    res.status(200).json({ data: merchant ?? [], success: true });
  } catch (error) {
    res.status(404).json({ error: "server error " });
    next(error);
  }
};
export const getMerchantReviews = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) res.status(400).json({ error: "Merchant ID is required" });

    const merchantReviews =
      await merchantService.getAverageRatingAndCountByMerchantService(id);
    if (!merchantReviews) res.status(404).json({ error: "Merchant not found" });

    res.status(200).json(merchantReviews);
  } catch (error) {
    next(error);
  }
};
export const createMerchant = async (
  req: Request<{}, {}, MerchantPayload>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body;
    console.log("merchant payload.....", payload);
    const newMerchant = await merchantService.createMerchant(payload);
    res.status(201).json({
      message: "Merchant created successfully",
      merchant: newMerchant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMerchant = async (
  req: Request<{ id: string }, {}, MerchantPayload>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (!id) res.status(400).json({ error: "Merchant ID is required" });

    const updatedMerchant = await merchantService.updateMerchant(id, payload);
    if (!updatedMerchant)
      res.status(404).json({ error: "Merchant not found or update failed" });

    res.status(200).json({
      message: "Merchant updated successfully",
      merchant: updatedMerchant,
    });
  } catch (error) {
    next(error);
  }
};
