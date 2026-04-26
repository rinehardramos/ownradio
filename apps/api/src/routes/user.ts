import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createPlayGenStation,
  createDjProfile,
  assignDjToStation,
  createPlayGenProgram,
  listTtsVoices,
} from '../lib/playgen.js';

export const userRoutes: FastifyPluginAsync = async (app) => {
  // POST /user/stations — create a new station for the authenticated user
  app.post<{
    Body: {
      name: string; genre: string; slug: string;
      description?: string; streamUrl?: string; metadataUrl?: string;
    };
  }>('/user/stations', { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user as { userId: string; username: string };
    const { name, genre, slug, description, streamUrl, metadataUrl } = request.body ?? {};

    if (!name || !genre || !slug) {
      return reply.status(400).send({ error: 'name, genre, and slug are required' });
    }

    const existing = await prisma.station.findUnique({ where: { slug } });
    if (existing) {
      return reply.status(409).send({ error: 'Slug already taken' });
    }

    const pgStation = await createPlayGenStation({ name, genre, slug, description });

    const station = await prisma.station.create({
      data: {
        slug, name, genre,
        description: description ?? '',
        streamUrl: streamUrl ?? pgStation.streamUrl ?? '',
        metadataUrl: metadataUrl ?? pgStation.metadataUrl ?? '',
        isLive: false, status: 'off_air',
        playgenStationId: pgStation.id,
        ownerId: user.userId,
      },
      include: { dj: true },
    });

    return reply.status(201).send(station);
  });

  // GET /user/stations — list stations owned by the authenticated user
  app.get('/user/stations', { preHandler: requireAuth }, async (request) => {
    const user = (request as any).user as { userId: string; username: string };
    return prisma.station.findMany({
      where: { ownerId: user.userId },
      include: { dj: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  // POST /user/dj-profiles — create a DJ profile for a station
  app.post<{
    Body: {
      stationSlug: string;
      name: string;
      bio: string;
      localeCities: string[];
      languages: Array<{ code: string; weight: number }>;
      personality?: string;
      ttsVoiceId?: string;
    };
  }>('/user/dj-profiles', { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user as { userId: string; username: string };
    const { stationSlug, name, bio, localeCities, languages, personality, ttsVoiceId }
      = request.body ?? {};

    if (!stationSlug || !name || !bio || !localeCities?.length || !languages?.length) {
      return reply.status(400).send({
        error: 'stationSlug, name, bio, localeCities, and languages are required',
      });
    }

    const station = await prisma.station.findUnique({ where: { slug: stationSlug } });
    if (!station || station.ownerId !== user.userId) {
      return reply.status(404).send({ error: 'Station not found' });
    }

    const pgDj = await createDjProfile({
      name, bio, localeCities, languages, personality, ttsVoiceId,
    });

    const dj = await prisma.dJ.create({
      data: {
        stationId: station.id,
        name, bio,
        playgenDjId: pgDj.id,
        localeCities,
        languages,
        personality: personality ?? null,
      },
    });

    if (station.playgenStationId) {
      await assignDjToStation(station.playgenStationId, pgDj.id);
    }

    return reply.status(201).send(dj);
  });

  // GET /user/tts-voices — list available TTS voices
  app.get('/user/tts-voices', { preHandler: requireAuth }, async () => {
    return listTtsVoices();
  });

  // POST /user/stations/:slug/programs — create a program for a station
  app.post<{
    Params: { slug: string };
    Body: { title: string; scheduledAt: string; durationSecs: number; description?: string };
  }>('/user/stations/:slug/programs', { preHandler: requireAuth }, async (request, reply) => {
    const user = (request as any).user as { userId: string; username: string };
    const { slug } = request.params;
    const { title, scheduledAt, durationSecs, description } = request.body ?? {};

    if (!title || !scheduledAt || !durationSecs) {
      return reply.status(400).send({ error: 'title, scheduledAt, and durationSecs are required' });
    }

    const station = await prisma.station.findUnique({ where: { slug } });
    if (!station || station.ownerId !== user.userId) {
      return reply.status(404).send({ error: 'Station not found' });
    }

    let playgenProgramId: string | null = null;
    if (station.playgenStationId) {
      const pgProg = await createPlayGenProgram(station.playgenStationId, {
        title, scheduledAt, durationSecs, description,
      });
      playgenProgramId = pgProg.id;
    }

    const prog = await prisma.stationProgram.create({
      data: {
        stationId: station.id, playgenProgramId,
        title, description: description ?? null,
        scheduledAt: new Date(scheduledAt), durationSecs,
      },
    });

    return reply.status(201).send(prog);
  });

  // GET /user/stations/:slug/readiness — check station readiness, auto-flip to on_air
  app.get<{ Params: { slug: string } }>(
    '/user/stations/:slug/readiness',
    { preHandler: requireAuth },
    async (request, reply) => {
      const user = (request as any).user as { userId: string; username: string };
      const { slug } = request.params;

      const station = await prisma.station.findUnique({
        where: { slug },
        include: {
          dj: true,
          stationPrograms: { orderBy: { scheduledAt: 'desc' }, take: 1 },
        },
      });

      if (!station || station.ownerId !== user.userId) {
        return reply.status(404).send({ error: 'Station not found' });
      }

      const checks = {
        station: !!station.playgenStationId,
        dj: !!(station.dj?.playgenDjId),
        program: station.stationPrograms.length > 0,
      };

      const allGreen = checks.station && checks.dj && checks.program;
      let status = station.status as string;

      if (allGreen && status !== 'on_air') {
        await prisma.station.update({
          where: { id: station.id },
          data: { status: 'on_air', isLive: true },
        });
        status = 'on_air';
      }

      return { ...checks, status };
    },
  );
};
