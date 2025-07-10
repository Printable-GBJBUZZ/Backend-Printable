import express, { raw } from "express";

import { createMerchant, createUser } from "../controller/webhookController.ts";
const router = express.Router();

router.post("/merchant", raw({ type: "application/json" }), createMerchant);
router.post("/user", raw({ type: "application/json" }), createUser);

export default router;
