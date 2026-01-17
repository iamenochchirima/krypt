const fs = require("fs");
const path = require("path");

const artifactPath = path.join(__dirname, "../artifacts/contracts/SimpleNFT.sol/SimpleNFT.json");
const outputPath = path.join(__dirname, "../../../client/lib/contracts/SimpleNFT.ts");

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const output = `// Auto-generated from smart_contracts/evm - do not edit manually
// Run: cd smart_contracts/evm && pnpm compile && pnpm export-abi

export const NFT_CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export const NFT_CONTRACT_BYTECODE = "${artifact.bytecode}" as \`0x\${string}\`;
`;

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, output);
console.log("Exported to:", outputPath);
