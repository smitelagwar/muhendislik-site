import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const contractFiles = [
  "tests/document-studio/cad-review-stage02-contract.test.ts",
  "tests/document-studio/cad-chain-stage03-contract.test.ts",
  "tests/document-studio/cad-distance-stage04-contract.test.ts",
  "tests/document-studio/cad-area-stage05-contract.test.ts",
  "tests/document-studio/cad-markup-stage06-contract.test.ts",
  "tests/document-studio/cad-stage07-contract.test.ts",
  "tests/document-studio/cad-stage08-contract.test.ts",
  "tests/document-studio/cad-stage09-contract.test.ts",
  "tests/document-studio/cad-stage10-perf-contract.test.ts",
  "tests/document-studio/cad-review-gate-separation.test.ts",
];

const absoluteFiles = contractFiles.map((file) => resolve(process.cwd(), file));
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...absoluteFiles], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error("SYNTHETIC_CONTRACT_FAIL: Could not start Node test runner.", result.error);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`SYNTHETIC_CONTRACT_FAIL: Node test runner exited with ${result.status ?? result.signal}.`);
  process.exit(result.status ?? 1);
}

console.log("SYNTHETIC_CONTRACT_PASS: pure fixture and policy contracts passed; no real-user release claim is made.");
