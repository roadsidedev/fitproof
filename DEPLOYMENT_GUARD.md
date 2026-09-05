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


# Beginner click-by-click deployment path

This section is the easiest path if you prefer the Cloudflare Dashboard over the command line. Use the **Dashboard path** or the **Wrangler path** for database setup—not both for the same new database.

## A. Create the Cloudflare D1 database in the Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select the correct Cloudflare account from the account selector.
3. In the left navigation, open **Workers & Pages**.
4. Open **D1 SQL database**. If the label is not visible, use the dashboard search and search for `D1`.
5. Click **Create database**.
6. Enter exactly: `fitproof`.
7. Leave the location hint at its default unless you have a reason to choose a region.
8. Click **Create**.
9. Open the new `fitproof` database.
10. Copy the displayed **Database ID**. It is a UUID-like value. Keep this tab open.

**Checkpoint:** you should now see a database named `fitproof`, its Database ID, and a **Console** tab.

## B. Make the database usable: easiest Dashboard Console method

Use this method when you want the fewest commands. It creates the schema directly in the production database.

1. In the `fitproof` D1 database page, select **Console**.
2. In the repository, open `worker/dashboard-bootstrap.sql`.
3. Copy the entire file, from `PRAGMA foreign_keys = ON;` through the final index statement.
4. Paste it into the D1 Console editor.
5. Click **Execute**.
6. Wait for the success result. If the console rejects a large paste, execute the statements in two or three groups, keeping the `CREATE TABLE` statements before the `CREATE INDEX` statements.
7. Select the **Tables** tab.
8. Confirm these tables exist: `accounts`, `sessions`, `challenges`, `receipts`, `pool`, `claims`, `feed`, and `rate_limits`.
9. In the Console, execute:

```sql
PRAGMA table_info(accounts);
```

10. Confirm that the output includes `step_goal`.

**Important:** the Dashboard Console does not necessarily record files in Wrangler’s `d1_migrations` history. If you use this Dashboard method for a brand-new database, do not immediately run `wrangler d1 migrations apply --remote` against it unless you understand and reconcile migration history. The bootstrap file already includes the current schema, including the step-goal column.

## C. Seed the pool in the Dashboard Console

1. Still in the `fitproof` database, remain on **Console**.
2. Open `worker/dashboard-seed-pool.sql` in the repository.
3. Copy the entire file.
4. Paste it into the Console.
5. Click **Execute**.
6. Run this verification query:

```sql
SELECT item_id, type, label, stock, cost_points FROM pool ORDER BY cost_points;
```

7. Confirm that three rows are returned: `nim-micro`, `ai-25`, and `partner-band`.

The current FitProof implementation creates NIM claims with `pending` status. It does not yet make an on-chain payout automatically. Keep this wording visible to users until treasury payout processing is implemented.

## D. Bind D1 to the Worker in the Dashboard

The repository already has the binding configuration, but it contains a placeholder ID that must be replaced.

1. On your computer, open the cloned repository folder.
2. Open `wrangler.jsonc`.
3. Find this line:

```jsonc
"database_id":"REPLACE_WITH_D1_DATABASE_ID"
```

4. Replace only the placeholder value with the Database ID copied in step A.
5. Save the file.
6. Find this line:

```jsonc
"ALLOWED_ORIGIN":"https://REPLACE_WITH_MINI_APP_ORIGIN"
```

7. Replace it with the final HTTPS Vercel URL, for example:

```jsonc
"ALLOWED_ORIGIN":"https://fitproof.vercel.app"
```

8. Do not add a trailing slash.
9. Set `TREASURY_ADDRESS` under `vars` only if the Worker code uses it for a public treasury display. Do not put a private key in `vars`.

The relevant final shape is:

```jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "fitproof",
    "database_id": "YOUR_REAL_DATABASE_ID",
    "migrations_dir": "worker/migrations"
  }],
  "vars": {
    "ALLOWED_ORIGIN": "https://YOUR_FRONTEND_DOMAIN"
  }
}
```

## E. Deploy the Worker: easiest command-line method

Cloudflare Dashboard can edit Worker variables, but deploying this TypeScript Worker from the repository is easiest with Wrangler.

1. Install Node.js 18 or newer if it is not installed.
2. Open a terminal in the FitProof repository.
3. Install dependencies:

```bash
npm ci
```

4. Log in to Cloudflare:

```bash
npx wrangler login
```

5. A browser window opens. Choose the Cloudflare account that owns the `fitproof` D1 database.
6. Return to the terminal and run:

```bash
npm run worker:check
```

7. Confirm the dry-run shows `env.DB` as a D1 binding and no placeholder database ID remains.
8. Deploy:

```bash
npx wrangler deploy
```

9. Copy the Worker URL printed by Wrangler. It normally looks like:

```text
https://fitproof-api.<your-subdomain>.workers.dev
```

10. Verify it in a browser by opening:

```text
https://YOUR_WORKER_URL/health
```

You should see `{"ok":true}`.

## F. Deploy the Worker from the Cloudflare Dashboard instead

Use this only if you have configured a GitHub integration or are comfortable uploading the project through Cloudflare’s Worker deployment interface.

1. In Cloudflare, open **Workers & Pages**.
2. Click **Create application** or open the existing `fitproof-api` Worker.
3. Choose the GitHub repository `roadsidedev/fitproof` if repository integration is available.
4. Select the `main` branch.
5. Configure the build/deploy command according to the repository’s Wrangler setup. The Worker entry point is `worker/index.ts` and the Wrangler configuration is `wrangler.jsonc`.
6. Ensure the D1 binding name is exactly `DB`.
7. Deploy the Worker.
8. Open the Worker’s **Settings → Bindings** area and verify the D1 binding points to the database named `fitproof`.
9. Open **Settings → Variables and Secrets** and verify `ALLOWED_ORIGIN` is a plaintext variable with the exact frontend origin.
10. Click **Deploy** after changing variables.

If the Dashboard does not offer a reliable TypeScript/Wrangler build path, use the Wrangler method in section E. It is the less ambiguous method for this repository.

## G. Add Worker variables and secrets in the Dashboard

For a deployed Worker:

1. Open **Workers & Pages**.
2. Select `fitproof-api`.
3. Select **Settings**.
4. Find **Variables and Secrets**.
5. Click **Add**.
6. For `ALLOWED_ORIGIN`, choose **Variable**, enter the exact HTTPS Vercel URL, and save.
7. For `TREASURY_ADDRESS`, choose **Variable** only if needed by the deployed code.
8. For a private treasury key, choose **Secret**, enter `TREASURY_PRIVATE_KEY`, paste the key, and save. The value is hidden after saving.
9. Click **Deploy** to make the configuration active.

Do not add `VITE_API_URL` here. That is a frontend build variable and belongs in Vercel.

## H. Configure Vercel, click by click

1. Go to [Vercel](https://vercel.com/) and open the FitProof project.
2. Open **Settings → Environment Variables**.
3. Add:

```text
Name: VITE_API_URL
Value: https://YOUR_WORKER_URL
Environment: Production
```

4. Do not add a trailing slash to the Worker URL.
5. Save the variable.
6. Open **Deployments**.
7. Find the current production deployment.
8. Open the deployment menu and choose **Redeploy**, or push a new commit through the connected GitHub integration.
9. Open the deployed Vercel URL.
10. Confirm the browser app loads without a network error.

If you use a custom domain, use that custom domain as `ALLOWED_ORIGIN`, not the temporary `vercel.app` URL.

## I. First end-to-end check

Use the browser and terminal checks in this order:

1. `GET https://YOUR_WORKER_URL/health` returns `{"ok":true}`.
2. `GET https://YOUR_WORKER_URL/api/pool` returns the seeded pool.
3. Open the Vercel URL in a normal browser and confirm the app renders.
4. Open the same URL inside Nimiq Pay.
5. Connect the wallet.
6. Complete a circuit.
7. Sign the challenge.
8. Confirm the receipt appears.
9. Open History, Board, and Feed.
10. Confirm the new receipt appears in all appropriate views.

## J. What to do if a step fails

| Symptom | Most likely cause | Action |
|---|---|---|
| Worker returns 1101 or 1102 | Worker exception or binding problem | Open Worker **Logs**, inspect the exception, and verify the `DB` binding |
| Health works but `/api/pool` fails | Schema or pool seed missing | Re-run the table and pool verification queries |
| Browser shows CORS/origin error | `ALLOWED_ORIGIN` does not exactly match the browser origin | Copy the complete origin from the browser address bar, remove the path and trailing slash, redeploy Worker |
| Worker says database not found | Wrong database ID or wrong Cloudflare account | Recheck `database_id` and Wrangler login account |
| Step goal endpoint fails | Migration/bootstrap did not add `step_goal` | Run `PRAGMA table_info(accounts);`, then apply the appropriate schema correction before release |
| Wallet provider missing | App opened outside Nimiq Pay | Open the URL inside Nimiq Pay |
| Signature rejected | Wrong challenge, stale session, or wallet mismatch | Start a fresh quest; inspect Worker logs without publishing signatures |
| Claims remain pending | Expected current behavior | NIM payout processor is not yet implemented; do not promise instant payout |

## K. Dashboard-only versus Wrangler decision

Use **Dashboard Console** when you want the easiest initial database creation and schema bootstrap. Use **Wrangler** for repeatable code deployments and future migrations.

Recommended first release path for this repository:

1. Create D1 in the Dashboard.
2. Bootstrap schema with `worker/dashboard-bootstrap.sql` in Console.
3. Seed pool with `worker/dashboard-seed-pool.sql` in Console.
4. Put the real D1 ID and frontend origin in `wrangler.jsonc`.
5. Deploy Worker with `npx wrangler deploy`.
6. Configure `VITE_API_URL` in Vercel.
7. Redeploy Vercel.
8. Run the full smoke test.

Once the first release is live, use the checked-in Wrangler migrations for future schema changes. Keep Dashboard Console edits documented and avoid manually changing production tables without a corresponding migration or a recorded corrective procedure.

## Official references

- [Cloudflare D1 getting started](https://developers.cloudflare.com/d1/get-started/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare Worker environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
