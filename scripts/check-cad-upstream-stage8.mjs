import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const rel = (...parts) => path.join(ROOT, ...parts);
const read = (file) => fs.readFileSync(rel(file), "utf8");
const exists = (file) => fs.existsSync(rel(file));

function fail(message) {
  console.error(`GATE: FAIL — ${message}`);
  process.exit(1);
}
function mustInclude(source, token, label) {
  if (!source.includes(token)) fail(`${label} missing: ${token}`);
}
function mustExist(file) {
  if (!exists(file)) fail(`required release file missing: ${file}`);
}

const pkg = JSON.parse(read("package.json"));
const deps = pkg.dependencies ?? {};
const exact = {
  "@mlightcad/cad-simple-viewer": "1.6.2",
  "@mlightcad/data-model": "1.14.2",
  "@mlightcad/libredwg-converter": "3.14.2",
};
for (const [name, version] of Object.entries(exact)) {
  if (deps[name] !== version) fail(`${name} must stay exact at ${version}; got ${deps[name] ?? "missing"}`);
}

const overrides = pkg.overrides ?? {};
if (overrides.tar !== "7.5.22") fail(`tar security override must be 7.5.22; got ${overrides.tar ?? "missing"}`);
if (overrides["lodash-es"] !== "4.18.1") fail(`lodash-es security override must be 4.18.1; got ${overrides["lodash-es"] ?? "missing"}`);

const lock = JSON.parse(read("package-lock.json"));
if (lock.packages?.["node_modules/tar"]?.version !== "7.5.22") {
  fail(`lockfile tar must resolve to 7.5.22; got ${lock.packages?.["node_modules/tar"]?.version ?? "missing"}`);
}
if (lock.packages?.["node_modules/lodash-es"]?.version !== "4.18.1") {
  fail(`lockfile lodash-es must resolve to 4.18.1; got ${lock.packages?.["node_modules/lodash-es"]?.version ?? "missing"}`);
}

mustExist("THIRD_PARTY_NOTICES.md");
const notices = read("THIRD_PARTY_NOTICES.md");
for (const token of [
  "@mlightcad/libredwg-converter` — `3.14.2",
  "@mlightcad/libredwg-web` — `0.7.10",
  "GPL-3.0",
  "e3198a391b5c8599a94f1f1da285426443371451",
  "/cad-upstream/libredwg-parser-worker.js",
  "/cad-upstream/libredwg-web.wasm",
  "/cad-upstream/GPL-NOTICE.txt",
]) mustInclude(notices, token, "THIRD_PARTY_NOTICES.md");

mustExist("public/cad-upstream/libredwg-parser-worker.js");
mustExist("public/cad-upstream/libredwg-web.wasm");
mustExist("public/cad-upstream/mtext-renderer-worker.js");
mustExist("public/cad-upstream/GPL-NOTICE.txt");
const gpl = read("public/cad-upstream/GPL-NOTICE.txt");
for (const token of [
  "@mlightcad/libredwg-converter 3.14.2",
  "@mlightcad/libredwg-web 0.7.10",
  "GPL-3.0",
  "e3198a391b5c8599a94f1f1da285426443371451",
  "libredwg-parser-worker.js",
  "libredwg-web.wasm",
]) mustInclude(gpl, token, "generated GPL-NOTICE.txt");

const policy = read("src/lib/dokumantasyon/dwg/runtime-policy.ts");
const boundedTimeouts = [
  "DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS = 5_000",
  "DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS = 15_000",
  "DWG_BROWSER_WORKER_TIMEOUT_MS = 25_000",
  "CAD_UPSTREAM_TOTAL_TIMEOUT_MS = 35_000",
  "CAD_UPSTREAM_MEDIUM_TIMEOUT_MS = 120_000",
  "CAD_UPSTREAM_LARGE_TIMEOUT_MS = 180_000",
  "CAD_UPSTREAM_MEDIUM_FILE_BYTES = 8 * 1024 * 1024",
  "CAD_UPSTREAM_LARGE_FILE_BYTES = 32 * 1024 * 1024",
  "resolveCadUpstreamTimeoutMs",
  "DWG_APS_STATUS_REQUEST_TIMEOUT_MS = 15_000",
  "DWG_APS_TRANSLATION_TIMEOUT_MS = 180_000",
  "DWG_APS_VIEWER_LOAD_TIMEOUT_MS = 45_000",
];
for (const token of boundedTimeouts) mustInclude(policy, token, "runtime-policy");

if (exists("src/components/dokumantasyon/preview/aps-dwg-viewer.tsx")) {
  fail("retired aps-dwg-viewer.tsx returned after Stage 7");
}

const fileShell = read("src/components/dokumantasyon/preview/file-preview-shell.tsx");
mustInclude(fileShell, './cad-runtime-orchestrator', "FilePreviewShell");
const studioShell = read("src/components/dokumantasyon/studio/document-studio-shell.tsx");
mustInclude(studioShell, '../preview/cad-runtime-orchestrator', "DocumentStudioShell");
if (studioShell.includes('import("../preview/cad-viewer")')) {
  fail("DocumentStudioShell still bypasses the Stage 8 orchestrator");
}
const orchestrator = read("src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx");
for (const token of ["DokCadUpstreamViewer", "DwgLegacyConversionFallback", "ApsOnlyDwgViewer", '"current-fallback"']) {
  mustInclude(orchestrator, token, "CAD runtime orchestrator");
}

const upstreamHost = read("src/components/dokumantasyon/preview/cad-upstream-viewer.tsx");
mustInclude(upstreamHost, "resolveCadUpstreamTimeoutMs(sizeBytes)", "CAD upstream host");
mustInclude(upstreamHost, "data-cad-timeout-ms", "CAD upstream host");

const stage7 = read("scripts/check-cad-upstream-stage7.mjs");
mustInclude(stage7, "Stage 7 production orchestrator ownership: PASS", "Stage 7 gate");

console.log("Stage 8 exact upstream pins: PASS");
console.log("Stage 8 security overrides + lock resolution: PASS");
console.log("Stage 8 bounded size-aware runtime deadlines: PASS");
console.log("Stage 8 GPL notice/source reference: PASS");
console.log("Stage 8 both preview shells route CAD through orchestrator: PASS");
console.log("Stage 8 production ownership and rollback surface: PASS");
console.log("GATE: PASS — Aşama 8 release contract hazır.");
