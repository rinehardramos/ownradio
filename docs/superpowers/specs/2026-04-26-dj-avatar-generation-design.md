# DJ Auto-Generated Faces Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically generate a unique, photorealistic DJ portrait using DALL-E 3 whenever a DJ is created without an avatar. Generated images are stored in Cloudflare R2 and are guaranteed to be visually distinct from existing DJ avatars via perceptual hash comparison.

**Architecture:** A thin `AvatarGenerator` service module lives in the API. It is called inside the station upsert route after a DJ row is created/updated with no `avatarUrl`. Generation is async but awaited before the webhook response returns so the caller gets the final avatar URL immediately. A one-time backfill script handles existing nulls.

**Tech Stack:** `openai` SDK, `@aws-sdk/client-s3` (R2 is S3-compatible), `sharp` + `imghash` for pHash, Prisma, Fastify

---

## Configuration (env vars)

| Var | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | required | Already set |
| `AVATAR_PROVIDER` | `openai` | `openai` or `mock` (returns placeholder URL) |
| `AVATAR_MODEL` | `dall-e-3` | DALL-E model name |
| `AVATAR_PHASH_THRESHOLD` | `90` | Similarity % above which images are considered too similar |
| `AVATAR_MAX_RETRIES` | `3` | Max regeneration attempts before accepting the closest unique result |
| `R2_ENDPOINT` | required | Cloudflare R2 S3-compatible endpoint for your account |
| `R2_BUCKET` | required | Bucket name |
| `R2_ACCESS_KEY_ID` | required | R2 access key |
| `R2_SECRET_ACCESS_KEY` | required | R2 secret key |
| `R2_PUBLIC_URL` | required | Public CDN base URL for R2 assets (no trailing slash) |

## AvatarGenerator Service

**Location:** `apps/api/src/services/avatarGenerator.ts`

### Interface

```typescript
interface AvatarGeneratorOptions {
  djId: string;
  djName: string;
  djBio: string;
  genre: string;
}

// Returns public R2 URL of generated image
async function generateDjAvatar(opts: AvatarGeneratorOptions): Promise<string>
```

### Generation flow

1. Build prompt from DJ metadata:
   ```
   "Professional DJ portrait photograph of a {genre} music artist named {djName}.
   Persona: {djBio first 120 chars}. Photorealistic, studio lighting, looking at camera,
   unique facial features, high detail, no text, no watermark."
   ```
2. Call DALL-E 3 (`size: "1024x1024"`, `quality: "standard"`, `n: 1`)
3. Download the temporary DALL-E URL to an in-memory buffer
4. Compute pHash of the generated image using `imghash`
5. Fetch pHashes of all existing DJ avatars from DB (`dj.avatarUrl` where not null)
   — download each, compute pHash, cache result in memory for the request lifetime
6. If similarity with any existing avatar exceeds `AVATAR_PHASH_THRESHOLD`: append variation hint to prompt (`"distinct from previous, different hair, different skin tone"`) and regenerate. Repeat up to `AVATAR_MAX_RETRIES` times.
7. Upload final buffer to R2 at key `djs/{djId}.jpg` (content-type `image/jpeg`)
8. Return `${R2_PUBLIC_URL}/djs/{djId}.jpg`

### Mock provider

When `AVATAR_PROVIDER=mock`, skip generation and return `${R2_PUBLIC_URL}/placeholders/djs/mock.jpg`. Used in tests and local dev without an OpenAI key.

## API Integration

**File:** `apps/api/src/routes/stations.ts`

After the DJ upsert, if `dj.avatarUrl` is null or was not provided in the webhook payload:

```typescript
const avatarUrl = await generateDjAvatar({
  djId: dj.id,
  djName: dj.name,
  djBio: dj.bio,
  genre: station.genre,
});
await prisma.dJ.update({ where: { id: dj.id }, data: { avatarUrl } });
```

Generation errors are caught and logged — a failure does not fail the webhook response (DJ is created without avatar; generation can be retried via backfill).

## R2 Storage Module

**Location:** `apps/api/src/lib/r2.ts`

Thin wrapper around `@aws-sdk/client-s3`:

```typescript
export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void>
export async function downloadFromUrl(url: string): Promise<Buffer>
```

## Backfill Script

**Location:** `apps/api/scripts/generate-dj-avatars.ts`

Run with `npx tsx scripts/generate-dj-avatars.ts`.

- Queries all DJs where `avatarUrl IS NULL`
- Calls `generateDjAvatar` for each, sequentially (rate limit: 1 req/s)
- Updates `dj.avatarUrl` in DB on success
- Logs failures without stopping — re-runnable

## Data Model Changes

None. `DJ.avatarUrl` already exists as `String?`. No migration needed.

## Testing

- Unit test `avatarGenerator.ts` with `AVATAR_PROVIDER=mock` — verifies prompt construction, R2 upload call, DB update
- Unit test pHash uniqueness logic with two identical images (should retry) and two different images (should pass)
- Integration test: POST `/stations` with DJ, no avatarUrl — response includes `dj.avatarUrl` set to R2 URL (mock provider)
