import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { compressPDF } from "../controllers/fileCompressionController.ts";

export const fileConversionRouter = new Router();

fileConversionRouter.post("/compress-pdf", compressPDF);