# VendorLens Quick Start

## Project Shape

VendorLens is a procurement-facing due diligence app built on GenLayer. It helps a team answer one practical question: should we trust this vendor enough to move forward?

## Main Flows

1. Review a vendor dossier
2. Compare two reviewed vendors
3. Benchmark a vendor against a framework
4. Generate a due diligence briefing

## Main Contract

- File: `genlayer_contracts/vendorTrustLedger.py`
- Class: `VendorTrustLedger`

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
2. Upload `genlayer_contracts/vendorTrustLedger.py`
3. Deploy the contract
4. Copy the resulting address into `.env.local`

## Start

```bash
npm run dev
```

Open `http://localhost:3000`.
