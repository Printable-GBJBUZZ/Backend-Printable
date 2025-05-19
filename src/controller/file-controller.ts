import { compressAndStorePdf } from '../services/fileservice.ts';

export async function compressPdf(req: any, ctx?: any) {
  const isDeno = typeof Deno !== 'undefined';
  try {
    let file, originalFilename, pdfBytes;

    if (isDeno) {
      const formData = await ctx.request.body({ type: 'form-data' }).value.read();
      file = formData.files?.find((f: any) => f.name === 'pdf');
      if (!file || !file.content) {
        ctx.response.status = 400;
        ctx.response.body = { error: 'No PDF file uploaded' };
        return;
      }
      originalFilename = file.filename;
      pdfBytes = file.content;

      // Manual S3 upload for Deno
      const { compressedFileUrl } = await compressAndStorePdf(
        pdfBytes,
        originalFilename,
        'user-placeholder-id' // Replace with actual user ID
      );

      ctx.response.body = {
        message: 'PDF compressed successfully',
        compressedFileUrl,
      };
    } else {
      if (!req.file) {
        return req.res.status(400).json({ error: 'No PDF file uploaded' });
      }
      file = req.file;
      originalFilename = file.originalname;
      pdfBytes = file.buffer; // multer-s3 provides buffer

      const { compressedFileUrl } = await compressAndStorePdf(
        pdfBytes,
        originalFilename,
        'user-placeholder-id' // Replace with actual user ID
      );

      req.res.json({
        message: 'PDF compressed successfully',
        compressedFileUrl,
      });
    }
  } catch (error) {
    console.error('Error in compressPdf:', error);
    const errorResponse = { error: 'Failed to compress PDF' };
    if (isDeno) {
      ctx.response.status = 500;
      ctx.response.body = errorResponse;
    } else {
      req.res.status(500).json(errorResponse);
    }
  }
}