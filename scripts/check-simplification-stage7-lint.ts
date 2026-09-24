import { execFileSync, spawnSync } from "node:child_process";

const baseRef = process.env.SIMPLIFICATION_BASE_REF?.trim() || "origin/main";
const diff = execFileSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMR", baseRef + "...HEAD"],
  { encoding: "utf8" },
);

const lintable = diff
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((file) => /\.(?:cjs|js|jsx|mjs|ts|tsx)$/.test(file));

if (lintable.length === 0) {
  console.log("Stage 7 changed-scope lint: lintlenecek dosya yok.");
  process.exit(0);
}

console.log("Stage 7 changed-scope lint files:");
for (const file of lintable) {
  console.log(" - " + file);
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npx, ["eslint", ...lintable], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
