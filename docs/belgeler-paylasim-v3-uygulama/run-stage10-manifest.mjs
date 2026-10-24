import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../..");
const sources = ["src/components/belge-paylasim/belge-share-viewer.tsx", "src/lib/belge-paylasim/viewer-geometry.ts", "src/lib/belge-paylasim/viewer-session.ts",
  "tests/belgeler/belge-share-stage10.test.ts", "tests/belgeler/fixtures/share-viewer-harness.tsx", "docs/BELGELER_SISTEMI.md"];
const artifacts = ["ASAMA_10.md", "ASAMA_10_tests.tap", "ASAMA_10_tests.json", "ASAMA_10_runtime-tsc.log", "ASAMA_10_runtime-tsc.json",
  "ASAMA_10_lint.log", "ASAMA_10_lint.json", "ASAMA_10_browser.json", "ASAMA_10_diff-check.log", "ASAMA_10_320_light.png", "ASAMA_10_320_dark.png", "ASAMA_10_390_light.png",
  "run-stage10-checks.mjs", "run-stage10-browser.mjs", "run-stage10-manifest.mjs"].map((file) => `docs/belgeler-paylasim-v3-uygulama/${file}`);
const files = [...sources, ...artifacts].sort().map((file) => ({ file, sha256: createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex") }));
const worktree_digest = createHash("sha256").update(JSON.stringify(files)).digest("hex");
writeFileSync(resolve(evidence, "ASAMA_10_changes.json"), JSON.stringify({ algorithm: "SHA-256 of sorted file paths/hashes; excludes STATE and manifest itself", worktree_digest, files }, null, 2) + "\n");
console.log(JSON.stringify({ worktree_digest, fileCount: files.length }));
