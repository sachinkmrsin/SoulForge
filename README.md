# SoulForge

A dark-fantasy productivity tracker. Real habits and real goals are reframed as a
solo RPG: quests, daily rituals, boss battles, loot, and a character sheet that
levels up as you show up.

The product surface is called **SoulForge**. The repository, database, and
container names use **Soul Warrior Chronicle**.

---

## The loop

1. Register a username and password. You start at level 1 as a Knight.
2. Create **Quests** (goals) and **Rituals** (habits).
3. Check in on rituals each day to build streaks.
4. Earn XP. Level up, gain max HP, stats, and gold.
5. Challenge a **Boss**, then chip away at its HP.
6. Track progress in the **Chronicles** calendar and the **Hall of Champions**
   leaderboard.

## Features

| Area              | Route          | What it does                                                                     |
| ----------------- | -------------- | -------------------------------------------------------------------------------- |
| The Bonfire       | `/dashboard`   | HP and XP bars, current streak, XP today, active boss card, recent activity feed |
| Quests            | `/goals`       | Create, complete, and delete goals with a priority tier that sets the XP reward  |
| Rituals           | `/habits`      | Habits grouped by time of day, daily check-in, streaks, weekly streak bonus      |
| Boss Fights       | `/boss`        | One active battle per user; seeded boss roster; damage rolls off your Strength   |
| Trials            | `/challenges`  | Optional timed challenges with difficulty and XP payouts                         |
| Inventory         | `/inventory`   | Loot drops filtered by rarity and item type                                      |
| Skills            | `/skills`      | Global skill catalogue gated by level; equip up to three                         |
| Hall of Champions | `/leaderboard` | Global top 50 by level and XP, plus your own rank                                |
| Chronicles        | `/calendar`    | Month heatmap of activity with per-day XP, rituals, and subtasks                 |
| Character         | `/profile`     | Avatar class, stat radar, gold, HP, account age                                  |
| Admin             | `/admin`       | Users, boss and skill definitions, item catalogue, platform stats                |

Admin routes are gated on the `admin` role. The first admin is granted from the
CLI (see [Seeding and bootstrap](#seeding-and-bootstrap)).

## Tech stack

- **Runtime** Node 24, pnpm workspace monorepo
- **Frontend** React 19, Vite 7, Tailwind CSS 4, TanStack Query, wouter, Radix UI, Recharts
- **API** Express 5, Zod, esbuild bundle, pino request logging
- **Database** PostgreSQL 16, Drizzle ORM, drizzle-kit for schema pushes
- **Contract** hand-written OpenAPI 3.1 spec, Orval codegen for React Query hooks and Zod schemas
- **Environment** Docker Compose for everything, dev and production

---

## Quick start

Docker is the intended runtime. Postgres, the schema push, the API, and the
frontend are all owned by Compose, so you do not need a host Postgres install.

### Development

```bash
pnpm run docker:dev          # build and start postgres, db-push, api, frontend
pnpm run docker:dev:logs     # tail logs
pnpm run docker:dev:watch    # sync+restart on source changes (needs Compose watch)
pnpm run docker:dev:down     # stop and remove the dev stack
```

Then open:

- Frontend: <http://localhost:3000>
- API: <http://localhost:5000>
- Health check: <http://localhost:5000/api/healthz>

The dev frontend runs Vite with HMR and proxies `/api` to the API container.
`pnpm run docker:dev:watch` rebuilds and restarts the API container when
`artifacts/api-server/src` or `lib/` changes.

### Production

```bash
pnpm run docker:up           # nginx-served frontend + node API
pnpm run docker:logs
pnpm run docker:down
```

The production frontend is a static bundle served by nginx, which reverse
proxies `/api` to the API container. Only port 3000 is strictly required.

## Configuration

Copy `.env.docker` to `.env` as a starting point. `.env` is gitignored.

| Variable                                              | Default                                                                    | Used by                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`                                        | `postgresql://soulwarrior:soulwarrior@postgres:5432/soulwarrior_chronicle` | API, db-push, drizzle-kit                            |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `soulwarrior` / `soulwarrior` / `soulwarrior_chronicle`                    | Postgres container                                   |
| `API_PORT`                                            | `5000`                                                                     | API container, host mapping                          |
| `FRONTEND_PORT`                                       | `3000`                                                                     | Frontend container, host mapping                     |
| `API_URL`                                             | `http://api-server:5000` in Compose                                        | Dev frontend proxy target                            |
| `SESSION_SECRET`                                      | none                                                                       | HMAC key for tokens and password salt. **Set this.** |
| `AI_INTEGRATIONS_OPENAI_BASE_URL`                     | none                                                                       | Optional, only for trial generation                  |
| `AI_INTEGRATIONS_OPENAI_API_KEY`                      | none                                                                       | Optional, only for trial generation                  |

> `SESSION_SECRET` is not currently forwarded by either Compose file. Without it
> the API silently falls back to a hardcoded signing key. See
> [Known limitations](#known-limitations).

Host-side pnpm commands need a reachable Postgres and an exported
`DATABASE_URL` pointing at `localhost:5432`, not `postgres`.

## Project structure

```
artifacts/
  api-server/     Express API, esbuild -> ESM bundle
  soulforge/      React SPA, Vite + Tailwind
  mockup-sandbox/ UI prototyping sandbox, not shipped
lib/
  db/             Drizzle schema and pg client
  api-spec/       openapi.yaml and Orval config
  api-client-react/  Generated TanStack Query hooks
  api-zod/        Generated Zod request/response schemas
  integrations-openai-ai-server/  OpenAI client wrapper
  integrations-openai-ai-react/   OpenAI React hooks
scripts/          Seed and admin utilities, run via tsx
```

## Common commands

```bash
pnpm run typecheck                             # libs, then artifacts + scripts
pnpm run build                                 # typecheck + build every package
pnpm --filter @workspace/api-spec run codegen  # regenerate hooks and schemas
pnpm --filter @workspace/db run push           # apply schema changes
pnpm --filter @workspace/db run push-force     # force apply schema changes
```

Regenerating API clients requires `DATABASE_URL` to be set, because
`drizzle.config.ts` throws without it.

## Seeding and bootstrap

`scripts/` contains helpers that talk to Postgres through `psql`, so they must
run on a host with `psql` available and `DATABASE_URL` exported. They use
`tsx`, which is a dependency of the `scripts` workspace rather than the root, so
run them through that filter.

```bash
# 8 preset bosses
pnpm --filter @workspace/scripts exec tsx seed-bosses.ts

# 8 skill definitions
pnpm --filter @workspace/scripts exec tsx seed-skills.ts

# grant the first admin (registration always creates role "user")
pnpm --filter @workspace/scripts exec tsx promote-admin.ts <username>
```

After pulling changes, run `scripts/post-merge.sh` to reinstall and re-push the
schema.

## Game mechanics

All formulas live in `artifacts/api-server/src/lib/xp.ts`; the client renders
whatever the server computes.

- **XP curve** `floor(100 * level^1.5)`, so level 1 needs 100 XP and level 50
  needs about 35,000.
- **Level up** grants +10 max HP, +1 to each of Strength, Endurance, Dexterity,
  and Faith, and +50 gold.
- **Goal XP** is set by priority: low 100, medium 150, high 250, legendary 500.
- **Ritual bonus** adds `floor(streak / 7) * 10` XP, and every 7th consecutive
  check-in rolls an item.
- **Loot odds** legendary 0.5%, epic 2.5%, rare 9%, uncommon 23%, common 65%.
- **Boss damage** `floor(strength * attackPoints * 10) + random(0..50)`.
- **Skill slots** capped at three, gated on player level.

## Known limitations

This is an actively developed project. The following are known and
unaddressed:

- **Authentication is hand-rolled.** Passwords are hashed with a single
  SHA-256 pass salted by `SESSION_SECRET`, not a password KDF like bcrypt or
  argon2. Tokens are HMAC-signed and valid for seven days, are stored in
  `localStorage`, and cannot be revoked server-side, so logout does not
  invalidate a stolen token. Token signatures are compared with `!==` rather
  than a constant-time comparison.
- **`SESSION_SECRET` is not passed into the API container** by either Compose
  file. Add it to the `api-server` service and to `.env.docker`, otherwise the
  API signs tokens with a hardcoded fallback key.
- **`POST /logout` is a no-op.** It returns success without revoking anything.
- **Boss attacks cannot currently land.** `boss_battles.attack_points` is never
  incremented anywhere, so `POST /bosses/active/attack` always responds 400 and
  the Attack button stays disabled. Boss HP does drop indirectly, because
  completing quests and rituals deals damage through the XP award path, but a
  boss can never be defeated through the API as written.
- **Skill effects are flavor text.** `skill_definitions.effect` is displayed
  but never read by any code, so equipping a skill has no mechanical effect.
- **Per-boss loot tables are inert.** `bosses.loot_table` is stored and shown
  in the admin UI but the loot roller always uses the shared pool.
- **Subtask routes are shadowed.** `subtasksRouter` is mounted under `/goals`
  after `goalsRouter` with paths that collide, so the documented
  `/goals/{goalId}/subtasks` endpoints are unreachable. There is no subtask UI.
- **AI trial generation is not reachable from the UI.**
  `POST /challenges/generate` works and calls `gpt-5.1`, but the "Seek New
  Trials" button has no handler, and it requires `AI_INTEGRATIONS_OPENAI_*`
  which are unset by default.
- **Input validation is partial.** Only register, login, and the health check
  validate with generated Zod schemas. Most routes read the request body ad hoc,
  so enum fields are not enforced server-side.
- **Gold has no sink.** It accrues from level-ups and boss kills but cannot be
  spent.
- **Character classes are cosmetic.** They select an icon and nothing else.
- **The dashboard streak reads 0 on an idle day**, because it counts backwards
  from today only.
- **Calendar history is lossy.** Per-day ritual counts read each habit's single
  `lastCheckin`, so older days under-report.
- **CORS is fully open** and there is no rate limiting.

## Project status

- No test runner and no CI. Prettier is the only configured tool.
- `artifacts/mockup-sandbox` is a UI prototyping sandbox and is not part of any
  Compose stack.
- The OpenAPI spec documents no `securitySchemes`, so bearer auth is absent from
  the generated contract.
