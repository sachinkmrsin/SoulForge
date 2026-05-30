# AGENTS.md

## Stack

pnpm workspace monorepo · Node 24 · TypeScript 5.9 · Express 5 · React 19.1.0 (exact, Expo compat) · Vite 7 · Tailwind CSS 4 · PostgreSQL 16 · Drizzle ORM · Zod v4 (`zod/v4`) · Orval codegen · esbuild

## Commands

```bash
pnpm --filter @workspace/api-server run dev   # API server (port 5000)
pnpm --filter @workspace/soulforge run dev     # Frontend (port 3000, proxies /api → :5000)
pnpm run typecheck                             # full typecheck (libs → artifacts+scripts)
pnpm run build                                 # typecheck + build all
pnpm --filter @workspace/api-spec run codegen  # regenerate hooks/schemas from openapi.yaml
pnpm --filter @workspace/db run push           # apply DB schema changes (dev)
pnpm --filter @workspace/db run push-force     # force apply DB schema
```

No test runner or linter configured beyond Prettier.

## Workspace Layout

- **`artifacts/`** — deployable apps
  - `api-server` (`@workspace/api-server`) — Express API, esbuild → ESM bundle, pino logging
  - `soulforge` (`@workspace/soulforge`) — React SPA, Vite + Tailwind, `@` path alias → `src/`
  - `mockup-sandbox` — UI prototyping, not part of production
- **`lib/`** — shared packages
  - `db` — Drizzle schema (`lib/db/src/schema/`) + pg client; exports `.` and `./schema`
  - `api-spec` — OpenAPI spec (`openapi.yaml`) + Orval config; codegen outputs to `api-client-react` and `api-zod`
  - `api-client-react` — Generated React Query hooks (custom fetch mutator at `src/custom-fetch.ts`)
  - `api-zod` — Generated Zod schemas with BigInt/Date coercion
  - `integrations-openai-ai-server` — OpenAI server SDK wrapper (exports: `.`, `./batch`, `./image`, `./audio`)
  - `integrations-openai-ai-react` — OpenAI React hooks (exports: `.`, `./audio`)
- **`scripts/`** — Utility scripts run via `tsx`

## Workflows

- **API changes**: edit `lib/api-spec/openapi.yaml` → `pnpm --filter @workspace/api-spec run codegen` → implement/update routes in `artifacts/api-server/src/routes/`
- **DB schema changes**: edit files in `lib/db/src/schema/` → `pnpm --filter @workspace/db run push` → then run codegen if API contract changed
- **Typecheck order matters**: `typecheck:libs` (tsc --build) runs first, then per-package typecheck on artifacts + scripts

## Gotchas

- `pnpm` only — preinstall script rejects npm/yarn and deletes their lockfiles
- `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` blocks packages published < 1 day ago; add to `minimumReleaseAgeExclude` for urgent trusted updates
- API server `dev` script runs build then start (not a watcher) — restart manually on changes
- Frontend dev server proxies `/api` to `API_URL` (default `http://localhost:5000`); in Docker uses `http://api-server:5000`
- `DATABASE_URL` env var required for any DB operation (drizzle.config.ts throws without it)
- Post-merge hook (`scripts/post-merge.sh`) auto-runs `pnpm install --frozen-lockfile` + `pnpm --filter db push`
- `.env` is gitignored; see `.env.docker` for Docker Compose variable reference
- esbuild externalizes many native/platform packages — add to the external list if bundling fails on a new dependency
