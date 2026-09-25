import { execFileSync } from "node:child_process";
import fs from "node:fs";

const baseSha = process.env.SIMPLIFICATION_BASE_SHA || "8fb43a4a23fce92fb3096d465d7ab769fe86c438";

const changed = execFileSync(
  "git",
  ["diff", "--name-only", "--diff-filter=ACMR", baseSha + "...HEAD"],
  { encoding: "utf8" },
)
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((file) => /\.(?:js|jsx|mjs|cjs|ts|tsx)$/.test(file))
  .filter((file) => fs.existsSync(file));

if (changed.length === 0) {
  console.log("Aşama 7 lint: değişen JS/TS dosyası yok.");
  process.exit(0);
}

console.log("Aşama 7 lint dosyaları:");
for (const file of changed) {
  console.log(" - " + file);
}

execFileSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["eslint", "--max-warnings=0", ...changed],
  { stdio: "inherit" },
);
