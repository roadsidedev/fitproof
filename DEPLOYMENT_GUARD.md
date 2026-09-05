# FitProof production deployment guard

This guard is the release checklist for deploying FitProof as a Nimiq Pay Mini App. Follow the steps in order. Do not publish the Mini App URL until every **blocking** check passes.

## Release definition

A release is acceptable only when:

- the frontend is served from HTTPS;
- the Worker is live and connected to the intended D1 database;
- the configured frontend origin is exact and allow-listed;
- a real Nimiq Pay wallet can connect and sign;
- a signed receipt is persisted and appears in History, Feed, and Leaderboard;
- a claim is rejected when points or stock are insufficient;
- no production secret appears in the browser bundle or Git history;
- rollback instructions have been tested or are immediately executable.

## 0. Freeze and inspect the release

From a clean checkout of `main`:

```bash
git checkout main
git pull --ff-only origin main
git status --short
npm ci
npm test
npm run build
npm run worker:check
```

**Blocking checks:** the working tree must be clean before deployment, all tests must pass, the frontend build must pass, and the Worker dry-run must pass. Do not continue after a failure.

Record the release commit:

```bash
git rev-parse HEAD
```

## 1. Prepare production values

Choose one canonical frontend origin, for example:

```text
https://fitproof.example.com
```

Do not use a trailing slash in `ALLOWED_ORIGIN`.

Required values:

| Variable | Where it belongs | Example / rule |
|---|---|---|
| `VITE_API_URL` | Vercel build environment | `https://fitproof-api.<account>.workers.dev` |
| `ALLOWED_ORIGIN` | Cloudflare Worker variable | Exact frontend origin, no trailing slash |
| `TREASURY_ADDRESS` | Cloudflare Worker variable | Public NIM treasury address |
| `TREASURY_PRIVATE_KEY` | Cloudflare Worker secret only | Never expose to Vercel or client code |
| D1 `database_id` | `wrangler.jsonc` | Real ID returned by Wrangler |

Before proceeding, confirm that no secret is present in `.env`, source files, `dist/`, or Git:

```bash
git grep -nE 'PRIVATE_KEY|SECRET|TOKEN|API_KEY|DATABASE_URL' -- ':!package-lock.json' || true
```

Expected result: no production secret values. Names in documentation are acceptable; values are not.

## 2. Create or confirm D1

If the database does not exist:

```bash
npx wrangler d1 create fitproof
```

Copy the returned `database_id` into `wrangler.jsonc`. Never replace the ID with a placeholder.

Confirm the database exists:

```bash
npx wrangler d1 list
```

## 3. Apply the database migrations

Apply migrations to the remote production database:

```bash
npx wrangler d1 migrations apply fitproof --remote
```

Verify the tables:

```bash
npx wrangler d1 execute fitproof --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

The result must include:

```text
accounts
sessions
challenges
receipts
pool
claims
feed
rate_limits
```

The `accounts` table must include `step_goal`.

## 4. Seed the reward pool

The pool must contain explicit server-side rows before claims can work. Use a controlled SQL file or an authenticated operator process. Never expose pool mutation as a public client route.

Example initial seed:

```sql
INSERT OR REPLACE INTO pool (item_id, type, label, amount, stock, cost_points, updated_at)
VALUES
  ('nim-micro', 'nim', '2 NIM', '2', 40, 10, datetime('now')),
  ('ai-25', 'ai_credits', '25 AI credits', NULL, 20, 15, datetime('now')),
  ('partner-band', 'partner', 'Partner band code', NULL, 5, 25, datetime('now'));
```

Apply it through Wrangler, then verify:

```bash
npx wrangler d1 execute fitproof --remote --command="SELECT item_id,type,label,stock,cost_points FROM pool ORDER BY cost_points;"
```

## 5. Configure Worker variables and secrets

Set the exact deployed frontend origin in `wrangler.jsonc`:

Update the `vars.ALLOWED_ORIGIN` value and redeploy. Do not create a conflicting secret with the same name; use one source of truth.

Set public treasury configuration:

Set `TREASURY_ADDRESS` as a non-secret Wrangler variable in the deployment configuration.

Only if direct payouts are implemented and approved operationally:

```bash
npx wrangler secret put TREASURY_PRIVATE_KEY
```

The current claim flow creates a **pending NIM claim**. Do not advertise instant payout until the treasury payout worker has been implemented, funded, monitored, and tested.

## 6. Deploy the Worker

Run the final dry-run:

```bash
npm run worker:check
```

Deploy:

```bash
npx wrangler deploy
```

Capture the deployed Worker URL. Check health:

```bash
curl -fsS https://YOUR_WORKER_URL/health
```

Expected response:

```json
{"ok":true}
```

Check the pool endpoint:

```bash
curl -fsS https://YOUR_WORKER_URL/api/pool
```

Expected result: seeded items are returned and stock is not unexpectedly zero.

## 7. Configure and deploy the frontend

In Vercel, configure the **Production** environment variable:

```text
VITE_API_URL=https://YOUR_WORKER_URL
```

Also configure the same value for Preview only if Preview is allow-listed separately. Build-time variables require a new deployment after changes.

Deploy the frontend:

```bash
vercel --prod
```

Or deploy through the connected Vercel Git integration. Confirm the production URL exactly matches the Worker `ALLOWED_ORIGIN`.

## 8. Verify browser security

From a shell, confirm a foreign origin is rejected on a write route:

```bash
curl -i -X POST https://YOUR_WORKER_URL/api/sessions \
  -H 'origin: https://evil.example' \
  -H 'content-type: application/json' \
  -d '{}'
```

Expected status: `403`.

Confirm the configured origin is accepted far enough to perform normal validation:

```bash
curl -i -X POST https://YOUR_WORKER_URL/api/sessions \
  -H 'origin: https://YOUR_FRONTEND_ORIGIN' \
  -H 'content-type: application/json' \
  -d '{}'
```

Expected status: `400` for incomplete payload, not `403`. This proves the request passed origin protection.

## 9. Run the real Nimiq Pay smoke test

This check must happen inside the real Nimiq Pay host, not only in a desktop browser:

1. Open the HTTPS frontend URL as a Mini App in Nimiq Pay.
2. Confirm the app does not display “Open this inside Nimiq Pay.”
3. Tap **Connect wallet** and approve account access.
4. Start the Home Circuit.
5. Complete both rounds and the rest period.
6. Tap **Prove it with wallet**.
7. Confirm the native Nimiq Pay signing dialog shows the expected FitProof challenge.
8. Approve the signature.
9. Confirm the receipt ID appears in the completion screen.
10. Open History and confirm the receipt is present.
11. Open Board and confirm the masked wallet appears.
12. Open Feed and confirm the verified completion event appears.
13. Confirm the points balance is reflected in the pool claim state.

If signing is rejected, confirm the quest remains locally complete and can be attempted again. If the provider is missing, confirm the error tells the user to open FitProof inside Nimiq Pay.

## 10. Verify workout and anti-abuse behavior

Test each path with a real device:

- Steps: grant motion permission, confirm live step count, and complete the configured goal.
- Steps fallback: deny motion permission, complete the timed walk, and confirm the fallback message.
- Move: run the timer to completion; deny location and confirm the timer still works.
- Circuit: confirm a single round cannot complete the quest; confirm rest is enforced between rounds.
- Replay: resubmit the same completion request and confirm it is rejected.
- Expiry: wait until a challenge expires and confirm completion is rejected.
- Duplicate: complete the same quest type twice on the same UTC day and confirm the second completion is rejected or returns the existing receipt.
- Claim: attempt a claim with insufficient points and with empty stock; both must be rejected.

## 11. Inspect production records

After the smoke test, inspect only non-sensitive operational fields:

```bash
npx wrangler d1 execute fitproof --remote --command="SELECT receipt_id,wallet,quest_id,day_key,points_awarded,created_at FROM receipts ORDER BY created_at DESC LIMIT 5;"
npx wrangler d1 execute fitproof --remote --command="SELECT claim_id,wallet,item_id,status,created_at FROM claims ORDER BY created_at DESC LIMIT 5;"
npx wrangler d1 execute fitproof --remote --command="SELECT event_id,wallet,kind,label,created_at FROM feed ORDER BY created_at DESC LIMIT 5;"
```

Do not publish full wallet addresses, public keys, signatures, or private operational data in screenshots or logs.

## 12. Release decision

Mark the release **GO** only if all answers are yes:

- [ ] `npm ci` succeeds.
- [ ] All automated tests pass.
- [ ] Frontend build passes.
- [ ] Worker dry-run passes.
- [ ] D1 migrations are applied remotely.
- [ ] Pool rows are seeded and verified.
- [ ] Worker `/health` returns success.
- [ ] Foreign write origins receive `403`.
- [ ] Real Nimiq Pay account connection works.
- [ ] Real native signing works.
- [ ] Receipt persists in D1.
- [ ] History, Board, and Feed show the receipt.
- [ ] Challenge replay and expiry are rejected.
- [ ] Duplicate daily completion is rejected.
- [ ] Claim constraints work.
- [ ] No secrets are in the frontend bundle or Git.
- [ ] The pending-NIM wording is accurate if direct payout is not live.

If any blocking item is unchecked, mark the release **NO-GO**.

## 13. Rollback

For a frontend-only regression, redeploy the last known-good Vercel deployment. Keep the Worker and schema unchanged unless the API contract itself is broken.

For a Worker regression, deploy the previous known-good Worker commit:

```bash
git checkout KNOWN_GOOD_COMMIT
npx wrangler deploy
```

Do not roll back database migrations by deleting tables or columns. D1 migrations are forward-only in normal operation. If a schema change is defective, ship a corrective migration and temporarily disable the affected route.

If claims or payouts are unsafe, disable claim UI through a frontend release and stop payout processing. Do not delete claims or receipts; preserve the audit trail.

## Current release caveat

This repository now contains the application code, Worker, D1 schema, security controls, live data screens, step goals, and local exercise assets. A real production release still requires deployment-specific values, a real D1 database, pool seed data, a deployed Worker, a deployed frontend, and a real Nimiq Pay smoke test. Environment variables alone do not complete these steps.
