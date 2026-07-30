# Medisc

A minimal disc golf scorecard PWA — installable and offline-capable,
themed with Material Design 3 via MUI, backed by a Cloudflare Worker + D1.
The goal is a udisc-style scorecard without the bloat.

## Domain model

- **Course** — a physical course, identified by name.
- **Layout** — a course can have multiple layouts (e.g. "Blue",
  "Championship"); the same physical hole can have a different par/distance
  on each one, so holes belong to a layout rather than directly to a course.
- **Hole** — belongs to a layout: a number, a par, and an optional distance
  (meters).
- **Player** — a lightweight reusable roster entry (just a name, no
  login/account) picked from when starting a round.
- **Round** — a group of players playing one layout together. Creating a
  round pre-seeds a score (initialized to par, 0 penalties) for every
  player × hole combination, so the scoring screen just adjusts numbers up
  and down rather than creating rows on the fly.

## Stack

- **React 18 + TypeScript**, built with **Vite**
- **MUI (Material UI)** themed to Material Design 3 tokens
- **vite-plugin-pwa** for the manifest + service worker (installable, offline)
- **react-router-dom** for client-side routing
- **pnpm** as the package manager
- **Cloudflare Workers + D1** for the backend API and database, routed with
  **Hono** and validated with **Zod**
- **Vitest + React Testing Library** for frontend unit/component tests, and
  **@cloudflare/vitest-pool-workers** for real Worker + D1 integration tests
- **Playwright** for end-to-end tests, including a PWA installability check
- **ESLint + Prettier** for linting/formatting
- **GitHub Actions** for CI and deployment to **GitHub Pages** (static
  frontend preview; see below for the full Worker + D1 deployment)

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

| Script                         | Purpose                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `pnpm dev`                     | Start the Vite dev server                                                      |
| `pnpm build`                   | Type-check and build for production                                            |
| `pnpm preview`                 | Preview the production build locally                                           |
| `pnpm lint`                    | Run ESLint                                                                     |
| `pnpm format` / `format:check` | Run/check Prettier formatting                                                  |
| `pnpm typecheck`               | Run the TypeScript compiler with no emit                                       |
| `pnpm test`                    | Run frontend unit tests once                                                   |
| `pnpm test:watch`              | Run frontend unit tests in watch mode                                          |
| `pnpm test:coverage`           | Run frontend unit tests with coverage                                          |
| `pnpm test:worker`             | Run Worker API tests against a real D1 (via `@cloudflare/vitest-pool-workers`) |
| `pnpm e2e`                     | Build, preview, and run Playwright e2e tests                                   |
| `pnpm worker:dev`              | Run the Worker locally with `wrangler dev`                                     |
| `pnpm worker:deploy`           | Build the frontend and deploy the Worker                                       |
| `pnpm db:migrate:local`        | Apply migrations to the local D1 emulator                                      |
| `pnpm db:migrate:remote`       | Apply migrations to the real D1 database                                       |

## Backend (Cloudflare Worker + D1)

`worker/index.ts` assembles a Hono app from `worker/routes/`, backed by the
D1 database bound as `DB` in `wrangler.toml`:

**Courses** (`worker/routes/courses.ts`)

- `POST /api/courses` — body `{ name }` → creates a course.
- `GET /api/courses` — lists courses with their layout count.
- `GET /api/courses/:courseId` — a course with its layouts, each with its
  holes, nested.
- `POST /api/courses/:courseId/layouts` — body `{ name }` → adds a layout.

**Layouts** (`worker/routes/layouts.ts`)

- `POST /api/layouts/:layoutId/holes` — body
  `{ number, par, distanceMeters? }` → adds a hole to that layout. Rejects a
  duplicate hole `number` on the same layout with `409`.

**Players** (`worker/routes/players.ts`)

- `POST /api/players` — body `{ name }` → adds a player to the roster.
- `GET /api/players` — lists all players.
- `GET /api/players/:playerId/layouts` — distinct course/layout combos the
  player has *completed* rounds on, for populating a stats filter. 404s if
  the player doesn't exist.
- `GET /api/players/:playerId/stats?layoutId=` — per-hole aggregates
  (times played, avg/best/worst strokes, avg penalties) across the
  player's completed rounds on that layout only. 400s without a
  `layoutId`, 404s if the player doesn't exist.

**Rounds** (`worker/routes/rounds.ts`)

- `POST /api/rounds` — body `{ courseId, layoutId, playerIds }` → creates a
  round, seeds a score (strokes = par, penalties = 0) for every player ×
  hole, and returns the full round detail (course, layout, holes, players,
  scores). 404s if the layout doesn't belong to the course, or if any
  player id doesn't exist.
- `GET /api/rounds` — lists rounds (course/layout name, player count,
  completion state), newest first. Supports `?status=completed`
  /`?status=in_progress`, `?playerId=`, and `?courseId=` filters,
  combinable and all optional.
- `GET /api/rounds/:roundId` — the same detail shape `POST` returns, for
  resuming a round already in progress.
- `POST /api/rounds/:roundId/complete` — marks the round done (sets
  `completedAt`), locking its scores from further edits. 404s if the round
  doesn't exist.

**Hole scores** (`worker/routes/holeScores.ts`)

- `PATCH /api/hole-scores/:id` — body `{ strokes?, penalties? }` → updates
  one player's score for one hole. Either field alone is fine (the other is
  left as-is); `strokes` can't go below 1, `penalties` not below 0. 409s if
  the round it belongs to has already been completed.

The frontend lives in `src/courses/` (`/courses`, `/courses/:courseId`),
`src/rounds/` (`/rounds`, `/rounds/new`, `/rounds/:roundId`), and
`src/players/` (`/players`, `/players/:playerId` for per-layout stats).

`wrangler.toml` also serves the built frontend (`dist/`) as static assets,
so the Worker is the single deployable that hosts both the API and the app.

### One-time setup

```bash
pnpm exec wrangler d1 create medisc
```

Copy the printed `database_id` into `wrangler.toml`, then apply the schema
in `migrations/`:

```bash
pnpm db:migrate:remote
```

### Local development

Run the Worker and the Vite dev server side by side — Vite proxies `/api/*`
to `http://localhost:8787`:

```bash
pnpm db:migrate:local   # first time only, seeds the local D1 emulator
pnpm worker:dev         # terminal 1
pnpm dev                # terminal 2
```

### Deploying

Pushing to `main` triggers `.github/workflows/deploy-worker.yml`, which
builds the frontend, applies any pending D1 migrations against the real
database, then deploys the Worker — all via
[`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action).
Since `wrangler d1 migrations apply` only applies migrations D1 hasn't
already recorded, this is safe to run on every deploy and keeps the schema
in sync automatically as new migration files are added.

This needs two repository secrets (**Settings → Secrets and variables →
Actions**):

- `CLOUDFLARE_API_TOKEN` — create one at
  **My Profile → API Tokens → Create Token**, using the "Edit Cloudflare
  Workers" template (it covers Workers Scripts and D1).
- `CLOUDFLARE_ACCOUNT_ID` — shown in the Cloudflare dashboard sidebar, or
  in the URL when viewing your account (`dash.cloudflare.com/<account-id>/…`).

If you'd connected the GitHub repo directly in **Workers & Pages** for
Cloudflare's own Git-integration deploys, disconnect that (Settings →
Build & deployments) so it doesn't fight with this workflow — the
auto-detected build command there also can't run D1 migrations, only
build + deploy the Worker script itself.

To deploy manually instead (e.g. from your own machine):

```bash
pnpm db:migrate:remote
pnpm worker:deploy
```

Note: the GitHub Pages workflow below only hosts the static frontend, so
`/api/*` calls will fail there — deploy via Cloudflare Workers (above) to
get the full app with a working backend.

## Deployment (GitHub Pages preview)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app with `GITHUB_PAGES=true` (so Vite's `base` matches the `/medisc/` project
path) and publishes `dist/` to GitHub Pages via `actions/deploy-pages`.

In the repository settings, set **Settings → Pages → Source** to
**GitHub Actions**.

Every push and pull request also runs `.github/workflows/ci.yml`: lint,
format check, typecheck, frontend unit tests with coverage, Worker API
tests, and a headless Playwright run.
