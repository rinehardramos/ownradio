import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/client.js";

export const stationRoutes: FastifyPluginAsync = async (app) => {
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
