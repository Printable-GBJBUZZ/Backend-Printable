import express from "https://esm.sh/express@4.18.2";
import { getSystemStats } from "../controller/adminController.ts";

const router = express.Router();

router.get("/stats", getSystemStats);

export default router;