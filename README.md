# OwnRadio

A mobile-first, multi-station internet radio platform. Browse live stations, react to songs in real time, and chat with other listeners.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS v4, TypeScript |
| Backend | Fastify 5, Socket.io, Prisma 6, PostgreSQL |
| Auth | JWT (7-day token), bcrypt |
| Monorepo | Turborepo |
| Tests | Vitest (unit), Playwright (E2E, Pixel 7) |
| Infra | Docker Compose, GitHub Actions CI |

## Quickstart

```bash
# 1. Clone and install
git clone git@github.com:rinehardramos/ownradio.git
cd ownradio
npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_SECRET, and optionally CORS_ORIGIN

# 3. Start Postgres + API
docker compose up db api -d

# 4. Migrate schema and seed demo data
cd apps/api
npx prisma db push
npx tsx prisma/seed.ts
cd ../..

# 5. Start the frontend
cd apps/web
npm run dev
# Open http://localhost:3000
```

Demo credentials: `demo@ownradio.com` / `demo1234`

## Development

```bash
# Run all apps in watch mode
npm run dev

# Typecheck all packages
npx turbo typecheck

# Lint
npx turbo lint
```

## Testing

```bash
# Unit + integration tests (Vitest, no DB required)
npx turbo test

# E2E — Next.js app (requires dev server + API running)
npx playwright test --project=nextjs-app

# E2E — mockup demos (no server required)
npx playwright test --project="Mobile Chrome"
```

## Architecture

```
ownradio/
├── apps/
│   ├── api/                  # Fastify backend
│   │   ├── prisma/           # Schema + seed
│   │   └── src/
│   │       ├── routes/       # REST: /stations, /auth
│   │       ├── ws/           # Socket.io: chat, reactions, metadata poller
│   │       ├── lib/          # JWT helpers
│   │       └── middleware/   # requireAuth
│   └── web/                  # Next.js frontend
│       └── src/
│           ├── app/          # App Router pages
│           ├── components/
│           │   ├── landing/  # Hero, FeaturedStations, TopDJs, TrendingSongs, LoginSection
│           │   └── station/  # StationCarousel, StationCard, AudioControls, ReactionBar, LiveChat, DJSection
│           ├── hooks/        # useAuth, useStation (Socket.io real-time)
│           └── lib/          # api.ts (HTTP client), socket.ts (Socket.io singleton)
├── packages/
│   └── shared/               # Shared TypeScript types (Station, Song, ChatMessage, …)
└── tests/
    ├── nextjs/               # Playwright E2E against Next.js app
    └── *.spec.ts             # Playwright demos against mockup HTML
```

## How it works

- **Audio**: browser `<audio>` element streams directly from Icecast/Shoutcast — the backend only handles metadata.
- **Now Playing**: API polls each live station's metadata endpoint every 5 s, saves new songs to DB, broadcasts `now_playing` over Socket.io.
- **Reactions**: toggle (create/delete) per listener per song, debounced 500 ms, broadcast as `reaction_update` with grouped counts.
- **Chat**: authenticated messages (1–280 chars) saved to DB, broadcast as `new_message` to station room.
- **Listener count**: tracked per Socket.io room, broadcast on join/leave/disconnect.
