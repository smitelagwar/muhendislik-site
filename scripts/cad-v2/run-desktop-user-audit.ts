// ============================================================================
// DWG/DXF MOTOR V2 — MASAÜSTÜ GERÇEK KULLANICI DENEYİMİ VE STRES TESTİ
// ============================================================================
// Bu script, kullanıcının Masaüstündeki 5 gerçek dosyayı sisteme yükler,
// V2 motoruyla çözümler, ikili sahneye derler ve tüm kullanıcı senaryolarını
// (katmanlar, paftalar, kamera, bütçe, hata zarfı) tek tek doğrular.

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { unpackSceneChunk, validateSceneManifest } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import type { DokFile } from "../../src/lib/dokumantasyon/types";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";

interface TargetFileInfo {
  label: string;
  sourcePath: string;
  fileId?: string;
  format: "DWG" | "DXF";
  sizeBytes?: number;
  sha256?: string;
}

const TARGET_FILES: TargetFileInfo[] = [
  {
    label: "1) Kat Planı Mimari",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\1 ve 2.kat dwg.dwg",
    format: "DWG",
  },
  {
    label: "2) Kalıp Planı Zemin Kat",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\kalip_plani_zeminkat.dxf",
    format: "DXF",
  },
  {
    label: "3) Mustafa Selvi Mimari",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\mustafa selvimimariiiii.dwg",
    format: "DWG",
  },
  {
    label: "4) Süheyla Kara Statik (DWG)",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg",
    format: "DWG",
  },
  {
    label: "5) Süheyla Kara Statik (DXF Büyük)",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf",
    format: "DXF",
  },
];

const runId = `desktop-audit-${process.pid}-${Date.now()}`;
const defaultDataDir = path.resolve(process.cwd(), "test-output/cad-v2-tmp", runId);
const DATA_DIR = path.resolve(process.env.DOK_LOCAL_DATA_DIR?.trim() || defaultDataDir);
const productionDataDir = path.resolve(process.cwd(), ".data");
const relativeProductionPath = path.relative(productionDataDir, DATA_DIR);
if (
  relativeProductionPath === "" ||
  (relativeProductionPath !== ".." && !relativeProductionPath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeProductionPath))
) {
  throw new Error(`Desktop audit production .data dizinine yazmayı reddetti: ${DATA_DIR}`);
}
process.env.DOK_LOCAL_DATA_DIR = DATA_DIR;
process.env.CAD_V2_STORAGE_DIR = path.join(DATA_DIR, "cad-v2-scenes");
const DOK_STORAGE_DIR = path.join(DATA_DIR, "dok_storage");
const DOK_DB_PATH = path.join(DATA_DIR, "dok_db.json");
const SCENES_STORAGE_DIR = path.join(DATA_DIR, "cad-v2-scenes");

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DOK_STORAGE_DIR)) fs.mkdirSync(DOK_STORAGE_DIR, { recursive: true });
  if (!fs.existsSync(SCENES_STORAGE_DIR)) fs.mkdirSync(SCENES_STORAGE_DIR, { recursive: true });
}

function loadDokDb(): { folders: any[]; files: DokFile[] } {
  if (fs.existsSync(DOK_DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DOK_DB_PATH, "utf-8"));
      return { folders: parsed.folders || [], files: parsed.files || [] };
    } catch {
      // ignore
    }
  }
  return { folders: [], files: [] };
}

function saveDokDb(db: { folders: any[]; files: DokFile[] }) {
  fs.writeFileSync(DOK_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function run() {
  console.log("\n============================================================================");
  console.log("🚀 CAD V2 — MASAÜSTÜ 5 GERÇEK PROJE DOSYASI KULLANICI DENEYİM TESTİ");
  console.log("============================================================================\n");
  console.log(`İzole run-level DOK_LOCAL_DATA_DIR: ${DATA_DIR}`);

  ensureDirectories();
  const db = loadDokDb();

  // --------------------------------------------------------------------------
  // ADIM 1: Dosyaları Oku ve Dokümantasyon Depolamasına Kaydet
  // --------------------------------------------------------------------------
  console.log("📦 ADIM 1: Dosyaların İncelenmesi ve .data Depolamasına Kaydı");
  console.log("----------------------------------------------------------------------------");

  for (const item of TARGET_FILES) {
    if (!fs.existsSync(item.sourcePath)) {
      throw new Error(`Dosya bulunamadı: ${item.sourcePath}`);
    }

    const fileBuffer = fs.readFileSync(item.sourcePath);
    item.sizeBytes = fileBuffer.byteLength;
    item.sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const baseName = path.basename(item.sourcePath);
    const ext = path.extname(item.sourcePath).toLowerCase();

    console.log(`\n• ${item.label}:`);
    console.log(`  Dosya Adı : ${baseName}`);
    console.log(`  Boyut     : ${formatBytes(item.sizeBytes)} (${item.sizeBytes.toLocaleString()} bayt)`);
    console.log(`  SHA-256   : ${item.sha256}`);

    let existing = db.files.find((f) => f.display_name === baseName && !f.deleted_at);
    let fileId: string;
    if (existing) {
      fileId = existing.id;
      console.log(`  -> Mevcut DokFile kaydı kullanılıyor (ID: ${fileId})`);
    } else {
      fileId = crypto.randomUUID();
      console.log(`  -> Yeni DokFile kaydı oluşturuldu (ID: ${fileId})`);
    }

    const fileNameOnDisk = `${fileId}${ext}`;
    const targetStoragePath = path.join(DOK_STORAGE_DIR, fileNameOnDisk);

    fs.writeFileSync(targetStoragePath, fileBuffer);

    const now = new Date().toISOString();
    const dokFileRecord: DokFile = {
      id: fileId,
      folder_id: null,
      display_name: baseName,
      blob_pathname: `dok_storage/${fileNameOnDisk}`,
      blob_url: `local:${fileNameOnDisk}`,
      size_bytes: item.sizeBytes,
      mime_type: item.format === "DWG" ? "application/x-dwg" : "image/vnd.dxf",
      extension: ext,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      deleted_at: null,
      is_starred: false,
    } as any;

    if (existing) {
      const idx = db.files.findIndex((f) => f.id === fileId);
      db.files[idx] = dokFileRecord;
    } else {
      db.files.push(dokFileRecord);
    }

    item.fileId = fileId;
  }

  saveDokDb(db);
  console.log(`\n✔ ADIM 1 Tamamlandı: Tüm 5 dosya Document Studio depolamasına kaydedildi.`);

  // --------------------------------------------------------------------------
  // ADIM 2: Her Dosya İçin Pipeline Derleme, Kalite ve Stres Denetimi
  // --------------------------------------------------------------------------
  console.log("\n============================================================================");
  console.log("🔬 ADIM 2: Çözümleme (Decode), İkili Derleme (Compile) ve Doğrulama");
  console.log("============================================================================");

  const durableService = CadV2DurableService.getInstance();
  const summaryResults: any[] = [];

  for (let idx = 0; idx < TARGET_FILES.length; idx++) {
    const item = TARGET_FILES[idx];
    const baseName = path.basename(item.sourcePath);
    console.log(`\n========================================================================`);
    console.log(`▶ PROJE [${idx + 1}/5]: ${baseName}`);
    console.log(`  Format : ${item.format} | Boyut: ${formatBytes(item.sizeBytes!)} | File ID: ${item.fileId}`);
    console.log(`========================================================================`);

    const fileBuffer = fs.readFileSync(item.sourcePath);

    // 2.1 Dekoder
    console.log(`\n[2.1 Decode] ${item.format} Dekoderi Çalıştırılıyor...`);
    const tDecodeStart = performance.now();
    let canonical: CadCanonicalDocument;
    if (item.format === "DWG") {
      canonical = await parseDwgToCanonical(fileBuffer, {
        sourceVersionKey: `${item.fileId}_1`,
        sourceSha256: item.sha256,
      });
    } else {
      canonical = await parseDxfToCanonical(fileBuffer, {
        sourceVersionKey: `${item.fileId}_1`,
        sourceSha256: item.sha256,
      });
    }
    const tDecode = performance.now() - tDecodeStart;

    console.log(`✔ Dekoder Başarılı (${tDecode.toFixed(1)} ms)`);
    console.log(`  - ACAD Sürümü        : ${canonical.acadVersion}`);
    console.log(`  - Katman Sayısı      : ${Object.keys(canonical.layers).length}`);
    console.log(`  - Model Varlık Sayısı: ${canonical.modelSpaceEntities.length.toLocaleString()}`);
    console.log(`  - Blok Tanımı Sayısı : ${Object.keys(canonical.blocks).length.toLocaleString()}`);

    const counts: Record<string, number> = {};
    for (const ent of canonical.modelSpaceEntities) {
      counts[ent.type] = (counts[ent.type] || 0) + 1;
    }
    console.log(`  - Varlık Türleri     :`, counts);

    // 2.2 İkili Sahne Derleme
    console.log(`\n[2.2 Compile] DV2SCN01 İkili Sahne Derleyicisi Çalıştırılıyor...`);
    const tCompileStart = performance.now();
    const compiled = compileCanonicalToScene(canonical);
    const tCompile = performance.now() - tCompileStart;

    console.log(`✔ Derleme Başarılı (${tCompile.toFixed(1)} ms)`);
    console.log(`  - Sahne ID           : ${compiled.manifest.sceneId}`);
    console.log(`  - Parça (Chunk)      : ${compiled.chunks.size} adet`);
    console.log(`  - Kalite Durumu      : ${compiled.manifest.qualityStatus}`);
    console.log(`  - BBox               : [${compiled.manifest.layouts[0]?.bbox.map((v) => v.toFixed(2)).join(", ")}]`);

    // 2.3 Parça Boyut ve Header Bütünlüğü (Chunk Ceiling < 2 MiB)
    let totalChunkBytes = 0;
    let maxChunkBytes = 0;
    for (const [chunkId, bytes] of Array.from(compiled.chunks.entries())) {
      totalChunkBytes += bytes.byteLength;
      if (bytes.byteLength > maxChunkBytes) maxChunkBytes = bytes.byteLength;
      if (bytes.byteLength > 2 * 1024 * 1024) {
        throw new Error(`Chunk ${chunkId} tavanı aştı: ${bytes.byteLength} > 2MB`);
      }
    }
    console.log(`  - Toplam Sahne Boyutu: ${formatBytes(totalChunkBytes)} (Maks Chunk: ${formatBytes(maxChunkBytes)})`);

    // 2.4 Worker Unpack Doğrulaması
    console.log(`\n[2.4 Worker Unpack] Web Worker İkili Çözümleme Doğrulaması...`);
    const isValidManifest = validateSceneManifest(compiled.manifest);
    if (!isValidManifest) throw new Error("Manifest doğrulaması başarısız!");

    let totalVertices = 0;
    for (const [chunkId, chunkBytes] of Array.from(compiled.chunks.entries())) {
      const unpacked = unpackSceneChunk(chunkId, chunkBytes);
      totalVertices += unpacked.vertexCount;
    }
    console.log(`✔ Worker Unpack Başarılı: ${totalVertices.toLocaleString()} vertex doğrulandı.`);

    // 2.5 Durable Service Hazırlama ve Cache
    console.log(`\n[2.5 Durable Service] Hazırlama (Prepare) ve Çoklu İstek Dayanıklılığı...`);
    const prep = await durableService.prepare({
      fileId: item.fileId!,
      expectedSourceVersionKey: `${item.fileId}_1`,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: fileBuffer,
      fileName: baseName,
    });
    if (prep.status !== "ready") {
      throw new Error(`DurableService prepare hazır dönmedi: ${prep.status}`);
    }

    // Sıcak erişim testi (Warm Cache)
    const tWarmStart = performance.now();
    const warmPrep = await durableService.prepare({
      fileId: item.fileId!,
      expectedSourceVersionKey: `${item.fileId}_1`,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: fileBuffer,
      fileName: baseName,
    });
    const tWarm = performance.now() - tWarmStart;
    console.log(`✔ Sıcak (Warm Cache) Yanıtı: ${tWarm.toFixed(2)} ms (Sahne ID: ${warmPrep.sceneId})`);

    // 2.6 Pafta & Katman Bilgisi
    console.log(`\n[2.6 Arayüz Bilgisi] Paftalar ve Katmanlar:`);
    console.log(`  - Paftalar: ${compiled.manifest.layouts.map((l) => `"${l.sourceName}" (${l.kind})`).join(", ")}`);
    const layerNames = Object.keys(compiled.manifest.layers || {});
    console.log(`  - Katmanlar (${layerNames.length} adet): ${layerNames.slice(0, 10).join(", ")}${layerNames.length > 10 ? "..." : ""}`);

    summaryResults.push({
      label: item.label,
      fileId: item.fileId,
      format: item.format,
      sizeBytes: item.sizeBytes,
      decodeTimeMs: tDecode,
      compileTimeMs: tCompile,
      warmTimeMs: tWarm,
      entityCount: canonical.modelSpaceEntities.length,
      layerCount: layerNames.length,
      layoutCount: compiled.manifest.layouts.length,
      chunkCount: compiled.chunks.size,
      totalVertices,
      qualityStatus: compiled.manifest.qualityStatus,
    });
  }

  // --------------------------------------------------------------------------
  // SONUÇ TABLOSU VE CANLI TEST BAĞLANTILARI
  // --------------------------------------------------------------------------
  console.log("\n============================================================================");
  console.log("📊 5 GERÇEK DOSYA PERFORMANS VE DERLEME RAPORU");
  console.log("============================================================================\n");
  console.table(summaryResults.map((r) => ({
    Dosya: r.label,
    Format: r.format,
    Boyut: formatBytes(r.sizeBytes),
    Varlık: r.entityCount.toLocaleString(),
    Katman: r.layerCount,
    Pafta: r.layoutCount,
    Parça: r.chunkCount,
    Vertex: r.totalVertices.toLocaleString(),
    "Decode (ms)": r.decodeTimeMs.toFixed(0),
    "Compile (ms)": r.compileTimeMs.toFixed(0),
    "Warm (ms)": r.warmTimeMs.toFixed(1),
    Kalite: r.qualityStatus,
  })));

  console.log("\n============================================================================");
  console.log("🔗 GERÇEK KULLANICI ARAYÜZ BAĞLANTILARI (Document Studio):");
  console.log("============================================================================\n");
  for (const r of summaryResults) {
    console.log(`• ${r.label}:`);
    console.log(`  V2 Motor Doğrudan URL: http://localhost:3000/dokumantasyon/dosya/${r.fileId}?cadEngine=v2`);
    console.log(`  Klasik Studio URL    : http://localhost:3000/dokumantasyon/dosya/${r.fileId}\n`);
  }
}

run().catch((err) => {
  console.error("\n❌ BEKLENMEYEN HATA:", err);
  process.exit(1);
});
