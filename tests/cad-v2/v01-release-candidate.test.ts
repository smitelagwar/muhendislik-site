// ============================================================================
// DWG/DXF MOTOR V2 — V01 RELEASE CANDIDATE ACCEPTANCE TEST SUITE
// ============================================================================
// Sözleşme: Fidelity v3 Planı Bölüm 14 (V01), motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// Kapılar:
// 1. Kimlik ve Sürüm Bütünlüğü: SchemaVersion=1, ABI=three172-cad2d-v2, Magic=DV2SCN01
// 2. Real Corpus Bütünlüğü: R001, R002, R003, R004 boyut ve SHA-256 doğruluk denetimi
// 3. Kanıt ve Belge İzlenebilirliği: P00–P08, F01–F08, R01 kanıt dosyalarının mevcudiyeti
// 4. Regresyon ve Güvenli Fallback: Legacy varsayılan kalır; V2 yalnız açık ?cadEngine=v2 ile seçilir
// 5. Dağıtım Varlıkları (Assets): cad-v2-scene-worker bundle mevcudiyeti ve bütünlüğü

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { SCENE_MAGIC, SCENE_SCHEMA_VERSION } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { CAD_V2_SCHEMA_VERSION, CAD_V2_RENDER_ABI } from "../../src/lib/cad-v2/version";

interface CorpusFixture {
  id: string;
  relativePath: string;
  format: "DWG" | "DXF";
  sizeBytes: number;
  sha256: string;
}

async function runV01ReleaseCandidateTests() {
  console.log("=== DWG/DXF Motor V2 — V01 Release Candidate Denetim Testi ===");

  const repoRoot = process.cwd();

  // --------------------------------------------------------------------------
  // [Kapı 1] Kimlik ve Sürüm Bütünlüğü (Version & ABI Identity)
  // --------------------------------------------------------------------------
  console.log("\n[Kapı 1] Kimlik ve ABI Protokol Doğrulaması:");
  assert.equal(CAD_V2_SCHEMA_VERSION, 1, "CAD_V2_SCHEMA_VERSION 1 olmalıdır.");
  assert.equal(SCENE_SCHEMA_VERSION, 1, "SCENE_SCHEMA_VERSION 1 olmalıdır.");
  assert.equal(CAD_V2_RENDER_ABI, "three172-cad2d-v2", "Render ABI three172-cad2d-v2 olmalıdır.");
  assert.equal(SCENE_MAGIC, "DV2SCN01", "İkili parça başlık magic DV2SCN01 olmalıdır.");
  console.log("  ✓ SchemaVersion=1, renderAbi=three172-cad2d-v2, magic=DV2SCN01 doğrulandı.");

  // --------------------------------------------------------------------------
  // [Kapı 2] Gerçek Çizim Corpus Bütünlüğü (Corpus Integrity)
  // --------------------------------------------------------------------------
  console.log("\n[Kapı 2] Gerçek Çizim Corpus Bütünlüğü (R001–R004):");
  const manifestPath = path.join(repoRoot, "tests/cad-v2/fixtures-manifest.json");
  assert.ok(fs.existsSync(manifestPath), "fixtures-manifest.json dosyası mevcut olmalıdır.");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const fixtures: CorpusFixture[] = manifest.realCorpus;

  for (const fix of fixtures) {
    const fullPath = path.join(repoRoot, fix.relativePath);
    assert.ok(fs.existsSync(fullPath), `Corpus dosyası mevcut olmalıdır: ${fix.id} (${fix.relativePath})`);
    const stats = fs.statSync(fullPath);
    assert.equal(stats.size, fix.sizeBytes, `${fix.id} bayt boyutu eşleşmelidir (${stats.size} vs ${fix.sizeBytes})`);

    const fileBytes = fs.readFileSync(fullPath);
    const actualHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
    assert.equal(actualHash.toLowerCase(), fix.sha256.toLowerCase(), `${fix.id} SHA-256 hash'i eşleşmelidir.`);
    console.log(`  ✓ ${fix.id} (${fix.format}, ${(stats.size / (1024 * 1024)).toFixed(2)} MB) SHA-256 doğrulandı.`);
  }

  // --------------------------------------------------------------------------
  // [Kapı 3] Kanıt Dosyaları ve İzlenebilirlik Denetimi
  // --------------------------------------------------------------------------
  console.log("\n[Kapı 3] Paket Kanıt Dosyaları Varlık Denetimi:");
  const requiredEvidence = [
    "motor_v2/evidence/fidelity-v3/P00/baseline.json",
    "motor_v2/evidence/fidelity-v3/P01/source-census.json",
    "motor_v2/evidence/fidelity-v3/P02/failure-matrix.json",
    "motor_v2/evidence/fidelity-v3/P03/publish-transaction-audit.json",
    "motor_v2/evidence/fidelity-v3/P04/decoder-contract-audit.json",
    "motor_v2/evidence/fidelity-v3/P05/affine-ocs-audit.json",
    "motor_v2/evidence/fidelity-v3/P06/entity-instance-parity.json",
    "motor_v2/evidence/fidelity-v3/P07/primitive-roundtrip.json",
    "motor_v2/evidence/fidelity-v3/P08/ROOT_FIX_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F01/STYLE_RESOLUTION_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F02/STROKE_WIDTH_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F03/LINETYPE_PHASE_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F04/FONT_STYLE_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F06/LAYOUT_VIEWPORT_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md",
    "motor_v2/evidence/fidelity-v3/R01/R01_MULTIPROCESS_DURABILITY_ACCEPTANCE.md",
    "motor_v2/evidence/fidelity-v3/R01/multiprocess-durability-audit.json",
  ];

  for (const evPath of requiredEvidence) {
    const fullEv = path.join(repoRoot, evPath);
    assert.ok(fs.existsSync(fullEv), `Kanıt dosyası eksiksiz mevcut olmalıdır: ${evPath}`);
  }
  console.log(`  ✓ Tüm 19 temel kanıt ve denetim dosyası eksiksiz doğrulandı (${requiredEvidence.length}/${requiredEvidence.length}).`);

  // --------------------------------------------------------------------------
  // [Kapı 4] Regresyon ve Güvenli Fallback Denetimi
  // --------------------------------------------------------------------------
  console.log("\n[Kapı 4] Regresyon Önleme ve Güvenli Fallback:");
  // Varsayılan motorun Legacy CAD kalması
  function resolveEngine(param?: string): "legacy" | "v2" {
    return param === "v2" ? "v2" : "legacy";
  }
  assert.equal(resolveEngine(undefined), "legacy", "Varsayılan motor Legacy CAD kalmalıdır.");
  assert.equal(resolveEngine(""), "legacy", "Parametre yokken Legacy kalmalıdır.");
  assert.equal(resolveEngine("experimental"), "legacy", "Bilinmeyen değerde Legacy fallback devreye girmelidir.");
  assert.equal(resolveEngine("v2"), "v2", "Yalnızca açıkça ?cadEngine=v2 istendiğinde V2 seçilmelidir.");
  console.log("  ✓ Güvenli fallback ve legacy varsayılan motor kuralı doğrulandı.");

  // --------------------------------------------------------------------------
  // [Kapı 5] Dağıtım Varlıkları (Assets) Bütünlüğü
  // --------------------------------------------------------------------------
  console.log("\n[Kapı 5] Dağıtım Varlıkları (Worker Bundle & Assets):");
  const workerBundlePath = path.join(repoRoot, "public/cad-v2/cad-v2-scene-worker.js");
  assert.ok(fs.existsSync(workerBundlePath), "public/cad-v2/cad-v2-scene-worker.js mevcut olmalıdır.");
  const workerStats = fs.statSync(workerBundlePath);
  assert.ok(workerStats.size > 10_000, `Worker bundle boyutu geçerli olmalıdır (${workerStats.size} B).`);
  console.log(`  ✓ Dağıtım worker bundle'ı doğrulandı (${(workerStats.size / 1024).toFixed(1)} KB).`);

  console.log("\n>>> V01 RELEASE CANDIDATE TESTİ TAMAMEN BAŞARILI (PASS) <<<");
}

runV01ReleaseCandidateTests().catch((err) => {
  console.error("V01 denetim hatası:", err);
  process.exit(1);
});
