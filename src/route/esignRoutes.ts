import express from "express";
import {
  sendSigningRequest,
  uploadSignedDocument,
  uploadFile,
  getSignRecordWithStatus,
  updateFile,
  isSignerValid,
} from "../controller/esignController.ts";
const router = express.Router();
//router to signRequest
router.post("/signRequest", sendSigningRequest);
// router when user clicks on the sign link
router.get("/sign-document/:fileId/:userId", isSignerValid);
router.post("/upload-document", uploadFile);
router.get("/getRecords", getSignRecordWithStatus);
router.post("/updateFile", updateFile);

// router for submition of signature

router.post("/submitSignature", uploadSignedDocument);
export default router;
