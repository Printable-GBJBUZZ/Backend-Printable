// src/services/webhookService.ts
import { Request, Response } from "express";
import { UserPayloadType } from "../types/webhook/user.ts";
import { merchants } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { eq } from "drizzle-orm";

export class webhookMerchantService {
  public async handleWebhook(
    req: Request<{}, {}, UserPayloadType>,
    res: Response,
  ): Promise<Response> {
    const payload = req.body;
    console.log(payload);

    switch (payload.type) {
      case "user.created": {
        try {
          const userData = payload.data;
          const response = await db.insert(merchants).values({
            id: userData.id,
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email_addresses[0]?.email_address || "",
            phone: userData.phone_numbers[0],
          });

          return res.status(201).json({
            message: "Merchant created successfully",
            user: response,
          });
        } catch (error) {
          console.error("Error inserting merchants:", error);
          return res.status(400).json({ error: "Failed to create merchant" });
        }
      }
      case "user.deleted": {
        try {
          const response = await db
            .delete(merchants)
            .where(eq(merchants.id, payload.data.id));

          return res.status(204).json({
            message: "merchant deleted successfully",
            merchant: response,
          });
        } catch (error) {
          console.error("Error deleting merchant:", error);
          return res.status(400).json({ error: "Failed to delete merchant" });
        }
      }
      case "user.updated": {
        try {
          const userData = payload.data;
          const response = await db
            .update(merchants)
            .set({
              id: userData.id,
              name: `${userData.first_name} ${userData.last_name}`,
              email: userData.email_addresses[0]?.email_address || "",
              phone: userData.phone_numbers[0],
              updatedAt: new Date(),
            })
            .where(eq(merchants.id, payload.data.id));

          return res.status(202).json({
            message: "merchants updated successfully",
            merchant: response,
          });
        } catch (error) {
          console.error("Error updating merchant:", error);
          return res.status(500).json({ error: "Failed to update merchant" });
        }
      }
      default: {
        console.error({
          error: "Unsupported event type",
          eventType: payload.type,
          payload: payload.data,
        });
        return res.status(400).json({
          error: "Unsupported event type",
          eventType: payload.type,
        });
      }
    }
  }
}
