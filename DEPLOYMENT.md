# Production deployment

FitProof has two deployables: the Vite static frontend and the Cloudflare Worker API. A database URL by itself is not sufficient; the D1 schema must be applied and the frontend must point at the Worker URL.

## 1. Create and migrate D1

```bash
npx wrangler d1 create fitproof
# Put the returned database_id into wrangler.jsonc
npx wrangler d1 migrations apply fitproof --remote
```

The initial migration creates accounts, sessions, challenges, receipts, pool, claims, feed, and rate-limit tables. Seed pool rows using a controlled admin migration or an authenticated operator script; do not expose pool mutation to the public client.

## 2. Configure the Worker

Set `ALLOWED_ORIGIN` to the exact deployed frontend origin. Set `TREASURY_ADDRESS` as a non-secret variable. If direct NIM payouts are enabled, store the treasury private key only in the Worker’s encrypted secret store. Never put it in Vercel environment variables exposed to the browser, and never commit it.

```bash
npx wrangler secret put TREASURY_PRIVATE_KEY
npx wrangler deploy
```

## 3. Configure the frontend

Set `VITE_API_URL` to the deployed Worker URL at build time and deploy the Vite `dist` output to Vercel or another static host. If using Vercel, configure the variable for Preview and Production separately and redeploy after changing it.

## 4. Release gates

Run `npm ci`, `npm test`, `npm run build`, and `npx wrangler deploy --dry-run`. Verify `/health`, `/api/pool`, and a complete session → challenge → Nimiq Pay sign → complete flow inside Nimiq Pay. Do not use a mock signature in production.

The current repository still requires a real D1 database ID, deployed Worker URL, pool seed data, treasury operating policy, and an in-host Nimiq Pay smoke test before it can be declared production-ready.
