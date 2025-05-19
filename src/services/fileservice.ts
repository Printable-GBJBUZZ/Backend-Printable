import { PDFDocument } from 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.js';
import { db } from '../configs/db.ts';
import s3 from '../../s3.ts';
import { files, compressed_files } from '../db/schema.ts';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';

export async function compressAndStorePdf(
  pdfBytes: Uint8Array,
  originalFilename: string,
  ownerId: string
): Promise<{ compressedFileUrl: string, compressedFileKey: string, compressedFileSize: number }> {
  try {
    // Compress PDF
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const compressedFileSize = compressedPdfBytes.length;

    // S3 upload (handled by multer-s3 in Node.js, manual in Deno)
    const compressedFilename = `compressed_${uuidv4()}_${originalFilename}`;
    const fileKey = `uploads/${compressedFilename}`;

    // Store original file metadata
    const [originalFile] = await db
      .insert(files)
      .values({
        ownerId,
        fileName: originalFilename,
        fileKey: `uploads/${originalFilename}`,
        fileSize: pdfBytes.length,
        fileType: 'application/pdf',
      })
      .returning();

    // Store compressed file metadata
    await db.insert(compressed_files).values({
      originalFileId: originalFile.id,
      compressedFileName: compressedFilename,
      compressedFileKey: fileKey,
      compressedFileSize,
    });

    return {
      compressedFileUrl: `https://${process.env.BUCKET_NAME}.s3.${process.env.REGION}.amazonaws.com/${fileKey}`,
      compressedFileKey: fileKey,
      compressedFileSize,
    };
  } catch (error) {
    throw new Error(`Failed to compress and store PDF: ${error.message}`);
  }
}