# Commonweal

Commonweal is a GenLayer grant allocation workspace for reviewing applications, comparing applicants, benchmarking proposals against funding rubrics, and generating release memos on-chain.

## What It Does

- Reviews application packets and returns a viability score plus funding recommendation
- Compares two reviewed applicants for separation and overlapping risk
- Benchmarks a proposal against impact, feasibility, transparency, or equity rubrics
- Generates a portfolio-level funding memo
- Records every action in a durable ledger

## Core Contract

- File: `genlayer_contracts/grantCouncilLedger.py`
- Class: `GrantCouncilLedger`

## Frontend Areas

- `Signal`: portfolio snapshot of reviewed applications
- `Intake`: submit materials for a new funding review
- `Matchup`: compare two applicants head to head
- `Rubrics`: test one proposal against a funding rubric
- `Ledger`: inspect the permanent action trail
- `Memo`: generate a committee-ready funding summary

## Run Locally

```bash
npm install
npm run dev
```

Set `.env.local` before using the app:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_CHAIN_ID=62255
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

## Deploy The Contract

Upload `genlayer_contracts/grantCouncilLedger.py` to GenLayer Studio, deploy it, and place the new address in `.env.local`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Wagmi
- viem
- GenLayer

## License

MIT
