import express from 'express';
import { Router as OakRouter } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { compressPdf } from '../controller/file-controller.ts';
import s3 from '../configs/s3.ts';

// Express router for Node.js
const expressRouter = express.Router();

// Oak router for Deno
const oakRouter = new OakRouter();

const isDeno = typeof Deno !== 'undefined';

// File upload handling for Node.js with multer-s3
if (!isDeno) {
  const multer = require('multer');
  const multerS3 = require('multer-s3');
  const { v4: uuidv4 } = require('uuid');

  const upload = multer({
    storage: multerS3({
      s3,
      bucket: process.env.BUCKET_NAME,
      key: (req, file, cb) => {
        const compressedFilename = `compressed_${uuidv4()}_${file.originalname}`;
        cb(null, `uploads/${compressedFilename}`);
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
  });

  expressRouter.post('/compress', upload.single('pdf'), compressPdf);
}

// File upload handling for Deno
if (isDeno) {
  oakRouter.post('/compress', compressPdf);
}

export default isDeno ? oakRouter : expressRouter;