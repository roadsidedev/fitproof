# FitProof phased implementation plan

## Phase 1 — Foundation and workout loop

**Goal:** a mobile-first Mini App shell that makes the product understandable and lets a user complete a circuit, move timer, or steps fallback without dead ends.

**Deliverables:** Vite/React/TypeScript baseline; dark card UI; Today dashboard; three quest types; deterministic circuit generator; circuit player with rep/set progress and rest timer; timed move and steps fallback; onboarding state; MIT attribution and privacy copy.

**TDD bar:** unit tests cover circuit generation, quest completion rules, and steps/move timer boundaries. A build must pass before the phase commit.

## Phase 2 — Proof and identity

**Goal:** replace local completion with a server-verifiable, wallet-signed receipt.

**Deliverables:** Worker/D1 API contracts for sessions, challenges, completion, today, history, feed, and leaderboard; one-time challenge model with expiry, replay, wallet binding, UTC daily duplicate protection, rate limits, origin checks; Nimiq Pay adapter with a safe local mock; receipt history and masked wallet identity.

**TDD bar:** tests for incomplete payload, expiry, replay, wallet mismatch, duplicate daily completion, and CORS/origin rejection, plus a Playwright happy path with mocked signing.

## Phase 3 — Dynamic rewards and social proof

**Goal:** make verified receipts useful through a live pool, claims, streaks, feed, and leaderboard.

**Deliverables:** server-side pool inventory and claim state machine; points and triple-clear bonus; NIM pending payout path; empty/insufficient stock states; daily/weekly materialized leaderboard; append-only activity feed; settings/localization and production hardening.

**TDD bar:** tests for stock and points constraints, idempotent claims, streak calculation, and pool updates. Run the full suite and mobile smoke test before the phase commit.

## Commit policy

Each phase is committed separately only after its tests and production build pass. No secrets, treasury keys, or undisclosed health data are stored in this repository. The implementation reuses ideas and reimplements behavior rather than copying AGPL application code.
