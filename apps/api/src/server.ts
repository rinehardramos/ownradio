import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { stationRoutes } from "./routes/stations.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  await app.register(cookie);

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  app.register(stationRoutes);

  return app;
}

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: "0.0.0.0" });
}

if (process.env.NODE_ENV !== "test") {
  start();
}
