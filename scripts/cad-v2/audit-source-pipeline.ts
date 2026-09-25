// ============================================================================
// DWG/DXF MOTOR V2 — AUDIT SOURCE PIPELINE (P01)
// ============================================================================
// Bu script, bir CAD dosyasının kaynak ayrıştırma -> canonical -> scene
// aşamalarındaki definition ve instance sayaçlarını, veri kayıplarını
// ve kalite durumunu denetler ve P01 kanıt dosyalarını üretir.

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { evaluateDocumentQuality } from "../../src/lib/cad-v2/canonical/diagnostics";

const deadline = setTimeout(() => {
  console.error("[audit-source-pipeline] Süre aşımı (120 sn).");
  process.exit(2);
}, 120000);

async function runAudit() {
  const r001Relative = "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg";
  const r001Path = path.resolve(process.cwd(), r001Relative);

  if (!fs.existsSync(r001Path)) {
    throw new Error(`Kaynak dosya bulunamadı: ${r001Path}`);
  }

  const bytes = fs.readFileSync(r001Path);
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");

  console.log(`[audit-source-pipeline] R001 ayrıştırılıyor (${bytes.length} bytes, sha256=${hash.slice(0, 8)}...)...`);

  const doc = await parseDwgToCanonical(bytes, {
    sourceVersionKey: "R001-audit-p01",
    sourceSha256: hash,
  });

  // 1. Definition ve Instance Sayımları
  const countTypes = (items: any[]) =>
    items.reduce((acc: Record<string, number>, item: any) => {
      const t = item.type || "UNKNOWN";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

  const topEntities = doc.modelSpaceEntities || [];
  const topTypeCounts = countTypes(topEntities);

  const blocks = doc.blocks || {};
  const blockNames = Object.keys(blocks);
  const allBlockEntities = blockNames.flatMap((b) => blocks[b].entities || []);
  const blockTypeCounts = countTypes(allBlockEntities);

  // Instance ziyaretleri (reachable traversal)
  let instanceVisits = 0;
  let maxDepth = 0;
  const instanceTypeVisits: Record<string, number> = {};

  function traverse(entities: any[], depth = 0, ancestry: string[] = []) {
    for (const ent of entities) {
      instanceVisits++;
      maxDepth = Math.max(maxDepth, depth);
      const t = ent.type || "UNKNOWN";
      instanceTypeVisits[t] = (instanceTypeVisits[t] || 0) + 1;

      if (ent.type === "INSERT" && depth < 32 && !ancestry.includes(ent.blockName)) {
        const b = blocks[ent.blockName];
        if (b && Array.isArray(b.entities)) {
          traverse(b.entities, depth + 1, [...ancestry, ent.blockName]);
        }
      }
    }
  }

  traverse(topEntities);

  // 2. Kalite Değerlendirmesi
  const quality = evaluateDocumentQuality(doc, doc.rawStats);

  // 3. Sahne Derlemesi
  console.log("[audit-source-pipeline] Sahne derleniyor...");
  const compiled = compileCanonicalToScene(doc);

  // 4. Çıktı Nesnelerini Hazırla
  let gitHead = "unknown";
  try {
    gitHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    // git bulunamazsa yoksay
  }

  const sourceCensus = {
    source: {
      file: r001Relative,
      bytes: bytes.length,
      sha256: hash,
      acadVersion: doc.acadVersion,
      units: doc.units,
      rawHeaderInsunits: doc.rawStats?.rawHeaderInsunits,
    },
    topLevel: {
      count: topEntities.length,
      types: topTypeCounts,
    },
    blockDefinitions: {
      blockCount: blockNames.length,
      totalEntities: allBlockEntities.length,
      types: blockTypeCounts,
      invisibleEntitiesCount: allBlockEntities.filter((e) => e.visible === false).length,
    },
    instanceReachable: {
      totalVisits: instanceVisits,
      maxDepth,
      typeVisits: instanceTypeVisits,
    },
    hatchCensus: {
      topHatchCount: topEntities.filter((e) => e.type === "HATCH").length,
      topHatchWithLoops: topEntities.filter((e) => e.type === "HATCH" && e.loops?.length > 0).length,
      blockHatchCount: allBlockEntities.filter((e) => e.type === "HATCH").length,
      blockHatchWithLoops: allBlockEntities.filter((e) => e.type === "HATCH" && e.loops?.length > 0).length,
    },
    dimensionConversion: {
      topDimensionsInCanonical: topEntities.filter((e) => e.type === "DIMENSION").length,
      anonymousDimensionInserts: topEntities.filter(
        (e) => e.type === "INSERT" && e.blockName?.startsWith("*D")
      ).length,
    },
    auditMetadata: {
      timestamp: new Date().toISOString(),
      gitHead,
      nodeVersion: process.version,
    },
  };

  const provenanceSummary = {
    qualityStatus: compiled.manifest.qualityStatus,
    diagnosticCodes: compiled.manifest.diagnosticsSummary.diagnosticCodes,
    provenance: quality.provenance,
    sceneSummary: {
      chunkCount: compiled.chunks.size,
      totalChunkBytes: Array.from(compiled.chunks.values()).reduce((acc, c) => acc + c.byteLength, 0),
      bbox: compiled.manifest.layouts[0]?.bbox,
      exactStatusPrevented: compiled.manifest.qualityStatus !== "exact",
    },
    auditMetadata: {
      timestamp: new Date().toISOString(),
      gitHead,
      nodeVersion: process.version,
    },
  };

  // 5. Kanıt Dosyalarını Yaz
  const outDir = path.resolve(process.cwd(), "motor_v2/evidence/fidelity-v3/P01");
  fs.mkdirSync(outDir, { recursive: true });

  const censusPath = path.join(outDir, "source-census.json");
  const summaryPath = path.join(outDir, "provenance-summary.json");

  fs.writeFileSync(censusPath, JSON.stringify(sourceCensus, null, 2), "utf8");
  fs.writeFileSync(summaryPath, JSON.stringify(provenanceSummary, null, 2), "utf8");

  console.log(`[audit-source-pipeline] Kanıtlar yazıldı:`);
  console.log(`  -> ${censusPath}`);
  console.log(`  -> ${summaryPath}`);
  console.log(`[audit-source-pipeline] Kalite: ${compiled.manifest.qualityStatus}`);
  console.log(`[audit-source-pipeline] Tanı Kodları:`, compiled.manifest.diagnosticsSummary.diagnosticCodes);
}

runAudit()
  .catch((err) => {
    console.error("[audit-source-pipeline] Hata:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    clearTimeout(deadline);
    process.exit(process.exitCode || 0);
  });
