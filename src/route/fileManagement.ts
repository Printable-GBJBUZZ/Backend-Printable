import express from "express";

import { DeleteFile, uploadFile } from "../controller/esignController.ts";
import {
  assignFolderToFile,
  createFolder,
  deleteFolder,
  getAllFiles,
  renameFolder,
} from "../controller/fileManagementController.ts";
const router = express.Router();
//router to signRequest
router.post("/uploadFile", uploadFile);
// router when user clicks on the sign link
router.post("/deleteFile", DeleteFile);
router.post("/getFiles", getAllFiles); // can change file folder name
router.post("/renameFolder", renameFolder);
router.post("/deleteFolder", deleteFolder);
router.post("/createFolder", createFolder);
router.post("/moveFileToFolder", assignFolderToFile);

export default router;
