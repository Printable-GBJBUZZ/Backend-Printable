import { crypto } from "https://deno.land/std@0.221.0/crypto/mod.ts";
import { PutObjectCommand, GetObjectCommand } from "npm:@aws-sdk/client-s3@3.540.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.540.0";
import s3 from "../configs/s3.ts";
import type { ConversionResponse } from "../types/fileConversionTypes.ts";

const ALLOWED_TYPES = {
  office: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  image: ["image/jpeg", "image/png"],
};

const BUCKET = Deno.env.get("BUCKET_NAME") || "";
const LIBREOFFICE_COMMAND = Deno.build.os === "windows" ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe" : "libreoffice";

async function createImageHtml(imagePath: string, htmlPath: string): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body>
      <img src="${imagePath}" style="max-width: 100%; height: auto;" />
    </body>
    </html>
  `;
  await Deno.writeTextFile(htmlPath, htmlContent);
}

export default {
  async convertFile(file: File): Promise<ConversionResponse> {
    const isOfficeFile = ALLOWED_TYPES.office.includes(file.type);
    const isImageFile = ALLOWED_TYPES.image.includes(file.type);

    if (!isOfficeFile && !isImageFile) {
      return { success: false, error: "Unsupported file type" };
    }

    const tempDir = await Deno.makeTempDir();
    const inputPath = `${tempDir}/input_${crypto.randomUUID()}`;
    let pdfPath = "";

    try {
      await Deno.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));

      if (isOfficeFile) {
        const cmd = new Deno.Command(LIBREOFFICE_COMMAND, {
          args: ["--headless", "--convert-to", "pdf", "--outdir", tempDir, inputPath],
          stdout: "piped",
          stderr: "piped",
        });

        const { code, stdout, stderr } = await cmd.output();
        if (code !== 0) {
          const errorMsg = new TextDecoder().decode(stderr);
          throw new Error(`LibreOffice conversion failed: ${errorMsg}`);
        }

        console.log("LibreOffice stdout:", new TextDecoder().decode(stdout));
        pdfPath = inputPath + ".pdf";
      } else if (isImageFile) {
        const htmlPath = `${tempDir}/image_${crypto.randomUUID()}.html`;
        await createImageHtml(inputPath, htmlPath);

        const cmd = new Deno.Command(LIBREOFFICE_COMMAND, {
          args: ["--headless", "--convert-to", "pdf", "--outdir", tempDir, htmlPath],
          stdout: "piped",
          stderr: "piped",
        });

        const { code, stdout, stderr } = await cmd.output();
        if (code !== 0) {
          const errorMsg = new TextDecoder().decode(stderr);
          throw new Error(`LibreOffice image conversion failed: ${errorMsg}`);
        }

        console.log("LibreOffice stdout:", new TextDecoder().decode(stdout));
        pdfPath = htmlPath.replace(".html", ".pdf");
      }

      const pdfData = await Deno.readFile(pdfPath);
      const key = `conversions/${crypto.randomUUID()}.pdf`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: pdfData,
        })
      );

      const downloadUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: BUCKET,
          Key: key,
        }),
        { expiresIn: 600 }
      );

      return {
        success: true,
        downloadUrl,
        expiresIn: 600,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Unknown conversion error";
      console.error("Conversion failed:", errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      try {
        await Deno.remove(tempDir, { recursive: true });
      } catch (e) {
        console.warn("Temp cleanup warning:", e);
      }
    }
  },
};