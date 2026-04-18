# OwnRadio

A mobile-first, multi-station radio listener platform. Browse live stations, react to songs, and chat in real time.

## Stack

- **Frontend:** Next.js (App Router), Tailwind CSS v4, TypeScript
- **Monorepo:** Turborepo
- **Backend:** [PlayGen](https://github.com/...) — REST API serving stations, DJs, songs, auth
- **Tests:** Playwright (Pixel 7 device emulation)

## Prerequisites

- Node.js 20+
- PlayGen running locally (see PlayGen repo for setup)

## Quickstart

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env: set NEXT_PUBLIC_API_URL to your PlayGen gateway URL

# Start dev server
npm run dev
# Open http://localhost:3000
```

## Development

```bash
# Run all apps in dev mode
npm run dev

# Typecheck
npx turbo typecheck

# Lint
npx turbo lint
```

## Testing

```bash
# Run mockup demo tests (no server needed)
npx playwright test --project="Mobile Chrome"

# Run Next.js app tests (requires dev server running)
npm run dev &
npx playwright test --project=nextjs-app
```

## Architecture

```
ownradio/
├── apps/web/          # Next.js frontend
│   ├── src/app/       # App Router pages
│   ├── src/components/# UI components
│   │   ├── landing/   # Landing page sections
│   │   └── station/   # Station carousel + audio + chat
│   ├── src/hooks/     # useAuth, useStation (mocked)
│   └── src/lib/       # api.ts (PlayGen client), mock-data.ts
├── packages/shared/   # Shared TypeScript types
└── tests/             # Playwright E2E tests
```

## What's Mocked

PlayGen has no listener-facing features. These are mocked locally:
- Reactions (rock/heart/broken_heart/party) — local state
- Live chat messages — local state
- Listener count — random on mount

These will be replaced with real PlayGen endpoints once the listener features are built.
