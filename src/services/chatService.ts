import { db } from "../configs/db.ts";
import { chatMessages } from "../db/schema.ts";
import { eq, and, or, sql } from "drizzle-orm";
import Pusher from "pusher";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isRead: boolean;
  timestamp: Date;
}

export class ChatService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: Deno.env.get("PUSHER_APP_ID")!,
      key: Deno.env.get("PUSHER_KEY")!,
      secret: Deno.env.get("PUSHER_SECRET")!,
      cluster: Deno.env.get("PUSHER_CLUSTER")!,
      useTLS: true
    });
  }

  async sendMessage(senderId: string, receiverId: string, message: string,role:string): Promise<Message> {
    if (!message.trim()) throw new Error("Message cannot be empty");

    const newMessage = {
      id: crypto.randomUUID(),
      senderId,
      receiverId,
      message: message.trim(),
      isRead: false,
      timestamp: new Date()
    };

    await db.insert(chatMessages).values(newMessage);

    const channelName = role==="user" 
      ? `chat-userid-${receiverId}` 
      : `merchant-${receiverId}`;

    await this.pusher.trigger(channelName, "chat", {
      type: "new-message",
      data: newMessage
    });

    return newMessage;
  }

  async getConversation(party1Id: string, party2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, party1Id),
            eq(chatMessages.receiverId, party2Id)
          ),
          and(
            eq(chatMessages.senderId, party2Id),
            eq(chatMessages.receiverId, party1Id)
          )
        )
      )
      .orderBy(chatMessages.timestamp);
  }

  async markAsRead(readerId: string, senderId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.senderId, senderId),
          eq(chatMessages.receiverId, readerId),
          eq(chatMessages.isRead, false)
        )
      );

    const channelName = senderId.startsWith("user_")
      ? `chat-userid-${senderId}`
      : `merchant-${senderId}`;

    await this.pusher.trigger(channelName, "chat", {
      type: "messages-read",
      data: { readerId, timestamp: new Date() }
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.receiverId, userId),
          eq(chatMessages.isRead, false)
        )
      );
    
    return result[0]?.count || 0;
  }
}