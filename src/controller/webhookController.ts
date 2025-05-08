// src/controllers/webhookController.ts
import { Request, Response, NextFunction } from "express";
import { WebhookService } from "../services/webhookService.ts";
import { UserPayloadType } from "../types/webhook/user.ts";
export const createUser = async (
  req: Request<{}, {}, UserPayloadType>,
  res: Response,
  next: NextFunction
) => {
  try {
    const webhookService = new WebhookService();
    const response = await webhookService.handleWebhook(req, res);
    console.log(response);
  } catch (error) {
    next(error);
  }
};
