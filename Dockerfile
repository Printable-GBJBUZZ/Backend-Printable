
FROM denoland/deno:alpine-1.43.0

EXPOSE 8080
WORKDIR /app

COPY . .

RUN deno cache --lock=deno.lock main.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
