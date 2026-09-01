import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "public", "cad-upstream");

const LIBREDWG_CONVERTER_VERSION = "3.14.2";
const LIBREDWG_WEB_VERSION = "0.7.10";
const LIBREDWG_SOURCE_COMMIT = "e3198a391b5c8599a94f1f1da285426443371451";
const EXPECTED_ESBUILD_VERSION = "0.27.4";

const assets = [
  {
    source: join(
      root,
      "node_modules",
      "@mlightcad",
      "cad-simple-viewer",
      "dist",
      "mtext-renderer-worker.js"
    ),
    target: join(outputDir, "mtext-renderer-worker.js"),
  },
  {
    source: join(
      root,
      "node_modules",
      "@mlightcad",
      "libredwg-converter",
      "dist",
      "libredwg-parser-worker.js"
    ),
    target: join(outputDir, "libredwg-parser-worker.js"),
  },
  {
    source: join(
      root,
      "node_modules",
      "@mlightcad",
      "libredwg-converter",
      "dist",
      "libredwg-web.wasm"
    ),
    target: join(outputDir, "libredwg-web.wasm"),
  },
];

await mkdir(outputDir, { recursive: true });

// Next/webpack production bundling changed the runtime identity of MLightCAD's
// peer packages during the Stage 9 browser gate. Build one browser-native ESM
// graph so cad-simple-viewer, data-model and renderer packages share exactly one
// module identity in development, `next start`, Vercel preview and production.
//
// IMPORTANT: LibreDWG is intentionally a dynamic import. Pulling
// @mlightcad/libredwg-web into the DXF startup entry evaluates the generated DWG
// runtime on the browser main thread even when the opened file is DXF. On CI and
// slower clients that synchronous evaluation can monopolize the event loop long
// enough that even the studio timeout/elapsed timers cannot tick. Esbuild ESM
// splitting keeps the shared data-model identity while loading the DWG-only code
// only when registerLibreDwgConverter() asks for it.
const esbuildPackage = JSON.parse(
  await readFile(join(root, "node_modules", "esbuild", "package.json"), "utf8")
);
if (esbuildPackage.version !== EXPECTED_ESBUILD_VERSION) {
  throw new Error(
    `CAD upstream runtime requires esbuild ${EXPECTED_ESBUILD_VERSION}; found ${esbuildPackage.version ?? "unknown"}.`
  );
}

const { build } = await import("esbuild");
const runtimeTarget = join(outputDir, "mlightcad-runtime.js");
const runtimeChunksDir = join(outputDir, "mlightcad-runtime-chunks");
await rm(runtimeChunksDir, { recursive: true, force: true });

const threeJsmExtensionPlugin = {
  name: "three-jsm-extension",
  setup(esbuild) {
    // MLightCAD's published ESM still has two browser-valid/bundler-tolerated
    // Three.js example specifiers without `.js`. Node's package exports expose
    // the concrete .js files, so normalize extensionless JSM imports for esbuild.
    esbuild.onResolve(
      { filter: /^three\/examples\/jsm\/.+[^.]$/ },
      async (args) => {
        if (args.path.endsWith(".js")) return null;
        return esbuild.resolve(`${args.path}.js`, {
          kind: args.kind,
          resolveDir: args.resolveDir,
          importer: args.importer,
        });
      }
    );
  },
};

const runtimeBuild = await build({
  stdin: {
    contents: `
      import * as Viewer from "@mlightcad/cad-simple-viewer";
      import * as dataModel from "@mlightcad/data-model";
      import * as mtextRenderer from "@mlightcad/mtext-renderer";
      import * as threeRenderer from "@mlightcad/three-renderer";

      async function loadLibreDwg() {
        return import("@mlightcad/libredwg-converter");
      }

      export { Viewer, dataModel, mtextRenderer, threeRenderer, loadLibreDwg };
    `,
    resolveDir: root,
    sourcefile: "cad-upstream-runtime-entry.ts",
    loader: "ts",
  },
  outdir: outputDir,
  entryNames: "mlightcad-runtime",
  chunkNames: "mlightcad-runtime-chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  platform: "browser",
  format: "esm",
  target: ["es2022"],
  keepNames: true,
  minify: true,
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
  metafile: true,
  plugins: [threeJsmExtensionPlugin],
});
const runtimeStat = await stat(runtimeTarget);
const runtimeGraphBytes = Object.values(runtimeBuild.metafile.outputs).reduce(
  (sum, output) => sum + Number(output.bytes || 0),
  0
);
if (!runtimeStat.isFile() || runtimeStat.size <= 0 || runtimeGraphBytes < 500_000) {
  throw new Error(
    `CAD upstream runtime graph is unexpectedly small: entry=${runtimeStat.size} graph=${runtimeGraphBytes} bytes.`
  );
}
console.log(
  `[cad-upstream] bundled public/cad-upstream/mlightcad-runtime.js (${runtimeStat.size} entry bytes; ${runtimeGraphBytes} graph bytes, LibreDWG lazy)`
);

for (const asset of assets) {
  const sourceStat = await stat(asset.source).catch(() => null);
  if (!sourceStat?.isFile() || sourceStat.size <= 0) {
    throw new Error(`Required CAD upstream asset is missing: ${asset.source}`);
  }
  await copyFile(asset.source, asset.target);
  const targetStat = await stat(asset.target);
  if (targetStat.size !== sourceStat.size) {
    throw new Error(`CAD upstream asset copy size mismatch: ${asset.target}`);
  }
  console.log(
    `[cad-upstream] synced ${asset.target.slice(root.length + 1)} (${targetStat.size} bytes)`
  );
}

const fontsOutputDir = join(outputDir, "fonts");
await mkdir(fontsOutputDir, { recursive: true });

const fontAssets = [
  {
    source: join(root, "public", "fonts", "Arial-Regular.ttf"),
    target: join(fontsOutputDir, "Arial-Regular.ttf"),
  },
  {
    source: join(root, "public", "fonts", "Arial-Bold.ttf"),
    target: join(fontsOutputDir, "Arial-Bold.ttf"),
  },
];

for (const fontAsset of fontAssets) {
  const sourceStat = await stat(fontAsset.source).catch(() => null);
  if (!sourceStat?.isFile() || sourceStat.size <= 0) {
    throw new Error(`Required font asset is missing: ${fontAsset.source}`);
  }
  await copyFile(fontAsset.source, fontAsset.target);
  const targetStat = await stat(fontAsset.target);
  if (targetStat.size !== sourceStat.size) {
    throw new Error(`Font asset copy size mismatch: ${fontAsset.target}`);
  }
  console.log(
    `[cad-upstream] synced font ${fontAsset.target.slice(root.length + 1)} (${targetStat.size} bytes)`
  );
}

const fontsManifest = [
  {
    file: "Arial-Regular.ttf",
    name: [
      "arial",
      "arial-regular",
      "arial.ttf",
      "standard",
      "txt",
      "txt.shx",
      "romans",
      "romans.shx",
      "simplex",
      "simplex.shx",
      "isocpeur",
      "isocpeur.ttf",
      "times",
      "times new roman",
      "calibri",
    ],
    type: "mesh",
  },
  {
    file: "Arial-Bold.ttf",
    name: ["arial-bold", "arial-bold.ttf", "arialb.ttf"],
    type: "mesh",
  },
];

// Preserve the existing public path: /cad-upstream/fonts/fonts.json.
const canonicalFontsManifestPath = join(fontsOutputDir, "fonts.json");
await writeFile(canonicalFontsManifestPath, JSON.stringify(fontsManifest, null, 2), "utf8");
console.log(`[cad-upstream] wrote ${canonicalFontsManifestPath.slice(root.length + 1)}`);

const gplNotice = `MLightCAD LibreDWG browser component\n\n@mlightcad/libredwg-converter ${LIBREDWG_CONVERTER_VERSION} — GPL-3.0\n@mlightcad/libredwg-web ${LIBREDWG_WEB_VERSION}\n\nCorresponding upstream source snapshot:\nhttps://github.com/mlightcad/realdwg-web/tree/${LIBREDWG_SOURCE_COMMIT}\n\nGPL-3.0 license text:\nhttps://www.gnu.org/licenses/gpl-3.0.html\n\nDistributed assets:\n- libredwg-parser-worker.js\n- libredwg-web.wasm\n\nRepository notice: THIRD_PARTY_NOTICES.md\n`;

const noticePath = join(outputDir, "GPL-NOTICE.txt");
await writeFile(noticePath, gplNotice, "utf8");
const noticeStat = await stat(noticePath);
if (!noticeStat.isFile() || noticeStat.size <= 0) {
  throw new Error("CAD upstream GPL notice could not be generated.");
}
console.log(`[cad-upstream] wrote ${noticePath.slice(root.length + 1)} (${noticeStat.size} bytes)`);
