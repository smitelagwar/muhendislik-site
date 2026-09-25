import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_ESBUILD_VERSION = "0.27.4";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(
  ROOT,
  "src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts"
);
const OUTPUT_DIR = path.join(ROOT, "public/workers");
const OUTPUT = path.join(OUTPUT_DIR, "dwg-dxf-conversion-worker.js");
const CAD_V2_ENTRY = path.join(ROOT, "src/workers/cad-v2/cad-v2-scene-worker.ts");
const CAD_V2_OUTPUT_DIR = path.join(ROOT, "public/cad-v2");
const CAD_V2_OUTPUT = path.join(CAD_V2_OUTPUT_DIR, "cad-v2-scene-worker.js");

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function main() {
  const esbuildPackagePath = path.join(ROOT, "node_modules/esbuild/package.json");
  const esbuildPackage = await readJson(esbuildPackagePath);
  if (esbuildPackage.version !== EXPECTED_ESBUILD_VERSION) {
    throw new Error(
      `DWG worker requires esbuild ${EXPECTED_ESBUILD_VERSION}; found ${esbuildPackage.version ?? "unknown"}.`
    );
  }

  const { build } = await import("esbuild");
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CAD_V2_OUTPUT_DIR, { recursive: true });

  const result = await build({
    entryPoints: [ENTRY],
    outfile: OUTPUT,
    bundle: true,
    platform: "browser",
    format: "esm",
    target: ["es2022"],
    keepNames: true,
    minify: false,
    sourcemap: false,
    legalComments: "none",
    metafile: true,
    logLevel: "info",
  });

  const stat = await fs.stat(OUTPUT);
  if (stat.size < 100_000) {
    throw new Error(`DWG worker bundle is unexpectedly small: ${stat.size} bytes.`);
  }

  const inputs = Object.keys(result.metafile?.inputs ?? {});
  const includesAcadTs = inputs.some((input) => input.includes("@node-projects/acad-ts"));
  if (!includesAcadTs) {
    throw new Error("DWG worker bundle does not contain @node-projects/acad-ts.");
  }

  const cadV2Result = await build({
    entryPoints: [CAD_V2_ENTRY],
    outfile: CAD_V2_OUTPUT,
    bundle: true,
    platform: "browser",
    format: "esm",
    target: ["es2022"],
    keepNames: true,
    minify: false,
    sourcemap: false,
    legalComments: "none",
    metafile: true,
    logLevel: "info",
  });
  const cadV2Stat = await fs.stat(CAD_V2_OUTPUT);
  if (cadV2Stat.size < 10_000) {
    throw new Error(`CAD V2 scene worker bundle is unexpectedly small: ${cadV2Stat.size} bytes.`);
  }
  const cadV2Inputs = Object.keys(cadV2Result.metafile?.inputs ?? {});
  if (!cadV2Inputs.some((input) => input.includes("curve-refinement.ts"))) {
    throw new Error("CAD V2 scene worker bundle does not include the bounded curve refinement evaluator.");
  }

  console.log(`DWG worker bundle ready: ${path.relative(ROOT, OUTPUT)} (${stat.size} bytes)`);
  console.log(`CAD V2 scene worker bundle ready: ${path.relative(ROOT, CAD_V2_OUTPUT)} (${cadV2Stat.size} bytes)`);
  console.log(`esbuild ${EXPECTED_ESBUILD_VERSION}; keepNames=true; target=es2022`);
}

await main();
