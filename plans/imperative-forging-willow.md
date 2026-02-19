# Deploy Playground to GitHub Pages

## Context

The React playground (`packages/playground`) builds via Vite but has no deployment. We want it automatically deployed to GitHub Pages on pushes to `main`.

## Changes

### 1. Set Vite base path — `packages/playground/vite.config.ts`

GitHub Pages serves from `https://<user>.github.io/basic/`, so assets need a base path prefix. Add `base: "/basic/"` to the Vite config.

### 2. Add deploy workflow — `.github/workflows/deploy.yml`

New workflow triggered on push to `main`. Uses the modern GitHub Pages approach (`actions/upload-pages-artifact` + `actions/deploy-pages`):

- Checkout, setup Node 20, `npm ci`
- `npm run build --workspaces --if-present` (builds lang first, then playground)
- Upload `packages/playground/dist/` as Pages artifact
- Deploy to GitHub Pages

Requires the repo's **Settings > Pages > Source** be set to "GitHub Actions" (not "Deploy from a branch").

## Verification

- Push to `main`, confirm the deploy workflow runs and succeeds
- Visit `https://cpirich.github.io/basic/` to confirm the playground loads
