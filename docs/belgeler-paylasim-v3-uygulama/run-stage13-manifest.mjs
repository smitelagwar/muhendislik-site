import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const evidence = "docs/belgeler-paylasim-v3-uygulama";
const sources = [
  "tests/site-audit/belgeler-share-e2e.spec.ts",
  "tests/site-audit/belgeler-share-live-acceptance.spec.ts",
  "tests/site-audit/belgeler-stage13-shell-smoke.spec.ts",
  "tests/belgeler/belge-share-stage03.test.ts",
  "src/lib/belge-paylasim/request-validation.ts",
  "src/app/api/belgeler/paylasim/kota/route.ts",
  "playwright.site.config.ts",
  "docs/BELGELER_SISTEMI.md",
  `${evidence}/run-stage13-checks.mjs`,
  `${evidence}/run-stage13-manifest.mjs`,
  `${evidence}/run-stage13-postgres-live.ts`,
  `${evidence}/playwright.stage13-production.config.ts`,
];
const sourceHashes = [...new Set(sources)].sort().map((file) => ({
  file,
  sha256: createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex"),
}));
const finalSourceDigest = createHash("sha256").update(JSON.stringify(sourceHashes)).digest("hex");
const artifacts = readdirSync(resolve(root, evidence), { recursive: true })
  .filter((file) => typeof file === "string" && /^(?:ASAMA_13|FINAL_AUDIT)\.(?:md|json|log)$|^ASAMA_13_[^/\\]+\.(?:md|json|log)$/.test(file))
  .map((file) => `${evidence}/${file.replaceAll("\\", "/")}`)
  .filter((file) => !file.endsWith("ASAMA_13_changes.json"));
const files = [...new Set([...sources, ...artifacts])].sort().map((file) => ({
  file,
  sha256: createHash("sha256").update(readFileSync(resolve(root, file))).digest("hex"),
}));
const worktreeDigest = createHash("sha256").update(JSON.stringify(files)).digest("hex");
const report = {
  algorithm: "SHA-256 of sorted source file paths and SHA-256 hashes for finalSourceDigest; worktreeDigest covers those paths plus sorted ASAMA_13/FINAL_AUDIT evidence paths and hashes; excludes STATE and this manifest",
  planHead: "04048e50fd02e50c1c9ea783acec2d7383f516b4",
  finalSourceDigest,
  worktreeDigest,
  fileCount: files.length,
  files,
};
writeFileSync(resolve(root, evidence, "ASAMA_13_changes.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ worktreeDigest, fileCount: files.length }));
