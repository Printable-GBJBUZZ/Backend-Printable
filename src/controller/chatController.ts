import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chatService.ts";

const chatService = new ChatService();

export const sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { senderId, receiverId, message } = req.body;
    const result = await chatService.sendMessage(senderId, receiverId, message);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};



export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userA, userB } = req.query;
    const result = await chatService.getConversation(userA as string, userB as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};