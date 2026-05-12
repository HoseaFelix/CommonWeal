# VendorLens Deployment Guide

## Overview

VendorLens is a GenLayer application for vendor due diligence, framework benchmarking, and approval briefings.

## Main Contract

- File: `genlayer_contracts/vendorTrustLedger.py`
- Class: `VendorTrustLedger`

## Prerequisites

- Node.js 20+
- npm
- A funded GenLayer wallet or private key for contract deployment

## Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_CHAIN_ID=62255
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
PRIVATE_KEY=0x...
```

## Deploy Through GenLayer Studio

1. Open `https://studio.genlayer.com`
2. Create or open a project
3. Upload `genlayer_contracts/vendorTrustLedger.py`
4. Deploy the contract
5. Copy the deployed address into `.env.local`

## Run Locally

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Helper Scripts

The deployment helpers in `scripts/` are configured to read:

```text
genlayer_contracts/vendorTrustLedger.py
```

## Supported Frameworks

- SOC 2
- ISO 27001
- GDPR
- HIPAA

## Troubleshooting

### Missing contract address

- Add `NEXT_PUBLIC_CONTRACT_ADDRESS` to `.env.local`
- Restart the dev server after changing environment variables

### Deployment script cannot run

- Make sure `PRIVATE_KEY` is set
- Confirm the wallet has enough GEN
- Confirm the contract file path is correct
