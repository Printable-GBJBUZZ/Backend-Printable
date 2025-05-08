import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import fileConversionController from "../controller/fileConversionController.ts";

const router = new Router({ prefix: "/api" });

router.get("/test", (ctx) => {
  ctx.response.body = "Test route working!";
});

router.post("/convert", fileConversionController.convert);

export const fileConversionRouter = router;