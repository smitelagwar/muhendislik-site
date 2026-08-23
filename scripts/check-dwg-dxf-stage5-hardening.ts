import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
  DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES,
  DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
  DWG_BROWSER_WORKER_TIMEOUT_MS,
  isWithinByteLimit,
  parsePositiveContentLength,
} from "../src/lib/dokumantasyon/dwg/runtime-policy";

const viewer = fs.readFileSync("src/components/dokumantasyon/preview/aps-dwg-viewer.tsx", "utf8");
const worker = fs.readFileSync("src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts", "utf8");
const route = fs.readFileSync("src/app/api/dokumantasyon/files/[id]/dwg-dxf/route.ts", "utf8");
const derivativeAccess = fs.readFileSync("src/lib/dokumantasyon/dwg/derivative-access.ts", "utf8");
const workerBuild = fs.readFileSync("scripts/build-dwg-dxf-worker.mjs", "utf8");
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const packageLock = JSON.parse(fs.readFileSync("package-lock.json", "utf8")) as {
  packages?: Record<string, { version?: string; devDependencies?: Record<string, string> }>;
};

assert.equal(DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES, 4 * 1024 * 1024);
assert.equal(DWG_BROWSER_DXF_HARD_LIMIT_BYTES, 64 * 1024 * 1024);
assert.equal(DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES, 4 * 1024 * 1024);
assert.equal(DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS, 5_000);
assert.equal(DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS, 15_000);
assert.equal(DWG_BROWSER_WORKER_TIMEOUT_MS, 25_000);

assert.equal(parsePositiveContentLength(null), null);
assert.equal(parsePositiveContentLength(""), null);
assert.equal(parsePositiveContentLength("invalid"), null);
assert.equal(parsePositiveContentLength("-1"), null);
assert.equal(parsePositiveContentLength("0"), 0);
assert.equal(parsePositiveContentLength("4194304"), 4 * 1024 * 1024);
assert.equal(isWithinByteLimit(1, 4), true);
assert.equal(isWithinByteLimit(4, 4), true);
assert.equal(isWithinByteLimit(5, 4), false);
assert.equal(isWithinByteLimit(0, 4), false);
assert.equal(isWithinByteLimit(Number.NaN, 4), false);

assert.match(worker, /WORKER_SOURCE_LIMIT_EXCEEDED/);
assert.match(worker, /DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES/);
assert.match(worker, /maxOutputBytes: DWG_BROWSER_DXF_HARD_LIMIT_BYTES/);
assert.match(worker, /initialOutputBytes: DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES/);
assert.match(worker, /WORKER_DXF_OUTPUT_LIMIT_EXCEEDED/);
assert.match(worker, /error\.code === "OUTPUT_LIMIT_EXCEEDED"/);
assert.match(worker, /Cannot access '\.\+' before initialization/);
assert.match(worker, /validation\.decision === "REJECT"/);
assert.match(worker, /\[dxfBuffer\]/);

assert.match(viewer, /fetchWithDeadline/);
assert.match(viewer, /readResponseWithinLimit/);
assert.match(viewer, /DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS/);
assert.match(viewer, /DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS/);
assert.match(viewer, /DWG_BROWSER_WORKER_TIMEOUT_MS/);
assert.match(viewer, /DWG_BROWSER_DXF_HARD_LIMIT_BYTES/);
assert.match(viewer, /DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES/);
assert.match(viewer, /response\.body\.getReader\(\)/);
assert.match(viewer, /reader\.cancel\("DWG_BROWSER_BODY_LIMIT_EXCEEDED"\)/);
assert.match(viewer, /worker\.onmessageerror/);
assert.match(viewer, /WORKER_DXF_SIZE_MISMATCH/);
assert.match(viewer, /result\.decision === "PASS" \|\| result\.decision === "WARN"/);
assert.match(viewer, /<ApsFallbackViewer/);
assert.match(viewer, /new Worker\(DWG_DXF_WORKER_ASSET_URL/);

assert.match(route, /openReadyDwgDxfDerivativeStream/);
assert.match(route, /X-DWG-DXF-Streaming/);
assert.match(route, /private, no-store/);
assert.match(route, /X-Content-Type-Options/);
assert.doesNotMatch(route, /Buffer\.from/);
assert.doesNotMatch(route, /readReadyDwgDxfDerivativeBytes/);

assert.match(derivativeAccess, /openReadyDwgDxfDerivativeStream/);
assert.match(derivativeAccess, /stream: blob\.stream/);
assert.match(derivativeAccess, /access: "private"/);
assert.doesNotMatch(derivativeAccess, /\/var\/task\/\.data/);

assert.equal(packageJson.devDependencies?.esbuild, "0.27.4");
assert.equal(packageLock.packages?.[""]?.devDependencies?.esbuild, "0.27.4");
assert.equal(packageLock.packages?.["node_modules/esbuild"]?.version, "0.27.4");
assert.equal(packageJson.scripts?.prebuild, "node scripts/build-dwg-dxf-worker.mjs");
assert.equal(packageJson.scripts?.predev, "node scripts/build-dwg-dxf-worker.mjs");
assert.match(workerBuild, /EXPECTED_ESBUILD_VERSION = "0\.27\.4"/);
assert.match(workerBuild, /keepNames: true/);
assert.match(workerBuild, /platform: "browser"/);
assert.match(workerBuild, /format: "esm"/);

console.log("DWG→DXF Stage 5 runtime/Vercel hardening contract: PASS");
