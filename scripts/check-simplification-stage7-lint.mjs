import { execFileSync, spawnSync } from "node:child_process";
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

const changedRanges = new Map();

for (const file of changed) {
  const patch = execFileSync(
    "git",
    ["diff", "--unified=0", "--no-color", baseSha + "...HEAD", "--", file],
    { encoding: "utf8" },
  );
  const ranges = [];
  for (const line of patch.split(/\r?\n/)) {
    const match = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (!match) continue;
    const start = Number(match[1]);
    const count = match[2] === undefined ? 1 : Number(match[2]);
    if (count > 0) ranges.push([start, start + count - 1]);
  }
  changedRanges.set(file, ranges);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["eslint", "-f", "json", ...changed], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});

let reports;
try {
  reports = JSON.parse(result.stdout || "[]");
} catch {
  console.error(result.stdout);
  process.exit(result.status || 1);
}

const violations = [];
let historicalWarnings = 0;

for (const report of reports) {
  const relative = report.filePath.replace(process.cwd() + "/", "").replaceAll("\\", "/");
  const ranges = changedRanges.get(relative) || [];
  for (const message of report.messages || []) {
    const line = Number(message.line || 0);
    const touchesChangedLine =
      line === 0 || ranges.some(([start, end]) => line >= start && line <= end);

    if (message.severity === 2 || (message.severity === 1 && touchesChangedLine)) {
      violations.push({
        file: relative,
        line,
        column: message.column || 0,
        severity: message.severity,
        ruleId: message.ruleId,
        message: message.message,
      });
    } else if (message.severity === 1) {
      historicalWarnings += 1;
    }
  }
}

if (historicalWarnings > 0) {
  console.log(
    "Aşama 7 lint: " +
      historicalWarnings +
      " tarihsel warning değişmeyen satırlarda kaldı; release blocker değil.",
  );
}

if (violations.length > 0) {
  console.error("Aşama 7 lint release ihlalleri:");
  for (const item of violations) {
    console.error(
      " - " +
        item.file +
        ":" +
        item.line +
        ":" +
        item.column +
        " [" +
        (item.ruleId || "eslint") +
        "] " +
        item.message,
    );
  }
  process.exit(1);
}

console.log("Aşama 7 lint: release-owned satırlarda 0 error / 0 warning.");
