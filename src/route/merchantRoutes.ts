import express from "express";
import {
  getMerchant,
  createMerchant,
  updateMerchant,
} from "../controller/merchantController.ts";

const router = express.Router();

router.get("/:id", getMerchant);

router.post("/", createMerchant);

router.patch("/:id", updateMerchant);

export default router;
