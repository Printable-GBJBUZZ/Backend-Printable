import { resolve } from "jsr:@std/path";
import { db } from "../configs/db.ts";
import { files, file_versions } from "../db/schema.ts";
import { desc, eq  } from "drizzle-orm";
import { PutObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3@3.614.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.614.0";
import s3Client from "../configs/s3.ts";

function generateUUID(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  } catch (e) {
    console.error("UUID generation failed:", e.message);
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export interface FileUploadPayload {
  inputFile: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  folderId?: string;
}

export interface FileVersionPayload {
  inputFile: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  userId: string;
  fileId: string;
}

export interface DocxToPDFPayload {
  inputFile: string;
  outputDir: string;
  userId: string;
  originalFileName: string;
}

export interface PptxToPDFPayload {
  inputFile: string;
  outputDir: string;
  userId: string;
  originalFileName: string;
}

export class FilesService {
  private async uploadToS3(filePath: string, userId: string, operation: string): Promise<string> {
    try {
      const fileContent = await Deno.readFile(filePath);
      const s3Key = `users/${userId}/${operation}/${generateUUID()}.pdf`;
      const command = new PutObjectCommand({
        Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
        Key: s3Key,
        Body: fileContent,
        ContentType: "application/pdf",
      });
      await s3Client.send(command);
      return s3Key;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  private async getPresignedUrl(s3Key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
        Key: s3Key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 600 });
    } catch (error) {
      console.error("S3 presigned URL error:", error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  async uploadFile(payload: FileUploadPayload): Promise<any> {
    const { inputFile, fileName, fileType, fileSize, userId, folderId } = payload;
    const resolvedInput = resolve(inputFile);
    const s3Key = await this.uploadToS3(resolvedInput, userId, "documents");
    const fileId = generateUUID();
    const fileHash = generateUUID(); // Simplified; use proper hash in production

    const [file] = await db
      .insert(files)
      .values({
        id: fileId,
        ownerId: userId,
        fileName,
        fileKey: s3Key,
        fileSize,
        fileType,
        fileHash,
        folderId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      message: "File uploaded successfully",
      file,
    };
  }

  async createFileVersion(payload: FileVersionPayload): Promise<any> {
    const { inputFile, fileName, fileType, fileSize, userId, fileId } = payload;
    const resolvedInput = resolve(inputFile);
    const s3Key = await this.uploadToS3(resolvedInput, userId, "versions");
    const versionId = generateUUID();

    const [version] = await db
      .insert(file_versions)
      .values({
        id: versionId,
        fileId,
        versionId,
        fileName,
        fileKey: s3Key,
        fileSize,
        fileType,
        ownerId: userId,
        createdAt: new Date(),
      })
      .returning();

    return {
      message: "File version created successfully",
      version,
    };
  }

  async getFileVersions(fileId: string): Promise<any[]> {
    return db
      .select()
      .from(file_versions)
      .where(eq(file_versions.fileId, fileId))
      .orderBy(desc(file_versions.createdAt));
  }

  async getFileVersion(fileId: string, versionId: string): Promise<any> {
    const [version] = await db
      .select()
      .from(file_versions)
      .where(eq(file_versions.versionId, versionId))
      .where(eq(file_versions.fileId, fileId));

    if (!version) {
      throw new Error("Version not found");
    }

    const url = await this.getPresignedUrl(version.fileKey);
    return { version, url };
  }

  async docxToPDF(payload: DocxToPDFPayload): Promise<string> {
    const { inputFile, outputDir, userId, originalFileName } = payload;

    if (!inputFile || !outputDir || !originalFileName) {
      throw new Error("Input file, output directory, and original file name are required");
    }

    const resolvedInput = resolve(inputFile).replace(/\\/g, "/");
    const outputPath = resolve(outputDir, `converted-${Date.now()}.pdf`).replace(/\\/g, "/");

    try {
      // Validate file exists and is readable
      const stat = await Deno.stat(resolvedInput).catch(() => null);
      if (!stat || !stat.isFile) {
        throw new Error(`Input file not found or not a file: ${resolvedInput}`);
      }
      const fileContent = await Deno.readFile(resolvedInput);
      if (fileContent.length === 0) {
        throw new Error(`Input file is empty: ${resolvedInput}`);
      }

      console.log(`Sending DOCX to Gotenberg: ${resolvedInput}, filename: ${originalFileName}`);

      const formData = new FormData();
      formData.append("files", new Blob([fileContent], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), originalFileName);

      const response = await fetch("http://localhost:3000/forms/libreoffice/convert", {
        method: "POST",
        headers: {
          "Gotenberg-Output-Filename": "output.pdf",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gotenberg response: ${response.status} ${errorText}`);
        throw new Error(`Gotenberg API error: ${response.statusText} - ${errorText}`);
      }

      const pdfBuffer = await response.arrayBuffer();
      if (pdfBuffer.byteLength === 0) {
        throw new Error("Gotenberg returned an empty PDF");
      }
      await Deno.writeFile(outputPath, new Uint8Array(pdfBuffer));

      const s3Key = await this.uploadToS3(outputPath, userId, "docx-to-pdf");
      const url = await this.getPresignedUrl(s3Key);
      await Deno.remove(outputPath).catch((e) => console.warn(`Failed to remove ${outputPath}: ${e.message}`));
      return url;
    } catch (error) {
      console.error("DOCX to PDF error:", error);
      throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
    }
  }

  async pptxToPDF(payload: PptxToPDFPayload): Promise<string> {
    const { inputFile, outputDir, userId, originalFileName } = payload;

    if (!inputFile || !outputDir || !originalFileName) {
      throw new Error("Input file, output directory, and original file name are required");
    }

    const resolvedInput = resolve(inputFile).replace(/\\/g, "/");
    const outputPath = resolve(outputDir, `converted-${Date.now()}.pdf`).replace(/\\/g, "/");

    try {
      // Validate file exists and is readable
      const stat = await Deno.stat(resolvedInput).catch(() => null);
      if (!stat || !stat.isFile) {
        throw new Error(`Input file not found or not a file: ${resolvedInput}`);
      }
      const fileContent = await Deno.readFile(resolvedInput);
      if (fileContent.length === 0) {
        throw new Error(`Input file is empty: ${resolvedInput}`);
      }

      console.log(`Sending PPTX to Gotenberg: ${resolvedInput}, filename: ${originalFileName}`);

      const formData = new FormData();
      formData.append("files", new Blob([fileContent], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }), originalFileName);

      const response = await fetch("http://localhost:3000/forms/libreoffice/convert", {
        method: "POST",
        headers: {
          "Gotenberg-Output-Filename": "output.pdf",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gotenberg response: ${response.status} ${errorText}`);
        throw new Error(`Gotenberg API error: ${response.statusText} - ${errorText}`);
      }

      const pdfBuffer = await response.arrayBuffer();
      if (pdfBuffer.byteLength === 0) {
        throw new Error("Gotenberg returned an empty PDF");
      }
      await Deno.writeFile(outputPath, new Uint8Array(pdfBuffer));

      const s3Key = await this.uploadToS3(outputPath, userId, "pptx-to-pdf");
      const url = await this.getPresignedUrl(s3Key);
      await Deno.remove(outputPath).catch((e) => console.warn(`Failed to remove ${outputPath}: ${e.message}`));
      return url;
    } catch (error) {
      console.error("PPTX to PDF error:", error);
      throw new Error(`PPTX to PDF conversion failed: ${error.message}`);
    }
  }
}