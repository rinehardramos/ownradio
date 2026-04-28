import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/client.js";
import { getPublicStations, getPublicStation } from "../lib/playgen.js";
import { getCurrentSongForSlug } from "../ws/metadata.js";

const WEBHOOK_SECRET = process.env.PLAYGEN_WEBHOOK_SECRET ?? "";

function verifySecret(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  if (!WEBHOOK_SECRET) return true;
  const header = req.headers["x-playgen-secret"];
  const token = Array.isArray(header) ? header[0] : header;
  return token === WEBHOOK_SECRET;
}

interface CreateStationBody {
  slug: string;
  name: string;
  description?: string;
  streamUrl?: string;
  metadataUrl?: string;
  genre?: string;
  artworkUrl?: string;
  isLive?: boolean;
  dj?: {
    name: string;
    bio?: string;
    avatarUrl?: string;
  };
}

export const stationRoutes: FastifyPluginAsync = async (app) => {
  // POST /stations — upsert by slug (webhook from PlayGen, requires X-PlayGen-Secret)
  // Kept for backward compat: creates local record for song history FK references
  app.post<{ Body: CreateStationBody }>("/stations", async (request, reply) => {
    if (!verifySecret(request)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const { slug, name, description, streamUrl, metadataUrl, genre, artworkUrl, isLive, dj } =
      request.body ?? {};

    if (!slug || !name) {
      return reply.status(400).send({ error: "slug and name are required" });
    }

    const existing = await prisma.station.findUnique({ where: { slug }, include: { dj: true } });

    if (existing) {
      const updated = await prisma.station.update({
        where: { slug },
        data: {
          name,
          ...(description !== undefined && { description }),
          ...(streamUrl !== undefined && { streamUrl }),
          ...(metadataUrl !== undefined && { metadataUrl }),
          ...(genre !== undefined && { genre }),
          ...(artworkUrl !== undefined && { artworkUrl }),
          ...(isLive !== undefined && { isLive }),
          ...(dj && {
            dj: existing.dj
              ? { update: { data: { name: dj.name, bio: dj.bio ?? "", avatarUrl: dj.avatarUrl ?? null } } }
              : { create: { name: dj.name, bio: dj.bio ?? "", avatarUrl: dj.avatarUrl ?? null } },
          }),
        },
        include: { dj: true },
      });

      return reply.status(200).send(updated);
    }

    const created = await prisma.station.create({
      data: {
        slug,
        name,
        description: description ?? "",
        streamUrl: streamUrl ?? "",
        metadataUrl: metadataUrl ?? "",
        genre: genre ?? "",
        artworkUrl: artworkUrl ?? null,
        isLive: isLive ?? false,
        ...(dj && {
          dj: { create: { name: dj.name, bio: dj.bio ?? "", avatarUrl: dj.avatarUrl ?? null } },
        }),
      },
      include: { dj: true },
    });

    return reply.status(201).send(created);
  });

  // GET /stations — #32: read from PlayGen public API (source of truth)
  app.get("/stations", async (request, reply) => {
    try {
      const playgenStations = await getPublicStations();

      // Merge with local data: current song from in-memory cache, local DJ avatar
      const localStations = await prisma.station.findMany({
        where: { slug: { in: playgenStations.map(s => s.slug) } },
        include: { dj: true, songs: { orderBy: { playedAt: "desc" }, take: 1 } },
      });
      const localBySlug = new Map(localStations.map(s => [s.slug, s]));

      return playgenStations.map(pg => {
        const local = localBySlug.get(pg.slug);
        const currentSong = getCurrentSongForSlug(pg.slug) ?? (local?.songs?.[0] ?? null);
        return {
          ...pg,
          // Prefer local fields that OwnRadio manages
          artworkUrl: local?.artworkUrl ?? pg.artworkUrl,
          streamUrl: local?.streamUrl || pg.streamUrl,
          isLive: local?.isLive ?? pg.isLive,
          dj: pg.dj ? {
            ...pg.dj,
            avatarUrl: local?.dj?.avatarUrl ?? pg.dj.avatarUrl,
          } : local?.dj ?? null,
          currentSong,
          listenerCount: 0,
        };
      });
    } catch (err) {
      // Fallback to local DB if PlayGen is unreachable
      request.log.warn({ err }, 'PlayGen public API unreachable, falling back to local DB');
      const stations = await prisma.station.findMany({
        include: { dj: true, songs: { orderBy: { playedAt: "desc" }, take: 1 } },
        orderBy: { name: "asc" },
      });
      return stations.map(({ songs, ...s }) => ({
        ...s,
        currentSong: getCurrentSongForSlug(s.slug) ?? songs[0] ?? null,
        listenerCount: 0,
      }));
    }
  });

  // GET /stations/:slug — #32: read from PlayGen
  app.get<{ Params: { slug: string } }>("/stations/:slug", async (request, reply) => {
    const { slug } = request.params;
    try {
      const pg = await getPublicStation(slug);

      // Merge local data
      const local = await prisma.station.findUnique({
        where: { slug },
        include: { dj: true, songs: { orderBy: { playedAt: "desc" }, take: 20 } },
      });

      return {
        ...pg,
        artworkUrl: local?.artworkUrl ?? pg.artworkUrl,
        streamUrl: local?.streamUrl || pg.streamUrl,
        isLive: local?.isLive ?? pg.isLive,
        dj: pg.dj ? {
          ...pg.dj,
          avatarUrl: local?.dj?.avatarUrl ?? pg.dj.avatarUrl,
        } : local?.dj ?? null,
        songs: local?.songs ?? [],
      };
    } catch {
      // Fallback to local
      const station = await prisma.station.findUnique({
        where: { slug },
        include: { dj: true, songs: { orderBy: { playedAt: "desc" }, take: 20 } },
      });
      if (!station) return reply.status(404).send({ error: "Station not found" });
      return station;
    }
  });

  // GET /stations/:slug/top-songs — local song history (OwnRadio-specific)
  app.get<{ Params: { slug: string } }>("/stations/:slug/top-songs", async (request, reply) => {
    const { slug } = request.params;
    const station = await prisma.station.findUnique({ where: { slug } });
    if (!station) return reply.status(404).send({ error: "Station not found" });
    return prisma.song.findMany({
      where: { stationId: station.id },
      orderBy: { playedAt: "desc" },
      take: 10,
    });
  });

  // GET /stations/:slug/programs — program history
  app.get<{ Params: { slug: string } }>('/stations/:slug/programs', async (request, reply) => {
    const { slug } = request.params;
    const station = await prisma.station.findUnique({ where: { slug } });
    if (!station) return reply.status(404).send({ error: 'Station not found' });
    const limit = Number(process.env.PROGRAM_HISTORY_LIMIT ?? 5);
    return prisma.program.findMany({
      where: { stationId: station.id },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  });

  // GET /djs/:djId/programs
  app.get<{ Params: { djId: string } }>('/djs/:djId/programs', async () => {
    // Programs are now in PlayGen — this is a legacy endpoint
    return [];
  });
};
