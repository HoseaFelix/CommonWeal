# ComplianceHub Quick Start

## What This Project Is

ComplianceHub is a GenLayer application for policy risk analysis and compliance operations. It lets users:

- Analyze a policy
- Compare two policy analyses
- Benchmark a policy against major standards
- Review audit activity
- Generate compliance reports

## Main Contract

- File: `genlayer_contracts/complianceHub.py`
- Class: `ComplianceHub`

## Frontend Areas

- `Dashboard.tsx`: portfolio overview
- `AnalyzePanel.tsx`: submit policy text
- `ComparisonPanel.tsx`: compare analyses
- `BenchmarkPanel.tsx`: run standards checks
- `AuditPanel.tsx`: inspect activity history
- `ReportsPanel.tsx`: generate summaries

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

## Deploy The Contract

1. Open `https://studio.genlayer.com`
2. Upload `genlayer_contracts/complianceHub.py`
3. Deploy it
4. Copy the contract address into `.env.local`

## Start Locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Wagmi
- viem
- GenLayer
