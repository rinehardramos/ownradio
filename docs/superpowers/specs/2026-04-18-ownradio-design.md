# OwnRadio — Design Specification

## Overview

OwnRadio is a multi-station listener-facing web platform that wraps external audio streams (Icecast/Shoutcast) with a social, interactive experience. It brings the nostalgic feel of traditional radio into a modern mobile-first interface, letting listeners react, chat, discover stations, and feel part of a live crowd.

## Goals

- Listeners feel recognized and engaged — not passive consumers
- Community-driven, safe space for music fans
- Lightweight, mobile-first, low barrier to entry
- Nostalgia of traditional radio with modern interactivity

## Non-Goals (MVP)

- Contests/promos (deferred to post-MVP)
- Admin/DJ dashboard UI (API-driven management only)
- Audio hosting or streaming infrastructure (DJs use external tools)
- Native mobile apps (future — architect for it)

---

## Architecture

### System Diagram

```
┌─────────────┐     ┌──────────────────────┐     ┌────────────────┐
│  Next.js    │────▶│  Fastify API Server  │────▶│  PostgreSQL    │
│  Frontend   │     │  (REST + WebSocket)  │     │  (Neon)        │
│  (Vercel)   │◀────│  (Railway/Render)    │     └────────────────┘
└─────┬───────┘     └──────────┬───────────┘
      │                        │
      │  Audio stream          │  Polls metadata
      ▼                        ▼
┌─────────────┐     ┌──────────────────────┐
│  Browser    │     │  Icecast/Shoutcast   │
│  <audio>    │────▶│  Stream Server       │
│  element    │     │  (DJ-managed)        │
└─────────────┘     └──────────────────────┘
```

### Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js (React), Tailwind CSS | Vercel (free tier) |
| Backend | Fastify + Socket.io (TypeScript) | Railway/Render (free tier) |
| Database | PostgreSQL | Neon (free tier) |
| Monorepo | Turborepo | — |
| Shared types | TypeScript package | — |
| Local dev | Docker Compose | — |
| CI/CD | GitHub Actions | — |
| Tests | Playwright (E2E), Vitest (unit/integration) | — |

### Monorepo Structure

```
ownradio/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend + WebSocket
├── packages/
│   └── shared/       # Shared TypeScript types, constants
├── docker-compose.yml
├── turbo.json
└── .github/workflows/
```

### Key Architectural Decisions

1. **Audio flows directly from stream to browser** — our backend never touches audio data. The `<audio>` element connects to the DJ's stream URL.
2. **Backend polls stream metadata** — Fastify polls the Icecast/Shoutcast status endpoint every 5s, extracts now-playing info, broadcasts to listeners via WebSocket.
3. **Socket.io for real-time** — handles chat, reactions, now-playing updates, and live listener count. Sufficient for <100 concurrent listeners per station.
4. **Anonymous + optional auth** — anyone can listen and react; login required for chat and leaderboard tracking.

---

## Data Model

### Station

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(100) | |
| slug | VARCHAR(100) | URL-friendly, unique |
| description | TEXT | |
| stream_url | VARCHAR(500) | Icecast/Shoutcast endpoint |
| metadata_url | VARCHAR(500) | For polling now-playing |
| genre | VARCHAR(50) | |
| artwork_url | VARCHAR(500) | |
| is_live | BOOLEAN | Updated by metadata poller |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### DJ

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| station_id | UUID | FK → Station |
| name | VARCHAR(100) | |
| bio | TEXT | |
| avatar_url | VARCHAR(500) | |
| created_at | TIMESTAMP | |

### Listener

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| username | VARCHAR(50) | Unique |
| email | VARCHAR(255) | Hashed, unique |
| password_hash | VARCHAR(255) | bcrypt |
| avatar_url | VARCHAR(500) | |
| google_id | VARCHAR(255) | For OAuth, nullable |
| created_at | TIMESTAMP | |

### Song

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| station_id | UUID | FK → Station |
| title | VARCHAR(200) | |
| artist | VARCHAR(200) | |
| album_cover_url | VARCHAR(500) | Nullable |
| played_at | TIMESTAMP | |
| duration | INTEGER | Seconds, nullable |

### Reaction

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| song_id | UUID | FK → Song |
| station_id | UUID | FK → Station |
| listener_id | UUID | FK → Listener, nullable (anonymous) |
| type | ENUM | heart, rock, party, broken_heart |
| created_at | TIMESTAMP | |

Index on `(station_id, song_id)` for aggregation queries.

### ChatMessage

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| station_id | UUID | FK → Station |
| listener_id | UUID | FK → Listener, nullable |
| display_name | VARCHAR(50) | For anonymous users |
| content | VARCHAR(280) | Max 280 chars |
| created_at | TIMESTAMP | |

Cleanup: cron job deletes messages older than 24h per station.

### Derived Views (queries, not tables)

- **Top Listeners**: aggregate reactions + chat count per station, ranked
- **Top Ten Songs**: aggregate reactions per song per station, ranked
- **DJ Playlist**: recent songs from Song table, ordered by played_at

---

## Frontend Pages & Components

### Landing Page (`/`)

**Sections (top to bottom):**

1. **Hero** — OwnRadio branding, tagline ("Your Station. Your Vibe. Your Crowd."), animated radio icon, platform stats (stations, listeners, DJs)
2. **Featured Stations** — horizontal scrollable cards showing live stations with genre tag, DJ name, now-playing song, listener count, live badge
3. **Top DJs** — horizontal scrollable avatar bubbles with online indicator and listener count
4. **Trending Now** — ranked list of most-reacted songs across all stations
5. **Login Section** — "Join the crowd" prompt with:
   - Google OAuth button (redirects to Google, returns signed in)
   - Email button (navigates to `/login` page)
   - "Continue as guest" link
6. **Welcome Section** (replaces login when signed in) — confirmation message

### Login Page (`/login`)

Full-screen overlay with:
- Back button to landing
- Email + password fields
- Sign In button
- "Don't have an account? Sign up" link

### Station Page (`/station/[slug]`)

**Card-based carousel UI** (inspired by dating app swipe patterns):

- **Swipe left/right** to navigate between stations (carousel, cards slide in/out)
- **Tap left/right edges** for navigation (chevron indicators)
- **Scroll up/down** within a station card for content
- **Dots indicator** at top showing current station position

**Per-station card layout (top to bottom):**

1. **Hero** — gradient background per genre, album art icon, station name badge, genre chip, live badge
2. **Now Playing** — song title + artist, centered
3. **Audio Controls** — volume down button, volume slider, volume up button, play/pause button (pink circular, prominent)
4. **Reaction Bar** — 4 buttons in a row:
   - Rock — sentiment: energetic
   - Heart — sentiment: love
   - Broken Heart — sentiment: sad
   - Party — sentiment: hype
   - Each shows live count, highlights when active, throttled to 1 per type per song for anonymous users
5. **Live Chat** — scrollable message list, input field + send button. Login required to send (prompt shown for guests).
6. **DJ Section** — compact horizontal layout:
   - Left: DJ avatar (tap to open bio modal) + name + live listener count
   - Right: pill buttons — Playlist, Top 10, Fans

**DJ Bio Modal** — bottom-sheet overlay triggered by avatar tap:
- DJ name, bio text, genre tags
- Close button

**Navigation behavior:**
- Swiping/tapping to a new station auto-plays it
- Previous station auto-pauses
- Only one station plays at a time

### Authentication States

| Feature | Guest | Signed In |
|---------|-------|-----------|
| Listen to stream | Yes | Yes |
| See reactions/counts | Yes | Yes |
| React to songs | Yes (throttled) | Yes |
| View chat messages | Yes | Yes |
| Send chat messages | No (prompt shown) | Yes |
| Appear on leaderboard | No | Yes |
| Top Listeners tracking | No | Yes |

---

## API Endpoints

### REST (Fastify)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /stations | No | List all stations (with is_live, listener_count) |
| GET | /stations/:slug | No | Station detail + DJ info |
| GET | /stations/:slug/songs | No | Recent songs (DJ playlist) |
| GET | /stations/:slug/top-songs | No | Top 10 songs by reactions |
| GET | /stations/:slug/top-listeners | No | Top listeners by activity |
| POST | /auth/register | No | Email registration |
| POST | /auth/login | No | Email login, returns JWT |
| GET | /auth/google | No | Initiates Google OAuth |
| GET | /auth/google/callback | No | Google OAuth callback |
| GET | /me | Yes | Current user profile |

### WebSocket Events (Socket.io)

**Client → Server:**

| Event | Payload | Auth Required |
|-------|---------|--------------|
| join_station | { station_slug } | No |
| leave_station | { station_slug } | No |
| reaction | { song_id, type } | No |
| chat_message | { content } | Yes |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| now_playing | { title, artist, album_cover_url } | Song change |
| reaction_update | { song_id, counts } | Aggregated reaction counts |
| new_message | { display_name, content, created_at } | Chat message |
| listener_count | { count } | Live listener count update |
| station_status | { is_live } | Station online/offline |

---

## Authentication

- **Google OAuth 2.0** — primary login method, via Passport.js google strategy
- **Email/password** — bcrypt hashing, JWT tokens (access + refresh)
- **JWT storage** — httpOnly cookies (not localStorage)
- **Anonymous sessions** — tracked by socket connection ID for reaction throttling

---

## Real-Time Architecture

```
Listener A ──┐
Listener B ──┤──▶ Socket.io Server ──▶ Room: station:{slug}
Listener C ──┘         │
                       ├── Metadata Poller (5s interval per live station)
                       ├── Reaction Aggregator (debounced broadcast)
                       └── Listener Counter (presence tracking)
```

- Each station is a Socket.io room
- Reactions are debounced (aggregate counts broadcast every 500ms, not per-click)
- Listener count derived from room size
- Metadata poller runs per-station, only for live stations

---

## Styling

- **Theme**: dark background (#2d2d3f / #1a1a2e) with magenta/pink accents (#ff2d78)
- **Framework**: Tailwind CSS
- **Approach**: mobile-first, responsive
- **Typography**: system font stack
- **Interactions**: subtle scale animations on tap, smooth slide transitions between stations

---

## Testing Strategy

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Utility functions, data transformations, API handlers |
| Integration | Vitest + Supertest | API endpoints with test database |
| E2E | Playwright | Full user flows (mobile Chrome emulation) |
| Security | OWASP ZAP / manual | XSS, injection, auth bypass |

### Key E2E Scenarios

1. Landing page load and navigation
2. Google OAuth sign-in flow
3. Email sign-in flow
4. Station discovery and selection
5. Audio playback controls
6. Reaction toggle and count updates
7. Chat send (logged in) and prompt (guest)
8. Station carousel navigation (swipe + edge tap)
9. DJ bio modal open/close
10. Auth state transitions (guest / signed in)

---

## Docker (Local Development)

```yaml
# docker-compose.yml
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [api]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000

  api:
    build: ./apps/api
    ports: ["4000:4000"]
    depends_on: [db]
    environment:
      - DATABASE_URL=${DATABASE_URL}  # Set in .env
      - JWT_SECRET=${JWT_SECRET}      # Set in .env

  db:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

All sensitive values are read from `.env` (not committed). See `.env.example` for required variables.

---

## CI/CD (GitHub Actions)

```
on push/PR:
  1. Install dependencies (Turborepo cached)
  2. Lint (ESLint)
  3. Type check (tsc)
  4. Unit + integration tests (Vitest)
  5. E2E tests (Playwright, against Docker Compose)
  6. Security scan (npm audit)

on merge to main:
  7. Deploy web → Vercel (automatic)
  8. Deploy api → Railway/Render
```

---

## Future Considerations

- **React Native app** — shares API, add as `apps/mobile` in monorepo
- **Contests/promos** — new DB tables + API endpoints + UI section
- **Sentiment analysis** — aggregate reaction types over time per station/song
- **DJ dashboard** — separate Next.js app or admin route group
- **Scaling** — swap Socket.io for Ably/Pusher if >100 concurrent
- **Live performances** — WebRTC integration for DJ browser streaming
- **Song requests** — private message queue to DJ
