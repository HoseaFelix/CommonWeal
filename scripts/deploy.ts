import { createWalletClient, createPublicClient, http, defineChain } from 'viem';
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
    console.log("Starting deployment...");

    // 1. Get Wallet
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
        console.error("Error: PRIVATE_KEY not found in .env");
        console.error("Please add your GenLayer-funded private key to .env file:");
        console.error("PRIVATE_KEY=0x...");
        process.exit(1);
    }

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    console.log(`Using account: ${account.address}`);

    const walletClient = createWalletClient({
        account,
        chain: GENLAYER_CHAIN,
        transport: http()
    });

    const publicClient = createPublicClient({
        chain: GENLAYER_CHAIN,
        transport: http()
    });

    // 2. Read Contract Source
    const contractPath = path.resolve(__dirname, '../genlayer_contracts/vendorTrustLedger.py');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    console.log(`Reading contract from ${contractPath}...`);

    // 3. Deploy using sendTransaction
    const bytecode = `0x${Buffer.from(contractSource, 'utf8').toString('hex')}`;

    console.log("Broadcasting deployment transaction...");
    const hash = await walletClient.sendTransaction({
        data: bytecode as `0x${string}`,
        to: undefined,
        kzg: undefined
    });

    console.log(`Transaction sent! Hash: ${hash}`);
    console.log("Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.contractAddress) {
        console.log("\nDeployment successful.");
        console.log(`New Contract Address: ${receipt.contractAddress}`);
        console.log("\nPlease update NEXT_PUBLIC_CONTRACT_ADDRESS with this address.");
    } else {
        console.error("Deployment failed: No contract address in receipt.");
        console.log(receipt);
    }
}

main().catch(console.error);
