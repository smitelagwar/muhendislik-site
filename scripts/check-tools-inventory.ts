import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TOOLS, getLiveTools } from "../src/lib/tools-data";
import { TOOL_REGISTRY, getToolRegistryRecord } from "../src/lib/tool-registry";
import { TOOL_EVIDENCE_REQUIREMENTS } from "../src/lib/tool-evidence-manifest";

const ROOT = path.resolve(__dirname, "..");
const TOOLS_APP_DIR = path.join(ROOT, "src", "app", "kategori", "araclar");
const DYNAMIC_SLUG_PATH = path.join(TOOLS_APP_DIR, "[slug]", "page.tsx");

console.log("==================================================================");
console.log("FAZ B — MÜHENDİSLİK ARAÇLARI BAĞIMSIZ ENVANTER VE EVIDENCE DENETİMİ");
console.log("==================================================================\n");

// 1. Katalog Sayı Kontrolü
const catalogCount = TOOLS.length;
console.log(`[1] Katalog Araç Sayısı: ${catalogCount}`);
assert.equal(catalogCount, 30, `Katalogda tam 30 araç olmalı, bulunan: ${catalogCount}`);

// 2. ID Benzersizliği
const ids = TOOLS.map((t) => t.id);
const uniqueIds = new Set(ids);
console.log(`[2] Benzersiz ID Sayısı: ${uniqueIds.size} / ${catalogCount}`);
assert.equal(uniqueIds.size, catalogCount, "Katalogda mükerrer ID bulunuyor!");

// 3. Href Benzersizliği ve Formatı
const hrefs = TOOLS.map((t) => t.href);
const uniqueHrefs = new Set(hrefs);
console.log(`[3] Benzersiz Href Sayısı: ${uniqueHrefs.size} / ${catalogCount}`);
assert.equal(uniqueHrefs.size, catalogCount, "Katalogda mükerrer Href bulunuyor!");

for (const tool of TOOLS) {
  assert.equal(tool.href, `/kategori/araclar/${tool.id}`, `Href formatı geçersiz: ${tool.id} -> ${tool.href}`);
  assert.ok(tool.name.trim().length > 0, `Araç adı boş olamaz: ${tool.id}`);
  assert.ok(tool.description.trim().length > 0, `Açıklama boş olamaz: ${tool.id}`);
  assert.ok(tool.discipline.trim().length > 0, `Disiplin boş olamaz: ${tool.id}`);
}

// 4. Sıralama ve Live Durumu
const liveTools = getLiveTools();
assert.equal(liveTools.length, 30, "getLiveTools() 30 aracı getirmelidir.");

// 5. Dinamik Fallback Rota Varlığı
assert.ok(fs.existsSync(DYNAMIC_SLUG_PATH), "[slug]/page.tsx fallback rotası fiziksel olarak bulunmalıdır!");

// 6. Registry ve Manifest Türetimi
console.log("\n[4] 30 Araçlık Detaylı Rota, Motor ve Evidence Envanteri:\n");
console.log("| #  | ID | Rota | Component | Engine | Evidence State |");
console.log("|:---|:---|:---:|:---:|:---:|:---:|");

let dedicatedCount = 0;
let dynamicSlugCount = 0;
let implementedCount = 0;
let verifiedCount = 0;
let pendingCount = 0;

for (let i = 0; i < TOOLS.length; i++) {
  const tool = TOOLS[i];
  const registryRecord = getToolRegistryRecord(tool.id);
  assert.ok(registryRecord, `Registry kaydı eksik: ${tool.id}`);

  const dedicatedPath = path.join(TOOLS_APP_DIR, tool.id, "page.tsx");
  const hasDedicated = fs.existsSync(dedicatedPath);
  if (hasDedicated) {
    dedicatedCount++;
  } else {
    dynamicSlugCount++;
  }

  // Component & Engine fiziksel varlık kontrolü
  let hasComp = false;
  if (registryRecord.componentPath) {
    const compAbs = path.join(ROOT, registryRecord.componentPath);
    hasComp = fs.existsSync(compAbs);
  }
  assert.ok(hasComp, `Fiziksel bileşen bulunamadı: ${tool.id} -> ${registryRecord.componentPath}`);

  let hasEng = false;
  if (registryRecord.enginePath) {
    const engAbs = path.join(ROOT, registryRecord.enginePath);
    hasEng = fs.existsSync(engAbs);
  }
  assert.ok(hasEng, `Fiziksel hesap motoru bulunamadı: ${tool.id} -> ${registryRecord.enginePath}`);

  // Evidence Requirement kontrolü
  const evidenceReq = TOOL_EVIDENCE_REQUIREMENTS[tool.id];
  assert.ok(evidenceReq, `Evidence tanımı eksik: ${tool.id}`);

  for (const testFile of evidenceReq.engineTestFiles) {
    const testAbs = path.join(ROOT, testFile);
    assert.ok(fs.existsSync(testAbs), `Bağlı test dosyası bulunamadı: ${tool.id} -> ${testFile}`);
  }

  if (registryRecord.status === "implemented") implementedCount++;
  if (registryRecord.verificationState === "verified") verifiedCount++;
  else pendingCount++;

  const routeMark = hasDedicated ? "Dedicated" : "Dynamic [slug]";
  const compMark = hasComp ? "✅" : "❌";
  const engMark = hasEng ? "✅" : "❌";
  const stateMark = registryRecord.verificationState === "verified" ? "🟢 Verified" : "🟡 Pending Fix";

  console.log(`| ${(i + 1).toString().padStart(2, " ")} | \`${tool.id.padEnd(28, " ")}\` | ${routeMark.padEnd(14, " ")} | ${compMark} | ${engMark} | ${stateMark} |`);
}

console.log("\n------------------------------------------------------------------");
console.log("ENVANTER VE EVIDENCE DENETİM ÖZETİ:");
console.log(`- Toplam Katalog Araç Sayısı:  ${catalogCount} / 30`);
console.log(`- Dedicated Statik Rota:       ${dedicatedCount} / 30`);
console.log(`- Dynamic [slug] Fallback:     ${dynamicSlugCount} / 30`);
console.log(`- Implemented Kod:             ${implementedCount} / 30 (100%)`);
console.log(`- Baseline / Protected:        ${verifiedCount} / 30`);
console.log(`- Verification Pending (P0/P1): ${pendingCount} / 30`);
console.log("------------------------------------------------------------------");
console.log("✅ FAZ B ENVANTER VE EVIDENCE TÜRETİMİ BAŞARIYLA TAMAMLANDI.\n");
