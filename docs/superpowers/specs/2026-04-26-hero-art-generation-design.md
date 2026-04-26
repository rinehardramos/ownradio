# Hero Block AI Art Generation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically generate abstract artwork that visually interprets each station's current playlist and genre, storing it as the station's `artworkUrl` in R2. The hero carousel (`HeroCoverFlow`) updates in real-time via WebSocket when new art is ready.

**Architecture:** An `ArtworkGenerator` service runs inside the existing metadata polling loop. It tracks the last 5 songs per station and triggers a DALL-E 3 generation when the song fingerprint changes, subject to a configurable rate limit. The generated image is uploaded to R2, the DB is updated, and a new `artwork_update` Socket.IO event notifies connected clients.

**Tech Stack:** `openai` SDK, `@aws-sdk/client-s3` (R2), Prisma, Socket.IO, React

---

## Configuration (env vars)

| Var | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | required | Already set |
| `ARTWORK_PROVIDER` | `openai` | `openai` or `mock` |
| `ARTWORK_MODEL` | `dall-e-3` | DALL-E model name |
| `ARTWORK_REGEN_INTERVAL_MS` | `1800000` | Min ms between regenerations per station (default 30 min) |
| `ARTWORK_PROMPT_TEMPLATE` | see below | Handlebars-style template; override via env for custom style |
| `R2_ENDPOINT` | required | Shared with DJ avatar feature |
| `R2_BUCKET` | required | Shared |
| `R2_ACCESS_KEY_ID` | required | Shared |
| `R2_SECRET_ACCESS_KEY` | required | Shared |
| `R2_PUBLIC_URL` | required | Shared |

### Default prompt template

```
Album cover art for a {{genre}} radio station. Current playlist: {{songList}}.
Abstract, vibrant, cinematic composition. No text, no words, no letters, no watermarks.
Mood: {{mood}}.
```

`{{songList}}` = last 5 song titles joined by ` · `  
`{{mood}}` = inferred from genre mapping (e.g., rock→"energetic", lo-fi→"mellow, nostalgic")  
Template is rendered server-side before sending to DALL-E.

## ArtworkGenerator Service

**Location:** `apps/api/src/services/artworkGenerator.ts`

### State (in-memory per API process)

```typescript
// stationId → { lastSongFingerprint: string; lastGeneratedAt: number }
const generationState = new Map<string, GenerationState>();
```

### Trigger logic (called from metadata polling after each new song is stored)

```typescript
async function maybeRegenerateArtwork(stationId: string, recentSongs: Song[]): Promise<void>
```

1. Compute fingerprint: SHA-256 of last 5 `"artist - title"` strings joined
2. Load state for station — if fingerprint unchanged AND last generation was < `ARTWORK_REGEN_INTERVAL_MS` ago → skip
3. If `station.artworkUrl` is null → always generate regardless of interval
4. Call `generateArtwork(station, recentSongs)`
5. Update in-memory state

### Generation flow

```typescript
async function generateArtwork(station: Station, songs: Song[]): Promise<void>
```

1. Render prompt template with station genre, song list, mood
2. Call DALL-E 3 (`size: "1792x1024"`, `quality: "standard"`, `n: 1`) — landscape for hero use
3. Download image buffer from temporary DALL-E URL
4. Upload to R2 at key `stations/{stationId}/artwork.jpg` (overwrites previous)
5. Update `station.artworkUrl` in DB to `${R2_PUBLIC_URL}/stations/{stationId}/artwork.jpg`
6. Emit `artwork_update` Socket.IO event to all clients in the station's room:
   ```typescript
   io.to(`station:${station.slug}`).emit('artwork_update', {
     stationSlug: station.slug,
     artworkUrl: newUrl,
   });
   ```
7. On error: log and return — do not crash the polling loop

### Mock provider

When `ARTWORK_PROVIDER=mock`, skip generation and emit the event with a static placeholder URL. No DALL-E or R2 calls.

## Metadata Polling Integration

**File:** `apps/api/src/services/metadataPoller.ts`

After a new song is written to DB (the existing dedup guard passes), append:

```typescript
await maybeRegenerateArtwork(station.id, recentSongs);
```

`recentSongs` = last 5 songs for the station, already available from the song history query.

## WebSocket Event (shared types)

**File:** `packages/shared/src/events.ts` (or wherever socket event types live)

```typescript
export interface ArtworkUpdatePayload {
  stationSlug: string;
  artworkUrl: string;
}
```

## Frontend

### `useStation` hook

Add handler for the new `artwork_update` event:

```typescript
socket.on('artwork_update', (data: ArtworkUpdatePayload) => {
  if (data.stationSlug === station.slug) {
    setArtworkUrl(data.artworkUrl);
  }
});
```

Return `artworkUrl` from the hook. Components that currently read `station.artworkUrl` from the prop should prefer the hook's live value when available.

### `HeroCoverFlow` and `HeroStation`

Both already read `station.artworkUrl`. Pass the live `artworkUrl` from the hook (or keep reading from prop if the hook value is null). No structural changes needed — the image `src` update triggers a natural React re-render.

## R2 Module

Shared with DJ avatar feature — same `apps/api/src/lib/r2.ts` module (`uploadToR2`, `downloadFromUrl`).

## Testing

- Unit test prompt template rendering with various genres and song lists
- Unit test fingerprint change detection — same songs → skip, new song → regenerate
- Unit test rate limiting — two calls within interval → second is skipped
- Integration test: trigger polling with new song → mock provider emits `artwork_update` event → station `artworkUrl` updated in DB
- Integration test: `ARTWORK_PROVIDER=mock` skips DALL-E and R2, still emits event
