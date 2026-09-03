import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
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
  if (asset.target.endsWith("mtext-renderer-worker.js")) {
    const rawWorker = await readFile(asset.source, "utf8");
    const patchedWorker = rawWorker.replaceAll(
      "https://cdn.jsdelivr.net/gh/mlightcad/cad-data/fonts/",
      "/cad-upstream/fonts/"
    );
    await writeFile(asset.target, patchedWorker, "utf8");
  } else {
    await copyFile(asset.source, asset.target);
  }
  const targetStat = await stat(asset.target);
  console.log(
    `[cad-upstream] synced ${asset.target.slice(root.length + 1)} (${targetStat.size} bytes)`
  );
}

const fontsOutputDir = join(outputDir, "fonts");
await mkdir(fontsOutputDir, { recursive: true });

// Tek kaynak: src/lib/dokumantasyon/cad-font-manifest.json
const manifestPath = join(root, "src", "lib", "dokumantasyon", "cad-font-manifest.json");
const manifestRaw = await readFile(manifestPath, "utf8");
const manifestItems = JSON.parse(manifestRaw);

if (!Array.isArray(manifestItems) || manifestItems.length === 0) {
  throw new Error("CAD font manifest is empty or invalid: " + manifestPath);
}

const seenAliases = new Map();
const processedFontsManifest = [];

for (const item of manifestItems) {
  if (!item.file || !Array.isArray(item.names) || item.names.length === 0) {
    throw new Error(`Invalid manifest entry: ${JSON.stringify(item)}`);
  }

  // Dosya public/fonts/ veya public/fonts/cad/ içinde aranır
  const candidatePaths = [
    join(root, "public", "fonts", item.file),
    join(root, "public", "fonts", "cad", item.file),
  ];

  let sourcePath = null;
  let sourceStat = null;
  for (const cand of candidatePaths) {
    const s = await stat(cand).catch(() => null);
    if (s?.isFile() && s.size > 0) {
      sourcePath = cand;
      sourceStat = s;
      break;
    }
  }

  if (!sourcePath || !sourceStat) {
    throw new Error(`Required font asset is missing or empty in public/fonts/ or public/fonts/cad/: ${item.file}`);
  }

  const targetPath = join(fontsOutputDir, item.file);
  await copyFile(sourcePath, targetPath);
  const targetStat = await stat(targetPath);
  if (targetStat.size !== sourceStat.size) {
    throw new Error(`Font asset copy size mismatch: ${targetPath}`);
  }
  console.log(
    `[cad-upstream] synced font ${targetPath.slice(root.length + 1)} (${targetStat.size} bytes)`
  );

  // Alias çakışması kontrolü (fail-fast)
  for (const name of item.names) {
    const normalized = name.trim().toLowerCase();
    if (seenAliases.has(normalized)) {
      const prevFile = seenAliases.get(normalized);
      if (prevFile !== item.file) {
        throw new Error(
          `Font alias conflict: alias "${name}" is assigned to both "${prevFile}" and "${item.file}"`
        );
      }
    }
    seenAliases.set(normalized, item.file);
  }

  // Type: .shx -> "shx", .ttf/.otf/.woff -> "mesh"
  const isShx = item.file.toLowerCase().endsWith(".shx");
  const fontType = item.type ?? (isShx ? "shx" : "mesh");

  processedFontsManifest.push({
    file: item.file,
    name: [...item.names].sort((a, b) => a.localeCompare(b)),
    type: fontType,
    ...(item.encoding ? { encoding: item.encoding } : {}),
  });
}

// Deterministik alfabetik sıralama (aynı input her zaman aynı JSON hash'ini üretir)
processedFontsManifest.sort((a, b) => a.file.localeCompare(b.file));

const fontsManifestPath = join(fontsOutputDir, "fonts.json");
await writeFile(fontsManifestPath, JSON.stringify(processedFontsManifest, null, 2) + "\n", "utf8");
console.log(`[cad-upstream] wrote ${fontsManifestPath.slice(root.length + 1)}`);

const gplNotice = `MLightCAD LibreDWG browser component\n\n@mlightcad/libredwg-converter ${LIBREDWG_CONVERTER_VERSION} — GPL-3.0\n@mlightcad/libredwg-web ${LIBREDWG_WEB_VERSION}\n\nCorresponding upstream source snapshot:\nhttps://github.com/mlightcad/realdwg-web/tree/${LIBREDWG_SOURCE_COMMIT}\n\nGPL-3.0 license text:\nhttps://www.gnu.org/licenses/gpl-3.0.html\n\nDistributed assets:\n- libredwg-parser-worker.js\n- libredwg-web.wasm\n\nRepository notice: THIRD_PARTY_NOTICES.md\n`;

const noticePath = join(outputDir, "GPL-NOTICE.txt");
await writeFile(noticePath, gplNotice, "utf8");
const noticeStat = await stat(noticePath);
if (!noticeStat.isFile() || noticeStat.size <= 0) {
  throw new Error("CAD upstream GPL notice could not be generated.");
}
console.log(`[cad-upstream] wrote ${noticePath.slice(root.length + 1)} (${noticeStat.size} bytes)`);
