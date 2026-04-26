# Past History Stream List Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to browse and replay up to N past recorded programs per station and per DJ, surfaced in both station view and DJ view.

**Architecture:** A new `Program` Prisma model stores recording metadata provided by PlayGen via webhook. Two read endpoints expose programs scoped to a station or DJ. A shared `PastShowsList` React component renders the list in both contexts, reusing the existing `AudioControls` player for playback.

**Tech Stack:** Prisma, Fastify, React, existing `AudioControls`

---

## Configuration (env vars)

| Var | Default | Description |
|---|---|---|
| `PROGRAM_HISTORY_LIMIT` | `5` | Max programs returned per station or DJ |
| `PLAYGEN_WEBHOOK_SECRET` | required | Already set — reused for program webhook auth |

## Data Model

**New migration:** `apps/api/prisma/migrations/YYYYMMDD_add_programs/`

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

  @@map("programs")
}
```

`Station` model gets `programs Program[]` relation.

## Shared Types (`packages/shared`)

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

## API Endpoints

### Webhook — receive a new program recording

```
POST /webhooks/stations/:slug/program
Header: X-PlayGen-Secret: <PLAYGEN_WEBHOOK_SECRET>

Body:
{
  "title": "Late Night Vibes #42",
  "description": "optional",
  "recordedAt": "2026-04-26T02:00:00Z",
  "durationSecs": 3600,
  "playbackUrl": "https://assets.ownradio.net/programs/abc123.mp3",
  "coverArtUrl": "https://assets.ownradio.net/programs/abc123-cover.jpg"  // optional
}

Response: 201 { program: Program }
```

Behaviour: upserts by `(stationId, recordedAt)` to prevent duplicates on retry. Associates `djId` from the station's current DJ at time of receipt.

### Read endpoints

```
GET /stations/:slug/programs
Response: 200 { programs: Program[] }   // max PROGRAM_HISTORY_LIMIT, newest first

GET /djs/:djId/programs
Response: 200 { programs: Program[] }   // max PROGRAM_HISTORY_LIMIT, newest first
```

Both endpoints are public (no auth required — same as `/stations`).

## Frontend

### `PastShowsList` component

**Location:** `apps/web/src/components/station/PastShowsList.tsx`

Props:
```typescript
interface PastShowsListProps {
  programs: Program[];
  onPlay: (program: Program) => void;
  activeProgram: Program | null;
}
```

Renders a vertical list. Each row:
- Cover art thumbnail (40×40, rounded, falls back to a `Music` Lucide icon if null)
- Title + formatted date (`Apr 26`) + duration (`1h 0m`)
- Play/stop button — calls `onPlay(program)` or stops if already active

### Integration in `StationCard`

Add a "Past Shows" collapsible section below the existing controls. When expanded, fetches `/stations/:slug/programs` and renders `PastShowsList`. Clicking play sets the station's `AudioControls` stream URL to `program.playbackUrl` (existing `AudioControls` ref API handles this).

### Integration in DJ modal/view

The existing DJ info panel (shown in `StationCard`) gains a "Past Shows" tab. Fetches `/djs/:djId/programs` and renders the same `PastShowsList` component.

## Playback

No new audio infrastructure. `AudioControls` already supports any URL (HLS `.m3u8` or plain MP3). The parent component updates the `streamUrl` prop when a program is selected; `AudioControls` re-initialises automatically (existing `useEffect([streamUrl])` dep).

## Testing

- Migration applies cleanly on a fresh DB
- `POST /webhooks/stations/:slug/program` — creates program, returns 201; duplicate recordedAt returns 200 with existing record
- `GET /stations/:slug/programs` — returns ≤ `PROGRAM_HISTORY_LIMIT`, ordered newest first
- `GET /djs/:djId/programs` — same
- Unauthenticated reads succeed; webhook without valid secret returns 401
