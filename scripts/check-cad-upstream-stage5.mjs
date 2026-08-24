import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const fail = (message) => {
  console.error(`GATE: FAIL — ${message}`);
  process.exitCode = 1;
};

const read = (path) => readFile(resolve(root, path), "utf8");
const [orchestrator, upstreamHost, legacyFallback, apsOnly, runtimePolicy, shell, currentViewer] = await Promise.all([
  read("src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx"),
  read("src/components/dokumantasyon/preview/cad-upstream-viewer.tsx"),
  read("src/components/dokumantasyon/preview/dwg-legacy-conversion-fallback.tsx"),
  read("src/components/dokumantasyon/preview/aps-only-dwg-viewer.tsx"),
  read("src/lib/dokumantasyon/dwg/runtime-policy.ts"),
  read("src/components/dokumantasyon/preview/file-preview-shell.tsx"),
  read("src/components/dokumantasyon/preview/cad-viewer.tsx"),
]);

const requiredOrchestratorTokens = [
  'type DwgEngine = "fast-resolving" | "fast-current" | "upstream" | "current-fallback" | "aps"',
  "/dwg-dxf",
  "DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS",
  'setEngine("upstream")',
  'setEngine("current-fallback")',
  'setEngine("aps")',
  "DokCadUpstreamViewer",
  "DwgLegacyConversionFallback",
  "ApsOnlyDwgViewer",
  'data-fast-path="not-applicable-dxf"',
];
for (const token of requiredOrchestratorTokens) {
  if (!orchestrator.includes(token)) fail(`orchestrator token missing: ${token}`);
}

const fastIndex = orchestrator.indexOf('"fast-resolving"');
const upstreamIndex = orchestrator.indexOf('"upstream"', fastIndex + 1);
const currentIndex = orchestrator.indexOf('"current-fallback"', upstreamIndex + 1);
const apsIndex = orchestrator.indexOf('"aps"', currentIndex + 1);
if (!(fastIndex >= 0 && upstreamIndex > fastIndex && currentIndex > upstreamIndex && apsIndex > currentIndex)) {
  fail("DWG engine declaration/order must remain Fast → Upstream → Current → APS");
}

if (orchestrator.includes("DWG_DXF_WORKER_ASSET_URL")) {
  fail("browser DWG conversion must not run inside the hot-path orchestrator");
}
if (!legacyFallback.includes("DWG_DXF_WORKER_ASSET_URL")) {
  fail("legacy browser conversion fallback lost its worker contract");
}
if (!legacyFallback.includes("DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS") || !legacyFallback.includes("DWG_BROWSER_WORKER_TIMEOUT_MS")) {
  fail("legacy conversion fallback must preserve source and worker deadlines");
}

for (const token of [
  "resolveCadUpstreamTimeoutMs",
  "effectiveTimeoutMs",
  '"open-timeout"',
  "Promise.race([upstreamWork, deadline])",
  "adapter.destroy()",
]) {
  if (!upstreamHost.includes(token)) fail(`upstream terminal-deadline token missing: ${token}`);
}

for (const token of [
  "DWG_APS_STATUS_REQUEST_TIMEOUT_MS",
  "DWG_APS_TRANSLATION_TIMEOUT_MS",
  "DWG_APS_VIEWER_LOAD_TIMEOUT_MS",
  "hardDeadline",
  "viewerDeadline",
]) {
  if (!apsOnly.includes(token)) fail(`APS terminal-deadline token missing: ${token}`);
}

for (const token of [
  "CAD_UPSTREAM_TOTAL_TIMEOUT_MS = 35_000",
  "CAD_UPSTREAM_MEDIUM_TIMEOUT_MS = 120_000",
  "CAD_UPSTREAM_LARGE_TIMEOUT_MS = 180_000",
  "resolveCadUpstreamTimeoutMs",
  "DWG_APS_TRANSLATION_TIMEOUT_MS = 180_000",
  "DWG_APS_STATUS_REQUEST_TIMEOUT_MS = 15_000",
  "DWG_APS_VIEWER_LOAD_TIMEOUT_MS = 45_000",
]) {
  if (!runtimePolicy.includes(token)) fail(`runtime policy deadline missing: ${token}`);
}

if (!shell.includes('import("./cad-runtime-orchestrator")')) {
  fail("FilePreviewShell production CAD route does not use cad-runtime-orchestrator");
}
if (shell.includes('const DokCadViewer = dynamic(() => import("./cad-viewer")')) {
  fail("FilePreviewShell still directly selects the legacy CAD viewer");
}

// Stage 5 intentionally keeps the old implementation intact as rollback/current fallback.
for (const token of [
  'import("dxf-viewer")',
  "dxf-viewer-worker.ts",
  "DxfViewerLoadError",
]) {
  if (!currentViewer.includes(token)) fail(`legacy current viewer rollback contract missing: ${token}`);
}

if (!process.exitCode) {
  console.log("GATE: PASS — Stage 5 runtime is bounded Fast → Upstream → Current → APS with adaptive upstream deadlines and legacy rollback preserved.");
}
