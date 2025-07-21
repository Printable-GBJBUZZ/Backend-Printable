import express from "express";
import fileRouter from "./fileRoutes.ts";
import webhookRouter from "./webhookRoutes.ts";
import userRouter from "./userRoutes.ts";
import authRoutes from "./authRoutes.ts";
import orderRouter from "./orderRoute.ts";
import merchantRouter from "./merchantRoutes.ts";
import esignRouter from "./esignRoutes.ts";
import reviewRouter from "./reviewRoutes.ts";
import servicesandPriceRouter from './ServicesandPriceRoutes.ts';
import orderPriceRouter from './OrderPriceRoutes.ts';
import fetchReviewRoutes from "./fetchReviewRoutes.ts";
import fileManagement from "./fileManagement.ts";
import chatRoutes from "./chatRoutes.ts";

import userManagementRoutes from "./userManagementRoutes.ts";
import merchantManagementRoutes from "./merchantManagementRoutes.ts";
import orderManagementRoutes from "./orderManagementRoutes.ts";
import blogRouter from "./blogRoutes.ts";


import { Router } from "express";
import multer from "multer";

import {
  mergePDFs,
  splitPDF,
  getHistory,
} from "../controller/convertController.ts"; 
const router = express.Router();

const upload = multer({ dest: "/tmp" });
router.use("/file", fileRouter);
router.use("/webhook", webhookRouter);
router.use("/user", userRouter);
router.use("/auth", authRoutes);
router.use("/order", orderRouter);
router.use("/merchant", merchantRouter);
router.use("/esign", esignRouter);
router.use("/review", reviewRouter);
router.use("/reviews", fetchReviewRoutes);
router.use('/service', servicesandPriceRouter);
router.use('/order-price', orderPriceRouter);
router.use("/fileManagement", fileManagement);
router.use("/chat", chatRoutes);

router.use("/users", userManagementRoutes);
router.use("/merchants", merchantManagementRoutes);
router.use("/orders", orderManagementRoutes);
console.log("Mounting blog routes..."); // Add logging
router.use("/blog", blogRouter);

router.post("/pdf/merge", upload.array("file"), mergePDFs);
router.post("/pdf/split", upload.single("file"), splitPDF);
router.get("/pdf/history", (req, res, next) => {
  console.log("GET /api/pdf/history route hit with query:", req.query);
  getHistory(req, res, next);
});

export default router;
