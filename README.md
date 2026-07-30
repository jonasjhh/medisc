# Medisc

A React SPA built as an installable, offline-capable Progressive Web App,
themed with Material Design 3 via MUI. Currently just a "Hello, world!"
screen — this is the scaffolding step to prove the GitHub Pages pipeline and
PWA install flow work before real features are built.

## Stack

- **React 18 + TypeScript**, built with **Vite**
- **MUI (Material UI)** themed to Material Design 3 tokens
- **vite-plugin-pwa** for the manifest + service worker (installable, offline)
- **localforage** for local data persistence (IndexedDB-backed)
- **react-router-dom** for client-side routing
- **pnpm** as the package manager
- **Vitest + React Testing Library** for unit/component tests
- **Playwright** for end-to-end tests, including a PWA installability check
- **ESLint + Prettier** for linting/formatting
- **GitHub Actions** for CI and deployment to **GitHub Pages**

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

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app with `GITHUB_PAGES=true` (so Vite's `base` matches the `/medisc/` project
path) and publishes `dist/` to GitHub Pages via `actions/deploy-pages`.

In the repository settings, set **Settings → Pages → Source** to
**GitHub Actions**.

Every push and pull request also runs `.github/workflows/ci.yml`: lint,
format check, typecheck, unit tests with coverage, and a headless Playwright
run.
