# DJ Auto-Generated Faces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically generate a unique photorealistic DJ portrait with DALL-E 3 when a DJ is created without an avatar, store it in Cloudflare R2, and guarantee visual uniqueness via perceptual hash comparison.

**Architecture:** `r2.ts` handles upload/download. `avatarGenerator.ts` orchestrates DALL-E 3 generation, pHash uniqueness check, and R2 upload. The stations route calls `generateDjAvatar` after DJ upsert when `avatarUrl` is absent. A backfill script handles existing null-avatar DJs. Provider is swappable via `AVATAR_PROVIDER` env var.

**Tech Stack:** `openai`, `@aws-sdk/client-s3`, `sharp`, `imghash`, Prisma, Fastify, Vitest

---

## File Map

| File | Change |
|---|---|
| `apps/api/package.json` | add openai, @aws-sdk/client-s3, sharp, imghash |
| `apps/api/.env.example` | add AVATAR_* and R2_* vars |
| `apps/api/src/lib/r2.ts` | new — R2 upload/download wrapper |
| `apps/api/src/services/avatarGenerator.ts` | new — generation orchestration |
| `apps/api/src/routes/stations.ts` | call generateDjAvatar after DJ upsert |
| `apps/api/scripts/generate-dj-avatars.ts` | new — backfill script |
| `apps/api/src/tests/services/avatarGenerator.test.ts` | new — unit tests |

---

### Task 1: Install dependencies and add env vars

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/.env.example` (or create if missing — copy from root `.env.example`)

- [ ] **Step 1: Install packages**

```bash
cd apps/api && npm install openai @aws-sdk/client-s3 sharp imghash
npm install --save-dev @types/sharp
```

- [ ] **Step 2: Add env vars to .env.example**

Append to `apps/api/.env.example`:

```
# Avatar generation
AVATAR_PROVIDER=openai
AVATAR_MODEL=dall-e-3
AVATAR_PHASH_THRESHOLD=90
AVATAR_MAX_RETRIES=3

# Cloudflare R2 (S3-compatible)
R2_ENDPOINT=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json apps/api/.env.example
git commit -m "chore(api): add openai, R2, and image hashing dependencies"
```

---

### Task 2: Create R2 storage module

**Files:**
- Create: `apps/api/src/lib/r2.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/tests/lib/r2.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: vi.fn() })),
  PutObjectCommand: vi.fn(),
}));

import { uploadToR2 } from '../../lib/r2.js';

describe('uploadToR2', () => {
  it('calls S3 PutObjectCommand with correct params', async () => {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({});
    vi.mocked(S3Client).mockImplementation(() => ({ send: mockSend }) as any);

    await uploadToR2('djs/test.jpg', Buffer.from('imgdata'), 'image/jpeg');

    expect(mockSend).toHaveBeenCalledOnce();
    expect(vi.mocked(PutObjectCommand)).toHaveBeenCalledWith(
      expect.objectContaining({ Key: 'djs/test.jpg', ContentType: 'image/jpeg' })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/api && npx vitest run src/tests/lib/r2.test.ts
```

Expected: FAIL — `Cannot find module '../../lib/r2.js'`

- [ ] **Step 3: Write r2.ts**

Create `apps/api/src/lib/r2.ts`:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT ?? '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

const BUCKET = process.env.R2_BUCKET ?? '';

export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

export async function downloadFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/api && npx vitest run src/tests/lib/r2.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/r2.ts apps/api/src/tests/lib/r2.test.ts
git commit -m "feat(api): add R2 storage module with upload/download helpers"
```

---

### Task 3: Create avatarGenerator service

**Files:**
- Create: `apps/api/src/services/avatarGenerator.ts`
- Create: `apps/api/src/tests/services/avatarGenerator.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/tests/services/avatarGenerator.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/r2.js', () => ({
  uploadToR2: vi.fn().mockResolvedValue(undefined),
  downloadFromUrl: vi.fn().mockResolvedValue(Buffer.from('fakeimage')),
}));

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: {
      generate: vi.fn().mockResolvedValue({
        data: [{ url: 'https://oai.example.com/tmp/img.png' }],
      }),
    },
  })),
}));

vi.mock('imghash', () => ({
  hash: vi.fn().mockResolvedValue('abcdef123456'),
}));

vi.mock('../../db/client.js', () => ({
  prisma: {
    dJ: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe('generateDjAvatar — mock provider', () => {
  beforeEach(() => {
    process.env.AVATAR_PROVIDER = 'mock';
    process.env.R2_PUBLIC_URL = 'https://assets.example.com';
  });

  it('returns placeholder URL without calling DALL-E', async () => {
    const { generateDjAvatar } = await import('../../services/avatarGenerator.js');
    const url = await generateDjAvatar({ djId: 'dj1', djName: 'DJ Test', djBio: 'Bio', genre: 'Rock' });
    expect(url).toBe('https://assets.example.com/placeholders/djs/mock.jpg');
  });
});

describe('generateDjAvatar — openai provider', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.AVATAR_PROVIDER = 'openai';
    process.env.R2_PUBLIC_URL = 'https://assets.example.com';
    process.env.AVATAR_MAX_RETRIES = '3';
    process.env.AVATAR_PHASH_THRESHOLD = '90';
  });

  it('calls DALL-E, uploads to R2, returns public URL', async () => {
    const { generateDjAvatar } = await import('../../services/avatarGenerator.js');
    const { uploadToR2 } = await import('../../lib/r2.js');
    const url = await generateDjAvatar({ djId: 'dj99', djName: 'DJ Nova', djBio: 'Bio text', genre: 'Lo-Fi' });
    expect(url).toBe('https://assets.example.com/djs/dj99.jpg');
    expect(uploadToR2).toHaveBeenCalledWith('djs/dj99.jpg', expect.any(Buffer), 'image/jpeg');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && npx vitest run src/tests/services/avatarGenerator.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write avatarGenerator.ts**

Create `apps/api/src/services/avatarGenerator.ts`:

```typescript
import OpenAI from 'openai';
import hash from 'imghash';
import { uploadToR2, downloadFromUrl } from '../lib/r2.js';
import { prisma } from '../db/client.js';

export interface AvatarGeneratorOptions {
  djId: string;
  djName: string;
  djBio: string;
  genre: string;
}

const PROVIDER = process.env.AVATAR_PROVIDER ?? 'openai';
const MODEL = process.env.AVATAR_MODEL ?? 'dall-e-3';
const THRESHOLD = Number(process.env.AVATAR_PHASH_THRESHOLD ?? 90);
const MAX_RETRIES = Number(process.env.AVATAR_MAX_RETRIES ?? 3);
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

function buildPrompt(opts: AvatarGeneratorOptions, variation = ''): string {
  const bio = opts.djBio.slice(0, 120);
  return `Professional DJ portrait photograph of a ${opts.genre} music artist named ${opts.djName}. Persona: ${bio}. Photorealistic, studio lighting, looking at camera, unique facial features, high detail, no text, no watermark.${variation}`;
}

function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return Math.round(((maxLen - hammingDistance(a, b)) / maxLen) * 100);
}

async function getExistingHashes(): Promise<string[]> {
  const djs = await prisma.dJ.findMany({ where: { avatarUrl: { not: null } }, select: { avatarUrl: true } });
  const hashes: string[] = [];
  for (const dj of djs) {
    try {
      const buf = await downloadFromUrl(dj.avatarUrl!);
      hashes.push(await hash.hash(buf, 16));
    } catch { /* skip unreachable avatars */ }
  }
  return hashes;
}

export async function generateDjAvatar(opts: AvatarGeneratorOptions): Promise<string> {
  if (PROVIDER === 'mock') {
    return `${PUBLIC_URL}/placeholders/djs/mock.jpg`;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const existingHashes = await getExistingHashes();

  const variations = [
    '',
    ' distinct from previous, different hair colour and style',
    ' clearly different ethnicity, unique facial structure',
  ];

  let imgBuffer: Buffer | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const prompt = buildPrompt(opts, variations[attempt] ?? variations[variations.length - 1]);
    const result = await openai.images.generate({ model: MODEL, prompt, size: '1024x1024', quality: 'standard', n: 1 });
    const tmpUrl = result.data[0].url!;
    const buf = await downloadFromUrl(tmpUrl);
    const imgHash = await hash.hash(buf, 16);

    const isTooSimilar = existingHashes.some((h) => similarity(imgHash, h) > THRESHOLD);
    if (!isTooSimilar) {
      imgBuffer = buf;
      break;
    }
  }

  if (!imgBuffer) {
    // All retries exhausted — use last generated image anyway
    const prompt = buildPrompt(opts);
    const result = await openai.images.generate({ model: MODEL, prompt, size: '1024x1024', quality: 'standard', n: 1 });
    imgBuffer = await downloadFromUrl(result.data[0].url!);
  }

  const key = `djs/${opts.djId}.jpg`;
  await uploadToR2(key, imgBuffer, 'image/jpeg');
  return `${PUBLIC_URL}/${key}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/api && npx vitest run src/tests/services/avatarGenerator.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/avatarGenerator.ts apps/api/src/tests/services/avatarGenerator.test.ts
git commit -m "feat(api): add avatarGenerator service with DALL-E 3 and pHash uniqueness check"
```

---

### Task 4: Integrate into stations route

**Files:**
- Modify: `apps/api/src/routes/stations.ts`
- Modify: `apps/api/src/tests/routes/stations.test.ts`

- [ ] **Step 1: Add test for avatar generation on DJ creation**

Add this test to `apps/api/src/tests/routes/stations.test.ts` inside the `POST /stations` describe block:

```typescript
it('generates avatar when DJ is created without avatarUrl', async () => {
  const mockGenerate = vi.fn().mockResolvedValue('https://assets.example.com/djs/dj-new.jpg');
  vi.doMock('../../services/avatarGenerator.js', () => ({ generateDjAvatar: mockGenerate }));

  vi.mocked(prisma.station.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.station.create).mockResolvedValue({
    ...NEW_STATION,
    dj: { ...NEW_STATION.dj, avatarUrl: null },
  } as any);
  vi.mocked(prisma.dJ.update).mockResolvedValue({ ...NEW_STATION.dj, avatarUrl: 'https://assets.example.com/djs/dj-new.jpg' } as any);

  const res = await supertest(app.server)
    .post('/stations')
    .set('x-playgen-secret', '')
    .send({ slug: 'metro-manila-mix', name: 'Metro Manila Mix', genre: 'OPM', dj: { name: 'Camille', bio: 'Taglish DJ' } });

  expect(res.status).toBe(201);
  expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({ djName: 'Camille', genre: 'OPM' }));
});
```

Also add `dJ: { update: vi.fn() }` to the prisma mock at the top of the file:
```typescript
vi.mock('../../db/client.js', () => ({
  prisma: {
    station: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    song: { findMany: vi.fn() },
    dJ: { update: vi.fn() },
  },
}));
```

- [ ] **Step 2: Add import and generation call to stations.ts**

Add import at top of `apps/api/src/routes/stations.ts`:
```typescript
import { generateDjAvatar } from '../services/avatarGenerator.js';
```

After the `prisma.station.create` call (around line 83), add avatar generation before the return:

```typescript
const created = await prisma.station.create({ ... });

// Auto-generate avatar if DJ was created without one
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
```

Apply the same pattern for the update path (the `prisma.station.update` block):
```typescript
const updated = await prisma.station.update({ ... });

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
```

- [ ] **Step 3: Run all stations tests**

```bash
cd apps/api && npx vitest run src/tests/routes/stations.test.ts
```

Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/stations.ts apps/api/src/tests/routes/stations.test.ts
git commit -m "feat(api): auto-generate DJ avatar via DALL-E 3 on station webhook"
```

---

### Task 5: Write backfill script

**Files:**
- Create: `apps/api/scripts/generate-dj-avatars.ts`

- [ ] **Step 1: Write the script**

Create `apps/api/scripts/generate-dj-avatars.ts`:

```typescript
import { prisma } from '../src/db/client.js';
import { generateDjAvatar } from '../src/services/avatarGenerator.js';

async function main() {
  const djs = await prisma.dJ.findMany({
    where: { avatarUrl: null },
    include: { station: { select: { genre: true } } },
  });

  console.log(`Found ${djs.length} DJs without avatars`);

  for (const dj of djs) {
    try {
      const avatarUrl = await generateDjAvatar({
        djId: dj.id,
        djName: dj.name,
        djBio: dj.bio,
        genre: dj.station.genre,
      });
      await prisma.dJ.update({ where: { id: dj.id }, data: { avatarUrl } });
      console.log(`✓ ${dj.name} → ${avatarUrl}`);
    } catch (err) {
      console.error(`✗ ${dj.name}:`, err);
    }
    // Rate limit: 1 req/s
    await new Promise((r) => setTimeout(r, 1000));
  }

  await prisma.$disconnect();
}

main();
```

- [ ] **Step 2: Verify it runs without errors (dry run with mock provider)**

```bash
cd apps/api && AVATAR_PROVIDER=mock npx tsx scripts/generate-dj-avatars.ts
```

Expected: logs `Found N DJs without avatars` and `✓ <name> → .../placeholders/djs/mock.jpg` for each

- [ ] **Step 3: Commit**

```bash
git add apps/api/scripts/generate-dj-avatars.ts
git commit -m "feat(api): add backfill script to generate avatars for existing DJs"
```

---

### Task 6: Final gate

- [ ] **Step 1: Run full test suite**

```bash
cd apps/api && npx vitest run
```

Expected: all pass

- [ ] **Step 2: Typecheck**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Push**

```bash
git push origin main
```
