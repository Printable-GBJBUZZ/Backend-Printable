import { resolve } from "jsr:@std/path";
import { PDFDocument, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";
import { ConvertService } from "../services/convertService.ts";
import { FilesService } from "../services/filesService.ts";

const convertService = new ConvertService();
const filesService = new FilesService();

export const watermarkPDF = async (req: any, res: any, next: any) => {
  try {
    const { userId, watermarkText } = req.body;
    const file = req.file;

    if (!userId || !watermarkText || !file) {
      return res.status(400).json({ error: "userId, watermarkText, and file are required" });
    }

    const outputDir = resolve(Deno.cwd(), "tmp");
    await Deno.mkdir(outputDir, { recursive: true });

    console.log(`Watermarking file: ${file.path}, mimetype: ${file.mimetype}, originalname: ${file.originalname}`);

    const result = await convertService.watermarkPDF({
      inputFile: file.path,
      outputDir,
      userId,
      watermarkText,
    });

    res.json({
      success: true,
      result,
      history: { watermarked: [result] },
    });
  } catch (error: any) {
    console.error("Watermark error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const pptxToPDF = async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId || !file) {
      return res.status(400).json({ error: "userId and file are required" });
    }

    if (!file.mimetype.includes("presentation")) {
      return res.status(400).json({ error: "File must be a PPTX document" });
    }

    const outputDir = resolve(Deno.cwd(), "tmp");
    await Deno.mkdir(outputDir, { recursive: true });

    // Validate file exists
    const stat = await Deno.stat(file.path).catch(() => null);
    if (!stat || !stat.isFile) {
      throw new Error(`Uploaded file not found: ${file.path}`);
    }
    console.log(`Processing PPTX: ${file.path}, mimetype: ${file.mimetype}, originalname: ${file.originalname}, size: ${file.size}`);

    const result = await filesService.pptxToPDF({
      inputFile: file.path,
      outputDir,
      userId,
      originalFileName: file.originalname,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("PPTX to PDF error:", error);
    res.status(500).json({ success: false, error: `PPTX to PDF conversion failed: ${error.message}` });
  }
};

export const docxToPDF = async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!userId || !file) {
      return res.status(400).json({ error: "userId and file are required" });
    }

    if (!file.mimetype.includes("wordprocessingml.document")) {
      return res.status(400).json({ error: "File must be a DOCX document" });
    }

    const outputDir = resolve(Deno.cwd(), "tmp");
    await Deno.mkdir(outputDir, { recursive: true });

    // Validate file exists
    const stat = await Deno.stat(file.path).catch(() => null);
    if (!stat || !stat.isFile) {
      throw new Error(`Uploaded file not found: ${file.path}`);
    }
    console.log(`Processing DOCX: ${file.path}, mimetype: ${file.mimetype}, originalname: ${file.originalname}, size: ${file.size}`);

    const result = await filesService.docxToPDF({
      inputFile: file.path,
      outputDir,
      userId,
      originalFileName: file.originalname,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("DOCX to PDF error:", error);
    res.status(500).json({ success: false, error: `DOCX to PDF conversion failed: ${error.message}` });
  }
};

export const mergePDFs = async (req: any, res: any, next: any) => {
  try {
    const files = req.files;
    const { userId } = req.body;

    if (!userId || !files || files.length < 2) {
      return res.status(400).json({ error: "userId and at least two files are required" });
    }

    const inputFiles = files.map((file: any) => file.path);
    const outputDir = resolve(Deno.cwd(), "tmp");
    await Deno.mkdir(outputDir, { recursive: true });

    console.log(`Merging files: ${inputFiles.join(", ")}`);

    const result = await convertService.mergePDFs({
      inputFiles,
      outputDir,
      userId,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Merge PDFs error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const splitPDF = async (req: any, res: any, next: any) => {
  try {
    const { userId, pageRanges } = req.body;
    const file = req.file;

    if (!userId || !file || !pageRanges) {
      return res.status(400).json({ error: "userId, file, and pageRanges are required" });
    }

    const outputDir = resolve(Deno.cwd(), "tmp");
    await Deno.mkdir(outputDir, { recursive: true });

    console.log(`Splitting file: ${file.path}, pageRanges: ${pageRanges}`);

    const result = await convertService.splitPDF({
      inputFile: file.path,
      outputDir,
      userId,
      pageRanges: JSON.parse(pageRanges),
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Split PDF error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getHistory = async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const history = await convertService.getHistory(userId);
    res.json({ success: true, history });
  } catch (error: any) {
    console.error("Get history error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};