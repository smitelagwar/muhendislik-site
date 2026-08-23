import assert from "node:assert/strict";
import fs from "node:fs";

const viewer = fs.readFileSync("src/components/dokumantasyon/preview/aps-dwg-viewer.tsx", "utf8");
const dxfViewer = fs.readFileSync("src/components/dokumantasyon/preview/cad-viewer.tsx", "utf8");
const dxfRuntimePolicy = fs.readFileSync("src/lib/dokumantasyon/dxf-runtime-policy.ts", "utf8");
const worker = fs.readFileSync("src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts", "utf8");
const route = fs.readFileSync("src/app/api/dokumantasyon/files/[id]/dwg-dxf/route.ts", "utf8");
const browserIndex = fs.readFileSync("src/lib/dokumantasyon/dwg/index.ts", "utf8");
const serverIndex = fs.readFileSync("src/lib/dokumantasyon/dwg/server.ts", "utf8");
const signature = fs.readFileSync("src/lib/dokumantasyon/dwg/signature.ts", "utf8");
const workerBuild = fs.readFileSync("scripts/build-dwg-dxf-worker.mjs", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");

assert.match(viewer, /function DwgToDxfViewer/);
assert.match(viewer, /\/api\/dokumantasyon\/files\/\$\{fileId\}\/dwg-dxf/);
assert.match(viewer, /DWG_DXF_WORKER_ASSET_URL/);
assert.match(viewer, /new Worker\(DWG_DXF_WORKER_ASSET_URL, \{ type: "module" \}\)/);
assert.doesNotMatch(viewer, /new Worker\(new URL\("\.\/dwg-dxf-conversion-worker\.ts"/);
assert.match(viewer, /result\.decision === "PASS" \|\| result\.decision === "WARN"/);
assert.match(viewer, /<ApsFallbackViewer/);
assert.match(viewer, /extension="\.dxf"/);
assert.match(viewer, /ResolvedDxfCadViewer/);
assert.match(viewer, /onViewerFailure=\{handleDxfViewerFailure\}/);
assert.match(viewer, /DXF_RENDER_FAILED/);
// Stage 5 centralizes the Stage 4 browser ceiling/watchdog in runtime-policy.
assert.match(viewer, /DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES/);
assert.match(viewer, /DWG_BROWSER_WORKER_TIMEOUT_MS/);

// The shared DXF renderer must have terminal deadlines as well. Otherwise a successful
// DWG conversion can still leave the user on an infinite spinner before APS gets a chance.
assert.match(dxfViewer, /fetchDxfSourceBytes/);
assert.match(dxfViewer, /DXF_BROWSER_SOURCE_FETCH_TIMEOUT_MS/);
assert.match(dxfViewer, /DXF_BROWSER_VIEWER_LOAD_TIMEOUT_MS/);
assert.match(dxfViewer, /addEventListener\("error"/);
assert.match(dxfViewer, /addEventListener\("messageerror"/);
assert.match(dxfViewer, /Promise\.race\(\[viewerLoadPromise, workerFailurePromise, timeoutPromise\]\)/);
assert.match(dxfViewer, /onViewerFailure\?/);
assert.match(dxfRuntimePolicy, /DXF_BROWSER_SOURCE_FETCH_TIMEOUT_MS = 45_000/);
assert.match(dxfRuntimePolicy, /DXF_BROWSER_VIEWER_LOAD_TIMEOUT_MS = 90_000/);
assert.match(dxfRuntimePolicy, /DXF_BROWSER_SOURCE_HARD_LIMIT_BYTES = 256 \* 1024 \* 1024/);

assert.match(worker, /convertAndValidateDwgToDxf/);
assert.match(worker, /validation\.decision === "REJECT"/);
assert.match(worker, /FIDELITY_REJECTED/);
assert.match(worker, /\[dxfBuffer\]/);
assert.match(worker, /WORKER_CLASS_NAME_CONTRACT_FAILED/);

assert.match(signature, /DWG_DXF_WORKER_ASSET_VERSION/);
assert.match(signature, /DWG_DXF_WORKER_ASSET_URL/);
assert.match(signature, /\/workers\/dwg-dxf-conversion-worker\.js\?v=/);

assert.match(workerBuild, /EXPECTED_ESBUILD_VERSION = "0\.27\.4"/);
assert.match(workerBuild, /public\/workers/);
assert.match(workerBuild, /dwg-dxf-conversion-worker\.js/);
assert.match(workerBuild, /keepNames: true/);
assert.match(workerBuild, /platform: "browser"/);
assert.match(workerBuild, /format: "esm"/);
assert.match(workerBuild, /target: \["es2022"\]/);
assert.match(workerBuild, /@node-projects\/acad-ts/);

assert.match(packageJson, /"predev": "node scripts\/build-dwg-dxf-worker\.mjs"/);
assert.match(packageJson, /"prebuild": "node scripts\/build-dwg-dxf-worker\.mjs"/);

assert.match(route, /findReadyDwgDxfDerivativeForFile/);
assert.match(route, /openReadyDwgDxfDerivativeStream/);
assert.match(route, /status: 204/);
assert.match(route, /X-DWG-DXF-Cache/);
assert.match(route, /X-DWG-DXF-Decision/);

assert.doesNotMatch(browserIndex, /derivative-access|derivative-cache|@vercel\/blob|node:fs/);
assert.match(serverIndex, /derivative-access/);

console.log("DWG→DXF Stage 4 orchestration contract: PASS");
