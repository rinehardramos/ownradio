import { createHash } from 'crypto';
import type { Server as IOServer } from 'socket.io';
import OpenAI from 'openai';
import { prisma } from '../db/client.js';
import { uploadToR2, downloadFromUrl } from '../lib/r2.js';

interface GenerationState {
  lastSongFingerprint: string;
  lastGeneratedAt: number;
}

const generationState = new Map<string, GenerationState>();

const REGEN_INTERVAL_MS = parseInt(process.env.ARTWORK_REGEN_INTERVAL_MS ?? '1800000', 10);
const PROVIDER = process.env.ARTWORK_PROVIDER ?? 'openai';
const MODEL = process.env.ARTWORK_MODEL ?? 'dall-e-3';
const R2_PUBLIC_URL = process.env.S3_PUBLIC_URL ?? '';

const GENRE_MOOD: Record<string, string> = {
  rock: 'energetic, raw',
  pop: 'vibrant, bright',
  'hip-hop': 'urban, bold',
  'lo-fi': 'mellow, nostalgic',
  jazz: 'smooth, warm',
  electronic: 'futuristic, pulsating',
  classical: 'elegant, refined',
  opm: 'soulful, lively',
};

interface SongRef {
  artist: string;
  title: string;
}

function buildPrompt(genre: string, songs: SongRef[]): string {
  const template =
    process.env.ARTWORK_PROMPT_TEMPLATE ??
    'Album cover art for a {{genre}} radio station. Current playlist: {{songList}}. Abstract, vibrant, cinematic composition. No text, no words, no letters, no watermarks. Mood: {{mood}}.';
  const songList = songs
    .slice(0, 5)
    .map(s => `${s.artist} \u2013 ${s.title}`)
    .join(' \u00b7 ');
  const mood = GENRE_MOOD[genre.toLowerCase()] ?? 'dynamic';
  return template
    .replace('{{genre}}', genre)
    .replace('{{songList}}', songList)
    .replace('{{mood}}', mood);
}

function computeFingerprint(songs: SongRef[]): string {
  const key = songs
    .slice(0, 5)
    .map(s => `${s.artist} - ${s.title}`)
    .join('|');
  return createHash('sha256').update(key).digest('hex');
}

let _io: IOServer | null = null;

export function initArtworkGenerator(io: IOServer): void {
  _io = io;
}

export async function maybeRegenerateArtwork(
  stationId: string,
  recentSongs: (SongRef & { id: string; stationId: string; playedAt: Date | string; albumCoverUrl: string | null; duration: number | null })[]
): Promise<void> {
  const station = await prisma.station.findUnique({
    where: { id: stationId },
    select: { id: true, slug: true, genre: true, artworkUrl: true },
  });
  if (!station) return;

  const fingerprint = computeFingerprint(recentSongs);
  const state = generationState.get(stationId);
  const now = Date.now();
  const fingerprintUnchanged = state?.lastSongFingerprint === fingerprint;
  const withinInterval = state ? now - state.lastGeneratedAt < REGEN_INTERVAL_MS : false;
  // Skip if we've recently generated for the same song fingerprint,
  // or if DB already has artwork and no playlist change has occurred.
  const alreadyGeneratedRecently = fingerprintUnchanged && withinInterval;
  const dbArtworkUnchanged = station.artworkUrl !== null && fingerprintUnchanged;
  if (alreadyGeneratedRecently || dbArtworkUnchanged) return;

  await generateArtwork(station, recentSongs);
  generationState.set(stationId, { lastSongFingerprint: fingerprint, lastGeneratedAt: now });
}

async function generateArtwork(
  station: { id: string; slug: string; genre: string },
  songs: SongRef[]
): Promise<void> {
  try {
    const artworkUrl =
      PROVIDER === 'mock'
        ? `${R2_PUBLIC_URL}/placeholders/stations/mock.jpg`
        : await generateWithDalle(station, songs);

    await prisma.station.update({ where: { id: station.id }, data: { artworkUrl } });

    _io?.to(`station:${station.slug}`).emit('artwork_update', {
      stationSlug: station.slug,
      artworkUrl,
    });
  } catch (err) {
    console.error(`[artworkGenerator] Failed for station ${station.slug}:`, err);
  }
}

async function generateWithDalle(
  station: { id: string; genre: string },
  songs: SongRef[]
): Promise<string> {
  const openai = new OpenAI(); // reads OPENAI_API_KEY from env automatically
  const prompt = buildPrompt(station.genre, songs);
  const response = await openai.images.generate({
    model: MODEL,
    prompt,
    size: '1792x1024',
    quality: 'standard',
    n: 1,
  });
  const tempUrl = response.data?.[0]?.url;
  if (!tempUrl) throw new Error('DALL-E returned no image URL');
  const buffer = await downloadFromUrl(tempUrl);
  const key = `stations/${station.id}/artwork.jpg`;
  await uploadToR2(key, buffer, 'image/jpeg');
  return `${R2_PUBLIC_URL}/${key}`;
}
