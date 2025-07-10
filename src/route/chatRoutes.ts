
import express from "express";
import { sendChatMessage, getConversation } from "../controller/chatController.ts";

const router = express.Router();

router.post("/send", sendChatMessage);
router.get("/conversation", getConversation);

export default router;