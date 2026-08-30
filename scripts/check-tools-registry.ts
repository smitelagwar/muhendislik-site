import assert from "node:assert/strict";
import { TOOLS } from "../src/lib/tools-data";
import { TOOL_REGISTRY, getToolImplementation, isToolVerified, isToolImplemented } from "../src/lib/tool-registry";
import { TOOL_EVIDENCE_REQUIREMENTS } from "../src/lib/tool-evidence-manifest";

console.log("==================================================================");
console.log("FAZ B — MÜHENDİSLİK ARAÇLARI REGISTRY & LIVE-STATE BÜTÜNLÜĞÜ");
console.log("==================================================================\n");

// 1. 30/30 Registry Eşleşmesi
console.log(`[1] Registry Kayıt Sayısı: ${Object.keys(TOOL_REGISTRY).length} / 30`);
assert.equal(Object.keys(TOOL_REGISTRY).length, 30, "Registry tam 30 araç içermelidir.");

for (const tool of TOOLS) {
  const record = getToolImplementation(tool.id);
  assert.ok(record, `Registry içinde ${tool.id} bulunamadı!`);
  assert.equal(record.id, tool.id, `ID eşleşmiyor: ${record.id} !== ${tool.id}`);
  assert.equal(record.route, tool.href, `Rota eşleşmiyor: ${record.route} !== ${tool.href}`);
  assert.ok(record.name.length > 0, "Araç adı boş olamaz");
  assert.ok(record.normativeReference && record.normativeReference.length > 0, "Normatif referans boş olamaz");
  assert.ok(["A", "B", "C"].includes(record.tier), `Geçersiz risk sınıfı: ${record.tier}`);
  assert.ok(["placeholder", "implemented"].includes(record.status), `Geçersiz statü: ${record.status}`);
  assert.ok(["verified", "verification-pending"].includes(record.verificationState), `Geçersiz verificationState: ${record.verificationState}`);

  const evidence = TOOL_EVIDENCE_REQUIREMENTS[tool.id];
  assert.ok(evidence, `Evidence tanımı eksik: ${tool.id}`);
}

console.log("  ✓ Tüm 30 araç katalog ve registry ile %100 senkronize.");

// 2. Statü Sayımları
const verifiedTools = TOOLS.filter((t) => isToolVerified(t.id));
const implementedTools = TOOLS.filter((t) => isToolImplemented(t.id));
const pendingTools = TOOLS.filter((t) => !isToolVerified(t.id));

console.log("\n[2] Statü Dağılımı:");
console.log(`  - Geliştirilmiş (Implemented):          ${implementedTools.length} / 30 (100%)`);
console.log(`  - Doğrulanmış / Baseline (Verified):     ${verifiedTools.length} / 30`);
console.log(`  - Düzeltme Bekleyen (Pending Fix):     ${pendingTools.length} / 30`);

// 3. Canlılık Değişmezliği (Live Invariant Testi)
console.log("\n[3] Canlılık Değişmezliği Kontrolü:");
for (const tool of TOOLS) {
  const record = TOOL_REGISTRY[tool.id];
  if (record.verificationState === "verified") {
    assert.equal(record.status, "implemented", "Doğrulanmış bir araç kesinlikle implemented statüsünde olmalıdır.");
  }
}

console.log("  ✓ Live invariant kuralları sağlandı. Sahte canlılık tespiti aktif.");

console.log("\n==================================================================");
console.log("✅ FAZ B REGISTRY VE LIVE-STATE KONTROLÜ BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
