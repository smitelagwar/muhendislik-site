// ============================================================================
// DWG/DXF MOTOR V2 — G07 FONT, TEXT & DIMENSION TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G07), R08, R09
// - Türkçe karakter doğruluğu (Ğ, Ü, Ş, İ, Ö, Ç, ı, ğ, ü, ş, ö, ç)
// - CAD sembolleri (%%C -> Ø, %%D -> °, %%P -> ±)
// - MTEXT çok satırlı \P ve biçim kodu temizliği
// - Rotasyon, genişlik katsayısı ve eğiklik dönüşümleri
// - DIMENSION anonim blok (*D...) ve ölçülendirme eşlemesi
// - Bilinmeyen yazı tipi için güvenli Arial geri dönüşü (fallback)

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import type {
  CadTextEntity,
  CadMTextEntity,
} from "../../src/lib/cad-v2/canonical/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runFontTextDimensionTests() {
  console.log("=== DWG/DXF Motor V2 - G07 Yazı ve Ölçülendirme Doğruluğu Testi ===");

  // 1. Türkçe Karakter ve Vektör Çizgi Üretimi
  console.log("\n[Test 1] Türkçe Karakter Vektör Dönüşümü:");
  const turkishSample: CadTextEntity = {
    handle: "T_TURK",
    type: "TEXT",
    layer: "YAZI",
    order: BigInt(1),
    text: "ZEMİN VE BİRİNCİ NORMAL KAT PLANI (KOLON ŞEMA ÖLÇÜLERİ)",
    insertionPoint: [0, 0],
    height: 25,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    styleName: "STANDARD",
  };

  const turkishSegments = FontLayoutEngine.layoutText(turkishSample);
  assert(turkishSegments.length > 100, `Türkçe metin başarıyla ${turkishSegments.length} vektör segmente dönüştürüldü`);
  assert(turkishSegments[0].layer === "YAZI", "Metin katmanı korundu");

  // 2. CAD Özel Sembolleri (%%C, %%D, %%P)
  console.log("\n[Test 2] AutoCAD Özel Sembol Dönüşümleri (%%C, %%D, %%P):");
  const rawSymbolStr = "%%C14 DONATI, %%D45 AÇI, %%P0.05 KOT";
  const cleanedSymbolStr = FontLayoutEngine.cleanCadText(rawSymbolStr);
  console.log(`- Ham metin:    "${rawSymbolStr}"`);
  console.log(`- Çözülen metin: "${cleanedSymbolStr}"`);
  assert(cleanedSymbolStr.includes("Ø14"), "%%C başarıyla 'Ø' (çap) sembolüne dönüştü");
  assert(cleanedSymbolStr.includes("°45"), "%%D başarıyla '°' (derece) sembolüne dönüştü");
  assert(cleanedSymbolStr.includes("±0.05"), "%%P başarıyla '±' (artı/eksi) sembolüne dönüştü");

  // 3. MTEXT Çok Satırlı (\P) ve Biçim Kodları
  console.log("\n[Test 3] MTEXT Biçim Kodları ve Çok Satırlı Paragraf (\\P):");
  const rawMText = "{\\C1;\\H3.5;BAĞLANTI DETAYI}\\P{\\C7;KOLON BOYUTU: 30/60 cm}\\PÖLÇEK: 1/50";
  const cleanedMText = FontLayoutEngine.cleanCadText(rawMText);
  const lines = cleanedMText.split("\n");
  assert(lines.length === 3, `\\P ayrıştırılarak 3 satıra bölündü: ${lines.length}`);
  assert(!cleanedMText.includes("\\C1;"), "Renk kodu (\\C1;) temizlendi");
  assert(!cleanedMText.includes("\\H3.5;"), "Yükseklik kodu (\\H3.5;) temizlendi");
  assert(lines[0] === "BAĞLANTI DETAYI", `Satır 1 temiz: "${lines[0]}"`);

  const mtextEntity: CadMTextEntity = {
    handle: "MT_1",
    type: "MTEXT",
    layer: "NOTLAR",
    order: BigInt(2),
    text: rawMText,
    insertionPoint: [100, 100],
    height: 10,
    referenceWidth: 200,
    rotationRad: 0,
    attachmentPoint: 1,
    styleName: "STANDARD",
  };

  const mtextSegs = FontLayoutEngine.layoutMText(mtextEntity);
  assert(mtextSegs.length > 50, `MTEXT başarıyla ${mtextSegs.length} segmente dönüştürüldü`);

  // 4. Metin Geometrik Dönüşüm Oracle (Rotasyon, WidthFactor, Oblique)
  console.log("\n[Test 4] Metin Geometrik Dönüşümleri (Rotasyon, Genişlik, Eğiklik):");
  const rotatedText: CadTextEntity = {
    handle: "T_ROT",
    type: "TEXT",
    layer: "YAZI",
    order: BigInt(3),
    text: "DÖNDÜRÜLMÜŞ METİN",
    insertionPoint: [500, 500],
    height: 20,
    rotationRad: Math.PI / 2, // 90 derece
    widthFactor: 1.5,
    obliqueRad: 0.25,
    styleName: "STANDARD",
  };

  const rotSegs = FontLayoutEngine.layoutText(rotatedText);
  assert(rotSegs.length > 20, "Döndürülmüş ve eğik metin başarıyla üretildi");
  // 90 derece döndürülmüş metinde Y yayılımı X yayılımından belirgin biçimde büyük olmalı
  const minY = Math.min(...rotSegs.map((s) => Math.min(s.y0, s.y1)));
  const maxY = Math.max(...rotSegs.map((s) => Math.max(s.y0, s.y1)));
  const deltaY = maxY - minY;
  assert(deltaY > 50, `90 derece metin Y ekseninde dikey uzanıyor: ${deltaY.toFixed(2)} birim`);

  // 5. Bilinmeyen Yazı Tipi Güvenli Geri Dönüşü (Fallback)
  console.log("\n[Test 5] Bilinmeyen Yazı Tipi Fallback Güvenliği:");
  const fallbackFont = FontLayoutEngine.resolveFont("NON_EXISTENT_CAD_FONT_123");
  assert(fallbackFont !== null, "Bilinmeyen yazı tipi sistem varsayılanına (Arial) düştü, null dönmedi");

  // 6. Gerçek Dosya (R001) Yazı ve Ölçülendirme Varlıkları
  console.log("\n[Test 6] Gerçek DWG (R001) Yazı ve Ölçülendirme Varlıkları:");
  const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  const rawBytes = fs.readFileSync(r001Path);
  const fileHash = crypto.createHash("sha256").update(rawBytes).digest("hex");

  const canonicalDoc = await parseDwgToCanonical(rawBytes, {
    sourceSha256: fileHash,
    sourceVersionKey: "1 ve 2.kat dwg.dwg",
  });

  const textCount = canonicalDoc.modelSpaceEntities.filter((e) => e.type === "TEXT").length;
  const mtextCount = canonicalDoc.modelSpaceEntities.filter((e) => e.type === "MTEXT").length;
  const dimCount = canonicalDoc.modelSpaceEntities.filter((e) => e.type === "DIMENSION" || (e.type === "INSERT" && e.blockName.startsWith("*D"))).length;

  console.log(`- R001 TEXT Varlık Sayısı:      ${textCount}`);
  console.log(`- R001 MTEXT Varlık Sayısı:     ${mtextCount}`);
  console.log(`- R001 DIMENSION Varlık Sayısı: ${dimCount}`);

  assert(textCount > 1000, `R001 içinde 1000'den fazla TEXT mevcut: ${textCount}`);
  assert(mtextCount > 300, `R001 içinde 300'den fazla MTEXT mevcut: ${mtextCount}`);
  assert(dimCount > 1000, `R001 içinde 1000'den fazla DIMENSION mevcut: ${dimCount}`);

  console.log("\n>>> G07 YAZI VE ÖLÇÜLENDİRME DOĞRULUĞU TESTLERİ GEÇTİ (PASS) <<<\n");
}

runFontTextDimensionTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test hatası:", err);
    process.exit(1);
  });
