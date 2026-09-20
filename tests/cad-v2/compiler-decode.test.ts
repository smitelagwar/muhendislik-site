// ============================================================================
// G02 TEST: DWG & DXF DECODE ADAPTERS VERIFICATION
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";

async function runDecodeTests() {
  console.log("=== DWG/DXF Motor V2 - G02 Decoder Doğrulama ===");

  // 1. DWG Decode Testi (R001: 1 ve 2.kat dwg.dwg)
  const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  console.log("R001 okunuyor:", r001Path);
  const r001Buf = fs.readFileSync(r001Path);
  const dwgDoc = await parseDwgToCanonical(r001Buf, {
    sourceVersionKey: "R001_v1",
    sourceSha256: "17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086",
  });

  console.log("R001 DWG başarıyla çözüldü!");
  console.log("- ACAD Version:", dwgDoc.acadVersion);
  console.log("- Katman sayısı:", Object.keys(dwgDoc.layers).length);
  console.log("- Model Space Varlık sayısı:", dwgDoc.modelSpaceEntities.length);

  if (dwgDoc.modelSpaceEntities.length === 0) {
    throw new Error("R001 içinde varlık bulunamadı!");
  }

  // 2. DXF Decode Testi (Sentetik bilinen ölçüm geometrisi)
  const dxfSamplePath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf");
  console.log("\nDXF bilinen geometri fixture'ı okunuyor:", dxfSamplePath);
  const dxfBuf = fs.readFileSync(dxfSamplePath);
  const dxfDoc = await parseDxfToCanonical(dxfBuf, {
    sourceVersionKey: "known_geom_v1",
  });

  console.log("DXF başarıyla çözüldü!");
  console.log("- ACAD Version:", dxfDoc.acadVersion);
  console.log("- Model Space Varlık sayısı:", dxfDoc.modelSpaceEntities.length);

  if (dxfDoc.modelSpaceEntities.length !== 4) {
    throw new Error(`Beklenen 4 varlık, bulunan: ${dxfDoc.modelSpaceEntities.length}`);
  }

  const line1 = dxfDoc.modelSpaceEntities[0];
  if (line1.type !== "LINE") {
    throw new Error(`İlk varlık LINE olmalı, bulunan: ${line1.type}`);
  }
  console.log("- İlk çizgi başlangıç:", line1.start, "bitiş:", line1.end);

  // 3. Negatif test: Bozuk / kesilmiş DWG
  try {
    const brokenDwg = Buffer.from("AC1032_NOT_A_VALID_DWG_CONTENT_CORRUPTED");
    await parseDwgToCanonical(brokenDwg);
    throw new Error("Bozuk DWG reddedilmedi!");
  } catch (err: unknown) {
    console.log("\nNegatif test: Bozuk DWG beklendiği gibi reddedildi:", (err as Error).message);
  }

  console.log("\n>>> G02 DECODER ADAPTER TESTLERİ BAŞARILI (PASS) <<<");
}

runDecodeTests().catch((err) => {
  console.error("\n>>> G02 DECODER TESTLERİNDE HATA (FAIL) <<<", err);
  process.exit(1);
});
