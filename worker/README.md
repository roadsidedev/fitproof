# FitProof Worker

This directory owns the production persistence boundary described in the PRD. Apply `schema.sql` to D1 before routing traffic.

Required runtime bindings:

- `DB`: Cloudflare D1 database binding
- `ALLOWED_ORIGIN`: the exact deployed Mini App origin
- `TREASURY_ADDRESS`: payout destination configuration (never a private key in client code)
- `TREASURY_PRIVATE_KEY`: server-only secret if direct payouts are enabled

The Worker must verify Nimiq signatures server-side before inserting a receipt. Client-side proof objects are never authoritative.
