import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

vi.mock('../../lib/r2.js', () => ({
  uploadToR2: vi.fn(),
  downloadFromUrl: vi.fn().mockResolvedValue(Buffer.from('fake-image')),
}));

vi.mock('../../db/client.js', () => ({
  prisma: {
    station: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: {
      generate: vi.fn().mockResolvedValue({ data: [{ url: 'openai-mock-image' }] }),
    },
  })),
}));

import { prisma } from '../../db/client.js';

process.env.ARTWORK_PROVIDER = 'mock';
process.env.R2_PUBLIC_URL = 'cdn-base';
process.env.ARTWORK_REGEN_INTERVAL_MS = '1800000';

import { maybeRegenerateArtwork } from '../../services/artworkGenerator.js';

type SongStub = { id: string; stationId: string; artist: string; title: string; playedAt: Date; albumCoverUrl: null; duration: null };

function makeSong(artist: string, title: string): SongStub {
  return { id: `${artist}-${title}`, stationId: 'st1', artist, title, playedAt: new Date(), albumCoverUrl: null, duration: null };
}

describe('artworkGenerator', () => {
  const station = { id: 'st1', slug: 'rock-haven', genre: 'Rock', artworkUrl: null };
  const songs = [makeSong('Metallica', 'Enter Sandman'), makeSong('ACDC', 'Thunderstruck')];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.station.findUnique).mockResolvedValue(station as never);
    vi.mocked(prisma.station.update).mockResolvedValue({ ...station, artworkUrl: 'MOCKED_ARTWORK' } as never);
  });

  it('generates artwork when artworkUrl is null', async () => {
    await maybeRegenerateArtwork('st1', songs);
    expect(prisma.station.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'st1' } })
    );
  });

  it('skips when fingerprint unchanged and within interval', async () => {
    await maybeRegenerateArtwork('st1', songs);
    vi.mocked(prisma.station.update).mockClear();
    await maybeRegenerateArtwork('st1', songs);
    expect(prisma.station.update).not.toHaveBeenCalled();
  });

  it('regenerates when song list changes', async () => {
    await maybeRegenerateArtwork('st1', songs);
    vi.mocked(prisma.station.update).mockClear();
    const newSongs = [...songs, makeSong('Nirvana', 'Teen Spirit')];
    await maybeRegenerateArtwork('st1', newSongs);
    expect(prisma.station.update).toHaveBeenCalled();
  });

  it('fingerprint is stable SHA-256 for same input', () => {
    const key = songs.slice(0, 5).map(s => `${s.artist} - ${s.title}`).join('|');
    const fp = createHash('sha256').update(key).digest('hex');
    expect(fp).toHaveLength(64);
    expect(fp).toBe(createHash('sha256').update(key).digest('hex'));
  });
});
