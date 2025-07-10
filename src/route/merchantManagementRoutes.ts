import express from "express";
import { getMerchants } from "../controller/merchantManagementController.ts";

const router = express.Router();

router.get("/", getMerchants);

export default router;