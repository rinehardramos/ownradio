import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/client.js";
import { generateDjAvatar } from "../services/avatarGenerator.js";

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
  // POST /stations — upsert by slug (requires X-PlayGen-Secret)
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
      // Upsert: update station fields; update or create DJ if provided
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

      if (updated.dj && !updated.dj.avatarUrl) {
        try {
          const avatarUrl = await generateDjAvatar({
            djId: updated.dj.id,
            djName: updated.dj.name,
            djBio: updated.dj.bio,
            genre: updated.genre,
          });
          await prisma.dJ.update({ where: { id: updated.dj.id }, data: { avatarUrl } });
          updated.dj.avatarUrl = avatarUrl;
        } catch (err) {
          app.log.error({ err }, 'Avatar generation failed for DJ %s', updated.dj.id);
        }
      }

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

    if (created.dj && !created.dj.avatarUrl) {
      try {
        const avatarUrl = await generateDjAvatar({
          djId: created.dj.id,
          djName: created.dj.name,
          djBio: created.dj.bio,
          genre: created.genre,
        });
        await prisma.dJ.update({ where: { id: created.dj.id }, data: { avatarUrl } });
        created.dj.avatarUrl = avatarUrl;
      } catch (err) {
        app.log.error({ err }, 'Avatar generation failed for DJ %s', created.dj.id);
      }
    }

    return reply.status(201).send(created);
  });

  // GET /stations
  app.get("/stations", async (request, reply) => {
    const stations = await prisma.station.findMany({
      include: {
        dj: true,
        songs: { orderBy: { playedAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    });
    return stations.map(({ songs, ...s }) => ({
      ...s,
      currentSong: songs[0] ?? null,
      listenerCount: 0,
    }));
  });

  // GET /stations/:slug
  app.get<{ Params: { slug: string } }>("/stations/:slug", async (request, reply) => {
    const { slug } = request.params;
    const station = await prisma.station.findUnique({
      where: { slug },
      include: {
        dj: true,
        songs: {
          orderBy: { playedAt: "desc" },
          take: 20,
        },
      },
    });
    if (!station) {
      return reply.status(404).send({ error: "Station not found" });
    }
    return station;
  });

  // GET /stations/:slug/top-songs
  app.get<{ Params: { slug: string } }>("/stations/:slug/top-songs", async (request, reply) => {
    const { slug } = request.params;
    const station = await prisma.station.findUnique({ where: { slug } });
    if (!station) {
      return reply.status(404).send({ error: "Station not found" });
    }
    const songs = await prisma.song.findMany({
      where: { stationId: station.id },
      orderBy: { playedAt: "desc" },
      take: 10,
    });
    return songs;
  });

  // GET /stations/:slug/programs
  app.get<{ Params: { slug: string } }>('/stations/:slug/programs', async (request, reply) => {
    const { slug } = request.params;
    const station = await prisma.station.findUnique({ where: { slug } });
    if (!station) return reply.status(404).send({ error: 'Station not found' });
    const limit = Number(process.env.PROGRAM_HISTORY_LIMIT ?? 5);
    const programs = await prisma.program.findMany({
      where: { stationId: station.id },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return programs;
  });

  // GET /djs/:djId/programs
  app.get<{ Params: { djId: string } }>('/djs/:djId/programs', async (request, reply) => {
    const { djId } = request.params;
    const limit = Number(process.env.PROGRAM_HISTORY_LIMIT ?? 5);
    const programs = await prisma.program.findMany({
      where: { djId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return programs;
  });
};
