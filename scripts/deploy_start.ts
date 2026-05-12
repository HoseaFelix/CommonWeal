
import { createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';

// GenLayer Studio Config
const GENLAYER_CHAIN = defineChain({
    id: 62255,
    name: 'GenLayer Studio',
    network: 'genlayer-studio',
    nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
    rpcUrls: { default: { http: ['https://studio.genlayer.com/api'] } }
});

async function main() {
    // The deployment wallet must hold enough GEN for contract deployment.
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        console.error("Please set PRIVATE_KEY in .env");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    const client = createWalletClient({
        account,
        chain: GENLAYER_CHAIN,
        transport: http()
    });

    const contractPath = path.resolve(__dirname, '../genlayer_contracts/vendorTrustLedger.py');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    console.log(`Deploying contract from ${contractPath}...`);

    // Deploy the raw contract source as hex-encoded bytecode.
    const hash = await client.deployContract({
        abi: [],
        bytecode: `0x${Buffer.from(contractSource, 'utf8').toString('hex')}`,
        args: [],
        account,
        chain: GENLAYER_CHAIN
    });

    console.log("Deployment Tx Hash:", hash);
}

main().catch(console.error);
