# ComplianceHub - Deployment Guide

## Overview
ComplianceHub is an enterprise compliance platform built on GenLayer featuring policy analysis, comparison, benchmarking, and reporting capabilities.

## What's Included

### Smart Contract (GenLayer)
- ✅ Policy Analysis with risk scoring
- ✅ Policy Comparison with divergence analysis
- ✅ Compliance Benchmarking (GDPR, CCPA, ISO27001, HIPAA)
- ✅ Aggregated Compliance Reporting
- ✅ Immutable Audit Trail
- ✅ Multi-user workspace isolation

### Frontend (Next.js)
- ✅ Dashboard with portfolio metrics
- ✅ Policy analysis interface
- ✅ Comparison tool
- ✅ Benchmark runner
- ✅ Audit trail viewer
- ✅ Report generator

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Required variables:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<deployed_contract_address>
NEXT_PUBLIC_GENLAYER_CHAIN_ID=62255
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

### 3. Contract Deployment

The smart contract at `genlayer_contracts/policyriskanalyzer.py` provides:

**Write Methods:**
- `analyze_policy(policy_text: str, policy_name: str)` - Submit policy for analysis
- `compare_policies(analysis_a_id: str, analysis_b_id: str)` - Compare two policies
- `benchmark_against_standard(analysis_id: str, standard_type: str)` - Benchmark against compliance standard
- `generate_compliance_report()` - Generate portfolio report

**Read Methods:**
- `get_user_analyses(user_address: str)` - Retrieve all user's analyses
- `get_user_comparisons(user_address: str)` - Retrieve all user's comparisons
- `get_user_benchmarks(user_address: str)` - Retrieve all user's benchmarks
- `get_user_audit_trail(user_address: str)` - Retrieve audit trail

**To deploy:**
1. Go to [GenLayer Studio](https://studio.genlayer.com)
2. Create a new project
3. Upload `genlayer_contracts/policyriskanalyzer.py`
4. Deploy the contract (class name: `ComplianceHub`)
5. Copy the deployed contract address
6. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

### 4. Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Workflow

### 1. Policy Analysis
```
1. User submits policy text
2. GenLayer validators analyze with AI
3. Result stored on-chain
4. Risk metrics displayed on dashboard
```

### 2. Policy Comparison
```
1. User selects 2 analyzed policies
2. Validators compare divergences
3. Harmonization suggestions generated
4. Results stored for audit trail
```

### 3. Compliance Benchmarking
```
1. User selects policy & standard (GDPR/CCPA/ISO27001/HIPAA)
2. Validators assess compliance gaps
3. Score, timeline, and recommendations generated
4. Results stored permanently
```

### 4. Report Generation
```
1. User requests compliance report
2. Contract aggregates all analyses
3. Portfolio metrics calculated
4. Executive summary with recommendations
```

## Wallet Setup

### Option 1: Auto-Generated (Testing)
The app auto-generates a test wallet. Optionally set in `.env.local`:
```
WALLET_PRIVATE_KEY=0x...
```

### Option 2: MetaMask (Production)
- Install MetaMask browser extension
- Connect to GenLayer Studio testnet
- Use wallet button in app to connect

## Building for Production

```bash
npm run build
npm start
```

## Deployment Platforms

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Other Platforms
- Netlify, Render, Railway, etc.

### Required Environment Variables
```
NEXT_PUBLIC_CONTRACT_ADDRESS
NEXT_PUBLIC_GENLAYER_CHAIN_ID=62255
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

## Package Dependencies

### Core
- `next` - React framework
- `react` & `react-dom` - UI
- `genlayer-js` - GenLayer SDK
- `zustand` - State management
- `zod` - Schema validation

### Styling
- `tailwindcss` - Utility CSS
- `daisyui` - Tailwind components

### Web3
- `viem` - Ethereum utilities
- `wagmi` - React wallet hooks

## Compliance Standards Supported

- **GDPR** - General Data Protection Regulation
- **CCPA** - California Consumer Privacy Act
- **ISO 27001** - Information Security Management
- **HIPAA** - Health Insurance Portability & Accountability

## Contract Storage Structure

### TreeMaps (Multi-user isolation)
- `analyses: TreeMap[str, PolicyAnalysis]` - All policy analyses
- `user_analyses: TreeMap[str, DynArray[str]]` - Per-user analysis IDs
- `comparisons: TreeMap[str, PolicyComparison]` - Policy comparisons
- `benchmarks: TreeMap[str, ComplianceBenchmark]` - Benchmarks
- `audit_trails: TreeMap[str, AuditTrail]` - Activity log

## Validation Rules

### Policy Analysis
- Risk score: 0-100 (integer)
- Risk level: Low/Medium/High/Critical
- Risky clauses: List of {clause, risk, reason}
- Compliance flags: List of strings

### Policy Comparison
- Divergence score: 0-100 (0 = identical, 100 = completely different)
- Key differences: List of divergences
- Shared risks: List of common risks

### Benchmarking
- Compliance score: 0-100 (100 = fully compliant)
- Gaps: List of missing controls
- Improvement priority: High/Medium/Low
- Timeline: Suggested remediation timeframe

## Troubleshooting
```
Submits a word/phrase for lexicographic analysis using GenLayer consensus.

### View Functions
```python
get_analysis(analysis_id: str) -> WordAnalysis
get_user_analyses(user_address: str) -> List[WordAnalysis]
get_analysis_count() -> int
get_latest_analysis_id() -> str
```

## Troubleshooting

### "Wallet not connected"
- Click the wallet button in top-right
- Use auto-generated wallet or connect MetaMask

### Transaction timeout
- GenLayer can take 30-60 seconds to finalize
- Check browser console for transaction hash
- Verify transaction on GenLayer Studio explorer

### "Contract address not configured"
- Check `.env.local` has `NEXT_PUBLIC_CONTRACT_ADDRESS`
- Ensure you deployed the contract on GenLayer Studio

### Empty analysis results
- Ensure the contract was deployed correctly
- Check GenLayer Studio console for contract errors
- Verify all required fields in response

## File Structure

```
app/
├── components/
│   ├── input.tsx          # Word input form (replaces YouTube input)
│   ├── animatedContent.tsx # Results display (updated for word analysis)
│   └── WalletButton.tsx
├── context/
│   └── WalletContext.tsx   # Wallet state management
├── page.tsx               # Main page (updated branding)
├── layout.tsx
└── globals.css

genlayer_contracts/
└── dictionary.py          # Smart contract (AI Dictionary)

constants/
├── genlayer_config.ts     # GenLayer configuration
└── constant.js            # Utilities (Supadata removed)

store/
└── store.ts               # Zustand stores

types/
└── index.d.ts             # TypeScript types
```

## Performance Notes

- Each analysis costs approximately 0.005 GEN
- GenLayer consensus takes 30-60 seconds
- Analyses are stored on-chain permanently
- No centralized API dependencies

## Support

For GenLayer documentation, visit: https://docs.genlayer.com

## Next Steps

1. ✅ Dependencies cleaned up (removed Supadata, YouTube, Gemini)
2. ✅ Contract updated to `AIDictionary` with lexicographic focus
3. ✅ Frontend converted to word/phrase input
4. ✅ UI updated with dictionary branding
5. 📋 **TODO**: Deploy contract to GenLayer Studio
6. 📋 **TODO**: Run `npm install` to get clean dependencies
7. 📋 **TODO**: Update `.env.local` with your contract address
8. 📋 **TODO**: Test locally with `npm run dev`
9. 📋 **TODO**: Deploy to production platform

Happy lexicographing! 📚✨
