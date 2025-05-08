// src/services/webhookService.ts
import { Request, Response } from "express";
import { UserPayloadType } from "../types/webhook/user.ts";
import { users } from "../db/schema.ts";
import { createHash } from "node:crypto";
import { db } from "../configs/db.ts";
import { eq } from "drizzle-orm";

export class WebhookService {
  public async handleWebhook(
    req: Request<{}, {}, UserPayloadType>,
    res: Response
  ): Promise<Response> {
    const payload = req.body;
    console.log(payload);

    switch (payload.type) {
      case "user.created": {
        try {
          const userData = payload.data;
          //signId per user based on their email
          const email = userData.email_addresses[0]?.email_address || "";
          const hashBuffer = createHash("sha256").update(email).digest();
          const signingKey = parseInt(
            hashBuffer.toString("hex").slice(0, 10),
            16
          );
          const sign_id = String(signingKey % 10000000000);
          const response = await db.insert(users).values({
            id: userData.id,
            name: `${userData.first_name} ${userData.last_name}`,
            email: email,
            phone: userData.phone_numbers[0],
            signId: sign_id,
          });

          return res.status(201).json({
            message: "User created successfully",
            user: response,
          });
        } catch (error) {
          console.error("Error inserting user:", error);
          return res.status(400).json({ error: "Failed to create user" });
        }
      }
      case "user.deleted": {
        try {
          const response = await db
            .delete(users)
            .where(eq(users.id, payload.data.id));

          return res.status(204).json({
            message: "User deleted successfully",
            user: response,
          });
        } catch (error) {
          console.error("Error deleting user:", error);
          return res.status(400).json({ error: "Failed to delete user" });
        }
      }
      case "user.updated": {
        try {
          const userData = payload.data;
          const response = await db
            .update(users)
            .set({
              id: userData.id,
              name: `${userData.first_name} ${userData.last_name}`,
              email: userData.email_addresses[0]?.email_address || "",
              phone: userData.phone_numbers[0],
              updatedAt: new Date(),
            })
            .where(eq(users.id, payload.data.id));

          return res.status(202).json({
            message: "User updated successfully",
            user: response,
          });
        } catch (error) {
          console.error("Error updating user:", error);
          return res.status(500).json({ error: "Failed to update user" });
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
