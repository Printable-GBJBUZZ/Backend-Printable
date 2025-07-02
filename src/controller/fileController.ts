import "jsr:@std/dotenv/load";
import { GetObjectCommand, DeleteObjectCommand } from "npm:@aws-sdk/client-s3@3.614.0";
import { EsignService, FilePayload } from "../services/esignService.ts";
import { FilesService } from "../services/filesService.ts";
import multer from "npm:multer@^1.4.5-lts.1";
import multerS3 from "npm:multer-s3@^3.0.1";
import s3 from "../configs/s3.ts";

console.log("BUCKET_NAME:", Deno.env.get("BUCKET_NAME"));

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
    metadata: (req: any, file: any, cb: any) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req: any, file: any, cb: any) => {
      cb(null, `documents/${Date.now()}_${file.originalname}`);
    },
  }),
}).single("file");

export const uploadFile = (req: any, res: any) => {
  upload(req, res, (err: any) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log("Uploaded file:", req.file);
    res.json({
      message: "File uploaded successfully",
      fileUrl: req.file.location,
      fileId: req.file.key,
    });
  });
};

export const getFile = async (req: any, res: any) => {
  console.log("getFile params:", req.params);
  console.log("getFile body:", req.body);

  try {
    const params = {
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: `documents/${req.params.filename}`,
    };

    const command = new GetObjectCommand(params);
    const { Body } = await s3.send(command);

    res.attachment(req.params.filename);
    Body.pipe(res);
  } catch (err: any) {
    console.error("getFile error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req: any, res: any) => {
  try {
    const params = {
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: `documents/${req.params.filename}`,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    res.json({ message: "File deleted successfully" });
  } catch (err: any) {
    console.error("deleteFile error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const listFiles = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const folderName = req.query.folderName || "";
    const sortBy = req.query.sort || "id";
    const type = req.query.typeFilter || "";
    const ownerId = req.query.ownerId || "";

    const filesService = new FilesService();

    const result = await filesService.getFiles(
      page,
      pageSize,
      folderName,
      {
        column: sortBy,
        direction: "asc",
      },
      type,
      ownerId,
    );

    res.json(result);
  } catch (err: any) {
    console.error("listFiles error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createFileVersion = async (req: any, res: any) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }

    console.log("createFileVersion file:", req.file);

    const filesService = new FilesService();
    const versionPayload = {
      fileId,
      inputFile: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      userId,
    };

    const version = await filesService.createFileVersion(versionPayload);
    res.json({ message: "File version created successfully", version });
  } catch (err: any) {
    console.error("createFileVersion error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getFileVersions = async (req: any, res: any) => {
  try {
    const { fileId } = req.params;
    const filesService = new FilesService();
    const versions = await filesService.getFileVersions(fileId);
    res.json({ versions });
  } catch (err: any) {
    console.error("getFileVersions error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getFileVersion = async (req: any, res: any) => {
  try {
    const { fileId, versionId } = req.params;
    const filesService = new FilesService();
    const version = await filesService.getFileVersion(fileId, versionId);

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    const params = {
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: version.version.fileKey,
    };

    const command = new GetObjectCommand(params);
    const { Body } = await s3.send(command);

    res.attachment(version.version.fileName);
    Body.pipe(res);
  } catch (err: any) {
    console.error("getFileVersion error:", err);
    res.status(500).json({ error: err.message });
  }
};