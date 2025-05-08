import express from "express";
import {
    uploadFile,
    getFile,
    deleteFile,
} from "../controller/fileController.ts";

const router = express.Router();

// Route to AWS S3

router.post("/upload", uploadFile);

router.get("/:filename", getFile);

router.delete("/:filename", deleteFile);

export default router;
