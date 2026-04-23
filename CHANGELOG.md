# Changelog

All notable changes to OwnRadio are documented here.

## [Unreleased]

### Design Confirmed — 2026-04-23

- **PlayGen HLS streaming integration design approved.** OwnRadio-side wiring is complete and requires no further code changes. Streaming will activate once three PlayGen-side wires are in place (gateway `/stream/*` location block, playout trigger in `manifestService.ts`, R2 prefetch constraint documented). See `docs/superpowers/specs/2026-04-23-playgen-hls-streaming.md` for the full spec.

## [MVP] — 2026-04-18

### Added

- Turborepo monorepo with `apps/api` (Fastify + Socket.io) and `apps/web` (Next.js 15)
- Station carousel with swipe/tap navigation
- `AudioControls` component — HLS.js for `.m3u8` streams; native `<audio>` fallback for Icecast/Shoutcast direct streams
- `useStation` hook — Socket.io real-time: `now_playing`, `reaction_update`, `new_message`, `listener_count`, `stream_control`, `dj_switch`
- Webhook routes: `POST /webhooks/stations/:slug/stream-control` and `POST /webhooks/stations/:slug/dj-switch` — secured by `X-PlayGen-Secret` header
- Email auth with JWT (7-day tokens, bcrypt)
- Reactions (rock, love, vibe, sleepy, nah) with debounced Socket.io broadcast
- Live chat (authenticated users only; 1–280 chars)
- Icecast/Shoutcast metadata poller (5 s interval)
- Prisma schema + seed data (4 stations, demo listener)
- Playwright E2E tests + Vitest unit/integration tests
- GitHub Actions CI pipeline
- Docker Compose local dev stack
