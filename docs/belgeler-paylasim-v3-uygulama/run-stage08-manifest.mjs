import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const manifestPath = resolve(evidenceDir, "ASAMA_08_changes.json");
const changedFiles = [
  "docs/BELGELER_SISTEMI.md",
  "src/lib/belge-paylasim/local-link-registry.ts",
  "src/hooks/use-belge-share.ts",
  "src/components/belge-paylasim/belge-share-dialog.tsx",
  "tests/belgeler/belge-share-client.test.ts",
  "tests/belgeler/belge-share-stage08.test.ts",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08.md",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_diff-check.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_tests.tap",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_tests.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_runtime-tsc.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_runtime-tsc.json",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_lint.log",
  "docs/belgeler-paylasim-v3-uygulama/ASAMA_08_lint.json",
  "docs/belgeler-paylasim-v3-uygulama/run-stage08-tests.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage08-runtime-tsc.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage08-lint.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage08-manifest.mjs",
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
  algorithm: "SHA-256 over UTF-8 JSON.stringify of sorted ASAMA_08 file paths and their SHA-256 hashes; excludes STATE and self-referential manifest",
  worktree_digest: worktreeDigest,
  files,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ manifestPath, worktreeDigest, fileCount: files.length }, null, 2));
