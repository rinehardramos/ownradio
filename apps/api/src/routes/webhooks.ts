import type { FastifyPluginAsync } from "fastify";
import type { Server as IOServer } from "socket.io";
import type { StreamControlPayload, DjSwitchPayload } from "@ownradio/shared";
import { prisma } from "../db/client.js";

const WEBHOOK_SECRET = process.env.PLAYGEN_WEBHOOK_SECRET ?? "";

function verifySecret(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  if (!WEBHOOK_SECRET) return true; // disabled in dev if unset
  const header = req.headers["x-playgen-secret"];
  const token = Array.isArray(header) ? header[0] : header;
  return token === WEBHOOK_SECRET;
}

/**
 * Internal webhook routes called by PlayGen to control OwnRadio streams.
 * Requires X-PlayGen-Secret header matching PLAYGEN_WEBHOOK_SECRET env var.
 */
// Accept a getter so the route can be registered before io is created
export function buildWebhookRoutes(getIo: () => IOServer): FastifyPluginAsync {
  return async (app) => {
    // POST /webhooks/stations/:slug/stream-control
    app.post<{
      Params: { slug: string };
      Body: StreamControlPayload;
    }>("/webhooks/stations/:slug/stream-control", async (req, reply) => {
      if (!verifySecret(req)) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { slug } = req.params;
      const payload = req.body;
      if (!payload?.action) {
        return reply.status(400).send({ error: "action required" });
      }
      // Persist stream URL so page-load shows the latest stream without waiting for a Socket event
      if (payload.action === "url_change" && payload.streamUrl) {
        await prisma.station.update({
          where: { slug },
          data: { streamUrl: payload.streamUrl, isLive: true },
        }).catch((err) => {
          app.log.warn({ err, slug }, "[webhook] failed to persist stream_url");
        });
      }

      getIo().to(`station:${slug}`).emit("stream_control", payload);
      return { ok: true };
    });

    // POST /webhooks/stations/:slug/dj-switch
    app.post<{
      Params: { slug: string };
      Body: DjSwitchPayload;
    }>("/webhooks/stations/:slug/dj-switch", async (req, reply) => {
      if (!verifySecret(req)) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { slug } = req.params;
      const payload = req.body;
      if (!payload?.djId || !payload?.name) {
        return reply.status(400).send({ error: "djId and name required" });
      }
      getIo().to(`station:${slug}`).emit("dj_switch", payload);
      return { ok: true };
    });
  };
}
