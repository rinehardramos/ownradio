# OwnRadio — Architecture

## Overview

OwnRadio is a listener-facing multi-station internet radio platform. It wraps audio streams with a real-time social layer (reactions, chat, now-playing) delivered over Socket.io. Audio can come from two sources:

1. **Direct stream (Icecast/Shoutcast)** — legacy/external stations. The browser `<audio>` element connects directly to the station's stream URL. The backend only handles metadata polling.
2. **HLS stream (PlayGen DJ)** — AI-generated shows produced by the PlayGen DJ service. The browser receives a `.m3u8` playlist URL via a Socket.io `stream_control` event and plays it using HLS.js.

---

## System Diagram

```
                        ┌──────────────────────────────────────────────┐
                        │  PlayGen (external)                          │
                        │                                              │
                        │  DJ Service ──► hlsGenerator (ffmpeg)        │
                        │                      │                       │
                        │                      ▼                       │
                        │  nginx gateway ──► /stream/{stationId}/      │
                        │                   playlist.m3u8              │
                        │        │                                     │
                        │  Station Service ──► streamControlNotifier   │
                        └────────┼────────────────────────────────────-┘
                                 │  POST /webhooks/stations/{slug}/stream-control
                                 ▼
┌─────────────┐     ┌──────────────────────┐     ┌────────────────┐
│  Next.js    │────▶│  Fastify API Server  │────▶│  PostgreSQL    │
│  Frontend   │     │  (REST + Socket.io)  │     │  (Neon)        │
│  (Vercel)   │◀────│  (Railway)           │     └────────────────┘
└─────┬───────┘     └──────────┬───────────┘
      │                        │
      │  Audio (HLS or direct) │  Polls Icecast/Shoutcast metadata (5 s)
      ▼                        ▼
┌─────────────┐     ┌──────────────────────┐
│  HLS.js or  │     │  Icecast/Shoutcast   │
│  <audio>    │────▶│  Stream Server       │
│  (browser)  │     │  (DJ-managed)        │
└─────────────┘     └──────────────────────┘
```

---

## PlayGen HLS Streaming Flow

When a PlayGen DJ show is approved and published, the following sequence delivers the HLS stream to OwnRadio listeners with no code change required on the OwnRadio side:

```
1. DJ show approved in PlayGen UI
       │
       ▼
2. PlayGen DJ service: buildProgramManifest() completes
   → manifest JSON written to R2
   → startPlayout(stationId) called → state: generating
       │
       ▼
3. PlayGen DJ service: generateHls(stationId, manifest)
   → ffmpeg downloads R2 audio segments to local cache
   → produces .ts segments + playlist.m3u8 on local disk
   → state: live
       │
       ▼
4. PlayGen DJ service calls notifyStreamUrlChange(slug, streamUrl)
   streamUrl = https://api.playgen.site/stream/{stationId}/playlist.m3u8
       │
       ▼
5. PlayGen Station service: POST /webhooks/stations/{slug}/stream-control
   Body: { action: "url_change", streamUrl: "https://api.playgen.site/stream/..." }
   Header: X-PlayGen-Secret: <shared secret>
       │
       ▼
6. OwnRadio API (webhooks.ts): verifies X-PlayGen-Secret
   → io.to("station:{slug}").emit("stream_control", payload)
       │
       ▼
7. OwnRadio browser: useStation hook receives stream_control event
   → setStreamUrl(payload.streamUrl)
   → setStreamActive(true)
       │
       ▼
8. AudioControls re-initialises HLS.js with new .m3u8 URL
   → browser begins HLS playback
```

**Status:** Fully wired end-to-end as of 2026-04-23. OwnRadio-side (steps 6–8) was already complete. PlayGen-side (steps 1–5) — gateway `/stream/*` route, playout auto-start via `playoutTrigger.ts`, and R2 prefetch — are all now implemented.

---

## Monorepo Structure

```
ownradio/
├── apps/
│   ├── api/                  # Fastify backend
│   │   ├── prisma/           # Schema + seed
│   │   └── src/
│   │       ├── routes/       # REST: /stations, /auth, /webhooks
│   │       ├── ws/           # Socket.io: chat, reactions, metadata poller
│   │       ├── lib/          # JWT helpers
│   │       └── middleware/   # requireAuth
│   └── web/                  # Next.js 15 frontend
│       └── src/
│           ├── app/          # App Router pages
│           ├── components/
│           │   ├── landing/  # Hero, FeaturedStations, TopDJs, TrendingSongs, LoginSection
│           │   └── station/  # StationCarousel, StationCard, AudioControls, ReactionBar, LiveChat, DJSection
│           ├── hooks/        # useAuth, useStation (Socket.io real-time)
│           └── lib/          # api.ts (HTTP client), socket.ts (Socket.io singleton)
├── packages/
│   └── shared/               # Shared TypeScript types (Station, Song, ChatMessage, StreamControlPayload, …)
└── tests/
    ├── nextjs/               # Playwright E2E against Next.js app
    └── *.spec.ts             # Playwright demos against mockup HTML
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS v4, TypeScript |
| Backend | Fastify 5, Socket.io, Prisma 6, PostgreSQL |
| Audio (direct) | Native `<audio>` element → Icecast/Shoutcast URL |
| Audio (HLS) | HLS.js → PlayGen `/stream/{stationId}/playlist.m3u8` |
| Auth | JWT (7-day token), bcrypt |
| Monorepo | Turborepo |
| Tests | Vitest (unit), Playwright (E2E, Pixel 7) |
| Infra | Docker Compose, GitHub Actions CI |

---

## WebSocket Events (Socket.io)

### Client → Server

| Event | Payload | Auth Required |
|---|---|---|
| `join_station` | `{ slug }` | No |
| `leave_station` | `{ slug }` | No |
| `reaction` | `{ songId, stationId, type }` | No |
| `chat_message` | `{ stationId, content }` | Yes |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `now_playing` | `{ title, artist, albumCoverUrl }` | Song change |
| `reaction_update` | `{ songId, counts }` | Aggregated reaction counts |
| `new_message` | `{ displayName, content, createdAt }` | Chat message |
| `listener_count` | `{ count }` | Live listener count |
| `station_status` | `{ isLive }` | Station online/offline |
| `stream_control` | `{ action, streamUrl? }` | PlayGen stream URL change / stop / resume |
| `dj_switch` | `{ djId, name, voiceStyle? }` | Active DJ changed by PlayGen |

---

## Webhook Endpoints

Authenticated by `X-PlayGen-Secret` header matching the `PLAYGEN_WEBHOOK_SECRET` env var. In development, if the env var is unset, auth is skipped.

| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/stations/:slug/stream-control` | Change stream URL, stop, or resume playback |
| POST | `/webhooks/stations/:slug/dj-switch` | Notify listeners that the active DJ has changed |

---

## Real-Time Architecture

```
Listener A ──┐
Listener B ──┤──▶ Socket.io Server ──▶ Room: station:{slug}
Listener C ──┘         │
                       ├── Metadata Poller (5 s interval per live station)
                       ├── Reaction Aggregator (debounced broadcast, 500 ms)
                       ├── Listener Counter (presence tracking)
                       └── Webhook relay (stream_control, dj_switch from PlayGen)
```

---

## Environment Variables

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | api | Neon PostgreSQL connection string |
| `JWT_SECRET` | api | JWT signing secret |
| `CORS_ORIGIN` | api | Allowed origin for CORS (e.g. `https://ownradio.net`) |
| `PLAYGEN_WEBHOOK_SECRET` | api | Shared secret for PlayGen webhook auth |
| `NEXT_PUBLIC_API_URL` | web | Browser-facing API base URL |
| `NEXT_PUBLIC_WS_URL` | web | Browser-facing WebSocket URL |

---

## Known Constraints (HLS Streaming)

- **HLS generation is synchronous per station in PlayGen.** Only one ffmpeg process per station at a time. Concurrent shows on the same station are not supported.
- **PlayGen local disk required.** HLS `.ts` segments live on the PlayGen DJ service container's local filesystem. A container restart loses active streams. A future iteration could write segments directly to R2.
- **R2 download latency.** For a large show, all audio must be fetched from R2 before HLS playback starts. `HLS_MAX_PREFETCH_MB` (default 500 MB) caps the prefetch window.
- **No DVR/time-shift.** Listeners who join mid-stream receive the live window. Past segments are not seekable.
