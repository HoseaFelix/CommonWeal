# VendorLens

VendorLens is a GenLayer workspace for third-party vendor due diligence. Teams can review vendor materials, compare vendors head to head, benchmark evidence against trust frameworks, and publish concise approval briefings on-chain.

## What It Does

- Reviews vendor materials and returns a trust score plus decision posture
- Compares two reviewed vendors for differentiation and shared exposure
- Benchmarks a vendor against SOC 2, ISO 27001, GDPR, or HIPAA expectations
- Generates a portfolio-level due diligence briefing
- Records all actions in a durable activity ledger

## Core Contract

- File: `genlayer_contracts/vendorTrustLedger.py`
- Class: `VendorTrustLedger`

## Frontend Areas

- `Overview`: portfolio snapshot of reviewed vendors
- `Vendor Intake`: submit materials for a new review
- `Compare`: weigh two vendors against each other
- `Frameworks`: benchmark a vendor against a trust framework
- `Activity`: inspect the permanent decision ledger
- `Briefing`: generate a summary report

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

Upload `genlayer_contracts/vendorTrustLedger.py` to GenLayer Studio, deploy it, and place the new address in `.env.local`.

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
