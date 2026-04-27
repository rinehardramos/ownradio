import type { FastifyPluginAsync } from "fastify";
import type { Server as IOServer } from "socket.io";
import type { StreamControlPayload, DjSwitchPayload } from "@ownradio/shared";
import { prisma } from "../db/client.js";
import { maybeRegenerateArtwork } from "../services/artworkGenerator.js";

function verifySecret(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const secret = process.env.PLAYGEN_WEBHOOK_SECRET ?? "";
  if (!secret) return true; // disabled in dev if unset
  const header = req.headers["x-playgen-secret"];
  const token = Array.isArray(header) ? header[0] : header;
  return token === secret;
}

interface ProgramWebhookBody {
  title: string;
  description?: string;
  recordedAt: string;
  durationSecs: number;
  playbackUrl: string;
  coverArtUrl?: string;
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
        }).catch((err: unknown) => {
          app.log.warn({ err, slug }, "[webhook] failed to persist stream_url");
        });
      }

      getIo().to(`station:${slug}`).emit("stream_control", { ...payload, stationSlug: slug });
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
      getIo().to(`station:${slug}`).emit("dj_switch", { ...payload, stationSlug: slug });
      return { ok: true };
    });

    // POST /webhooks/stations/:slug/program
    app.post<{ Params: { slug: string }; Body: ProgramWebhookBody }>(
      '/webhooks/stations/:slug/program',
      async (request, reply) => {
        if (!verifySecret(request)) return reply.status(401).send({ error: 'Unauthorized' });

        const { slug } = request.params;
        const { title, description, recordedAt, durationSecs, playbackUrl, coverArtUrl } = request.body ?? {};

        if (!title || !recordedAt || !durationSecs || !playbackUrl) {
          return reply.status(400).send({ error: 'title, recordedAt, durationSecs, and playbackUrl are required' });
        }

        const station = await prisma.station.findUnique({
          where: { slug },
          include: { dj: { select: { id: true } } },
        });
        if (!station) return reply.status(404).send({ error: 'Station not found' });

        const program = await prisma.program.upsert({
          where: { stationId_recordedAt: { stationId: station.id, recordedAt: new Date(recordedAt) } },
          update: { title, description: description ?? null, durationSecs, playbackUrl, coverArtUrl: coverArtUrl ?? null },
          create: {
            stationId: station.id,
            djId: station.dj?.id ?? null,
            title,
            description: description ?? null,
            recordedAt: new Date(recordedAt),
            durationSecs,
            playbackUrl,
            coverArtUrl: coverArtUrl ?? null,
          },
        });

        // #33: Generate artwork once per program delivery (not per song change)
        const recentSongs = await prisma.song.findMany({
          where: { stationId: station.id },
          orderBy: { playedAt: 'desc' },
          take: 5,
          select: { id: true, stationId: true, artist: true, title: true, playedAt: true, albumCoverUrl: true, duration: true },
        });
        maybeRegenerateArtwork(station.id, recentSongs).catch((err: unknown) => {
          app.log.warn({ err }, '[webhook] artwork generation failed for station %s', slug);
        });

        return reply.status(201).send({ program });
      }
    );
  };
}
