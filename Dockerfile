# ── Stage 1: Base ─────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config + all package.json files for dependency install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Builder ─────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy all source (except what .dockerignore excludes)
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/
COPY apps/admin/ apps/admin/
COPY apps/mobile/ apps/mobile/

# Build shared → admin → mobile web export → prisma generate → API
RUN pnpm --filter @palmtree/shared build
RUN pnpm --filter @palmtree/admin build
RUN pnpm --dir apps/mobile npx expo export --platform web
RUN pnpm --dir apps/api db:generate
RUN pnpm --filter @palmtree/api build

# ── Stage 3: Runner ──────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Copy workspace config + all package.json files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/admin/package.json apps/admin/

# Install all deps (need prisma CLI for migrate deploy)
RUN pnpm install --frozen-lockfile

# Copy built shared package
COPY --from=builder /app/packages/shared/dist/ packages/shared/dist/

# Copy built API + source (source needed for seed script's tsx imports)
COPY --from=builder /app/apps/api/dist/ apps/api/dist/
COPY --from=builder /app/apps/api/src/ apps/api/src/

# Copy admin dist into API's admin-dist directory
COPY --from=builder /app/apps/admin/dist/ apps/api/admin-dist/

# Copy mobile web export into API's shop-dist directory
COPY --from=builder /app/apps/mobile/dist/ apps/api/shop-dist/

# Copy Prisma schema and migrations
COPY --from=builder /app/apps/api/prisma/ apps/api/prisma/

# Generate Prisma client in the runner (avoids pnpm hoisting path issues)
RUN pnpm --dir apps/api db:generate

# Create uploads directory (Railway volume will mount here)
RUN mkdir -p apps/api/uploads

ENV NODE_ENV=production
EXPOSE 3001

# Run migrations then start the server
CMD ["sh", "-c", "cd /app/apps/api && npx prisma migrate deploy && node /app/apps/api/dist/index.js"]
