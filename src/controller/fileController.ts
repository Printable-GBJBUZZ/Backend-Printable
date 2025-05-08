import "jsr:@std/dotenv/load";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import multer from "multer";
import s3 from "../configs/s3.ts";
import { EsignService, FilePayload } from "../services/esignService.ts";
const esignService = new EsignService();

// Configure Multer with memory storage to support both local storage and s3 bucket seperately
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single("file");

function calculateFileHash(fileBuffer: Buffer): string {
  const hash = createHash("sha256");
  hash.update(fileBuffer);
  return hash.digest("hex");
}

export const uploadFile = (req: any, res: any) => {
  upload(req, res, async (err: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    console.log(req.file);

    const { ownerId } = req.body;
    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    const file = req.file;
    const fileBuffer = file.buffer;
    const fileHash = calculateFileHash(fileBuffer);
    const fileId = String(Date.now());
    const fileKey = `documents/${fileId}_${file.originalname}`;

    try {
      // Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: Deno.env.get("BUCKET_NAME"),
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.mimetype,
      });
      await s3.send(putCommand);

      // Prepare file payload for database
      const payload: FilePayload = {
        id: String(fileId),
        ownerId,
        fileName: file.originalname,
        fileKey: `https://${Deno.env.get(
          "BUCKET_NAME"
        )}.s3.amazonaws.com/${fileKey}`,
        fileSize: file.size,
        fileType: file.mimetype,
        fileHash,
      };

      // Save file metadata to database
      await esignService.createFile(payload);

      return res.json({
        message: "File uploaded successfully",
        fileUrl: payload.fileKey,
        fileHash,
      });
    } catch (error) {
      console.error("Upload or DB error:", error);

      // Rollback S3 upload on failure
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: Deno.env.get("BUCKET_NAME"),
            Key: fileKey,
          })
        );
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }

      return res.status(500).json({ error: "File upload failed" });
    }
  });
};

export const getFile = async (req: any, res: any) => {
  try {
    const key = `documents/${req.params.filename}`;
    const command = new GetObjectCommand({
      Bucket: Deno.env.get("BUCKET_NAME"),
      Key: key,
    });

    const { Body } = await s3.send(command);
    res.attachment(req.params.filename);
    Body.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req: any, res: any) => {
  try {
    const key = `documents/${req.params.filename}`;
    const command = new DeleteObjectCommand({
      Bucket: Deno.env.get("BUCKET_NAME"),
      Key: key,
    });

    await s3.send(command);
    res.json({ message: "File deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const updateFile = (req: any, res: any) => {
  upload(req, res, async (err: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { oldFileKey, ownerId } = req.body;
    if (!oldFileKey || !ownerId) {
      return res
        .status(400)
        .json({ error: "oldFileKey and ownerId are required" });
    }

    const file = req.file;
    const fileBuffer = file.buffer;
    try {
      // Delete old file from S3
      const oldKey = oldFileKey.includes("s3.amazonaws.com")
        ? oldFileKey.split(".com/")[1]
        : oldFileKey;

      await s3.send(
        new DeleteObjectCommand({
          Bucket: Deno.env.get("BUCKET_NAME"),
          Key: oldKey,
        })
      );

      // Upload new file to S3
      const putCommand = new PutObjectCommand({
        Bucket: Deno.env.get("BUCKET_NAME"),
        Key: oldFileKey,
        Body: fileBuffer,
        ContentType: file.mimetype,
      });
      await s3.send(putCommand);

      // Prepare new payload
      const payload: FilePayload = {
        ownerId,
        fileName: file.originalname,
        fileKey: `https://${Deno.env.get(
          "BUCKET_NAME"
        )}.s3.amazonaws.com/${oldFileKey}`,
        fileSize: file.size,
        fileType: file.mimetype,
      };

      // Update in DB
      await esignService.updateFile(oldFileKey, payload); // You must define this method in your service

      return res.json({
        message: "File updated successfully",
        fileUrl: payload.fileKey,
      });
    } catch (error) {
      console.error("Update error:", error);
      return res.status(500).json({ error: "File update failed" });
    }
  });
};
