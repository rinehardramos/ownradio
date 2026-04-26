# Past History Stream List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users browse and replay up to N recorded past programs per station and per DJ, surfaced in station view and DJ view using the existing AudioControls player.

**Architecture:** New `Program` Prisma model. PlayGen posts recording metadata via a new webhook endpoint. Two read endpoints return programs scoped by station or DJ. A shared `PastShowsList` React component renders in StationCard (below DJ row). Limit is configurable via `PROGRAM_HISTORY_LIMIT` env var.

**Tech Stack:** Prisma migration, Fastify, shared types package, React, existing AudioControls

---

## File Map

| File | Change |
|---|---|
| `apps/api/prisma/schema.prisma` | add Program model + Station relation |
| `apps/api/prisma/migrations/…` | new migration |
| `packages/shared/src/station.ts` | add Program interface |
| `packages/shared/src/index.ts` | export Program |
| `apps/api/src/routes/stations.ts` | add GET /stations/:slug/programs + GET /djs/:djId/programs |
| `apps/api/src/routes/webhooks.ts` | add POST /webhooks/stations/:slug/program |
| `apps/api/src/tests/routes/stations.test.ts` | add programs endpoint tests |
| `apps/api/src/tests/routes/webhooks-program.test.ts` | new — webhook tests |
| `apps/web/src/components/station/PastShowsList.tsx` | new component |
| `apps/web/src/components/station/StationCard.tsx` | add Past Shows section |

---

### Task 1: Add Program model and migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add Program model to schema**

Add to `apps/api/prisma/schema.prisma` after the `ChatMessage` model:

```prisma
model Program {
  id           String   @id @default(cuid())
  stationId    String   @map("station_id")
  djId         String?  @map("dj_id")
  title        String
  description  String?
  recordedAt   DateTime @map("recorded_at")
  durationSecs Int      @map("duration_secs")
  playbackUrl  String   @map("playback_url")
  coverArtUrl  String?  @map("cover_art_url")
  createdAt    DateTime @default(now()) @map("created_at")

  station Station @relation(fields: [stationId], references: [id])

  @@unique([stationId, recordedAt])
  @@map("programs")
}
```

Also add `programs Program[]` to the `Station` model after `chatMessages ChatMessage[]`:
```prisma
  programs     Program[]
```

- [ ] **Step 2: Create and run migration**

```bash
cd apps/api && npx prisma migrate dev --name add_programs
```

Expected: Migration created and applied. `prisma generate` runs automatically.

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api): add Program model and migration for past history stream list"
```

---

### Task 2: Add Program type to shared package

**Files:**
- Modify: `packages/shared/src/station.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Add Program interface to station.ts**

Append to `packages/shared/src/station.ts`:

```typescript
export interface Program {
  id: string;
  stationId: string;
  djId: string | null;
  title: string;
  description: string | null;
  recordedAt: string;       // ISO 8601
  durationSecs: number;
  playbackUrl: string;
  coverArtUrl: string | null;
}
```

- [ ] **Step 2: Export from index.ts**

Open `packages/shared/src/index.ts`. Add `Program` to the existing named export from `./station.js`. Do not duplicate other exports.

- [ ] **Step 3: Typecheck shared package**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/station.ts packages/shared/src/index.ts
git commit -m "feat(shared): add Program type for past history stream list"
```

---

### Task 3: Add GET /stations/:slug/programs and GET /djs/:djId/programs

**Files:**
- Modify: `apps/api/src/routes/stations.ts`
- Modify: `apps/api/src/tests/routes/stations.test.ts`

- [ ] **Step 1: Add program to prisma mock**

In `apps/api/src/tests/routes/stations.test.ts`, update the `vi.mock('../../db/client.js', ...)` call to include `program: { findMany: vi.fn() }` alongside `station` and `song`.

- [ ] **Step 2: Write failing tests**

Add to `apps/api/src/tests/routes/stations.test.ts`:

```typescript
describe('GET /stations/:slug/programs', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const MOCK_PROGRAMS = [
    {
      id: 'prog1',
      stationId: 'st1',
      djId: 'dj1',
      title: 'Late Night Vibes ep 1',
      description: null,
      recordedAt: new Date('2026-04-26T02:00:00Z'),
      durationSecs: 3600,
      playbackUrl: 'programs/prog1.mp3',
      coverArtUrl: null,
      createdAt: new Date(),
    },
  ];

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('returns programs for a valid station slug', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    vi.mocked(prisma.program.findMany).mockResolvedValue(MOCK_PROGRAMS as any);

    const res = await supertest(app.server).get('/stations/rock-haven/programs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Late Night Vibes ep 1');
  });

  it('returns 404 for unknown station', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
    const res = await supertest(app.server).get('/stations/unknown/programs');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd apps/api && npx vitest run src/tests/routes/stations.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — 404 (routes not registered yet)

- [ ] **Step 4: Add endpoints to stations.ts**

Append inside the `stationRoutes` plugin before the closing `};`:

```typescript
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/api && npx vitest run src/tests/routes/stations.test.ts
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/stations.ts apps/api/src/tests/routes/stations.test.ts
git commit -m "feat(api): add GET /stations/:slug/programs and GET /djs/:djId/programs"
```

---

### Task 4: Add program webhook endpoint

**Files:**
- Modify: `apps/api/src/routes/webhooks.ts`
- Create: `apps/api/src/tests/routes/webhooks-program.test.ts`

- [ ] **Step 1: Read webhooks.ts to understand current structure**

```bash
cat apps/api/src/routes/webhooks.ts
```

Note how `verifySecret` is called and how routes are registered — follow the same pattern.

- [ ] **Step 2: Write failing test**

Create `apps/api/src/tests/routes/webhooks-program.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../server.js';

vi.mock('../../db/client.js', () => ({
  prisma: {
    station: { findUnique: vi.fn() },
    program: { upsert: vi.fn() },
  },
}));

import { prisma } from '../../db/client.js';

const MOCK_STATION = { id: 'st1', slug: 'rock-haven', dj: { id: 'dj1' } };
const MOCK_PROGRAM = {
  id: 'prog1', stationId: 'st1', djId: 'dj1',
  title: 'Late Night Vibes ep 1', description: null,
  recordedAt: new Date('2026-04-26T02:00:00Z'),
  durationSecs: 3600, playbackUrl: 'programs/prog1.mp3',
  coverArtUrl: null, createdAt: new Date(),
};

describe('POST /webhooks/stations/:slug/program', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); await app.ready(); });
  afterAll(async () => { await app.close(); });
  afterEach(() => vi.clearAllMocks());

  it('creates a program and returns 201', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    vi.mocked(prisma.program.upsert).mockResolvedValue(MOCK_PROGRAM as any);

    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', '')
      .send({
        title: 'Late Night Vibes ep 1',
        recordedAt: '2026-04-26T02:00:00Z',
        durationSecs: 3600,
        playbackUrl: 'programs/prog1.mp3',
      });

    expect(res.status).toBe(201);
    expect(res.body.program.title).toBe('Late Night Vibes ep 1');
  });

  it('returns 401 when a configured secret is sent incorrectly', async () => {
    const original = process.env.PLAYGEN_WEBHOOK_SECRET;
    process.env.PLAYGEN_WEBHOOK_SECRET = 'test-only-not-real';
    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', 'wrong-value')
      .send({ title: 'T', recordedAt: '2026-04-26T00:00:00Z', durationSecs: 1, playbackUrl: 'programs/t.mp3' });
    expect(res.status).toBe(401);
    process.env.PLAYGEN_WEBHOOK_SECRET = original;
  });

  it('returns 400 when required fields are missing', async () => {
    vi.mocked(prisma.station.findUnique).mockResolvedValue(MOCK_STATION as any);
    const res = await supertest(app.server)
      .post('/webhooks/stations/rock-haven/program')
      .set('x-playgen-secret', '')
      .send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/api && npx vitest run src/tests/routes/webhooks-program.test.ts
```

Expected: FAIL — 404 (route not registered)

- [ ] **Step 4: Add the handler inside buildWebhookRoutes in webhooks.ts**

```typescript
interface ProgramWebhookBody {
  title: string;
  description?: string;
  recordedAt: string;
  durationSecs: number;
  playbackUrl: string;
  coverArtUrl?: string;
}

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

    return reply.status(201).send({ program });
  }
);
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/api && npx vitest run src/tests/routes/webhooks-program.test.ts
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/webhooks.ts apps/api/src/tests/routes/webhooks-program.test.ts
git commit -m "feat(api): add POST /webhooks/stations/:slug/program for recording ingestion"
```

---

### Task 5: Create PastShowsList component

**Files:**
- Create: `apps/web/src/components/station/PastShowsList.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/station/PastShowsList.tsx`:

```tsx
'use client';
import { Music, Play, Square, Clock } from 'lucide-react';
import type { Program } from '@ownradio/shared';

interface PastShowsListProps {
  programs: Program[];
  onPlay: (program: Program) => void;
  activeProgram: Program | null;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PastShowsList({ programs, onPlay, activeProgram }: PastShowsListProps) {
  if (programs.length === 0) {
    return (
      <div style={{ padding: '12px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
        No past shows yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {programs.map((prog) => {
        const isActive = activeProgram?.id === prog.id;
        return (
          <div
            key={prog.id}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}
          >
            {/* Cover art */}
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {prog.coverArtUrl
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={prog.coverArtUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Music size={16} strokeWidth={1.75} color="rgba(255,255,255,0.3)" />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#ff2d78' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prog.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                <Clock size={10} strokeWidth={1.75} />
                <span>{formatDuration(prog.durationSecs)}</span>
                <span>·</span>
                <span>{formatDate(prog.recordedAt)}</span>
              </div>
            </div>

            {/* Play/stop button */}
            <button
              onClick={() => onPlay(prog)}
              aria-label={isActive ? 'Stop' : `Play ${prog.title}`}
              style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(255,45,120,0.4)', background: isActive ? 'rgba(255,45,120,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 150ms' }}
            >
              {isActive
                ? <Square size={12} strokeWidth={2} color="#ff2d78" fill="#ff2d78" />
                : <Play size={12} strokeWidth={2} color="rgba(255,255,255,0.6)" style={{ marginLeft: 1 }} />
              }
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/station/PastShowsList.tsx
git commit -m "feat(web): add PastShowsList component for past program playback"
```

---

### Task 6: Integrate PastShowsList into StationCard

**Files:**
- Modify: `apps/web/src/components/station/StationCard.tsx`

- [ ] **Step 1: Add imports**

At the top of `StationCard.tsx`, add the following (merge with existing React imports, add new named imports):

```tsx
import { useEffect } from 'react';           // add to existing react import
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PastShowsList } from './PastShowsList';
import type { Program } from '@ownradio/shared';
```

- [ ] **Step 2: Add state inside the component**

After existing `useState` calls:

```tsx
const [showPastShows, setShowPastShows] = useState(false);
const [programs, setPrograms] = useState<Program[]>([]);
const [activeProgram, setActiveProgram] = useState<Program | null>(null);
const [programStreamUrl, setProgramStreamUrl] = useState<string | null>(null);
```

- [ ] **Step 3: Add fetch effect**

After existing logic before the return statement:

```tsx
useEffect(() => {
  if (!showPastShows) return;
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/stations/${station.slug}/programs`)
    .then((r) => r.json())
    .then((data: Program[]) => setPrograms(data))
    .catch(() => setPrograms([]));
}, [showPastShows, station.slug]);
```

- [ ] **Step 4: Add handleProgramPlay**

```tsx
function handleProgramPlay(prog: Program) {
  if (activeProgram?.id === prog.id) {
    setActiveProgram(null);
    setProgramStreamUrl(null);
  } else {
    setActiveProgram(prog);
    setProgramStreamUrl(prog.playbackUrl);
  }
}
```

- [ ] **Step 5: Wire programStreamUrl into effectiveStreamUrl**

Find:
```tsx
const effectiveStreamUrl = isPlaceholderStream ? null : rawStreamUrl;
```
Replace with:
```tsx
const effectiveStreamUrl = programStreamUrl
  ? programStreamUrl
  : isPlaceholderStream ? null : rawStreamUrl;
```

- [ ] **Step 6: Add Past Shows section after the DJ card**

After the closing `</div>` of the DJ card section, before `{/* Modals */}`:

```tsx
{/* Past Shows */}
<div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
  <button
    onClick={() => setShowPastShows((v) => !v)}
    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}
  >
    Past Shows
    {showPastShows
      ? <ChevronUp size={14} strokeWidth={2} color="rgba(255,255,255,0.4)" />
      : <ChevronDown size={14} strokeWidth={2} color="rgba(255,255,255,0.4)" />
    }
  </button>
  {showPastShows && (
    <div style={{ padding: '0 16px 12px' }}>
      <PastShowsList programs={programs} onPlay={handleProgramPlay} activeProgram={activeProgram} />
    </div>
  )}
</div>
```

- [ ] **Step 7: Typecheck**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/station/StationCard.tsx
git commit -m "feat(web): add Past Shows collapsible section to StationCard"
```

---

### Task 7: Final gate

- [ ] **Step 1: Run full API test suite**

```bash
cd apps/api && npx vitest run
```

Expected: all pass

- [ ] **Step 2: Typecheck all packages**

```bash
npx turbo typecheck lint --filter=web --filter=@ownradio/shared --filter=@ownradio/api
```

Expected: 0 errors

- [ ] **Step 3: Push**

```bash
git push origin main
```
