FROM denoland/deno:alpine-1.43.0

EXPOSE 8080

WORKDIR /app

COPY . .

CMD ["run", "--allow-net", "main.ts"]
