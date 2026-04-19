# Build context: repo root (docker build -f apps/web/Dockerfile .)

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY package.json turbo.json ./

ARG NEXT_PUBLIC_API_URL=http://localhost:80
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build --workspace=apps/web

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
