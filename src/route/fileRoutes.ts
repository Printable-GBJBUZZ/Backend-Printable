import express from "express";
import reviewRoutes from './reviewRoutes.ts';
import {
    uploadFile,
    getFile,
    deleteFile,
    listFiles,
} from "../controller/fileController.ts";

const router = express.Router();

router.use('/', reviewRoutes);

// Route to AWS S3

router.get("/", listFiles)

router.post("/upload", uploadFile);

router.get("/:filename", getFile);

router.delete("/:filename", deleteFile);

export default router;
