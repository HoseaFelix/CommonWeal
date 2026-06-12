import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { studionet } from 'genlayer-js/chains';
import * as fs from 'fs';
import * as path from 'path';

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
        chain: studionet,
        transport: http()
    });

    const contractPath = path.resolve(__dirname, '../genlayer_contracts/grantCouncilLedger.py');
    const contractSource = fs.readFileSync(contractPath, 'utf8');

    console.log(`Deploying contract from ${contractPath}...`);

    // Deploy the raw contract source as hex-encoded bytecode.
    const hash = await client.deployContract({
        abi: [],
        bytecode: `0x${Buffer.from(contractSource, 'utf8').toString('hex')}`,
        args: [],
        account,
        chain: studionet
    });

    console.log("Deployment Tx Hash:", hash);
}

main().catch(console.error);
