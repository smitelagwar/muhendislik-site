import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const corpusDir = path.join(root, "tests", "private-dwg-corpus");
const manifestPath = path.join(corpusDir, "manifest.local.json");

const rollbackPaths = [
  "src/components/dokumantasyon/preview/cad-viewer.tsx",
  "src/components/dokumantasyon/preview/dxf-viewer-worker.ts",
  "src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts",
  "src/components/dokumantasyon/preview/aps-dwg-viewer.tsx",
  "src/lib/dokumantasyon/dwg",
];

const sizeMinimums = { small: 5, medium: 5, large: 3 };
const baselineStatusValues = new Set(["pass", "warning", "fail", "not-applicable"]);
const baselineStatusFields = ["color", "linetype", "lineweight", "text", "block", "hatch"];
const recommendedDrawingTypes = ["kalip-plani", "kolon-aplikasyonu", "kiris-acilimi", "mimari-plan"];
const recommendedFeatures = ["HATCH", "MTEXT", "BLOCK/INSERT", "DIMENSION", "lineweight", "linetype", "colors"];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function checkRollbackSurface() {
  for (const relativePath of rollbackPaths) {
    assert(await exists(path.join(root, relativePath)), `Rollback yüzeyi eksik: ${relativePath}`);
  }
}

function validateBaseline(fileName, baseline) {
  assert(baseline && typeof baseline === "object" && !Array.isArray(baseline), `${fileName}: baseline eksik`);
  assert(typeof baseline.opens === "boolean", `${fileName}: baseline.opens boolean olmalı`);
  assert(
    typeof baseline.durationMs === "number" && Number.isFinite(baseline.durationMs) && baseline.durationMs >= 0,
    `${fileName}: baseline.durationMs sıfır veya pozitif sayı olmalı`,
  );
  assert(
    baseline.error === null || typeof baseline.error === "string",
    `${fileName}: baseline.error string veya null olmalı`,
  );
  assert(typeof baseline.infiniteLoading === "boolean", `${fileName}: baseline.infiniteLoading boolean olmalı`);

  for (const field of baselineStatusFields) {
    assert(
      baselineStatusValues.has(baseline[field]),
      `${fileName}: baseline.${field} pass/warning/fail/not-applicable değerlerinden biri olmalı`,
    );
  }
}

async function main() {
  await checkRollbackSurface();
  console.log("Rollback yüzeyi: PASS");

  if (!(await exists(manifestPath))) {
    console.error("Golden corpus manifest bulunamadı: tests/private-dwg-corpus/manifest.local.json");
    console.error("GATE: BLOCKED — Aşama 2'ye geçme.");
    process.exitCode = 2;
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert(Array.isArray(manifest.files), "manifest.local.json içinde files dizisi olmalı");
  assert(manifest.files.length >= 13, `Golden corpus en az 13 gerçek DWG içermeli; mevcut: ${manifest.files.length}`);

  const seen = new Set();
  const counts = { small: 0, medium: 0, large: 0 };
  const drawingTypes = new Set();
  const features = new Set();
  const rows = [];

  for (const entry of manifest.files) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), "Geçersiz corpus girdisi");
    const fileName = entry.file;
    assert(typeof fileName === "string" && fileName.toLowerCase().endsWith(".dwg"), "Her corpus girdisi .dwg dosyası olmalı");
    assert(path.basename(fileName) === fileName, `${fileName}: yalnız doğrudan corpus klasöründeki dosya adını kullan`);
    assert(!seen.has(fileName), `${fileName}: duplicate corpus girdisi`);
    seen.add(fileName);

    assert(Object.hasOwn(sizeMinimums, entry.sizeClass), `${fileName}: sizeClass small/medium/large olmalı`);
    counts[entry.sizeClass] += 1;

    const filePath = path.join(corpusDir, fileName);
    assert(await exists(filePath), `${fileName}: gerçek DWG dosyası bulunamadı`);
    const info = await stat(filePath);
    assert(info.isFile() && info.size > 0, `${fileName}: dosya boş veya geçersiz`);

    if (typeof entry.drawingType === "string" && entry.drawingType.length > 0) drawingTypes.add(entry.drawingType);
    if (Array.isArray(entry.features)) {
      for (const feature of entry.features) {
        if (typeof feature === "string" && feature.length > 0) features.add(feature);
      }
    }

    validateBaseline(fileName, entry.baseline);

    rows.push({
      file: fileName,
      class: entry.sizeClass,
      bytes: info.size,
      opens: entry.baseline.opens,
      ms: entry.baseline.durationMs,
      infinite: entry.baseline.infiniteLoading,
    });
  }

  for (const [sizeClass, minimum] of Object.entries(sizeMinimums)) {
    assert(counts[sizeClass] >= minimum, `${sizeClass}: en az ${minimum} dosya gerekli; mevcut: ${counts[sizeClass]}`);
  }

  console.table(rows);
  console.log(`Corpus dağılımı: small=${counts.small}, medium=${counts.medium}, large=${counts.large}, total=${manifest.files.length}`);

  const missingDrawingTypes = recommendedDrawingTypes.filter((value) => !drawingTypes.has(value));
  const missingFeatures = recommendedFeatures.filter((value) => !features.has(value));

  if (missingDrawingTypes.length > 0) {
    console.warn(`UYARI — mümkünse corpus'a şu çizim tiplerini ekle: ${missingDrawingTypes.join(", ")}`);
  }
  if (missingFeatures.length > 0) {
    console.warn(`UYARI — mümkünse corpus'a şu özellikleri ekle: ${missingFeatures.join(", ")}`);
  }

  console.log("Baseline alanları: PASS");
  console.log("GATE: PASS — Aşama 2 için Stage 1 kabul kapısı hazır.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  console.error("GATE: BLOCKED — Aşama 2'ye geçme.");
  process.exitCode = 1;
});
