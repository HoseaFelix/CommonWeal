# Commonweal Quick Start

## Project Shape

Commonweal is a grant allocation app built on GenLayer. It helps a funding committee answer one practical question: is this application ready for capital release?

## Main Flows

1. Review an application packet
2. Compare two reviewed applicants
3. Benchmark a proposal against a rubric
4. Generate a funding memo

## Main Contract

- File: `genlayer_contracts/grantCouncilLedger.py`
- Class: `GrantCouncilLedger`

## Setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_CHAIN_ID=62255
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

## Deploy

1. Open `https://studio.genlayer.com`
2. Upload `genlayer_contracts/grantCouncilLedger.py`
3. Deploy the contract
4. Copy the resulting address into `.env.local`

## Start

```bash
npm run dev
```

Open `http://localhost:3000`.
