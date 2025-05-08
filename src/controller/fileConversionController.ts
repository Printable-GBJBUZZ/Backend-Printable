

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import fileConversionService from "../services/fileConversionService.ts";

export default {
  async convert(ctx: Context) {
    try {
      const body = ctx.request.body({ type: "form-data" });
      if (!body.value) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid form data" };
        return;
      }

      const formData = await body.value.read();
      const file = formData.files?.[0];

      if (!file?.filename || !file.originalName) {
        ctx.response.status = 400;
        ctx.response.body = { error: "No valid file provided" };
        return;
      }

      const fileContent = await Deno.readFile(file.filename);
      const fileObj = new File([fileContent], file.originalName, {
        type: file.contentType || "application/octet-stream",
      });

      const result = await fileConversionService.convertFile(fileObj);
      ctx.response.status = result.success ? 200 : 400;
      ctx.response.body = result;
    } catch (error) {
      console.error("Conversion error:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};