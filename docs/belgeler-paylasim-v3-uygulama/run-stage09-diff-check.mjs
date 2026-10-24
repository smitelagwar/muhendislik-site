import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const logPath = resolve(evidenceDir, "ASAMA_09_diff-check.log");
const files = [
  "PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md",
  "db/migrations/009_belge_paylasim_cleanup_queue.sql",
  "docs/BELGELER_SISTEMI.md",
  "src/app/api/cron/belge-paylasim-temizlik/route.ts",
  "src/lib/belge-paylasim/blob-store.ts",
  "src/lib/belge-paylasim/cleanup.ts",
  "src/lib/belge-paylasim/repository.ts",
  "src/lib/belge-paylasim/types.ts",
  "tests/belgeler/belge-share-cleanup.test.ts",
  "tests/belgeler/belge-share-stage02.test.ts",
  "tests/belgeler/belge-share-stage03.test.ts",
  "tests/belgeler/belge-share-stage04.test.ts",
  "tests/belgeler/belge-share-stage05.test.ts",
  "tests/belgeler/belge-share-stage09.test.ts",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09.md",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-tests.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-runtime-tsc.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-lint.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-manifest.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-diff-check.mjs",
];
let output = "";
let exitCode = 0;
try {
  output = execFileSync("git", ["diff", "--check"], { cwd: projectRoot, encoding: "utf8", timeout: 30_000 });
} catch (error) {
  output += String(error?.stdout ?? "");
  output += String(error?.stderr ?? "");
  exitCode = Number(error?.status ?? 1);
}
const trailingWhitespace = [];
for (const file of files) {
  const lines = readFileSync(resolve(projectRoot, file), "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[\t ]+$/.test(line)) trailingWhitespace.push(`${file}:${index + 1}: trailing whitespace`);
  });
}
output += trailingWhitespace.join("\n");
output += `${output && !output.endsWith("\n") ? "\n" : ""}git diff --check exit=${exitCode}; stage/worktree files checked for trailing whitespace=${files.length}; findings=${trailingWhitespace.length}\n`;
writeFileSync(logPath, output, "utf8");
console.log(output);
if (exitCode !== 0 || trailingWhitespace.length > 0) process.exitCode = 1;
