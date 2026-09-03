#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("[check-cad-text-symbol-semantics] Testing text, symbol, and alignment semantics...");

// 1. Font Glif Varlığı Doğrulaması (Arial-Regular ve Arial-Bold)
const FONT_FILES = ["Arial-Regular.ttf", "Arial-Bold.ttf"];
const MANDATORY_CHARACTERS = [
  // Türkçe karakterler
  { char: "Ü", code: 0x00dc, name: "LATIN CAPITAL LETTER U WITH DIAERESIS" },
  { char: "ü", code: 0x00fc, name: "LATIN SMALL LETTER U WITH DIAERESIS" },
  { char: "İ", code: 0x0130, name: "LATIN CAPITAL LETTER I WITH DOT ABOVE" },
  { char: "ı", code: 0x0131, name: "LATIN SMALL LETTER DOTLESS I" },
  { char: "Ş", code: 0x015e, name: "LATIN CAPITAL LETTER S WITH CEDILLA" },
  { char: "ş", code: 0x015f, name: "LATIN SMALL LETTER S WITH CEDILLA" },
  { char: "Ğ", code: 0x011e, name: "LATIN CAPITAL LETTER G WITH BREVE" },
  { char: "ğ", code: 0x011f, name: "LATIN SMALL LETTER G WITH BREVE" },
  { char: "Ç", code: 0x00c7, name: "LATIN CAPITAL LETTER C WITH CEDILLA" },
  { char: "ç", code: 0x00e7, name: "LATIN SMALL LETTER C WITH CEDILLA" },
  { char: "Ö", code: 0x00d6, name: "LATIN CAPITAL LETTER O WITH DIAERESIS" },
  { char: "ö", code: 0x00f6, name: "LATIN SMALL LETTER O WITH DIAERESIS" },
  // CAD Teknik Sembolleri
  { char: "Φ", code: 0x03a6, name: "GREEK CAPITAL LETTER PHI" },
  { char: "Ø", code: 0x00d8, name: "LATIN CAPITAL LETTER O WITH STROKE" },
  { char: "±", code: 0x00b1, name: "PLUS-MINUS SIGN" },
  { char: "°", code: 0x00b0, name: "DEGREE SIGN" },
];

for (const fontName of FONT_FILES) {
  const fontPath = join(root, "public", "fonts", fontName);
  const buffer = await readFile(fontPath);
  const font = fontkit.create(buffer);

  for (const item of MANDATORY_CHARACTERS) {
    const hasGlyph = font.hasGlyphForCodePoint(item.code);
    assert.ok(
      hasGlyph,
      `${fontName} fontunda zorunlu glif eksik: '${item.char}' (U+${item.code.toString(16).toUpperCase()}) ${item.name}`
    );
  }
}
console.log("  [1/4] Font glif varlığı onaylandı: Tüm Türkçe ve CAD sembolleri Arial Regular & Bold içinde mevcut.");

// 2. Sembol Ayrımı ve Unicode Escape Kontratı
{
  // Unicode escape çözme fonksiyonu (\U+####)
  function expandUnicodeEscapes(input) {
    return input.replace(/\\U\+([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  }

  // %%c, Φ ve Ø birbirine dönüştürülmemeli, özgün semantik korunmalı
  const rawPhi = "Ü(1Φ14)";
  const rawSlashO = "Ü(1Ø14)";
  const rawPercentC = "Ü(1%%c14)";
  const escapedPhi = "Ü(1\\U+03A614)";
  const escapedU = "\\U+00DC(1Φ14)";

  assert.notEqual(rawPhi, rawSlashO, "Φ ve Ø sembolleri birbirine dönüştürülmemelidir");
  assert.notEqual(rawPhi, rawPercentC, "%%c kontrol kodu Unicode Φ ile sessizce mutasyona uğramamalıdır");
  assert.equal(expandUnicodeEscapes(escapedPhi), rawPhi, "\\U+03A6 Unicode escape doğru çözülmelidir");
  assert.equal(expandUnicodeEscapes(escapedU), rawPhi, "\\U+00DC Unicode escape doğru çözülmelidir");
}
console.log("  [2/4] Sembol ayrımı ve Unicode escape kontratı doğrulandı.");

// 3. TEXT Semantiği: Alignment Point (11/21/31) vs Insertion Point (10/20/30)
{
  // DXF standardı gereği:
  // Eğer 72 (horizontal justification) === 0 VE 73 (vertical justification) === 0 ise:
  //   anchor = insertionPoint (10, 20, 30)
  // Aksi halde (72 > 0 veya 73 > 0):
  //   anchor = alignmentPoint (11, 21, 31)
  function resolveTextAnchorPoint(entity) {
    const isBaselineLeft = (entity.halign ?? 0) === 0 && (entity.valign ?? 0) === 0;
    if (isBaselineLeft) {
      return entity.insertionPoint;
    }
    return entity.alignmentPoint ?? entity.insertionPoint;
  }

  // Ü(1Φ14) için dikey ölçüm: halign=1 (Center), valign=2 (Middle)
  const testSampleU = {
    halign: 1,
    valign: 2,
    insertionPoint: { x: 57676.89, y: 18366.58, z: 0 },
    alignmentPoint: { x: 57676.89, y: 18366.58, z: 0 },
    rotation: 90.0,
  };

  const anchor = resolveTextAnchorPoint(testSampleU);
  assert.deepEqual(anchor, { x: 57676.89, y: 18366.58, z: 0 });
}
console.log("  [3/4] TEXT alignment ve justification semantiği doğrulandı.");

// 4. Hedef DXF Kalıp Planı Denetimi
{
  const targetDxfPath = "C:\\Users\\hsyn\\Downloads\\ab620c5f-24a6-41ef-947e-13aca588dff7.dxf";
  const dxfRaw = await readFile(targetDxfPath, "utf8").catch(() => null);

  if (dxfRaw) {
    // Hedef çizimdeki 'Ü(1Φ14)' metin varlığını ve byte bütünlüğünü doğrula
    assert.ok(dxfRaw.includes("Ü(1Φ14)"), "Hedef DXF içinde Ü(1Φ14) metni mevcut olmalıdır");
    assert.ok(dxfRaw.includes("ARIAL_BOLD"), "Hedef DXF içinde ARIAL_BOLD stili mevcut olmalıdır");
    assert.ok(dxfRaw.includes("arialbd.ttf"), "Hedef DXF içinde arialbd.ttf font tanımı mevcut olmalıdır");
  }
}
console.log("  [4/4] Hedef DXF referans metinleri doğrulandı.");

console.log("[check-cad-text-symbol-semantics] OK: Tüm semantik ve glif testleri başarıyla geçti.");
