import express from "https://esm.sh/express@4.18.2";
import {
  processPayment,
  getPaymentStatus,
  processPayout,
  getPayoutStatus,
  applyReferral,
  getUserTransactions,
} from "../controller/billingController.ts";

const router = express.Router();

router.post("/payment", processPayment);
router.get("/payment/:id", getPaymentStatus);
router.post("/payout", processPayout);
router.get("/payout/:id", getPayoutStatus);
router.post("/referral", applyReferral);
router.get("/:userId/transactions", getUserTransactions);

export default router;