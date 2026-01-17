const fs = require("fs");
const path = require("path");

const contracts = [
  { name: "SimpleNFT", file: "SimpleNFT.sol", abiName: "NFT_CONTRACT_ABI", bytecodeName: "NFT_CONTRACT_BYTECODE" },
  { name: "SimpleEdition", file: "SimpleEdition.sol", abiName: "EDITION_CONTRACT_ABI", bytecodeName: "EDITION_CONTRACT_BYTECODE" },
];

const outputDir = path.join(__dirname, "../../../client/lib/contracts");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const contract of contracts) {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${contract.file}/${contract.name}.json`);
  const outputPath = path.join(outputDir, `${contract.name}.ts`);

  if (!fs.existsSync(artifactPath)) {
    console.log(`Skipping ${contract.name} - artifact not found`);
    continue;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const output = `// Auto-generated from smart_contracts/evm - do not edit manually
// Run: cd smart_contracts/evm && pnpm compile && pnpm export-abi

export const ${contract.abiName} = ${JSON.stringify(artifact.abi, null, 2)} as const;

export const ${contract.bytecodeName} = "${artifact.bytecode}" as \`0x\${string}\`;
`;

  fs.writeFileSync(outputPath, output);
  console.log(`Exported ${contract.name} to:`, outputPath);
}
