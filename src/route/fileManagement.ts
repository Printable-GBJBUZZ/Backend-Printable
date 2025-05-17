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
router.get("/getFiles/:ownerId", getAllFiles); // can change file folder name
router.patch("/renameFolder/:folderId/:newName", renameFolder);
router.delete("/deleteFolder/:folderId", deleteFolder);
router.post("/createFolder", createFolder);
router.patch("/moveFileToFolder", assignFolderToFile);

export default router;
