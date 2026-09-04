# FitProof

FitProof is a mobile-first home-fitness Mini App concept for Nimiq Pay. The core loop is **move → sign a proof → earn from the current pool**. The implementation follows the attached PRD and is intentionally a thin reimplementation rather than a fork of a gym-management product.

## Current implementation

The repository currently contains a polished Vite/React/TypeScript foundation with:

- Today dashboard with three quests: steps/timed fallback, move timer, and a generated bodyweight circuit.
- Beginner and regular circuit levels, large touch targets, rest/session guidance, and completion feedback.
- Proof-domain model covering one-time challenges, five-minute expiry, replay prevention, wallet binding, daily duplicate protection, masked addresses, and receipt points.
- Dynamic reward-pool model covering NIM/AI-credit/partner items, stock and points constraints, pending NIM claims, and UTC streaks.
- MIT attribution and privacy disclosures.

The browser currently uses a safe local signing mock so the product can be exercised without a Nimiq Pay provider. Production wiring must replace that mock with `@nimiq/mini-app-sdk` and move verification, points, inventory, and payout logic to a Cloudflare Worker backed by D1.

## Run locally

```bash
npm install
npm test
npm run build
npm run dev
```

The automated suite contains **17 tests** across the workout, proof, rewards, expiry, replay, wallet mismatch, duplicate completion, stock, points, and streak rules.

## Phased delivery

See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the TDD gates and phase boundaries. The remote `main` branch contains separate pushed commits for each completed phase:

| Phase | Commit | Result |
|---|---|---|
| 1. Foundation and workout loop | `587c113` | Vite shell, quests, circuit player, tests |
| Cleanup | `31bbbe9` | Ignore local dependencies and build output |
| 2. Proof and identity | `96120c6` | Challenge/receipt domain and tests |
| 3. Rewards and social-domain foundation | `ffa175e` | Dynamic pool, claims, streaks, attribution |

## Production follow-ups

Before competition submission, connect the real Nimiq Pay provider, implement the Worker/D1 routes from the PRD (`/api/sessions`, `/api/challenges`, `/api/complete`, `/api/claims`, `/api/today`, `/api/feed`, `/api/leaderboard`, and `/api/pool`), verify Ed25519 signatures with `@nimiq/core`, add Playwright coverage for the mocked sign happy path, and run the Mini App inside Nimiq Pay. Treasury keys and all signing/payout secrets belong only in deployment environment variables.

FitProof does not claim that a signature proves physical form. The honest product statement is: **“Your wallet signs that you completed this app quest.”**

## License

MIT. Third-party attribution and data-collection disclosures are in [`ATTRIBUTION.md`](./ATTRIBUTION.md).
