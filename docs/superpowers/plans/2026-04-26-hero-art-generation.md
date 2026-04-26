# Hero Block AI Art Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-generate abstract artwork for each station's hero block using DALL-E 3. The image reflects the current playlist and genre, stored in R2, and updates live via `artwork_update` WebSocket events.

**Architecture:** `artworkGenerator.ts` service holds in-memory generation state (fingerprint + timestamp per station). Called from `pollStation()` after a new song is saved. Emits `artwork_update` Socket.IO event. `useStation` hook consumes the event and returns `artworkUrl`. R2 module (`apps/api/src/lib/r2.ts`) is shared with the DJ avatar plan — implement that plan first.

**Tech Stack:** openai SDK, @aws-sdk/client-s3, Prisma, Socket.IO, React, Vitest

---

## File Map

| File | Change |
|---|---|
| `packages/shared/src/ws-events.ts` | Add `ArtworkUpdatePayload` interface + `artwork_update` to `ServerEvents` |
| `apps/api/src/lib/r2.ts` | Already created by DJ avatar plan — no changes needed |
| `apps/api/src/services/artworkGenerator.ts` | Create — fingerprint logic, DALL-E call, R2 upload, Socket.IO emit |
| `apps/api/src/ws/metadata.ts` | Call `maybeRegenerateArtwork()` after new song saved in `pollStation()` |
| `apps/api/src/tests/services/artworkGenerator.test.ts` | Create — unit tests |
| `apps/web/src/hooks/useStation.ts` | Add `artworkUrl` state + `artwork_update` socket handler |

---

### Task 1: Add ArtworkUpdatePayload to shared types

**Files:**
- Modify: `packages/shared/src/ws-events.ts`

- [ ] **Step 1: Verify baseline typecheck passes**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: passes (baseline).

- [ ] **Step 2: Add the payload type and event**

In `packages/shared/src/ws-events.ts`, after `DjSwitchPayload`, add:

```typescript
export interface ArtworkUpdatePayload {
  stationSlug: string;
  artworkUrl: string;
}
```

Add `artwork_update` to `ServerEvents`:

```typescript
export interface ServerEvents {
  now_playing(payload: { title: string; artist: string; albumCoverUrl: string | null }): void;
  reaction_update(payload: { songId: string; counts: ReactionCounts }): void;
  new_message(payload: { displayName: string; content: string; createdAt: string }): void;
  listener_count(payload: { count: number }): void;
  station_status(payload: { isLive: boolean }): void;
  stream_control(payload: StreamControlPayload): void;
  dj_switch(payload: DjSwitchPayload): void;
  artwork_update(payload: ArtworkUpdatePayload): void;
  error(payload: { message: string }): void;
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/ws-events.ts
git commit -m "feat(shared): add ArtworkUpdatePayload and artwork_update server event"
```

---

### Task 2: Create artworkGenerator service + tests

**Files:**
- Create: `apps/api/src/services/artworkGenerator.ts`
- Create: `apps/api/src/tests/services/artworkGenerator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/tests/services/artworkGenerator.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/api && npx vitest run src/tests/services/artworkGenerator.test.ts
```

Expected: FAIL — `Cannot find module '../../services/artworkGenerator.js'`

- [ ] **Step 3: Implement artworkGenerator.ts**

Create `apps/api/src/services/artworkGenerator.ts`:

```typescript
import { createHash } from 'crypto';
import type { Server as IOServer } from 'socket.io';
import OpenAI from 'openai';
import { prisma } from '../db/client.js';
import { uploadToR2, downloadFromUrl } from '../lib/r2.js';
import type { Song } from '@ownradio/shared';

interface GenerationState {
  lastSongFingerprint: string;
  lastGeneratedAt: number;
}

const generationState = new Map<string, GenerationState>();

const REGEN_INTERVAL_MS = parseInt(process.env.ARTWORK_REGEN_INTERVAL_MS ?? '1800000', 10);
const PROVIDER = process.env.ARTWORK_PROVIDER ?? 'openai';
const MODEL = process.env.ARTWORK_MODEL ?? 'dall-e-3';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

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

function buildPrompt(genre: string, songs: Pick<Song, 'artist' | 'title'>[]): string {
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

function computeFingerprint(songs: Pick<Song, 'artist' | 'title'>[]): string {
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
  recentSongs: Pick<Song, 'id' | 'stationId' | 'artist' | 'title' | 'playedAt' | 'albumCoverUrl' | 'duration'>[]
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
  if (station.artworkUrl !== null && fingerprintUnchanged && withinInterval) return;

  await generateArtwork(station, recentSongs);
  generationState.set(stationId, { lastSongFingerprint: fingerprint, lastGeneratedAt: now });
}

async function generateArtwork(
  station: { id: string; slug: string; genre: string },
  songs: Pick<Song, 'artist' | 'title'>[]
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
  songs: Pick<Song, 'artist' | 'title'>[]
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
  const tempUrl = response.data[0]?.url;
  if (!tempUrl) throw new Error('DALL-E returned no image URL');
  const buffer = await downloadFromUrl(tempUrl);
  const key = `stations/${station.id}/artwork.jpg`;
  await uploadToR2(key, buffer, 'image/jpeg');
  return `${R2_PUBLIC_URL}/${key}`;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/api && npx vitest run src/tests/services/artworkGenerator.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run typecheck**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/services/artworkGenerator.ts \
        apps/api/src/tests/services/artworkGenerator.test.ts
git commit -m "feat(api): add artworkGenerator service with mock provider and rate limiting"
```

---

### Task 3: Wire artworkGenerator into metadata poller

**Files:**
- Modify: `apps/api/src/ws/metadata.ts`

- [ ] **Step 1: Add import**

After existing imports in `apps/api/src/ws/metadata.ts`:

```typescript
import { maybeRegenerateArtwork, initArtworkGenerator } from '../services/artworkGenerator.js';
```

- [ ] **Step 2: Initialize with io in startMetadataPollers**

```typescript
export async function startMetadataPollers(io: IOServer): Promise<void> {
  initArtworkGenerator(io);
  await refreshPollers(io);
  discoveryInterval = setInterval(() => refreshPollers(io), 30_000);
}
```

- [ ] **Step 3: Fetch recent songs and call maybeRegenerateArtwork inside pollStation**

Replace the inner `try` block in `pollStation` with:

```typescript
  try {
    const song = await prisma.song.create({
      data: { stationId, title: metadata.title, artist: metadata.artist },
    });

    io.to(`station:${slug}`).emit("now_playing", {
      id: song.id,
      stationId: song.stationId,
      title: song.title,
      artist: song.artist,
      albumCoverUrl: song.albumCoverUrl,
      playedAt: song.playedAt,
      duration: song.duration,
    });

    const recentSongs = await prisma.song.findMany({
      where: { stationId },
      orderBy: { playedAt: 'desc' },
      take: 5,
      select: { id: true, stationId: true, artist: true, title: true, playedAt: true, albumCoverUrl: true, duration: true },
    });
    await maybeRegenerateArtwork(stationId, recentSongs);
  } catch {
    console.error(`Failed to save song for station ${slug}`);
  }
```

- [ ] **Step 4: Run typecheck**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/ws/metadata.ts
git commit -m "feat(api): call artworkGenerator from metadata polling loop"
```

---

### Task 4: Add artworkUrl to useStation hook

**Files:**
- Modify: `apps/web/src/hooks/useStation.ts`

- [ ] **Step 1: Add ArtworkUpdatePayload to imports**

```typescript
import type {
  StationWithDJ,
  Song,
  ReactionType,
  ReactionCounts,
  ChatMessage,
  StreamControlPayload,
  DjSwitchPayload,
  ArtworkUpdatePayload,
} from "@ownradio/shared";
```

- [ ] **Step 2: Add artworkUrl to UseStationReturn interface**

```typescript
interface UseStationReturn {
  currentSong: Song | null;
  songResolved: boolean;
  reactions: ReactionCounts;
  messages: ChatMessage[];
  listenerCount: number;
  activeReaction: ReactionType | null;
  streamUrl: string | null;
  streamActive: boolean;
  activeDj: DjSwitchPayload | null;
  /** Live artwork URL — overrides station.artworkUrl when received via WebSocket */
  artworkUrl: string | null;
  sendReaction: (type: ReactionType) => void;
  sendMessage: (content: string) => void;
}
```

- [ ] **Step 3: Add artworkUrl state inside useStation (after activeDj state)**

```typescript
const [artworkUrl, setArtworkUrl] = useState<string | null>(station.artworkUrl ?? null);
```

- [ ] **Step 4: Reset on station slug change**

Add `setArtworkUrl(station.artworkUrl ?? null)` to the slug-change guard:

```typescript
if (activeSlug !== station.slug) {
  setActiveSlug(station.slug);
  setStreamUrlOverride(null);
  setStreamActive(true);
  setActiveDj(null);
  setSongResolved(station.currentSong != null);
  setArtworkUrl(station.artworkUrl ?? null);
}
```

- [ ] **Step 5: Register artwork_update handler in the socket useEffect**

Inside the `useEffect`, after `onDjSwitch`:

```typescript
function onArtworkUpdate(data: ArtworkUpdatePayload) {
  if (data.stationSlug === station.slug) {
    setArtworkUrl(data.artworkUrl);
  }
}
```

Register and clean up alongside the other handlers:

```typescript
socket.on("artwork_update", onArtworkUpdate);

return () => {
  clearTimeout(resolveTimer);
  socket.emit("leave_station");
  socket.off("now_playing", onNowPlaying);
  socket.off("reaction_update", onReactionUpdate);
  socket.off("new_message", onNewMessage);
  socket.off("listener_count", onListenerCount);
  socket.off("stream_control", onStreamControl);
  socket.off("dj_switch", onDjSwitch);
  socket.off("artwork_update", onArtworkUpdate);
};
```

- [ ] **Step 6: Return artworkUrl from the hook**

```typescript
return {
  currentSong,
  songResolved,
  reactions,
  messages,
  listenerCount,
  activeReaction,
  streamUrl,
  streamActive,
  activeDj,
  artworkUrl,
  sendReaction,
  sendMessage,
};
```

- [ ] **Step 7: Run typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/hooks/useStation.ts
git commit -m "feat(web): expose artworkUrl from useStation, live via artwork_update event"
```

---

### Task 5: Final gate

- [ ] **Step 1: Full typecheck + lint**

```bash
npx turbo typecheck lint --filter=web --filter=api --filter=@ownradio/shared
```

Expected: 0 errors, no blocking lint warnings.

- [ ] **Step 2: Run all API tests**

```bash
cd apps/api && npx vitest run
```

Expected: all pass, including the 4 new artworkGenerator tests.

- [ ] **Step 3: Verify event is wired end-to-end**

```bash
grep -r "artwork_update" packages/shared/src/ apps/api/src/ apps/web/src/
```

Expected: matches in `ws-events.ts`, `artworkGenerator.ts`, `metadata.ts`, and `useStation.ts`.

- [ ] **Step 4: Push**

```bash
git push origin main
```
