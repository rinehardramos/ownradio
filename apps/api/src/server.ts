import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { Server as IOServer } from "socket.io";
import { stationRoutes } from "./routes/stations.js";
import { authRoutes } from "./routes/auth.js";
import { setupSocketHandlers } from "./ws/index.js";
import { startMetadataPollers, stopAllPollers } from "./ws/metadata.js";

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
  app.register(authRoutes);

  return app;
}

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;
  await app.listen({ port, host: "0.0.0.0" });
  const io = new IOServer(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    },
  });
  setupSocketHandlers(io);
  startMetadataPollers(io).catch((err) => {
    console.error("Failed to start metadata pollers:", err);
  });

  // Graceful shutdown
  const shutdown = () => {
    stopAllPollers();
    app.close().then(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (process.env.NODE_ENV !== "test") {
  start();
}
