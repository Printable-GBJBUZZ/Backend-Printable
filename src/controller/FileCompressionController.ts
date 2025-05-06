import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { compressAndUploadPDF, generateDownloadLink } from "../services/FileCompresstionService.ts";

export async function uploadFile(ctx: Context) {
  try {
    const body = await ctx.request.body({ type: "form-data" });
    const formData = await body.value.read();
    const file = formData.files?.[0];

    if (!file || file.contentType !== "application/pdf") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Please upload a valid PDF file" };
      return;
    }

    // Check file size (limit to 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const fileSize = (await Deno.stat(file.filename!)).size;
    if (fileSize > MAX_FILE_SIZE) {
      ctx.response.status = 400;
      ctx.response.body = { error: "File size exceeds 10MB limit" };
      return;
    }

    const fileBuffer = await Deno.readFile(file.filename!);
    const { compressedFileName, fileSize: compressedSize } = await compressAndUploadPDF(fileBuffer, file.originalName);

    const downloadLink = await generateDownloadLink(compressedFileName);

    ctx.response.status = 200;
    ctx.response.body = {
      message: "File compressed and uploaded successfully",
      compressedFileName,
      fileSize: compressedSize,
      downloadLink,
      expiresIn: "10 minutes",
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    ctx.response.status = 500;
    ctx.response.body = { error: `Internal server error: ${errorMessage}` };
  }
}