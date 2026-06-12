import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { studionet } from 'genlayer-js/chains';
import * as fs from 'fs';
import * as path from 'path';

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
        chain: studionet,
        transport: http()
    });

    const publicClient = createPublicClient({
        chain: studionet,
        transport: http()
    });

    // 2. Read Contract Source
    const contractPath = path.resolve(__dirname, '../genlayer_contracts/grantCouncilLedger.py');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    console.log(`Reading contract from ${contractPath}...`);
    console.log(`Deploying to ${studionet.name} (chain id ${studionet.id})...`);

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
