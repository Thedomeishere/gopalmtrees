# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Go Palm Trees — a full-stack e-commerce platform for selling plants and landscaping services. Monorepo with pnpm workspaces and Turbo for orchestration.

## Common Commands

```bash
# Development
pnpm dev:api          # Start Express API on port 3001
pnpm dev:admin        # Start admin dashboard (Vite dev server)
pnpm dev:mobile       # Start Expo dev client

# Database (PostgreSQL via Prisma)
docker compose up -d              # Start PostgreSQL container
pnpm db:migrate                   # Run Prisma migrations
pnpm db:seed                      # Seed with sample data (admin@gopalmtrees.com / admin123)
pnpm db:studio                    # Open Prisma Studio GUI
pnpm --dir apps/api db:generate   # Regenerate Prisma client after schema changes

# Type checking & linting
pnpm typecheck        # Typecheck all workspaces (runs tsc --noEmit via turbo)
pnpm lint             # Lint all workspaces

# Build
pnpm build            # Build all workspaces
pnpm build:admin      # Build admin only
```

## Architecture

```
apps/
  api/       → Express.js REST API (port 3001), Prisma ORM, JWT auth, Stripe
  admin/     → React 18 + Vite + TailwindCSS admin dashboard
  mobile/    → React Native + Expo 54 with Expo Router (file-based routing)
packages/
  shared/    → TypeScript types, constants (business config, tax rates), utilities
```

**Data flow:** Mobile and admin apps call the Express API via fetch wrappers (`apps/*/src/services/api.ts`). API talks to PostgreSQL via Prisma. Stripe webhooks hit `/api/stripe/webhook`.

### API (`apps/api`)

- **Entry:** `src/index.ts` — Express with helmet, CORS, morgan, static `/uploads`
- **Auth:** JWT tokens (bcrypt passwords). Middleware in `src/middleware/auth.ts`: `requireAuth`, `requireAdmin`
- **Routes:** `src/routes/` — auth, products, categories, orders, quotes, users, cart, wishlist, analytics, notifications, stripe, upload
- **Schema:** `prisma/schema.prisma` — 15 models. Key: User, Product (with related ProductSize/ProductImage/ProductTag/CareTip tables), Order (items/statusHistory/shippingAddress as JSON), Quote, Cart
- **Seed:** `prisma/seed.ts` (run via `tsx`, excluded from tsconfig)
- **Cron:** `src/cron.ts` — daily analytics aggregation via node-cron

### Admin (`apps/admin`)

- **Routing:** React Router v7 (client-side), pages in `src/pages/`
- **Layout:** `src/components/layout/AdminLayout.tsx` wraps authenticated routes
- **Auth:** `src/hooks/useAuth.tsx` — JWT login, localStorage token, AuthContext provider
- **API client:** `src/services/api.ts` — fetch wrapper reading JWT from localStorage
- **Dev proxy:** Vite proxies `/api` and `/uploads` to `http://localhost:3001`

### Mobile (`apps/mobile`)

- **Routing:** Expo Router file-based — `src/app/(tabs)/` for tab nav, `src/app/(auth)/` for login/signup, dynamic routes like `src/app/product/[id].tsx`
- **Providers:** `src/providers/AuthProvider.tsx` (JWT via expo-secure-store), `src/providers/CartProvider.tsx` (API-backed cart)
- **API client:** `src/services/api.ts` — fetch wrapper using expo-secure-store for JWT

### Shared (`packages/shared`)

- Exports types for all domain models, constants (tax rates, store locations, service types), and utilities (currency formatting, tax calculation, slug generation)
- Must be built (`pnpm build`) before dependent workspaces can typecheck (turbo handles this via `dependsOn: ["^build"]`)

## Path Aliases

Admin and mobile both use `@/*` → `./src/*` and `@palmtree/shared` → shared package source. The API uses relative imports only.

## Key Patterns

- **Dates:** All dates are ISO strings (no Firebase Timestamps). Parse with `new Date(isoString)`.
- **Auth flow:** Client sends `Authorization: Bearer <jwt>` header. API middleware attaches `req.user` with `{ sub, email, role }`.
- **Prisma JSON fields:** Order `items`, `statusHistory`, `shippingAddress` are stored as JSON columns. Cast with `as any` when passing between Prisma queries.
- **File uploads:** multer disk storage to `uploads/` directory, served statically.
- **Push notifications:** Expo Server SDK. Tokens registered via `/api/notifications/register-token`.

## Environment

- **Database:** PostgreSQL 16 via docker-compose (user: palmtree, password: palmtree, db: palmtree, port: 5432)
- **API env:** `apps/api/.env` — DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PORT
- **TypeScript:** v5.7.3+ with strict mode across all workspaces
