# Medisc

A React SPA built as an installable, offline-capable Progressive Web App,
themed with Material Design 3 via MUI, backed by a Cloudflare Worker + D1
for server-side data (currently: a visit/score counter). This is still an
early scaffolding step — the UI is a "Hello, world!" screen plus a small
visit-tracking demo, proving the pipelines and data flow work end to end
before real features are built.

## Stack

- **React 18 + TypeScript**, built with **Vite**
- **MUI (Material UI)** themed to Material Design 3 tokens
- **vite-plugin-pwa** for the manifest + service worker (installable, offline)
- **localforage** for local data persistence (IndexedDB-backed)
- **react-router-dom** for client-side routing
- **pnpm** as the package manager
- **Cloudflare Workers + D1** for the backend API and database
- **Vitest + React Testing Library** for unit/component tests
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

| Script                         | Purpose                                      |
| ------------------------------ | -------------------------------------------- |
| `pnpm dev`                     | Start the Vite dev server                    |
| `pnpm build`                   | Type-check and build for production          |
| `pnpm preview`                 | Preview the production build locally         |
| `pnpm lint`                    | Run ESLint                                   |
| `pnpm format` / `format:check` | Run/check Prettier formatting                |
| `pnpm typecheck`               | Run the TypeScript compiler with no emit     |
| `pnpm test`                    | Run unit tests once                          |
| `pnpm test:watch`              | Run unit tests in watch mode                 |
| `pnpm test:coverage`           | Run unit tests with coverage                 |
| `pnpm e2e`                     | Build, preview, and run Playwright e2e tests |
| `pnpm worker:dev`              | Run the Worker locally with `wrangler dev`   |
| `pnpm worker:deploy`           | Build the frontend and deploy the Worker     |
| `pnpm db:migrate:local`        | Apply migrations to the local D1 emulator    |
| `pnpm db:migrate:remote`       | Apply migrations to the real D1 database     |

## Backend (Cloudflare Worker + D1)

`worker/index.ts` implements the API, backed by the D1 database bound as
`DB` in `wrangler.toml`:

- `POST /api/scores` — body `{ userId, score }`, inserts one row into the
  `scores` table and returns `{ totalVisits, yourVisits }`.
- `GET /api/scores/top?limit=10` — returns the leaderboard, scores summed
  per `userId`.

The frontend (`src/scores/`) calls this on every page load: it assigns each
browser a random persisted `userId` (via `localforage`), records a visit,
and shows both the visitor's own count and the site-wide total.

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

```bash
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
format check, typecheck, unit tests with coverage, and a headless Playwright
run.
