// ============================================================================
// DWG/DXF MOTOR V2 — CORPUS VALIDATOR CLI (G15, B04)
// ============================================================================
// Sözleşme: motor_v2/DUZELTME_PLANI.md (ADIM 3)
// Gerçek DWG/DXF test korpusunu (R001 - R004) doğrular, ayrıştırır ve raporlar.

import * as path from "node:path";
import { execSync } from "node:child_process";

console.log("[CorpusValidator] DWG/DXF Motor V2 Korpus Doğrulaması Başlatılıyor...");

try {
  const testScript = path.resolve(process.cwd(), "tests/cad-v2/accuracy-performance-acceptance.test.ts");
  execSync(`npx tsx "${testScript}"`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("[CorpusValidator] Tüm korpus başarıyla doğrulandı (PASS).");
} catch (err: any) {
  console.error("[CorpusValidator] Korpus doğrulama hatası:", err.message);
  process.exit(1);
}
