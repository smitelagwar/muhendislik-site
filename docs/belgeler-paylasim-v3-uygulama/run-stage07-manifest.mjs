import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const manifestPath = resolve(evidenceDir, "ASAMA_07_changes.json");
const changedFiles = [
  "src/hooks/use-belge-share.ts",
  "src/components/belge-paylasim/belge-share-dialog.tsx",
  "src/components/beton-dokum-studio.tsx",
  "src/components/istifa-studio.tsx",
  "src/components/insaat-ruhsati-studio.tsx",
  "src/components/taahhutname-studio.tsx",
  "src/components/sozlesme-studio.tsx",
  "tests/belgeler/belge-share-stage07.test.ts",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07.md",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_browser.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_dev-server.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_diff-check.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_tests.tap",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_tests.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_runtime-tsc.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_runtime-tsc.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_lint.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_07_lint.json",
  "docs/belgeler-paylasim-v3-uygulama/run-stage07-tests.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage07-runtime-tsc.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage07-lint.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage07-browser.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage07-manifest.mjs",
].sort();

const files = changedFiles.map((file) => {
  const absolutePath = resolve(projectRoot, file);
  if (!existsSync(absolutePath)) throw new Error(`Required stage evidence is missing: ${file}`);
  return {
    file,
    sha256: createHash("sha256").update(readFileSync(absolutePath)).digest("hex"),
  };
});
const worktreeDigest = createHash("sha256").update(JSON.stringify(files), "utf8").digest("hex");
const manifest = {
  algorithm: "SHA-256 over UTF-8 JSON.stringify of sorted ASAMA_07 file paths and their SHA-256 hashes; excludes STATE and self-referential manifest",
  worktree_digest: worktreeDigest,
  files,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ manifestPath, worktreeDigest, fileCount: files.length }, null, 2));
