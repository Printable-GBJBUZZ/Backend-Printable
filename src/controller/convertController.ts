// File: src/controller/convertController.ts

import { Request, Response } from "express";
import { ConvertService, MergePDFPayload, SplitPDFPayload } from "../services/convertService.ts"; // Removed ConvertPayload, CompressPDFPayload

const convertService = new ConvertService();

export const mergePDFs = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No files uploaded" });
    }

    const { userId } = req.body;
    const inputFiles = (req.files as Express.Multer.File[]).map(file => file.path);
    const payload: MergePDFPayload = {
      inputFiles,
      outputDir: "/tmp",
      userId,
    };

    const result = await convertService.mergePDFs(payload);
    const history = userId ? await convertService.getHistory(userId) : {};

    res.json({
      success: true,
      result: [result],
      history,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: `Merge failed: ${error.message}` });
  }
};

export const splitPDF = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { userId, pageRanges } = req.body;
    const payload: SplitPDFPayload = {
      inputFile: req.file.path,
      outputDir: "/tmp",
      pageRanges: pageRanges || "1",
      userId,
    };

    const result = await convertService.splitPDF(payload);
    const history = userId ? await convertService.getHistory(userId) : {};

    res.json({
      success: true,
      result,
      history,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: `Split failed: ${error.message}` });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ success: false, error: "userId query parameter is required and must be a string" });
    }

    const history = await convertService.getHistory(userId);
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: `Failed to get history: ${error.message}` });
  }
};