import { resolve } from "jsr:@std/path";
import { PDFDocument, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";
import { PutObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3@3.614.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.614.0";
import s3Client from "../configs/s3.ts";
import  libre  from "npm:libreoffice-convert@1.1.0";

// Safe UUID generator using Deno's crypto API with fallback
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

export interface MergePDFPayload {
  inputFiles: string[];
  outputDir: string;
  userId?: string;
}

export interface SplitPDFPayload {
  inputFile: string;
  outputDir: string;
  pageRanges: string;
  userId?: string;
}

export interface WatermarkPDFPayload {
  inputFile: string;
  outputDir: string;
  watermarkText: string;
  userId?: string;
}

export interface DocxToPDFPayload {
  inputFile: string;
  outputDir: string;
  userId?: string;
}

export interface PptxToPDFPayload {
  inputFile: string;
  outputDir: string;
  userId?: string;
}

const userHistory: { [userId: string]: { [operation: string]: string[] } } = {};

export class ConvertService {
  private async uploadToS3(filePath: string, userId: string, operation: string): Promise<string> {
    const fileContent = await Deno.readFile(filePath);
    const s3Key = `users/${userId}/${operation}/${generateUUID()}.pdf`;
    const command = new PutObjectCommand({
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: s3Key,
      Body: fileContent,
      ContentType: "application/pdf",
    });
    try {
      await s3Client.send(command);
      return s3Key;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw error;
    }
  }

  private async getPresignedUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: s3Key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 600 });
  }

  async mergePDFs(payload: MergePDFPayload): Promise<string> {
    const { inputFiles, outputDir, userId } = payload;

    if (!inputFiles?.length || !outputDir) {
      throw new Error("Input files and output directory are required");
    }

    const pdfDoc = await PDFDocument.create();
    for (const filePath of inputFiles) {
      const resolvedPath = resolve(filePath);
      const pdfBytes = await Deno.readFile(resolvedPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => pdfDoc.addPage(page));
    }

    const outputPath = resolve(outputDir, `merged-${Date.now()}.pdf`);
    const pdfBytes = await pdfDoc.save();
    await Deno.writeFile(outputPath, pdfBytes);

    if (userId) {
      const s3Key = await this.uploadToS3(outputPath, userId, "merged");
      const url = await this.getPresignedUrl(s3Key);
      await Deno.remove(outputPath);
      userHistory[userId] = userHistory[userId] || {};
      userHistory[userId]["merged"] = userHistory[userId]["merged"] || [];
      userHistory[userId]["merged"].push(url);
      return url;
    }
    return outputPath;
  }

  async splitPDF(payload: SplitPDFPayload): Promise<string[]> {
    const { inputFile, outputDir, pageRanges, userId } = payload;

    if (!inputFile || !outputDir || !pageRanges) {
      throw new Error("Input file, output directory, and page ranges are required");
    }

    const resolvedInput = resolve(inputFile);
    const pdfBytes = await Deno.readFile(resolvedInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();
    const ranges = pageRanges.split(",").map((range) => range.trim());
    const outputFiles: string[] = [];

    let originalS3Key: string | undefined;
    if (userId) {
      originalS3Key = await this.uploadToS3(resolvedInput, userId, "original");
      await Deno.remove(resolvedInput);
    }

    for (const range of ranges) {
      const newPdf = await PDFDocument.create();
      let pageIndices: number[] = [];

      if (range.includes("-")) {
        const [start, end] = range.split("-").map(Number);
        if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
          throw new Error(`Invalid page range: ${range}`);
        }
        pageIndices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
      } else {
        const pageNum = Number(range);
        if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
          throw new Error(`Invalid page number: ${range}`);
        }
        pageIndices = [pageNum - 1];
      }

      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const tempOutputPath = resolve(outputDir, `split-${range}-${Date.now()}.pdf`);
      const newPdfBytes = await newPdf.save();
      await Deno.writeFile(tempOutputPath, newPdfBytes);

      if (userId) {
        const s3Key = await this.uploadToS3(tempOutputPath, userId, "split");
        const url = await this.getPresignedUrl(s3Key);
        outputFiles.push(url);
        await Deno.remove(tempOutputPath);
      } else {
        outputFiles.push(tempOutputPath);
      }
    }

    if (userId && originalS3Key) {
      userHistory[userId] = userHistory[userId] || {};
      userHistory[userId]["split"] = userHistory[userId]["split"] || [];
      userHistory[userId]["split"].push(...outputFiles);
      userHistory[userId]["original"] = userHistory[userId]["original"] || [];
      userHistory[userId]["original"].push(await this.getPresignedUrl(originalS3Key));
    }

    return outputFiles;
  }

  async watermarkPDF(payload: WatermarkPDFPayload): Promise<string> {
    const { inputFile, outputDir, watermarkText, userId } = payload;

    if (!inputFile || !outputDir || !watermarkText) {
      throw new Error("Input file, output directory, and watermark text are required");
    }

    const resolvedInput = resolve(inputFile);
    const pdfBytes = await Deno.readFile(resolvedInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 50;
      page.drawText(watermarkText, {
        x: width / 4,
        y: height / 4,
        size: fontSize,
        font,
        opacity: 0.3,
        rotate: { type: 'degrees', angle: 45 },
      });
    }

    const outputPath = resolve(outputDir, `watermarked-${Date.now()}.pdf`);
    const pdfBytesSaved = await pdfDoc.save();
    await Deno.writeFile(outputPath, pdfBytesSaved);

    if (userId) {
      const s3Key = await this.uploadToS3(outputPath, userId, "watermarked");
      const url = await this.getPresignedUrl(s3Key);
      await Deno.remove(outputPath);
      userHistory[userId] = userHistory[userId] || {};
      userHistory[userId]["watermarked"] = userHistory[userId]["watermarked"] || [];
      userHistory[userId]["watermarked"].push(url);
      return url;
    }
    return outputPath;
  }

  async docxToPDF(payload: DocxToPDFPayload): Promise<string> {
    const { inputFile, outputDir, userId } = payload;

    if (!inputFile || !outputDir) {
      throw new Error("Input file and output directory are required");
    }

    const resolvedInput = resolve(inputFile);
    const docxBuf = await Deno.readFile(resolvedInput);
    const outputPath = resolve(outputDir, `converted-${Date.now()}.pdf`);

    await new Promise((resolve, reject) => {
      libre.convert(docxBuf, '.pdf', undefined, (err, pdfBuf) => {
        if (err) return reject(err);
        Deno.writeFile(outputPath, pdfBuf).then(resolve).catch(reject);
      });
    });

    if (userId) {
      const s3Key = await this.uploadToS3(outputPath, userId, "docx-to-pdf");
      const url = await this.getPresignedUrl(s3Key);
      await Deno.remove(outputPath);
      userHistory[userId] = userHistory[userId] || {};
      userHistory[userId]["docx-to-pdf"] = userHistory[userId]["docx-to-pdf"] || [];
      userHistory[userId]["docx-to-pdf"].push(url);
      return url;
    }
    return outputPath;
  }

  async pptxToPDF(payload: PptxToPDFPayload): Promise<string> {
    const { inputFile, outputDir, userId } = payload;

    if (!inputFile || !outputDir) {
      throw new Error("Input file and output directory are required");
    }

    const resolvedInput = resolve(inputFile);
    const pptxBuf = await Deno.readFile(resolvedInput);
    const outputPath = resolve(outputDir, `converted-${Date.now()}.pdf`);

    await new Promise((resolve, reject) => {
      libre.convert(pptxBuf, '.pdf', undefined, (err, pdfBuf) => {
        if (err) return reject(err);
        Deno.writeFile(outputPath, pdfBuf).then(resolve).catch(reject);
      });
    });

    if (userId) {
      const s3Key = await this.uploadToS3(outputPath, userId, "pptx-to-pdf");
      const url = await this.getPresignedUrl(s3Key);
      await Deno.remove(outputPath);
      userHistory[userId] = userHistory[userId] || {};
      userHistory[userId]["pptx-to-pdf"] = userHistory[userId]["pptx-to-pdf"] || [];
      userHistory[userId]["pptx-to-pdf"].push(url);
      return url;
    }
    return outputPath;
  }

  async getHistory(userId: string): Promise<{ [operation: string]: string[] }> {
    return userHistory[userId] || {};
  }
}