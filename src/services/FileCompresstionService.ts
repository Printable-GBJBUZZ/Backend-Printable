import { PDFDocument } from "pdf-lib";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "npm:@aws-sdk/client-s3@3.645.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.645.0";

const s3Client = new S3Client({
  region: Deno.env.get("REGION") || "us-east-1",
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY") || "",
  },
});

export async function compressAndUploadPDF(fileBuffer: Uint8Array, originalName: string) {
  try {
    console.log("Starting PDF compression");
    const pdfDoc = await PDFDocument.load(fileBuffer);
    const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: false });

    const compressedFileName = `compressed-${Date.now()}-${originalName}`;
    const uploadParams = {
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: compressedFileName,
      Body: compressedPdfBytes,
      ContentType: "application/pdf",
    };

    console.log("Uploading to S3:", compressedFileName);
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    console.log("Upload successful");

    return {
      compressedFileName,
      fileSize: compressedPdfBytes.length,
    };
  } catch (error: unknown) {
    console.error("S3 upload failed:", error);
    throw error;
  }
}

export async function generateDownloadLink(fileName: string): Promise<string> {
  const getObjectParams = {
    Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
    Key: fileName,
  };

  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10 minutes
  return url;
}

export async function deleteFileFromS3(fileName: string): Promise<void> {
  try {
    const deleteParams = {
      Bucket: Deno.env.get("BUCKET_NAME") || "blog-storage-printable",
      Key: fileName,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log(`File ${fileName} deleted from S3`);
  } catch (error: unknown) {
    console.error("S3 delete failed:", error);
    throw error;
  }
}