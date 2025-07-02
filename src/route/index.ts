import express from "https://esm.sh/express@4.18.2";
     import fileRouter from "./fileRoutes.ts";
     import webhookRouter from "./webhookRoutes.ts";
     import userRouter from "./userRoutes.ts";
     import orderRouter from "./orderRoute.ts";
     import merchantRouter from "./merchantRoutes.ts";
     import esignRouter from "./esignRoutes.ts";
     import reviewRouter from "./reviewRoutes.ts";
     import fetchReviewRoutes from "./fetchReviewRoutes.ts";
     import fileManagement from "./fileManagement.ts";
     import { resolve } from "jsr:@std/path";
     import multer from "https://esm.sh/multer@1.4.5-lts.1";
     import { mergePDFs, splitPDF, getHistory } from "../controller/convertController.ts";

     const router = express.Router();
     const upload = multer({ dest: resolve(Deno.cwd(), "tmp") });

     router.use("/file", fileRouter);
     router.use("/webhook", webhookRouter);
     router.use("/user", userRouter);
     router.use("/order", orderRouter);
     router.use("/merchant", merchantRouter);
     router.use("/esign", esignRouter);
     router.use("/review", reviewRouter);
     router.use("/reviews", fetchReviewRoutes);
     router.use("/fileManagement", fileManagement);

     router.post("/pdf/merge", upload.array("file"), mergePDFs);
     router.post("/pdf/split", upload.single("file"), splitPDF);
     router.get("/pdf/history", (req, res, next) => {
       console.log("GET /api/pdf/history route hit with query:", req.query);
       getHistory(req, res, next);
     });

     export default router;