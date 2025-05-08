import { users } from "../db/schema.ts";
import { db } from "../configs/db.ts";
import { eq } from "drizzle-orm";

const isDeno = typeof Deno !== 'undefined';

// Type definitions for payload (since user.ts wasn't provided)
interface UserPayloadType {
  type: string;
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email_addresses: { email_address: string }[];
    phone_numbers: string[];
  };
}

export class WebhookService {
  public async handleWebhook(req: any, res: any): Promise<any> {
    const payload: UserPayloadType = isDeno ? await req.request.body().value : req.body;
    console.log(payload);

    switch (payload.type) {
      case "user.created": {
        try {
          const userData = payload.data;
          const response = await db.insert(users).values({
            id: userData.id,
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email_addresses[0]?.email_address || "",
            phone: userData.phone_numbers[0] || "",
          });

          if (isDeno) {
            res.response.body = {
              message: "User created successfully",
              user: response,
            };
            res.response.status = 201;
          } else {
            return res.status(201).json({
              message: "User created successfully",
              user: response,
            });
          }
        } catch (error) {
          console.error("Error inserting user:", error);
          if (isDeno) {
            res.response.body = { error: "Failed to create user" };
            res.response.status = 400;
          } else {
            return res.status(400).json({ error: "Failed to create user" });
          }
        }
        break;
      }
      case "user.deleted": {
        try {
          const response = await db
            .delete(users)
            .where(eq(users.id, payload.data.id));

          if (isDeno) {
            res.response.body = {
              message: "User deleted successfully",
              user: response,
            };
            res.response.status = 204;
          } else {
            return res.status(204).json({
              message: "User deleted successfully",
              user: response,
            });
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          if (isDeno) {
            res.response.body = { error: "Failed to delete user" };
            res.response.status = 400;
          } else {
            return res.status(400).json({ error: "Failed to delete user" });
          }
        }
        break;
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
              phone: userData.phone_numbers[0] || "",
              updatedAt: new Date(),
            })
            .where(eq(users.id, payload.data.id));

          if (isDeno) {
            res.response.body = {
              message: "User updated successfully",
              user: response,
            };
            res.response.status = 202;
          } else {
            return res.status(202).json({
              message: "User updated successfully",
              user: response,
            });
          }
        } catch (error) {
          console.error("Error updating user:", error);
          if (isDeno) {
            res.response.body = { error: "Failed to update user" };
            res.response.status = 500;
          } else {
            return res.status(500).json({ error: "Failed to update user" });
          }
        }
        break;
      }
      default: {
        console.error({
          error: "Unsupported event type",
          eventType: payload.type,
          payload: payload.data,
        });
        if (isDeno) {
          res.response.body = {
            error: "Unsupported event type",
            eventType: payload.type,
          };
          res.response.status = 400;
        } else {
          return res.status(400).json({
            error: "Unsupported event type",
            eventType: payload.type,
          });
        }
      }
    }
  }
}