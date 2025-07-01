import { triggerPusherEvent } from "./pusherService.ts";

/**
 * User-specific Pusher operations
 */
export class UserPusherService {
  /**
   * Generate consistent channel name for user-merchant chats
   */
  private static getChatChannel(userId: string, merchantId: string): string {
    // Sort IDs to ensure consistent channel naming
    const sortedIds = [userId, merchantId].sort();
    return `private-userchat-${sortedIds[0]}-${sortedIds[1]}`;
  }

  /**
   * Trigger chat message to user-specific channel
   */
  static async triggerChatMessage(
    userId: string,
    merchantId: string,
    messageData: any
  ) {
    const channelName = this.getChatChannel(userId, merchantId);
    await triggerPusherEvent(channelName, "new-message", messageData);
  }
}