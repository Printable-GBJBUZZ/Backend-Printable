import { db } from "../configs/db.ts";
import { chatMessages } from "../db/schema.ts";
import { triggerPusherEvent } from "./pusherService.ts";
import { UserPusherService } from "./userPusherService.ts";

// Helper to detect user IDs (modify based on your actual ID patterns)
function isUserId(id: string): boolean {
  // Example patterns - adjust based on your actual ID formats
  return id.startsWith("user_") || id.includes("user-") || id.length === 36; // UUIDs
}

export class ChatService {
  async sendMessage(senderId: string, receiverId: string, message: string) {
    const newMessage = {
      id: crypto.randomUUID(),
      senderId,
      receiverId,
      message,
      timestamp: new Date(),
      isRead: false,
    };
    
    // Save to database
    await db.insert(chatMessages).values(newMessage);
    
    // Determine if sender is user or merchant
    if (isUserId(senderId)) {
      // User sending to merchant
      await UserPusherService.triggerChatMessage(
        senderId,
        receiverId,
        newMessage
      );
    } else {
      // Merchant sending to user
      const channelName = `private-merchantchat-${senderId}-${receiverId}`;
      await triggerPusherEvent(channelName, "new-message", newMessage);
    }
    
    return newMessage;
  }

  async getConversation(userA: string, userB: string) {
    return await db
      .select()
      .from(chatMessages)
      .where((row) =>
        (row.senderId.eq(userA).and(row.receiverId.eq(userB)))
          .or(row.senderId.eq(userB).and(row.receiverId.eq(userA)))
      )
      .orderBy(chatMessages.timestamp);
  }
}