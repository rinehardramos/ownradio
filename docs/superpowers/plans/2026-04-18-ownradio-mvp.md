# OwnRadio MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-station listener-facing radio platform with real-time chat, reactions, and station carousel navigation.

**Architecture:** Turborepo monorepo with Next.js frontend (Vercel), Fastify + Socket.io backend (Railway/Render), PostgreSQL (Neon). Audio streams directly from external Icecast/Shoutcast to browser `<audio>` element — backend only handles metadata, chat, and reactions.

**Tech Stack:** TypeScript, Next.js 15, Fastify, Socket.io, PostgreSQL, Prisma, Tailwind CSS, Vitest, Playwright, Docker Compose, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-18-ownradio-design.md`

**Environment:** All secrets (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, etc.) are read from `.env` files — never hardcoded. See `.env.example` for required variables.

---

## File Structure

See spec document for full file tree. Key directories:

- `apps/web/` — Next.js frontend
- `apps/api/` — Fastify backend + Socket.io + Prisma
- `packages/shared/` — Shared TypeScript types
- `tests/` — Playwright E2E tests
- `.github/workflows/` — CI pipeline

---

## Phase 1: Monorepo Scaffold (Tasks 1-4)

### Task 1: Initialize Turborepo Monorepo

**Files:** `package.json`, `turbo.json`, `.gitignore`, `.env.example`, `packages/shared/`

- [ ] Initialize git repo
- [ ] Create root `package.json` with workspaces `["apps/*", "packages/*"]`, turbo devDependency, and scripts (dev, build, lint, test, typecheck)
- [ ] Create `turbo.json` with tasks: build (dependsOn ^build), dev (persistent, no cache), lint, test, typecheck
- [ ] Create `.gitignore` (node_modules, .next, dist, .env, .turbo, test-results, .superpowers)
- [ ] Create `.env.example` with placeholder variable names (DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL) — values shown as `changeme` or `your-value-here`
- [ ] Create `packages/shared/package.json` (name: @ownradio/shared, main/types pointing to src/index.ts)
- [ ] Create `packages/shared/tsconfig.json` (ES2022, bundler moduleResolution, strict)
- [ ] Create shared type files — see Step 6 below
- [ ] Run `npm install` and `npx turbo typecheck` — verify passes
- [ ] Commit: `feat: initialize turborepo monorepo with shared types`

**Step 6 detail — shared types:**

`packages/shared/src/station.ts`: Interfaces for Station, DJ, Song, ReactionType (union: "heart"|"rock"|"party"|"broken_heart"), Reaction, ReactionCounts, ChatMessage, StationWithDJ (extends Station with dj, listenerCount, currentSong).

`packages/shared/src/auth.ts`: Interfaces for Listener, LoginRequest, RegisterRequest, AuthResponse.

`packages/shared/src/ws-events.ts`: Typed interfaces for ClientEvents (join_station, leave_station, reaction, chat_message) and ServerEvents (now_playing, reaction_update, new_message, listener_count, station_status, error).

`packages/shared/src/index.ts`: Re-exports all.

---

### Task 2: Scaffold Fastify API App

**Files:** `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/server.ts`, `apps/api/src/db/client.ts`, `apps/api/prisma/schema.prisma`

- [ ] Create `apps/api/package.json` with deps: @ownradio/shared, @prisma/client, fastify, @fastify/cors, @fastify/cookie, socket.io, bcryptjs, jsonwebtoken. DevDeps: prisma, tsx, typescript, vitest, supertest
- [ ] Create `apps/api/tsconfig.json` (ES2022, bundler, strict)
- [ ] Create Prisma schema with all 6 models (Station, DJ, Listener, Song, Reaction, ChatMessage) matching the spec data model. Use `@map` for snake_case table/column names. Add composite index on Reaction(stationId, songId).
- [ ] Create `apps/api/src/db/client.ts` — Prisma client singleton with global caching for dev
- [ ] Create `apps/api/src/server.ts` — Fastify app with CORS (origin from env), cookie plugin, health endpoint at GET /health. Export `buildApp()` for testing. Only call `start()` when not in test env.
- [ ] Run `npm install && cd apps/api && npx prisma generate` — verify types generated
- [ ] Run `npx turbo typecheck` — verify passes
- [ ] Commit: `feat: scaffold fastify api with prisma schema`

---

### Task 3: Scaffold Next.js Frontend App

**Files:** `apps/web/` (scaffolded via create-next-app, then customized)

- [ ] Run `npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`
- [ ] Add `@ownradio/shared` and `socket.io-client` to deps in `apps/web/package.json`
- [ ] Configure Tailwind theme in `tailwind.config.ts` — extend colors with brand-pink (#ff2d78), brand-pink-light (#ff6b9d), brand-pink-bg (#ffe0ec), brand-dark (#1a1a2e), brand-dark-card (#2d2d3f), brand-dark-border (#3d3d5c). Add font-mono with Courier New.
- [ ] Update root layout (`app/layout.tsx`) — dark bg, white text, OwnRadio metadata
- [ ] Create placeholder `app/page.tsx` showing "OWNRADIO" branding text
- [ ] Run `npx turbo build` — verify both apps build
- [ ] Commit: `feat: scaffold next.js frontend with tailwind theme`

---

### Task 4: Docker Compose + CI Pipeline

**Files:** `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `.github/workflows/ci.yml`

- [ ] Create `apps/api/Dockerfile` — node:22-alpine, copy workspaces, install, prisma generate, run with tsx
- [ ] Create `apps/web/Dockerfile` — node:22-alpine, copy workspaces, install, build, run with npm start
- [ ] Create `docker-compose.yml` with 3 services:
  - `db`: postgres:16-alpine, port 5432, env vars from `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${POSTGRES_DB}`, healthcheck with pg_isready, pgdata volume
  - `api`: builds from apps/api/Dockerfile, port 4000, depends on db (healthy), env from `${DATABASE_URL}`, `${JWT_SECRET}`, CORS_ORIGIN
  - `web`: builds from apps/web/Dockerfile, port 3000, depends on api, NEXT_PUBLIC_API_URL/WS_URL
- [ ] Create `.github/workflows/ci.yml`:
  - **check** job: postgres service container (env from secrets), steps: checkout, setup-node 22, npm ci, turbo typecheck, turbo lint, prisma migrate deploy, turbo test, npm audit
  - **e2e** job (needs check): checkout, setup-node, npm ci, playwright install, docker compose up, playwright test, docker compose down, upload playwright-report on failure
- [ ] Run `docker compose build` — verify builds succeed
- [ ] Commit: `feat: add docker compose and ci pipeline`

---

## Phase 2: Backend API (Tasks 5-9)

### Task 5: Station & DJ REST Endpoints

**Files:** `apps/api/src/routes/stations.ts`, `apps/api/tests/routes/stations.test.ts`

- [ ] Write failing test (`stations.test.ts`):
  - `beforeAll`: build app, create supertest agent, seed a Station with DJ
  - `afterAll`: delete all, disconnect, close app
  - Test GET /stations — returns array with station name, slug, genre, isLive, dj.name
  - Test GET /stations/:slug — returns station detail with DJ
  - Test GET /stations/unknown — returns 404
- [ ] Run test, verify FAIL
- [ ] Implement `stations.ts` with 5 routes:
  - GET /stations — findMany with include dj, map to response shape
  - GET /stations/:slug — findUnique with include dj + songs (20 most recent), 404 if not found
  - GET /stations/:slug/top-songs — findMany songs ordered by reaction count desc, limit 10
  - GET /stations/:slug/top-listeners — findMany listeners with reaction+message counts for station, sort by total activity
- [ ] Register routes in server.ts: `app.register(stationRoutes)`
- [ ] Run tests, verify PASS
- [ ] Commit: `feat: add station and DJ REST endpoints with tests`

---

### Task 6: Authentication — Email + JWT

**Files:** `apps/api/src/lib/jwt.ts`, `apps/api/src/middleware/auth.ts`, `apps/api/src/routes/auth.ts`, `apps/api/tests/routes/auth.test.ts`

- [ ] Write failing auth tests:
  - POST /auth/register — creates listener, returns user + token, no passwordHash exposed
  - POST /auth/register — rejects duplicate email (409)
  - POST /auth/register — rejects password < 8 chars (400)
  - POST /auth/login — returns token for valid credentials
  - POST /auth/login — rejects wrong password (401)
  - GET /me — returns user for valid Bearer token
  - GET /me — rejects missing token (401)
- [ ] Run tests, verify FAIL
- [ ] Implement `jwt.ts`: signToken (7d expiry) and verifyToken using JWT_SECRET from env
- [ ] Implement `middleware/auth.ts`: requireAuth preHandler — extracts Bearer token, verifies, sets req.user
- [ ] Implement `auth.ts` routes:
  - POST /auth/register — validate fields, check password length >= 8, check unique email/username, bcrypt hash (cost 12), create listener, sign token, return 201
  - POST /auth/login — find by email, bcrypt compare, sign token
  - GET /me (preHandler: requireAuth) — find listener by id from token
- [ ] Register routes in server.ts: `app.register(authRoutes)`
- [ ] Run tests, verify PASS
- [ ] Commit: `feat: add email auth with JWT and tests`

---

### Task 7: WebSocket — Chat, Reactions, Listener Count

**Files:** `apps/api/src/ws/index.ts`, `apps/api/src/ws/chat.ts`, `apps/api/src/ws/reactions.ts`, `apps/api/tests/ws/chat.test.ts`

- [ ] Write failing chat test: create HTTP server + Socket.io server, seed station, connect client, join station, verify new_message event received
- [ ] Run test, verify FAIL
- [ ] Implement `ws/index.ts` — setupSocketHandlers:
  - On connection: try authenticate from handshake.auth.token
  - join_station: join room `station:{slug}`, broadcast listener_count
  - leave_station: leave room, broadcast listener_count
  - On disconnect: broadcast updated listener_count
  - Wire up chat and reaction handlers
- [ ] Implement `ws/chat.ts` — handleChat:
  - Require auth (userId + username), require joined station
  - Validate content (1-280 chars)
  - Save ChatMessage to DB
  - Broadcast new_message to room
- [ ] Implement `ws/reactions.ts` — handleReactions:
  - Toggle behavior: if existing reaction with same songId+listenerId+type, delete it; otherwise create
  - Debounce broadcasts: aggregate counts per station+song, emit reaction_update every 500ms
  - ReactionCounts query: groupBy type, count
- [ ] Integrate Socket.io into server.ts: create HTTP server wrapping Fastify, attach Socket.io, call setupSocketHandlers
- [ ] Run tests, verify PASS
- [ ] Commit: `feat: add websocket handlers for chat, reactions, listener count`

---

### Task 8: Stream Metadata Poller

**Files:** `apps/api/src/ws/metadata.ts`

- [ ] Implement `metadata.ts`:
  - `fetchIcecastMetadata(url)`: fetch JSON from Icecast status endpoint, parse icestats.source.title, split "Artist - Title"
  - `pollStation(io, stationId, slug, metadataUrl)`: fetch metadata, skip if same as last known song, save Song to DB, broadcast now_playing
  - `startMetadataPollers(io)`: poll all live stations every 5s, check for new/removed live stations every 30s
  - `stopAllPollers()`: cleanup for graceful shutdown
- [ ] Call `startMetadataPollers(io)` in server.ts start() after setupSocketHandlers
- [ ] Commit: `feat: add icecast/shoutcast metadata poller`

---

### Task 9: Database Seed Data

**Files:** `apps/api/prisma/seed.ts`

- [ ] Create seed script:
  - 4 stations (Rock Haven, Beat Lounge, Chill Waves, Pinoy Hits) with DJs, all isLive: true
  - 5 sample songs across stations
  - 1 demo listener (username: demo_listener, email: demo@ownradio.com, bcrypt-hashed password)
- [ ] Add prisma seed config to `apps/api/package.json`
- [ ] Commit: `feat: add database seed data for development`

---

## Phase 3: Frontend (Tasks 10-13)

### Task 10: API Client + Socket Hook

**Files:** `apps/web/src/lib/api.ts`, `apps/web/src/lib/socket.ts`, `apps/web/src/hooks/useAuth.ts`, `apps/web/src/hooks/useSocket.ts`

- [ ] Create `api.ts` — fetch wrapper: prepends API_URL, adds Bearer token from localStorage, throws on non-ok
- [ ] Create `socket.ts` — Socket.io client singleton, connects with auth token from localStorage, `getSocket()` and `reconnectSocket()` exports
- [ ] Create `useAuth` hook — manages user state, login/register/logout functions, stores token in localStorage, calls reconnectSocket on auth change
- [ ] Create `useStation` hook — joins/leaves Socket.io room, listens for now_playing, reaction_update, new_message, listener_count, station_status events. Exposes sendMessage and sendReaction functions.
- [ ] Commit: `feat: add api client, socket singleton, and auth/station hooks`

---

### Task 11: Landing Page Components

**Files:** `apps/web/src/components/landing/*.tsx`, `apps/web/src/app/page.tsx`

- [ ] Create `Hero.tsx` — branding, tagline, animated radio icon, platform stats (stationCount, listenerCount, djCount props)
- [ ] Create `FeaturedStations.tsx` — horizontal scroll of station cards with genre gradient, live badge, DJ name, now-playing, listener count. Each card links to `/station/[slug]`.
- [ ] Create `TopDJs.tsx` — horizontal scroll of DJ avatar bubbles with online indicator and listener count
- [ ] Create `TrendingSongs.tsx` — ranked list of top songs by reaction count
- [ ] Create `LoginSection.tsx` — "Join the crowd" prompt, Google OAuth button (placeholder), Email button (links to /login), "Continue as guest" link. Shows "Welcome back" when logged in.
- [ ] Assemble in `app/page.tsx` — server component that fetches stations from API, renders all sections
- [ ] Commit: `feat: implement landing page with all sections`

---

### Task 12: Login Page

**Files:** `apps/web/src/app/login/page.tsx`

- [ ] Create client component with email + password form
- [ ] On submit: call useAuth().login, redirect to / on success, show error on failure
- [ ] Back button navigates to previous page
- [ ] "Don't have an account? Sign up" link (future — placeholder for now)
- [ ] Styled with dark theme matching mockup
- [ ] Commit: `feat: add email login page`

---

### Task 13: Station Page — Carousel + Audio + Reactions + Chat + DJ

**Files:** `apps/web/src/app/station/[slug]/page.tsx`, `apps/web/src/components/station/*.tsx`

This is the largest frontend task. Implements the full station experience from the mockup.

- [ ] Create `AudioControls.tsx` — native `<audio>` element with stream URL, play/pause button (pink circle), volume down/up buttons, volume slider. Auto-play when station becomes active.
- [ ] Create `ReactionBar.tsx` — 4 buttons (rock, heart, broken_heart, party) with live counts from useStation hook. Toggle on click, highlight when active. Calls sendReaction.
- [ ] Create `LiveChat.tsx` — scrollable message list (auto-scroll), input + send button. Input disabled for guests with "Log in to chat" prompt. Calls sendMessage.
- [ ] Create `DJBioModal.tsx` — bottom-sheet overlay with DJ name, bio, genre tags, close button.
- [ ] Create `DJSection.tsx` — compact horizontal: avatar (click opens DJBioModal) + name + listener count on left, pill buttons (Playlist, Top 10, Fans) on right.
- [ ] Create `StationCard.tsx` — composes all above: hero gradient, now-playing, AudioControls, ReactionBar, LiveChat, DJSection. Scrollable vertically.
- [ ] Create `StationCarousel.tsx` — wraps StationCards with:
  - Swipe left/right (touch + mouse) to navigate
  - Edge tap zones (left/right chevrons)
  - Dot indicators at top
  - Auto-play new station, auto-pause previous
  - CSS transitions for slide-in/slide-out
- [ ] Create `app/station/[slug]/page.tsx` — server component, fetches all stations, finds initial index from slug, renders StationCarousel
- [ ] Commit: `feat: implement station page with carousel, audio, reactions, chat, DJ section`

---

## Phase 4: E2E Tests + Polish (Tasks 14-15)

### Task 14: Playwright E2E Tests

**Files:** `playwright.config.ts`, `tests/landing.spec.ts`, `tests/auth.spec.ts`, `tests/station.spec.ts`

- [ ] Update `playwright.config.ts` — baseURL localhost:3000, webServer runs docker compose, Pixel 7 device, video/screenshot/trace on
- [ ] Write `landing.spec.ts` — loads hero, featured stations visible, login section visible, station card links to station page
- [ ] Write `auth.spec.ts` — email login flow (fill form, submit, redirect to /)
- [ ] Write `station.spec.ts` — loads station, reaction buttons visible, audio element attached, edge tap navigates
- [ ] Run `npx playwright test` — verify all pass
- [ ] Commit: `feat: add playwright e2e tests for landing, auth, station`

---

### Task 15: Final Polish + README

**Files:** `README.md`

- [ ] Create README with: project description, quickstart (clone, copy .env.example to .env, fill values, docker compose up, open localhost:3000), development (turbo dev), testing (turbo test, playwright test), architecture overview
- [ ] Run full suite: `npx turbo test && npx playwright test`
- [ ] Verify all pass
- [ ] Commit: `docs: add project readme with quickstart`

---

## Summary

| Phase | Tasks | What it produces |
|-------|-------|-----------------|
| 1. Scaffold | 1-4 | Working monorepo with shared types, Docker, CI |
| 2. Backend | 5-9 | REST API, auth, WebSocket, metadata poller, seed data |
| 3. Frontend | 10-13 | Landing page, login, station carousel with full interactivity |
| 4. E2E + Polish | 14-15 | Playwright tests, README |

Total: **15 tasks**, each independently committable and testable.
