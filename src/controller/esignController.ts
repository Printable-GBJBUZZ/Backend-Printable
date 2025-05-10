import { Request, Response, NextFunction } from "express";
import "jsr:@std/dotenv/load";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import multer from "multer";
import s3 from "../configs/s3.ts";
import { EsignService, FilePayload } from "../services/esignService.ts";

const esignService = new EsignService();

// Configure Multer with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("file");

const BUCKET = Deno.env.get("BUCKET_NAME")!;

function calculateFileHash(fileBuffer: Buffer): string {
  return createHash("sha256").update(fileBuffer).digest("hex");
}

async function uploadToS3(key: string, buffer: Buffer, mime: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mime,
  });
  return await s3.send(command);
}

async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  return await s3.send(command);
}

// Upload New File
export const uploadFile = (req: any, res: any) => {
  upload(req, res, async (err: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { ownerId } = req.body;
    if (!ownerId) return res.status(400).json({ error: "ownerId is required" });

    const { buffer, originalname, mimetype, size } = req.file;
    const fileHash = calculateFileHash(buffer);
    const fileId = String(Date.now());
    const key = `documents/${fileId}_${originalname}`;

    try {
      await uploadToS3(key, buffer, mimetype);

      const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;
      const payload: FilePayload = {
        id: fileId,
        ownerId,
        fileName: originalname,
        fileKey: fileUrl,
        fileSize: size,
        fileType: mimetype,
        fileHash,
      };

      await esignService.createFile(payload);

      return res.json({ msg: "File uploaded", fileUrl });
    } catch (error) {
      await deleteFromS3(key).catch(() => console.error("Rollback failed"));
      return res.status(500).json({ error: "File upload failed" });
    }
  });
};

// Update File
export const updateFile = (req: any, res: any) => {
  upload(req, res, async (err: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { fileId, fileName, ownerId } = req.body;
    if (!fileId || !ownerId) {
      return res.status(400).json({ error: "fileId and ownerId are required" });
    }
    // get file data
    const { buffer, mimetype, size } = req.file;
    const key = `documents/${fileId}_${fileName}`;

    try {
      await deleteFromS3(key);
      await uploadToS3(key, buffer, mimetype);

      const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;
      const fileHash = calculateFileHash(buffer);

      //update file on databae
      const response = await esignService.updateFile(
        {
          fileKey: fileUrl,
          fileSize: size,
          fileType: mimetype,
          fileHash,
        },
        fileId
      );

      return res.json(response);
    } catch (error) {
      return res.status(500).json({ error: "File update failed" });
    }
  });
};

// Upload Signed Document
export const uploadSignedDocument = (
  req: any,
  res: any,
  next: NextFunction
) => {
  upload(req, res, async (err: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { fileId, fileName, ownerId, signeeEmail } = req.body;
    if (!fileId || !ownerId || !signeeEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      //update sign status within database if valid
      await esignService.signeeSignedDocument({ fileId, signeeEmail });

      const { buffer, mimetype, size } = req.file;
      const key = `documents/${fileId}_${fileName}`;

      //delete previous file and add new one with same id and name
      await deleteFromS3(key);
      await uploadToS3(key, buffer, mimetype);

      const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;
      const fileHash = calculateFileHash(buffer);

      await esignService.updateFile(
        { fileKey: fileUrl, fileSize: size, fileType: mimetype, fileHash },
        fileId
      );

      return res.json({
        msg: "Signed document and Saved  successfully!!",
        success: true,
      });
    } catch (error) {
      next(error);
    }
  });
};

// Send Signing Request
export const sendSigningRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = await esignService.sendSigningRequest(req.body);
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Check if user can proceed to sign
export const isSignerValid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fileId, userId } = req.params;
  try {
    const response = await esignService.isValidSigner({
      signer_userId: userId,
      fileId,
    });
    if (response) return res.status(200).json({ response, success: true });
    return res.status(404).json({ response: "file not found", success: false });
  } catch (error) {
    next(error);
  }
};

// Get signed records for user
export const getSignRecordWithStatus = async (req: Request, res: Response) => {
  const { ownerId } = req.query;
  if (!ownerId)
    return res.status(400).json({ msg: "ownerId is required", success: false });

  try {
    const records = await esignService.getSignRecordsForUser(ownerId as string);
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to fetch records", error });
  }
};
