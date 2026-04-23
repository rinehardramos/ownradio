FROM node:25-alpine AS builder
WORKDIR /app

# Copy workspace manifests for install
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci

# Copy source
COPY packages/shared/src ./packages/shared/src
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma client (uses schema at apps/api/prisma/schema.prisma)
RUN ./node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma

# Compile TypeScript (tsc inlines @ownradio/shared types since it's source-only)
RUN npm run build --workspace=apps/api

# ─── Runtime ────────────────────────────────────────────────
FROM node:25-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY apps/api/prisma ./apps/api/prisma

EXPOSE 4000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/server.js"]
