import express from "express";
import fileRouter from "./fileRoutes.ts";
import webhookRouter from "./webhookRoutes.ts";
import userRouter from "./userRoutes.ts";
import orderRouter from "./orderRoute.ts";
import merchantRouter from "./merchantRoutes.ts";
import esignRouter from "./esignRoutes.ts";
import reviewRouter from "./reviewRoutes.ts";
import servicesandPriceRouter from './ServicesandPriceRoutes.ts';
import orderPriceRouter from './OrderPriceRoutes.ts';
import fetchReviewRoutes from "./fetchReviewRoutes.ts";
import fileManagement from "./fileManagement.ts";
import blogRouter from "./blogRoutes.ts";
// Adjust this import based on actual file location
import authRouter from './authRoutes.ts'; // Change to './routes/authRoutes.ts' if needed

import { Router } from "express";
import multer from "multer";
import {
  mergePDFs,
  splitPDF,
  getHistory,
} from "../controller/convertController.ts";

const router = express.Router();

const upload = multer({ dest: "/tmp" });

// Mount all routers with logging
console.log("Mounting file routes...");
router.use("/file", fileRouter);
console.log("Mounting webhook routes...");
router.use("/webhook", webhookRouter);
console.log("Mounting user routes...");
router.use("/user", userRouter);
console.log("Mounting order routes...");
router.use("/order", orderRouter);
console.log("Mounting merchant routes...");
router.use("/merchant", merchantRouter);
console.log("Mounting esign routes...");
router.use("/esign", esignRouter);
console.log("Mounting review routes...");
router.use("/review", reviewRouter);
console.log("Mounting fetch review routes...");
router.use("/reviews", fetchReviewRoutes);
console.log("Mounting service routes...");
router.use('/service', servicesandPriceRouter);
console.log("Mounting order price routes...");
router.use('/order', orderPriceRouter);
console.log("Mounting file management routes...");
router.use("/fileManagement", fileManagement);
console.log("Mounting blog routes...");
router.use("/blog", blogRouter);
console.log("Mounting auth routes...");
router.use('/auth', authRouter);

// PDF-related routes
router.post("/pdf/merge", upload.array("file"), mergePDFs);
router.post("/pdf/split", upload.single("file"), splitPDF);
router.get("/pdf/history", (req, res, next) => {
  console.log("GET /pdf/history route hit with query:", req.query);
  getHistory(req, res, next);
});

export default router;