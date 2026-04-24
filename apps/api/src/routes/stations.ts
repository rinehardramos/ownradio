import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/client.js";

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

  // GET /stations
  app.get("/stations", async (request, reply) => {
    const stations = await prisma.station.findMany({
      include: { dj: true },
      orderBy: { name: "asc" },
    });
    return stations;
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
};
