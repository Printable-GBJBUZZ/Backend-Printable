import express from "express";
import { updateUserController,getUserController, getNearestMerchants } from "../controller/userController.ts";
const router = express.Router();

router.get('/nearest-merchants',getNearestMerchants)
router.get("/:id",getUserController );
router.patch("/:id", updateUserController)



export default router;
