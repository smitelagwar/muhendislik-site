import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
  DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
  DWG_BROWSER_WORKER_TIMEOUT_MS,
} from "../src/lib/dokumantasyon/dwg/runtime-policy";
import {
  DWG_DXF_CONVERTER_SIGNATURE,
  DWG_DXF_ENGINE_VERSION,
  DWG_DXF_PROFILE_ID,
  DWG_DXF_WORKER_ASSET_URL,
  DWG_DXF_WORKER_ASSET_VERSION,
} from "../src/lib/dokumantasyon/dwg/signature";

const read = (file: string) => fs.readFileSync(file, "utf8");
const packageJson = JSON.parse(read("package.json")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};
const packageLock = JSON.parse(read("package-lock.json")) as {
  packages?: Record<string, {
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }>;
};

assert.equal(packageJson.dependencies?.["@node-projects/acad-ts"], "2.4.0");
assert.equal(packageLock.packages?.[""]?.dependencies?.["@node-projects/acad-ts"], "2.4.0");
assert.equal(packageLock.packages?.["node_modules/@node-projects/acad-ts"]?.version, "2.4.0");
assert.equal(packageJson.devDependencies?.esbuild, "0.27.4");
assert.equal(packageLock.packages?.[""]?.devDependencies?.esbuild, "0.27.4");
assert.equal(packageLock.packages?.["node_modules/esbuild"]?.version, "0.27.4");
assert.equal(packageJson.scripts?.prebuild, "node scripts/build-dwg-dxf-worker.mjs");
assert.equal(packageJson.scripts?.predev, "node scripts/build-dwg-dxf-worker.mjs");

assert.equal(DWG_DXF_ENGINE_VERSION, "2.4.0");
assert.equal(DWG_DXF_PROFILE_ID, "dwg-dxf-v1");
assert.equal(DWG_DXF_WORKER_ASSET_VERSION, "acad-ts-2.4.0-dwg-dxf-v1");
assert.equal(
  DWG_DXF_WORKER_ASSET_URL,
  "/workers/dwg-dxf-conversion-worker.js?v=acad-ts-2.4.0-dwg-dxf-v1"
);
assert.match(DWG_DXF_CONVERTER_SIGNATURE, /^acad-ts:2\.4\.0\|dwg-dxf-v1\|/);

assert.equal(DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES, 4 * 1024 * 1024);
assert.equal(DWG_BROWSER_DXF_HARD_LIMIT_BYTES, 64 * 1024 * 1024);
assert.equal(DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS, 5_000);
assert.equal(DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS, 15_000);
assert.equal(DWG_BROWSER_WORKER_TIMEOUT_MS, 25_000);

const workerBuild = read("scripts/build-dwg-dxf-worker.mjs");
assert.match(workerBuild, /EXPECTED_ESBUILD_VERSION = "0\.27\.4"/);
assert.match(workerBuild, /keepNames: true/);
assert.match(workerBuild, /platform: "browser"/);
assert.match(workerBuild, /format: "esm"/);
assert.match(workerBuild, /target: \["es2022"\]/);
assert.match(workerBuild, /path\.join\(ROOT, "public\/workers"\)/);
assert.match(workerBuild, /path\.join\(OUTPUT_DIR, "dwg-dxf-conversion-worker\.js"\)/);
assert.match(workerBuild, /@node-projects\/acad-ts/);

const validation = read("src/lib/dokumantasyon/dwg/validation.ts");
for (const code of ["LINE_TYPE_MISMATCH", "LINE_WEIGHT_MISMATCH", "COLOR_SEMANTICS_MISMATCH"]) {
  assert.match(
    validation,
    new RegExp(`"${code}"[\\s\\S]{0,260}"warning"`),
    `${code} must not force APS fallback when geometry is structurally intact`
  );
}
assert.match(validation, /code: "EXTENTS_MISMATCH"[\s\S]{0,100}severity: "blocking"/);
assert.match(validation, /"ENTITY_COUNT_MISMATCH"/);
assert.match(validation, /"BLOCK_ENTITY_COUNT_MISMATCH"/);

const viewer = read("src/components/dokumantasyon/preview/aps-dwg-viewer.tsx");
assert.match(viewer, /function DwgToDxfViewer/);
assert.match(viewer, /DWG_DXF_WORKER_ASSET_URL/);
assert.match(viewer, /new Worker\(DWG_DXF_WORKER_ASSET_URL, \{ type: "module" \}\)/);
assert.match(viewer, /result\.decision === "PASS" \|\| result\.decision === "WARN"/);
assert.match(viewer, /<ApsFallbackViewer/);
assert.match(viewer, /ResolvedDxfCadViewer/);
assert.match(viewer, /extension="\.dxf"/);
assert.match(viewer, /DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES/);
assert.match(viewer, /DWG_BROWSER_DXF_HARD_LIMIT_BYTES/);
assert.match(viewer, /DWG_BROWSER_WORKER_TIMEOUT_MS/);
assert.match(viewer, /chooseAps\(result\.errorCode \|\| "FIDELITY_OR_CONVERSION_FALLBACK"\)/);
assert.match(viewer, /data-dwg-dxf-fallback=\{fastPath\.reason\}/);
assert.doesNotMatch(viewer, /new Worker\(new URL\("\.\/dwg-dxf-conversion-worker\.ts"/);

const worker = read("src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts");
assert.match(worker, /convertAndValidateDwgToDxf/);
assert.match(worker, /WORKER_SOURCE_LIMIT_EXCEEDED/);
assert.match(worker, /WORKER_DXF_OUTPUT_LIMIT_EXCEEDED/);
assert.match(worker, /WORKER_CLASS_NAME_CONTRACT_FAILED/);
assert.match(worker, /validation\.decision === "REJECT"/);
assert.match(worker, /function blockingIssueCodes/);
assert.match(worker, /function fidelityRejectCode/);
assert.match(worker, /errorCode: exactErrorCode/);

const route = read("src/app/api/dokumantasyon/files/[id]/dwg-dxf/route.ts");
assert.match(route, /findReadyDwgDxfDerivativeForFile/);
assert.match(route, /openReadyDwgDxfDerivativeStream/);
assert.match(route, /new Response\(payload\.stream/);
assert.match(route, /X-DWG-DXF-Streaming/);
assert.match(route, /private, no-store/);
assert.match(route, /nosniff/);

const browserIndex = read("src/lib/dokumantasyon/dwg/index.ts");
const serverIndex = read("src/lib/dokumantasyon/dwg/server.ts");
assert.doesNotMatch(browserIndex, /derivative-access|derivative-cache|@vercel\/blob|node:fs|node:path/);
assert.match(serverIndex, /derivative-access/);

const nextConfig = read("next.config.ts");
assert.match(nextConfig, /serverExternalPackages:\s*\["@node-projects\/acad-ts"\]/);

const guardedPaths = [
  "src/lib/dokumantasyon/dwg",
  "src/components/dokumantasyon/preview/aps-dwg-viewer.tsx",
  "src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts",
  "src/app/api/dokumantasyon/files/[id]/dwg-dxf/route.ts",
];

function collectTextFiles(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(target, entry.name);
    return entry.isDirectory() ? collectTextFiles(child) : [child];
  });
}

for (const file of guardedPaths.flatMap(collectTextFiles)) {
  assert.doesNotMatch(read(file), /\/var\/task\/\.data/, `${file} must not use ephemeral production persistence`);
}

for (const forbidden of [
  "src/app/dwg-stage4-worker-probe",
  "src/app/dwg-stage6-worker-probe",
  "public/__dwg-stage4",
  "public/__dwg-stage5",
  "public/__dwg-stage6",
]) {
  assert.equal(fs.existsSync(forbidden), false, `${forbidden} must remain CI-ephemeral`);
}

fs.mkdirSync("artifacts/dwg-dxf-stage6-release", { recursive: true });
const evidence = {
  stage: 6,
  engine: "@node-projects/acad-ts",
  engineVersion: DWG_DXF_ENGINE_VERSION,
  profile: DWG_DXF_PROFILE_ID,
  converterSignature: DWG_DXF_CONVERTER_SIGNATURE,
  workerAssetVersion: DWG_DXF_WORKER_ASSET_VERSION,
  workerAssetUrl: DWG_DXF_WORKER_ASSET_URL,
  esbuildVersion: packageJson.devDependencies?.esbuild,
  browserPolicy: {
    sourceHardLimitBytes: DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
    dxfHardLimitBytes: DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
    cacheFetchTimeoutMs: DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
    sourceFetchTimeoutMs: DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
    workerTimeoutMs: DWG_BROWSER_WORKER_TIMEOUT_MS,
  },
  contracts: {
    stableWorkerKeepNames: true,
    existingDxfViewerReused: true,
    apsFallbackPreserved: true,
    privateDerivativeStreaming: true,
    browserServerBoundary: true,
    ephemeralProductionPersistenceForbidden: true,
    presentationOnlyMismatchWarns: true,
    exactFidelityFallbackReasonPreserved: true,
  },
};
fs.writeFileSync(
  "artifacts/dwg-dxf-stage6-release/static-evidence.json",
  `${JSON.stringify(evidence, null, 2)}\n`
);

console.log("DWG→DXF Stage 6 canonical release contract: PASS");
console.log(JSON.stringify(evidence, null, 2));
