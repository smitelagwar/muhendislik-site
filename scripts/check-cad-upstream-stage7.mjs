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

function mustExist(file) {
  if (!exists(file)) fail(`required live fallback file is missing: ${file}`);
}

function mustInclude(source, token, label) {
  if (!source.includes(token)) fail(`${label} missing required token: ${token}`);
}

function mustNotInclude(source, token, label) {
  if (source.includes(token)) fail(`${label} still contains retired token: ${token}`);
}

const cadViewerPath = "src/components/dokumantasyon/preview/cad-viewer.tsx";
const oldApsPath = "src/components/dokumantasyon/preview/aps-dwg-viewer.tsx";
const orchestratorPath = "src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx";
const legacyFallbackPath = "src/components/dokumantasyon/preview/dwg-legacy-conversion-fallback.tsx";
const apsOnlyPath = "src/components/dokumantasyon/preview/aps-only-dwg-viewer.tsx";
const shellPath = "src/components/dokumantasyon/preview/file-preview-shell.tsx";
const dxfWorkerPath = "src/components/dokumantasyon/preview/dxf-viewer-worker.ts";
const conversionWorkerPath = "src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts";

if (exists(oldApsPath)) {
  fail(`${oldApsPath} must be removed after Stage 6 cutover proof`);
}

mustExist(cadViewerPath);
mustExist(orchestratorPath);
mustExist(legacyFallbackPath);
mustExist(apsOnlyPath);
mustExist(shellPath);
mustExist(dxfWorkerPath);
mustExist(conversionWorkerPath);

const cadViewer = read(cadViewerPath);
mustNotInclude(cadViewer, "ApsDwgViewer", "cad-viewer");
mustNotInclude(cadViewer, "./aps-dwg-viewer", "cad-viewer");
mustNotInclude(cadViewer, 'normalizedExtension === ".dwg"', "cad-viewer");
mustInclude(cadViewer, 'normalizedExtension !== ".dxf"', "cad-viewer");
mustInclude(cadViewer, "DxfViewer", "cad-viewer");
mustInclude(cadViewer, "dxf-viewer-worker", "cad-viewer");

const orchestrator = read(orchestratorPath);
for (const token of [
  "DokCadUpstreamViewer",
  "DwgLegacyConversionFallback",
  "ApsOnlyDwgViewer",
  './cad-viewer',
  '"current-fallback"',
  '"aps"',
]) {
  mustInclude(orchestrator, token, "cad-runtime-orchestrator");
}

const fastIndex = orchestrator.indexOf('"fast-resolving"');
const upstreamIndex = orchestrator.indexOf('"upstream"', fastIndex + 1);
const currentIndex = orchestrator.indexOf('"current-fallback"', upstreamIndex + 1);
const apsIndex = orchestrator.indexOf('"aps"', currentIndex + 1);
if (!(fastIndex >= 0 && upstreamIndex > fastIndex && currentIndex > upstreamIndex && apsIndex > currentIndex)) {
  fail("production DWG runtime order is no longer Fast → Upstream → current fallback → APS");
}

const legacyFallback = read(legacyFallbackPath);
mustInclude(legacyFallback, "DWG_DXF_WORKER_ASSET_URL", "legacy conversion fallback");
mustInclude(legacyFallback, './cad-viewer', "legacy conversion fallback");

const shell = read(shellPath);
mustInclude(shell, './cad-runtime-orchestrator', "FilePreviewShell");
mustNotInclude(shell, 'import("./cad-viewer")', "FilePreviewShell");

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/u.test(entry.name)) output.push(full);
  }
  return output;
}

for (const file of walk(rel("src"))) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("./aps-dwg-viewer") || source.includes("ApsDwgViewer")) {
    fail(`retired ApsDwgViewer reference remains in ${path.relative(ROOT, file)}`);
  }
}

console.log("Stage 7 dead legacy DWG edge: PASS");
console.log("Stage 7 live rollback DXF/conversion fallbacks: PASS");
console.log("Stage 7 production orchestrator ownership: PASS");
console.log("GATE: PASS — Aşama 7 cleanup contract hazır.");
