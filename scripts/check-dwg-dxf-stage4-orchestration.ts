import assert from "node:assert/strict";
import fs from "node:fs";

const viewer = fs.readFileSync("src/components/dokumantasyon/preview/aps-dwg-viewer.tsx", "utf8");
const worker = fs.readFileSync("src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts", "utf8");
const route = fs.readFileSync("src/app/api/dokumantasyon/files/[id]/dwg-dxf/route.ts", "utf8");
const browserIndex = fs.readFileSync("src/lib/dokumantasyon/dwg/index.ts", "utf8");
const serverIndex = fs.readFileSync("src/lib/dokumantasyon/dwg/server.ts", "utf8");

assert.match(viewer, /function DwgToDxfViewer/);
assert.match(viewer, /\/api\/dokumantasyon\/files\/\$\{fileId\}\/dwg-dxf/);
assert.match(viewer, /new Worker\(new URL\("\.\/dwg-dxf-conversion-worker\.ts", import\.meta\.url\)/);
assert.match(viewer, /result\.decision === "PASS" \|\| result\.decision === "WARN"/);
assert.match(viewer, /<ApsFallbackViewer/);
assert.match(viewer, /extension="\.dxf"/);
assert.match(viewer, /ResolvedDxfCadViewer/);
assert.match(viewer, /MAX_BROWSER_FAST_PATH_BYTES/);
assert.match(viewer, /BROWSER_FAST_PATH_TIMEOUT_MS/);

assert.match(worker, /convertAndValidateDwgToDxf/);
assert.match(worker, /validation\.decision === "REJECT"/);
assert.match(worker, /FIDELITY_REJECTED/);
assert.match(worker, /\[dxfBuffer\]/);
assert.match(worker, /WORKER_CLASS_NAME_CONTRACT_FAILED/);

assert.match(route, /findReadyDwgDxfDerivativeForFile/);
assert.match(route, /readReadyDwgDxfDerivativeBytes/);
assert.match(route, /status: 204/);
assert.match(route, /X-DWG-DXF-Cache/);
assert.match(route, /X-DWG-DXF-Decision/);

assert.doesNotMatch(browserIndex, /derivative-access|derivative-cache|@vercel\/blob|node:fs/);
assert.match(serverIndex, /derivative-access/);

console.log("DWG→DXF Stage 4 orchestration contract: PASS");
