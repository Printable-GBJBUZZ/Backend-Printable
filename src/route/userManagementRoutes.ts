import express from "express";
import { searchUsers, filterUsersByStatus, getUsers } from "../controller/userManagementController.ts";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/filter/status", filterUsersByStatus);
router.get("/", getUsers);

export default router;