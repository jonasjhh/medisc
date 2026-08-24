# Kinetic

Frontend + integrations for phone sensors and camera. Completely
independent of the `medisc` module in this repo — separate Cloudflare
Worker, separate deploy pipeline, no shared database or identity system.

## Stack

- React 18 + TypeScript, built with Vite
- Cloudflare Workers (static assets + a minimal Hono API), no D1/database yet
- pnpm as the package manager (own lockfile, independent of the repo root)

## Getting started

    pnpm install
    pnpm dev

## Local development

Run the Worker and the Vite dev server side by side — Vite proxies `/api/*`
to `http://localhost:8788`:

    pnpm worker:dev   # terminal 1
    pnpm dev          # terminal 2

## Deploying

    pnpm worker:deploy

Pushing to `main` with changes under `kinetic/**` also triggers
`.github/workflows/deploy-kinetic.yml` automatically, reusing the same
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` repository secrets already
configured for medisc's deploy (they're account-level, not scoped to one
Worker).

## Notes

- Deploys to `kinetic.<account>.workers.dev` — no custom domain/DNS setup.
  Camera (`getUserMedia`) and motion sensor (`DeviceMotionEvent`/
  `DeviceOrientationEvent`) browser APIs require a secure context, which this
  URL already satisfies.
