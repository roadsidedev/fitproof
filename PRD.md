# Product Requirements Document  
**Working title:** FitProof  
**Type:** Nimiq Pay Mini App  
**Version:** 0.1  
**Date:** 4 September 2026  
**Status:** Build-ready for Cycle II  
**License for this product:** MIT (competition requirement)

FitProof is a gamified home-fitness Mini App. Users complete short daily quests (steps, a timed run/walk, or a bodyweight circuit). Completing a quest unlocks a **wallet-signed proof**. That proof qualifies them for a **dynamic reward pool** (NIM, partner rewards, or AI credits) and appears on a leaderboard and activity feed.

This PRD follows the earlier recommendation: **do not fork a full gym-manager**. Compose a thin web product from MIT-friendly workout sources, then copy the NimQuest proof + leaderboard pattern.

-----

## 1. Why this product

Commercial fitness apps extract workout data and sell subscriptions. FitProof is the opposite:

- Workouts stay simple enough to do at home.
- Completion is attested with a Nimiq wallet signature.
- Rewards are not a fixed token drip. They come from whatever is in the current pool.
- The chain is used for **proof and claim**, not for storing every rep.

That maps cleanly onto Nimiq Pay Mini Apps: a web app inside Nimiq Pay that can list accounts, sign messages, and send NIM, with keys never leaving the wallet.

It also maps onto Cycle II scoring: a finished product with repeat value, real Nimiq integration, and a reason to come back daily. Cycle II runs **24 August–18 September 2026**. Submissions close **18 September 2026, 23:59 UTC**.

-----

## 2. Goals and non-goals

### Goals for v1

1. A new user can start and finish a home workout in under 3 minutes.
2. Completing a quest produces a verifiable wallet-signed receipt.
3. Receipts feed a public leaderboard and activity feed.
4. A completed receipt can be claimed against the current reward pool.
5. NIM is part of the core loop, not a logo on a splash screen. Supporting NIM is required for scoring; logo-only integration does not count.
6. The app feels finished on first open: no dead ends, no dummy buttons. Competition rules require a usable product, not a prototype.

### Non-goals for v1

- Full gym programming (barbell 5/3/1, periodization, 1RM calculators).
- Medical-grade anti-cheat or computer-vision form checking.
- HealthKit / Google Fit sync. Mini Apps run in a WebView and do not get native health APIs.
- Nutrition logging, Bluetooth scales, or wearable ingestion.
- On-chain storage of workout history. NimQuest stores proofs off-chain after signature verification; FitProof should do the same.
- Forking wger, SparkyFitness, OpenTracks, or other native/self-hosted suites.

-----

## 3. Competition and platform constraints

These are product requirements, not footnotes.

|Constraint                         |Implication                                           |
|-----------------------------------|------------------------------------------------------|
|Must be a web Mini App in Nimiq Pay|No Flutter/Android-only bases                         |
|Must use Mini Apps Framework       |`@nimiq/mini-app-sdk`, injected provider              |
|Must support USDT, NIM, or both    |v1 supports **NIM claims + optional USDT later**      |
|Must be MIT + public GitHub        |Do not copy AGPL code into the repo                   |
|Must attribute third-party OSS     |Keep an `ATTRIBUTION.md`                              |
|No secrets in the repo             |Challenge keys and pool admin secrets stay in env vars|
|Must work on first try             |One happy path from open → workout → sign → claim     |
|Marketing is scored                |Build in public; ship a 60-second walkthrough         |

Official references:

- Mini Apps overview: <https://www.nimiq.com/developers/mini-apps/overview>
- Mini Apps API: <https://www.nimiq.com/developers/mini-apps/api-reference>
- Competition rules: <https://miniappscompetition.com/rules>
- Scoring: <https://miniappscompetition.com/scoring>
- Cycle II dates / prize pool: <https://www.nimiq.com/blog/mini-apps-competition-cycle-1-winner-announcement>
- Starter kit: <https://miniappscompetition.com/starterkit>

Current Cycle II scoring emphasis:

- 45 pts functionality / usefulness
- 25 pts Nimiq Pay integration
- 15 pts real usage
- 10 pts design / UX
- 5 pts builder promotion

Design the product so the **core promise completes without error**: start quest → finish → sign → appear on board → claim.

Wallet primitives available to the Mini App:

- `listAccounts()`
- `sign()`
- send NIM payments
- optional `requestDeviceIdentifier({ reason })` for anti-sybil / device-scoped ranking
- `window.nimiqPay.language` for localization

-----

## 4. Audience

**Primary:** Nimiq Pay users who will do 10–20 minutes of movement if there is a simple quest and a visible reward.

**Secondary:** Friends they can beat on a daily leaderboard.

**Not for v1:** Coaches, powerlifters, physiotherapy patients, or people who need Apple Watch workout sync.

Onboarding copy should make the audience obvious in seconds. That is a scored criterion.

-----

## 5. Product principle

Treat fitness data and blockchain as two layers:

```text
Workout layer     generate plan → guide session → log result
Proof layer       hash session → wallet signs challenge → server verifies
Reward layer      receipt qualifies user for whatever is in the pool
Social layer      feed + leaderboard consume verified receipts only
```

Nimiq does **not** store “Tony did 23 push-ups.”  
It stores “this wallet signed receipt `R` for quest `Q` on day `D`.”

That is the same honesty model as NimQuest: the signature proves wallet control after the app/server accepts that a quest was completed. It does not prove perfect physical form.

-----

## 6. Open-source sourcing plan

FitProof is a **new MIT repo**. It vendors or reimplements small pieces. It does not become a fork of a 6k-star gym app.

### 6.1 Use directly

|Piece                          |Source                                                                 |License                        |What we take                                                |
|-------------------------------|-----------------------------------------------------------------------|-------------------------------|------------------------------------------------------------|
|Exercise catalog               |[yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)|Unlicense                      |JSON + images for bodyweight moves                          |
|Workout generation / session UX|[Snouzy/workout-cool](https://github.com/Snouzy/workout-cool)          |MIT                            |Equipment + muscle filters, plan generation, session logging|
|Home / calisthenics templates  |[N-O-P-E/Ballast](https://github.com/N-O-P-E/Ballast)                  |check before copy              |PPL bodyweight templates, skill progressions, streak idea   |
|Game juice                     |[xarvy/lift1.5](https://github.com/xarvy/lift1.5)                      |check before copy              |Session grade, streak, completion celebration               |
|Proof + leaderboard            |[mystiquemide/nimquest](https://github.com/mystiquemide/nimquest)      |treat as reference; reimplement|Challenge → sign → verify → D1 receipt → masked leaderboard |
|Optional illustrations         |[bryllim/workout-guide](https://github.com/bryllim/workout-guide)      |check CC-BY-SA on artwork      |SVG frames if attribution is clean                          |

### 6.2 Do not vendor

- [wger-project/wger](https://github.com/wger-project/wger) — AGPL, Django suite
- [CodeWithCJ/SparkyFitness](https://github.com/CodeWithCJ/SparkyFitness) — family health stack
- [oliexdev/openScale](https://github.com/oliexdev/openScale) — Bluetooth scales
- [OpenTracksApp/OpenTracks](https://github.com/OpenTracksApp/OpenTracks) — native GPS app
- [EnjoyingFOSS/feeel](https://github.com/EnjoyingFOSS/feeel) — Flutter
- [LiamMorrow/LiftLog](https://github.com/LiamMorrow/LiftLog) / [brandonp2412/Flexify](https://github.com/brandonp2412/Flexify) — native phone apps, AGPL/not Mini App shaped

Competition rules allow forks only if significantly modified and license-compliant. Prefer **reimplementation + attribution** over dumping a whole foreign repo into the submission.

### 6.3 Recommended home-exercise subset

From free-exercise-db, v1 ships only no-equipment / bodyweight moves:

- Push-up, knee push-up
- Bodyweight squat
- Reverse lunge
- Plank / mountain climber
- Glute bridge
- Jumping jack
- Crunch / dead bug
- Wall sit
- Superman
- Calf raise

Keep the catalog under 20 moves. More content is not more product.

Frontend for browsing the source data: <https://yuhonas.github.io/free-exercise-db/>

-----

## 7. v1 feature set

### 7.1 Quests

Three quest types only.

**A. Daily Steps**  
Target: 6,000 steps default, user-adjustable 3,000–12,000.  
Tracking: DeviceMotion / Accelerometer peak detection while the Mini App is open, plus manual “I walked outside” with a cooldown.  
Honesty: steps are **best-effort**. Proof is “user kept the session open for N minutes and the counter crossed the target,” not HealthKit.

Reference implementation idea: MosqueSteps PWA step counter using Accelerometer / DeviceMotion.  
<https://github.com/ummahbuild/mosquesteps>

**B. Move session (run / brisk walk)**  
Target: 10 or 15 minutes.  
Tracking: on-screen timer + optional geolocation distance if permission exists.  
Complete when timer ends and user confirms.  
GPS is optional. Do not block the quest if location is denied.

**C. Home circuit**  
Target: one personalized 6–8 minute circuit.

Generator inputs:

- available space: floor only
- level: beginner / regular
- focus: full body / upper / core / legs

Output example:

1. 8 squats
2. 6 knee push-ups
3. 20s plank
4. 8 glute bridges
5. repeat 2–3 rounds

Session player:

- one exercise at a time
- large tap targets for +rep / complete set
- rest timer 20–40s
- previous-session target shown if any

This is the workout-cool / Ballast / lift1.5 slice.  
<https://github.com/Snouzy/workout-cool>  
<https://workout.cool>

### 7.2 Personalization

On first launch:

1. Connect Nimiq account
2. Choose level
3. Choose daily time budget: 5 / 10 / 15 minutes
4. Set step goal

The app then assigns today’s three quests. Completing **any one** yields a proof. Completing **all three** yields a daily bonus multiplier on claim points.

### 7.3 Proof of completion

Copy NimQuest, swap “quiz pass” for “quest pass.”

Flow:

1. Client finishes quest and posts session payload.
2. Server validates payload (duration, set count, rate limits, replay window).
3. Server issues a one-time challenge bound to `wallet + questId + day + sessionHash + nonce + expiry`.
4. User signs the challenge in Nimiq Pay.
5. Server verifies Ed25519 signature with `@nimiq/core`.
6. Server writes a receipt.
7. Leaderboard and feed update.

NimQuest details to reuse:

- challenge expires in 5 minutes
- challenge is single-use
- duplicate completion returns the existing receipt
- wallet mismatch / altered message / expired challenge are rejected
- leaderboard shows masked addresses
- no NIM movement is required to create a proof

Repo: <https://github.com/mystiquemide/nimquest>

Signing API reference:  
<https://www.nimiq.com/developers/mini-apps/api-reference>

### 7.4 Dynamic reward pool

Rewards are **not hardcoded as “always 2 NIM.”**

Pool is a server-side config:

```json
{
  "cycleId": "2026-09-04",
  "status": "open",
  "items": [
    { "id": "nim-micro", "type": "nim", "amount": "2", "stock": 40, "costPoints": 10 },
    { "id": "ai-25", "type": "ai_credits", "label": "25 AI credits", "stock": 20, "costPoints": 15 },
    { "id": "partner-band", "type": "partner", "label": "Partner band code", "stock": 5, "costPoints": 25 }
  ]
}
```

Rules:

- Completing a quest grants **points**, not a token.
- Points are only granted after a verified receipt.
- Claim spends points against an in-stock pool item.
- If the NIM item is selected, the app requests a NIM send from the **treasury / faucet wallet** *or* records an off-chain IOU plus a later batch payout. For the hackathon, prefer a **small on-chain NIM send from an app treasury** so NIM is visibly used.
- If stock is 0, the UI shows “pool empty — points saved for next drop.”
- Admin can hot-swap the pool without a client release.

This satisfies “incentivize NIM usage” without pretending every push-up mints a coin. Older competition materials explicitly give extra weight to Mini Apps that incentivize NIM.

### 7.5 Leaderboard

- Daily and weekly boards
- Rank by verified quest points, not raw self-reported reps
- Masked wallet + optional display name
- “Tony completed daily steps and moved from #12 to #7”
- Device identifier may be used as a soft sybil signal, not as the public identity. Mini App SDK supports `requestDeviceIdentifier`.

### 7.6 Activity feed

Append-only public events from verified receipts:

- `wallet_short` completed `Home Circuit · Beginner Full Body`
- `wallet_short` hit `6,000 steps`
- `wallet_short` claimed `2 NIM`

No free-text comments in v1. That keeps moderation and shipping cost down.

### 7.7 Streaks and grades

From lift1.5 / Ballast:

- Daily streak if at least one verified quest that calendar day
- Session grade A/B/C based on completing prescribed sets
- Home-screen streak number is the only “RPG” stat in v1

Do not build shops, skins, or talent trees.

-----

## 8. User flows

### 8.1 First open

1. Splash: “Do the quest. Sign the proof. Claim what’s in the pool.”
2. Connect Nimiq account (`listAccounts` + approval dialog).
3. Level + time budget.
4. Land on Today.

### 8.2 Complete home circuit

1. Today → Home Circuit
2. Preview 4 moves with images from free-exercise-db
3. Start
4. Tap reps / mark set done / rest
5. Finish → session summary
6. “Prove it” → native sign dialog
7. Receipt card + share deeplink
8. Optional “Claim”

Deeplink formats already exist:

- `nimiqpay://miniapp?url=your-app.com`
- `https://nimpay.app/miniapps/open/your-app.com`

### 8.3 Claim

1. Wallet has points ≥ item cost
2. Item is in stock
3. If item is NIM: treasury pays user, or user is shown payout pending + explorer link
4. If item is partner / AI credits: show code or credit balance
5. Feed event is written

### 8.4 Failure states that must exist

- Nimiq Pay provider missing → “Open this inside Nimiq Pay”
- User rejects sign → quest stays complete locally, proof pending
- Challenge expired → one-tap reissue
- Pool empty → points retained
- Motion permission denied → steps quest falls back to timed walk

Error handling is a scored functionality item.

-----

## 9. Screens

1. Today
2. Quest player
3. Quest complete / prove
4. Claim / pool
5. Feed
6. Leaderboard
7. History (my receipts)
8. Settings (level, step goal, language from `window.nimiqPay.language`)

No tab beyond those eight. Mobile-first. Large tap targets. One primary button per screen.

-----

## 10. Data model

### Session (client → server, pre-proof)

```text
sessionId
wallet
questType          steps | move | circuit
questId
startedAt
endedAt
durationSec
payload            { steps } | { minutes, meters? } | { exercises: [{ id, sets, reps }] }
clientMeta         { userAgent, locale }
```

### Challenge

```text
challengeId
wallet
sessionHash
questId
dayKey
nonce
issuedAt
expiresAt
usedAt
```

### Receipt

```text
receiptId
wallet
questId
dayKey
sessionHash
signature
publicKey
pointsAwarded
createdAt
```

### Account

```text
wallet
displayName?
deviceId?
pointsBalance
streak
lastQuestDay
```

### PoolItem / Claim

```text
claimId
wallet
receiptIds[]
itemId
status          pending | paid | failed
txHash?
createdAt
```

Leaderboard is a materialized view over receipts, not a separate source of truth.

-----

## 11. Architecture

Match NimQuest’s deploy shape so the Mini App stays cheap and fast.

```text
Vite frontend  →  Cloudflare Worker
                     ├─ static Mini App
                     ├─ POST /api/sessions
                     ├─ POST /api/challenges
                     ├─ POST /api/complete
                     ├─ POST /api/claims
                     ├─ GET  /api/today
                     ├─ GET  /api/feed
                     ├─ GET  /api/leaderboard
                     └─ GET  /api/pool
D1
  accounts, sessions, challenges, receipts, claims, pool, rate_limits
```

Reference stack: NimQuest uses Vite + Cloudflare Workers + D1 + `@nimiq/mini-app-sdk` + `@nimiq/core`.

### Trust boundaries

|Runs in browser                     |Runs on worker                                                |
|------------------------------------|--------------------------------------------------------------|
|UI, timers, rep taps, motion counter|validation, challenge issue, signature verify, points, payouts|
|exercise images                     |pool inventory                                                |
|draft session                       |rate limits                                                   |

Never put treasury keys, HMAC secrets, or payout logic in the client.

### Anti-abuse for v1 (good enough)

- 1 verified receipt per quest type per wallet per UTC day
- max 5 open challenges per wallet
- challenge TTL 5 minutes
- IP + wallet rate limits
- reject EVM addresses for NIM proof path
- optional device identifier as a cluster signal
- do **not** claim this prevents all cheating

NimQuest already tests replay, expiry, wallet mismatch, and duplicate completion. FitProof should ship the same tests.

-----

## 12. Reward economics for the hackathon

Keep the treasury tiny and visible.

- Daily faucet cap per wallet: 1 NIM claim
- Global daily cap: configurable
- Points: circuit 10, steps 8, move 8, daily triple-clear +5
- NIM item costs 10 points and pays 1–2 NIM
- Partner / AI credit items exist even if stock is 0, so the “dynamic pool” UI is real

If live NIM payout is risky before submission, ship:

1. Verified receipt
2. Claim creates a pending payout
3. A documented treasury script flushes pending NIM claims

Judges still see NIM as part of the loop. A logo is not enough.

-----

## 13. Legal, privacy, honesty

Competition disallows undisclosed data collection. Disclose in-app and in README:

- wallet address
- workout session summaries
- optional device identifier
- optional coarse location if user starts a GPS move session

Do not collect heart rate, contacts, or photos.

Copy must not say “blockchain proves you exercised.”  
Correct line: **“Your wallet signs that you completed this app quest.”**

Health disclaimer: not medical advice. Bodyweight moves only. Users can skip any exercise.

Attribution file required for free-exercise-db images and any workout-cool / NimQuest-inspired code.

-----

## 14. Design requirements

Scored items include first impression, visual consistency, navigation without instructions, and mobile experience.

- Dark, high-contrast gym-card UI
- One accent color
- Today screen shows 3 quest cards + streak + pool teaser
- Native Nimiq Pay dialogs are the wallet UX; do not invent a fake seed-phrase screen
- Empty states for “no receipts yet” and “pool empty”
- Respect `window.nimiqPay.language` for en + one extra language if time

-----

## 15. Analytics and success metrics

### Product

- Time-to-first-verified-receipt < 4 minutes for a new wallet
- % of sessions that reach sign dialog
- % of signed receipts that claim
- D1 unique wallets with ≥1 receipt
- 2-day return rate

### Competition

- Live URL opens inside Nimiq Pay on first try
- Walkthrough video
- Public build log on X / Skool
- At least a handful of real masked wallets on the board, like NimQuest’s live D1 board rather than seeded rows.

-----

## 16. Delivery plan (now → 18 September)

Today is 4 September. Treat this as a 14-day ship.

**Days 1–2 — skeleton**  
Mini App boots in Nimiq Pay. Connect wallet. Dummy Today screen. Deploy Worker.

**Days 3–5 — workout layer**  
Circuit player + 12 exercises from free-exercise-db. Steps timer. Move timer.

**Days 6–8 — proof layer**  
Port NimQuest challenge/verify/receipt. History + masked leaderboard.

**Days 9–10 — rewards + feed**  
Pool config, claim UI, activity feed, streak.

**Days 11–12 — polish**  
Error states, empty states, mobile layout, attribution, README, demo video.

**Days 13–14 — freeze + promote**  
Load test the happy path on a phone inside Nimiq Pay. Submit. Sit in Sip & Ship on 9 and 16 September.

If something slips, cut in this order: GPS distance, AI credits, partner codes, weekly board, second language. Never cut: circuit + sign + leaderboard + NIM claim.

-----

## 17. Testing bar

Minimum automated tests, modeled on NimQuest:

- cannot complete without finishing the quest payload
- expired challenge rejected
- replayed challenge rejected
- wrong wallet rejected
- second circuit the same day returns existing receipt
- claim rejected if pool item is out of stock
- claim rejected if points insufficient
- CORS / origin checks on write routes

Plus one Playwright smoke: open → start circuit → finish → mock sign → receipt visible.

-----

## 18. Risks

|Risk                              |Mitigation                                           |
|----------------------------------|-----------------------------------------------------|
|DeviceMotion unreliable in WebView|Timed walk fallback; do not make steps the only quest|
|Users refuse to sign              |Local complete state + persistent “Prove it” button  |
|Cheating / multi-account farming  |Daily caps, device id, tiny NIM amounts              |
|AGPL contamination                |New MIT repo; copy ideas not wger/LiftLog source     |
|Pool payout ops                   |Start with micro-NIM and a pending-payout queue      |
|Scope explosion                   |Three quest types, eight screens, no social comments |

-----

## 19. v1 acceptance checklist

The product is done when all of these are true:

- [ ] Opens inside Nimiq Pay and reads accounts
- [ ] User can finish a home circuit with images and a rest timer
- [ ] User can finish a timed move session
- [ ] User can run a steps or timed-walk quest
- [ ] Finish issues a challenge; Nimiq Pay sign dialog appears
- [ ] Verified receipt appears on History, Feed, and Leaderboard
- [ ] User can claim points against a live pool that may include NIM
- [ ] Empty pool and rejected-signature states are explicit
- [ ] README lists sources and licenses
- [ ] Repo is public MIT with no secrets
- [ ] 60-second walkthrough exists
- [ ] Deeplink opens the Mini App

-----

## 20. Suggested public description (≤250 words)

Use this for the competition form:

> FitProof is a home-fitness Mini App for people who will move if the session is short and the reward is real. Each day you get three quests: a step target, a timed walk or run, and a bodyweight circuit generated from the equipment you actually have — which, at home, is none.
> 
> Completing a quest does not mint a mystery token. It creates a session summary, then asks your Nimiq wallet to sign a one-time proof. That receipt is what lands you on the leaderboard, in the public activity feed, and in line for the current reward pool. The pool can pay NIM, partner perks, or AI credits depending on what is stocked that week.
> 
> Nimiq Pay is used for account connect, message signing, and NIM claims. Workout history stays on the app server. The chain is the attestation layer, not a gym diary.

-----

## 21. Source index

**Platform**

- <https://www.nimiq.com/developers/mini-apps/overview>
- <https://www.nimiq.com/developers/mini-apps/api-reference>
- <https://www.nimiq.com/blog/mini-apps-framework>

**Competition**

- <https://miniappscompetition.com/rules>
- <https://miniappscompetition.com/scoring>
- <https://miniappscompetition.com/starterkit>
- <https://www.nimiq.com/blog/the-nimiq-mini-apps-competition-registration-is-open>
- <https://www.nimiq.com/blog/mini-apps-competition-cycle-1-winner-announcement>

**Build-on-top**

- <https://github.com/Snouzy/workout-cool>
- <https://github.com/yuhonas/free-exercise-db>
- <https://github.com/N-O-P-E/Ballast>
- <https://github.com/xarvy/lift1.5>
- <https://github.com/mystiquemide/nimquest>
- <https://github.com/bryllim/workout-guide>

**Do not fork as the app shell**

- <https://github.com/wger-project/wger>
- <https://github.com/CodeWithCJ/SparkyFitness>
- <https://github.com/OpenTracksApp/OpenTracks>

-----

If you want a next artifact from this PRD, the most useful one is a **repo skeleton spec**: folder layout, Worker routes, D1 schema SQL, and the exact Today-screen component list.