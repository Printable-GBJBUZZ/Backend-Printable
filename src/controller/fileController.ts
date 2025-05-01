import "jsr:@std/dotenv/load";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../configs/s3.ts";

console.log(Deno.env.get("BUCKET_NAME"));

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: Deno.env.get("BUCKET_NAME"),
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
    res.json({
      message: "File uploaded successfully",
      fileUrl: req.file.location,
      fileId: req.file.key,
    });
    console.log(req.file);
  });
};

export const getFile = async (req: any, res: any) => {
  console.log("req params", req.params);
  console.log("req body", req.body);

  try {
    const params = {
      Bucket: Deno.env.get("BUCKET_NAME"),
      Key: `documents/${req.params.filename}`,
    };

    const command = new GetObjectCommand(params);
    const { Body } = await s3.send(command);

    res.attachment(req.params.filename);
    Body.pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFile = async (req: any, res: any) => {
  try {
    const params = {
      Bucket: Deno.env.get("BUCKET_NAME"),
      Key: `documents/${req.params.filename}`,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    res.json({ message: "File deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
