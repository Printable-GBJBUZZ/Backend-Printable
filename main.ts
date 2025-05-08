import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import "jsr:@std/dotenv/load";
import { fileConversionRouter } from "./src/route/fileConversionRoutes.ts";




const app = new Application();

app.use(async (ctx, next) => {
  console.log(`${ctx.request.method} ${ctx.request.url.pathname}`);
  await next();
});

app.use(oakCors());
app.use(fileConversionRouter.routes());
app.use(fileConversionRouter.allowedMethods());



const PORT = 5002;
console.log(`Server running on port ${PORT}`);
await app.listen({ port: PORT });