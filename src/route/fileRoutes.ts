import express from "express";
import reviewRoutes from './reviewRoutes.ts';
import {
    uploadFile,
    getFile,
    deleteFile,
    listFiles,
    createFileVersion,
    getFileVersions,
    getFileVersion,
} from "../controller/fileController.ts";
import { pptxToPDF, watermarkPDF, docxToPDF } from "../controller/convertController.ts";
import multer from "npm:multer@^1.4.5-lts.1";

const router = express.Router();

router.use('/', reviewRoutes);
const upload = multer({ dest: "/tmp" });

router.get("/", listFiles);
router.post("/watermark", upload.single("file"), (req, res, next) => {
  console.log("Multer file (watermark):", req.file);
  watermarkPDF(req, res, next);
});
router.post("/convert/pptx-to-pdf", upload.single("file"), (req, res, next) => {
  console.log("Multer file (pptx-to-pdf):", req.file);
  pptxToPDF(req, res, next);
});
router.post("/convert/docx-to-pdf", upload.single("file"), (req, res, next) => {
  console.log("Multer file (docx-to-pdf):", req.file);
  docxToPDF(req, res, next);
});
router.post("/upload", uploadFile);
router.get("/:filename", getFile);
router.delete("/:filename", deleteFile);
router.post("/:fileId/versions", upload.single("file"), (req, res, next) => {
  console.log("Multer file (versions):", req.file);
  createFileVersion(req, res, next);
});
router.get("/:fileId/versions", getFileVersions);
router.get("/:fileId/versions/:versionId", getFileVersion);

export default router;