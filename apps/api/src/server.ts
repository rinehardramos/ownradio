import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { Server as IOServer } from "socket.io";
import { stationRoutes } from "./routes/stations.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/user.js";
import { buildWebhookRoutes } from "./routes/webhooks.js";
import { setupSocketHandlers } from "./ws/index.js";
import { startMetadataPollers, stopAllPollers } from "./ws/metadata.js";
import { prisma } from "./db/client.js";

// Shared mutable ref — populated by start() after listen(); stays null in tests.
const ioHolder: { current: IOServer | null } = { current: null };

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  await app.register(cookie);

  app.get("/health", async (_req, reply) => {
    const dbOk = await prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);

    const status = dbOk ? "ok" : "degraded";
    const body = {
      status,
      version: process.env.BUILD_VERSION || "dev",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbOk ? "connected" : "unreachable",
      },
    };

    return reply.status(dbOk ? 200 : 503).send(body);
  });

  app.register(stationRoutes);
  app.register(authRoutes);
  app.register(userRoutes);
  app.register(buildWebhookRoutes(() => ioHolder.current as IOServer));

  return app;
}

async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT) || 4000;

  // socket.io attaches to the raw http.Server which isn't created until listen(),
  // so we listen first, then wire up IO into the shared holder.
  await app.listen({ port, host: "0.0.0.0" });

  ioHolder.current = new IOServer(app.server, {
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    },
  });
  setupSocketHandlers(ioHolder.current);
  startMetadataPollers(ioHolder.current).catch((err) => {
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
