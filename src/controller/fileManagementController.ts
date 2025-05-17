import { NextFunction, Request, Response } from "express";
import { FileManager } from "../services/fileManagementService.ts";
import { FolderPayload } from "../services/fileManagementService.ts";
const fileManager = new FileManager();
export const createFolder = async (req: Request, res: Response) => {
  try {
    const { folderName, ownerId } = req.body;
    console.log(folderName, ownerId);
    const payload: FolderPayload = { name: folderName, ownerId };
    await fileManager.createFolder(payload);
    return res.status(200).json({ msg: "folder created successfully!!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed creating new Folder!" });
  }
};
export const renameFolder = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { folderId, newName } = req.params;
    const result = await fileManager.renameFolder({ folderId, newName });
    return res.status(200).json({ msg: "folder renamed successfully!!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed creating new Folder!" });
  }
};
export const assignFolderToFile = async (req: Request, res: Response) => {
  try {
    const { fileId, folderId } = req.body;
    console.log(fileId, folderId);
    const result = await fileManager.assignFolderToFile({ fileId, folderId });
    console.log(result);
    return res.status(200).json({ msg: `file move to new Folder` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed file move!" });
  }
};
export const deleteFolder = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { folderId } = req.params;
    console.log(folderId);
    if (!folderId)
      return res.status(400).json({ msg: "folderId is missing !" });
    const result = await fileManager.deleteFolder({ folderId });
    console.log(result);
    return res.status(200).json({ msg: "folder deleted successfully!!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed deleting Folder!" });
  }
};

export const getAllFiles = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { ownerId } = req.params;
    console.log(ownerId);
    const result = await fileManager.getFiles({ ownerId });
    console.log(result);
    return res.status(200).json({ msg: "files fethched !!", data: result });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed fetching files and folders" });
  }
};
