import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { lintContractSource } = require('genskill-mcp/dist/genlayerAuthoring.js');

const contractPath = path.resolve(process.cwd(), 'genlayer_contracts/grantCouncilLedger.py');
const source = fs.readFileSync(contractPath, 'utf8');
const result = lintContractSource(source);

console.log(`Contract: ${contractPath}`);
console.log(`Errors: ${result.errors}  Warnings: ${result.warnings}  Info: ${result.infos}`);

for (const finding of result.findings) {
  const line = finding.line ? `:${finding.line}` : '';
  console.log(`${finding.level.toUpperCase()} ${contractPath}${line} [${finding.rule}] ${finding.message}`);
  if (finding.hint) {
    console.log(`Hint: ${finding.hint}`);
  }
}

if (!result.ok) {
  process.exitCode = 1;
}
