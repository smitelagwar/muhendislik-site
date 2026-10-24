import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const manifestPath = resolve(evidenceDir, "ASAMA_09_changes.json");
const changedFiles = [
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
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_diff-check.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_tests.tap",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_tests.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_runtime-tsc.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_runtime-tsc.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_lint.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_09_lint.json",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-tests.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-runtime-tsc.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-lint.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-manifest.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage09-diff-check.mjs",
].sort();

const files = changedFiles.map((file) => {
  const absolutePath = resolve(projectRoot, file);
  if (!existsSync(absolutePath)) throw new Error(`Required stage evidence is missing: ${file}`);
  return { file, sha256: createHash("sha256").update(readFileSync(absolutePath)).digest("hex") };
});
const worktreeDigest = createHash("sha256").update(JSON.stringify(files), "utf8").digest("hex");
const manifest = {
  algorithm: "SHA-256 over UTF-8 JSON.stringify of sorted ASAMA_09 file paths and their SHA-256 hashes; excludes STATE and self-referential manifest",
  worktree_digest: worktreeDigest,
  files,
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ manifestPath, worktreeDigest, fileCount: files.length }, null, 2));
