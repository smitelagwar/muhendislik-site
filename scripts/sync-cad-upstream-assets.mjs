import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "public", "cad-upstream");

const LIBREDWG_CONVERTER_VERSION = "3.14.2";
const LIBREDWG_WEB_VERSION = "0.7.10";
const LIBREDWG_SOURCE_COMMIT = "e3198a391b5c8599a94f1f1da285426443371451";

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

const fontsManifestPath = join(fontsOutputDir, "fonts.json");
await writeFile(fontsManifestPath, JSON.stringify(fontsManifest, null, 2), "utf8");
console.log(`[cad-upstream] wrote ${fontsManifestPath.slice(root.length + 1)}`);

const gplNotice = `MLightCAD LibreDWG browser component\n\n@mlightcad/libredwg-converter ${LIBREDWG_CONVERTER_VERSION} — GPL-3.0\n@mlightcad/libredwg-web ${LIBREDWG_WEB_VERSION}\n\nCorresponding upstream source snapshot:\nhttps://github.com/mlightcad/realdwg-web/tree/${LIBREDWG_SOURCE_COMMIT}\n\nGPL-3.0 license text:\nhttps://www.gnu.org/licenses/gpl-3.0.html\n\nDistributed assets:\n- libredwg-parser-worker.js\n- libredwg-web.wasm\n\nRepository notice: THIRD_PARTY_NOTICES.md\n`;

const noticePath = join(outputDir, "GPL-NOTICE.txt");
await writeFile(noticePath, gplNotice, "utf8");
const noticeStat = await stat(noticePath);
if (!noticeStat.isFile() || noticeStat.size <= 0) {
  throw new Error("CAD upstream GPL notice could not be generated.");
}
console.log(`[cad-upstream] wrote ${noticePath.slice(root.length + 1)} (${noticeStat.size} bytes)`);
