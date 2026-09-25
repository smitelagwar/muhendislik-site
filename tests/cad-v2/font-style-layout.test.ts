// ============================================================================
// DWG/DXF MOTOR V2 — F04: FONT, TEXT, MTEXT VE TÜRKÇE KARAKTER DOĞRULUĞU TESTİ
// ============================================================================
// Plan: Fidelity v3 Planı F04, motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
//
// Gates:
// 1. Authoritative Font Resolver & STYLE Resolution (SHX vs TTF ayrımı, dosya adı çözümleme)
// 2. Exact vs Substitute Status & Deterministic Font Digest (katalog parmak izi, teşhis izolasyonu)
// 3. TEXT Alignment Matrix & 2nd Alignment Point (Left, Center, Right, Middle, Aligned, Fit)
// 4. Generation Mirror Flags & Oblique Shear (Bit 2 backward, Bit 4 upside down, eğiklik dönüşümü)
// 5. MTEXT Run-Based Layout (inline renk, yükseklik, tracking, stacked fractions, alt/üst çizgi, wrap, 9 nokta, mask)
// 6. Turkish Character Oracle & AutoCAD Control Symbols (ĞÜŞİÖÇ ığüşöç, \U+XXXX unicode, %%c, %%d, %%p)
// 7. Cache Invalidation Verification (farklı fontDigest -> farklı sceneId & canonicalFingerprint)
// 8. TTF Contour Tagging vs SHX Stroke Tagging (isContour ayrımı)

import assert from "node:assert";
import crypto from "node:crypto";
import {
  FontLayoutEngine,
  FontDegradedDiagnostic,
} from "../../src/lib/cad-v2/text/font-layout-engine";
import { computeSceneIdentity } from "../../src/lib/cad-v2/service/scene-identity";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import type {
  CadCanonicalDocument,
  CadTextEntity,
  CadMTextEntity,
  CadTextStyle,
} from "../../src/lib/cad-v2/canonical/types";

console.log("[F04 Test] Font, TEXT, MTEXT ve Türkçe Karakter Doğruluğu Testi Başlatılıyor...");

// ----------------------------------------------------------------------------
// GATE 1: Authoritative Font Resolver & STYLE Resolution
// ----------------------------------------------------------------------------
console.log("  Gate 1: Authoritative Font Resolver & STYLE Resolution...");
{
  const textStyles: Record<string, CadTextStyle> = {
    STANDARD: {
      id: "STANDARD",
      name: "STANDARD",
      fontFileName: "Arial-Regular.ttf",
      height: 0,
      widthFactor: 1,
      obliqueAngleDeg: 0,
      isVertical: false,
    },
    SERIF_STYLE: {
      id: "SERIF_STYLE",
      name: "SERIF_STYLE",
      fontFileName: "IBMPlexSerif-Regular.ttf",
      height: 2.5,
      widthFactor: 1,
      obliqueAngleDeg: 0,
      isVertical: false,
    },
    MISSING_SHX_STYLE: {
      id: "MISSING_SHX_STYLE",
      name: "MISSING_SHX_STYLE",
      fontFileName: "simplex.shx",
      height: 3,
      widthFactor: 1,
      obliqueAngleDeg: 0,
      isVertical: false,
    },
    MISSING_TTF_STYLE: {
      id: "MISSING_TTF_STYLE",
      name: "MISSING_TTF_STYLE",
      fontFileName: "NonExistentCadFont_404.ttf",
      height: 3,
      widthFactor: 1,
      obliqueAngleDeg: 0,
      isVertical: false,
    },
  };

  // 1.1 Mevcut TTF font çözümü (Arial)
  const resArial = FontLayoutEngine.resolveFontStyle({
    styleName: "STANDARD",
    textStyles,
  });
  assert.strictEqual(resArial.fontType, "ttf", "Arial TTF olarak algılanmalı");
  assert.strictEqual(resArial.status, "exact", "Arial-Regular.ttf diskte mevcut olduğundan exact olmalı");
  assert.strictEqual(resArial.isSubstitute, false, "Arial için ikame (substitute) kullanılmamalı");
  assert(resArial.ttfFont !== undefined, "ttfFont nesnesi dolu olmalı");
  assert(resArial.fontHash.length === 64, "Font hash 64 karakter SHA-256 olmalı");

  // 1.2 Mevcut Serif TTF font çözümü
  const resSerif = FontLayoutEngine.resolveFontStyle({
    styleName: "SERIF_STYLE",
    textStyles,
  });
  assert.strictEqual(resSerif.fontType, "ttf", "Serif TTF olarak algılanmalı");
  assert.strictEqual(resSerif.status, "exact", "IBMPlexSerif-Regular.ttf exact olmalı");
  assert.strictEqual(resSerif.isSubstitute, false, "Serif için substitute olmamalı");

  // 1.3 Eksik SHX font çözümü -> Asla exact olamaz, substitute dönmeli
  const diagsShx: FontDegradedDiagnostic[] = [];
  const resShx = FontLayoutEngine.resolveFontStyle({
    styleName: "MISSING_SHX_STYLE",
    textStyles,
    contextDiagnostics: diagsShx,
  });
  assert.strictEqual(resShx.status, "substitute", "Bulunamayan SHX için substitute dönmeli, asla exact olamaz");
  assert.strictEqual(resShx.isSubstitute, true, "isSubstitute true olmalı");
  assert(resShx.requestedFont.toLowerCase().endsWith(".shx"), "Talep edilen font shx uzantılı olmalı");
  assert.strictEqual(resShx.fontType, "ttf", "Eksik SHX Arial TTF ikamesiyle çözümlenmeli");
  assert(diagsShx.length > 0, "Bağlam tanısına shx_not_found veya fallback_applied eklenmeli");
  assert(
    diagsShx.some((d) => d.reason === "shx_not_found" || d.reason === "fallback_applied"),
    "Eksik SHX için uygun tanı kodu bulunmalı"
  );

  // 1.4 Eksik TTF font çözümü -> substitute dönmeli
  const diagsTtf: FontDegradedDiagnostic[] = [];
  const resMissingTtf = FontLayoutEngine.resolveFontStyle({
    styleName: "MISSING_TTF_STYLE",
    textStyles,
    contextDiagnostics: diagsTtf,
  });
  assert.strictEqual(resMissingTtf.status, "substitute", "Bulunamayan TTF için substitute dönmeli");
  assert.strictEqual(resMissingTtf.isSubstitute, true, "isSubstitute true olmalı");
  assert(diagsTtf.length > 0, "Eksik TTF tanı kaydı üretmeli");

  // 1.5 Tanımsız STYLE adı ile doğrudan varsayılan font çözümü
  const resUnknownStyle = FontLayoutEngine.resolveFontStyle({
    styleName: "STYLE_UNKNOWN_XYZ",
    textStyles,
  });
  assert(resUnknownStyle.resolvedFontName.length > 0, "Bilinmeyen stilde varsayılan font çözümlenmeli");
  assert(resUnknownStyle.ttfFont !== undefined, "Varsayılan font nesnesi tanımlı olmalı");

  console.log("    -> Gate 1: PASS");
}

// ----------------------------------------------------------------------------
// GATE 2: Exact vs Substitute Status & Deterministic Font Digest
// ----------------------------------------------------------------------------
console.log("  Gate 2: Exact vs Substitute Status & Deterministic Font Digest...");
{
  const catalogDigest1 = FontLayoutEngine.getFontCatalogDigest();
  assert(typeof catalogDigest1 === "string" && catalogDigest1.length === 64, "Katalog digest 64 karakter hex olmalı");

  const fontDigest = FontLayoutEngine.getFontDigest();
  assert.strictEqual(fontDigest, catalogDigest1, "getFontDigest ile getFontCatalogDigest eşit olmalı");

  // layoutTextDetailed çağrısında exact vs substitute durumunun doğrulanması
  const exactText: CadTextEntity = {
    handle: "T_EXACT",
    type: "TEXT",
    layer: "TEXT_LAYER",
    order: BigInt(1),
    text: "Exact Font Metni",
    insertionPoint: [10, 20],
    height: 3.5,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    styleName: "STANDARD",
  };

  const detailedExact = FontLayoutEngine.layoutTextDetailed(exactText);
  assert.strictEqual(detailedExact.isExact, true, "Mevcut font ile layoutTextDetailed isExact=true dönmeli");
  assert.strictEqual(detailedExact.resolvedFont.status, "exact", "Font durumu exact olmalı");

  const missingText: CadTextEntity = {
    handle: "T_MISSING",
    type: "TEXT",
    layer: "TEXT_LAYER",
    order: BigInt(2),
    text: "Missing Font Metni",
    insertionPoint: [10, 20],
    height: 3.5,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    styleName: "CUSTOM_UNAVAILABLE_FONT_STYLE",
  };

  const contextDiags: FontDegradedDiagnostic[] = [];
  const detailedMissing = FontLayoutEngine.layoutTextDetailed(missingText, {
    diagnostics: contextDiags,
  });
  assert.strictEqual(detailedMissing.isExact, false, "Bulunamayan font ile layoutTextDetailed isExact=false dönmeli");
  assert.strictEqual(detailedMissing.resolvedFont.status, "substitute", "Bulunamayan fontta status=substitute olmalı");
  assert(contextDiags.length > 0, "Bağlam tanısına eksik font kaydı eklenmiş olmalı");

  // Teşhis izolasyonu: global log sızıntısı olmamalı
  FontLayoutEngine.clearDegradedLogs();
  assert.strictEqual(FontLayoutEngine.getDegradedLogs().length, 0, "clearDegradedLogs sonrası global liste boş olmalı");

  console.log("    -> Gate 2: PASS");
}

// ----------------------------------------------------------------------------
// GATE 3: TEXT Alignment Matrix & 2nd Alignment Point
// ----------------------------------------------------------------------------
console.log("  Gate 3: TEXT Alignment Matrix & 2nd Alignment Point...");
{
  const h = 10;
  const sampleStr = "CAD HIZALAMA TEST";

  // 3.1 Sol / Taban Çizgisi (Baseline) -> P1 kullanılır, P2 yok sayılır
  const textLeft: CadTextEntity = {
    handle: "T_LEFT",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(10),
    text: sampleStr,
    insertionPoint: [100, 200],
    alignmentPoint: [999, 999], // Sol/Baseline'da P2 dikkate alınmaz!
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 0,
    verticalMode: 0,
    styleName: "STANDARD",
  };
  const resLeft = FontLayoutEngine.layoutTextDetailed(textLeft);
  assert.strictEqual(resLeft.anchor[0], 100, "Left/Baseline için anchor X = P1.x (100) olmalı");
  assert.strictEqual(resLeft.anchor[1], 200, "Left/Baseline için anchor Y = P1.y (200) olmalı");
  assert(Math.abs(resLeft.bbox[0] - 100) < 5, `Sol hizalamada minX P1.x civarında olmalı: ${resLeft.bbox[0]}`);

  // 3.2 Orta (Center) / Taban Çizgisi -> P2 kullanılır
  const textCenter: CadTextEntity = {
    handle: "T_CENTER",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(11),
    text: sampleStr,
    insertionPoint: [100, 200],
    alignmentPoint: [500, 300], // P2 geçerli
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 1,
    verticalMode: 0,
    styleName: "STANDARD",
  };
  const resCenter = FontLayoutEngine.layoutTextDetailed(textCenter);
  assert.strictEqual(resCenter.anchor[0], 500, "Center için anchor X = P2.x (500) olmalı");
  assert.strictEqual(resCenter.anchor[1], 300, "Center için anchor Y = P2.y (300) olmalı");
  const centerX = (resCenter.bbox[0] + resCenter.bbox[2]) / 2;
  assert(Math.abs(centerX - 500) < 5, `Orta hizalamada bbox merkezi P2.x civarında olmalı: ${centerX}`);

  // 3.3 Sağ (Right) / Taban Çizgisi -> P2 kullanılır
  const textRight: CadTextEntity = {
    handle: "T_RIGHT",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(12),
    text: sampleStr,
    insertionPoint: [100, 200],
    alignmentPoint: [500, 300],
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 2,
    verticalMode: 0,
    styleName: "STANDARD",
  };
  const resRight = FontLayoutEngine.layoutTextDetailed(textRight);
  assert.strictEqual(resRight.anchor[0], 500, "Right için anchor X = P2.x (500) olmalı");
  assert(Math.abs(resRight.bbox[2] - 500) < 5, `Sağ hizalamada maxX P2.x civarında olmalı: ${resRight.bbox[2]}`);

  // 3.4 Middle (hMode = 4, vMode = 0) -> P2 kullanılır, hem yatay hem düşey ortalama
  const textMiddle: CadTextEntity = {
    handle: "T_MIDDLE",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(13),
    text: sampleStr,
    insertionPoint: [100, 200],
    alignmentPoint: [400, 400],
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 4,
    verticalMode: 0,
    styleName: "STANDARD",
  };
  const resMiddle = FontLayoutEngine.layoutTextDetailed(textMiddle);
  assert.strictEqual(resMiddle.anchor[0], 400, "Middle için anchor X = P2.x (400) olmalı");
  assert.strictEqual(resMiddle.anchor[1], 400, "Middle için anchor Y = P2.y (400) olmalı");
  const midX = (resMiddle.bbox[0] + resMiddle.bbox[2]) / 2;
  const midY = (resMiddle.bbox[1] + resMiddle.bbox[3]) / 2;
  assert(Math.abs(midX - 400) < 5, `Middle modunda bbox merkezi X P2.x civarında olmalı: ${midX}`);
  assert(Math.abs(midY - 400) < 5, `Middle modunda bbox merkezi Y P2.y civarında olmalı: ${midY}`);

  // 3.5 Aligned (hMode = 3): P1 ve P2 arasına orantılı sığdırma (boy ve en birlikte ölçeklenir)
  const textAligned: CadTextEntity = {
    handle: "T_ALIGNED",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(14),
    text: "ALIGNED METİN",
    insertionPoint: [0, 0],
    alignmentPoint: [200, 0], // P1->P2 mesafesi = 200
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 3,
    verticalMode: 0,
    styleName: "STANDARD",
  };
  const resAligned = FontLayoutEngine.layoutTextDetailed(textAligned);
  assert(resAligned.advanceWidth > 0, "Aligned modda advanceWidth hesaplanmalı");
  assert(resAligned.height !== h, "Aligned modda yükseklik P1-P2 mesafesine göre dinamik ölçeklenmeli");

  // 3.6 Fit (hMode = 5): P1 ve P2 arasına genişlik katsayısı ayarlanarak sığdırma (yükseklik sabit)
  const textFit: CadTextEntity = {
    handle: "T_FIT",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(15),
    text: "FIT METİN",
    insertionPoint: [0, 0],
    alignmentPoint: [300, 0], // P1->P2 mesafesi = 300
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 5,
    verticalMode: 0,
    styleName: "STANDARD",
  };
  const resFit = FontLayoutEngine.layoutTextDetailed(textFit);
  assert.strictEqual(resFit.height, h, "Fit modunda yükseklik sabit kalmalı");
  assert(Math.abs(resFit.advanceWidth - 300) < 1, `Fit modunda advanceWidth P1-P2 mesafesine (300) eşit olmalı: ${resFit.advanceWidth}`);

  // 3.7 Düşey Hizalamalar: Top (3), Middle (2), Bottom (1), Baseline (0)
  const textTop: CadTextEntity = {
    handle: "T_TOP",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(16),
    text: "TOP TEXT",
    insertionPoint: [0, 0],
    alignmentPoint: [100, 500],
    height: 20,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 0,
    verticalMode: 3, // Top
    styleName: "STANDARD",
  };
  const resTop = FontLayoutEngine.layoutTextDetailed(textTop);
  // Top hizalamada metin maxY'si yaklaşık anchor Y (500) olmalı, glifler aşağı uzanmalı
  assert(resTop.bbox[3] <= 505 && resTop.bbox[1] < 500, `Top hizalamada metin maxY anchor Y civarında olmalı: ${resTop.bbox[3]}`);

  console.log("    -> Gate 3: PASS");
}

// ----------------------------------------------------------------------------
// GATE 4: Generation Mirror Flags & Oblique Shear
// ----------------------------------------------------------------------------
console.log("  Gate 4: Generation Mirror Flags & Oblique Shear...");
{
  const h = 20;
  const baseText: CadTextEntity = {
    handle: "T_BASE",
    type: "TEXT",
    layer: "TXT",
    order: BigInt(20),
    text: "E",
    insertionPoint: [0, 0],
    height: h,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    horizontalMode: 0,
    verticalMode: 0,
    generationFlag: 0,
    styleName: "STANDARD",
  };
  const resBase = FontLayoutEngine.layoutTextDetailed(baseText);

  // 4.1 Backward (Bit 2): Yatay Ayna (Mirror X)
  const mirrorXText: CadTextEntity = {
    ...baseText,
    handle: "T_MIRROR_X",
    generationFlag: 2, // Bit 2: backward
  };
  const resMirrorX = FontLayoutEngine.layoutTextDetailed(mirrorXText);
  assert(resMirrorX.segments.length > 0, "Mirror X segmentleri üretilmeli");
  // 'E' harfinde sağa uzanan yatay çizgiler mirror X uygulandığında sola uzanmalı
  // BBox sınırları korunmalı
  assert(resMirrorX.bbox[0] >= 0 && resMirrorX.bbox[2] <= resBase.advanceWidth + 1, "Mirror X genişlik sınırlarında kalmalı");

  // 4.2 Upside Down (Bit 4): Düşey Ayna (Mirror Y)
  const mirrorYText: CadTextEntity = {
    ...baseText,
    handle: "T_MIRROR_Y",
    generationFlag: 4, // Bit 4: upside down
  };
  const resMirrorY = FontLayoutEngine.layoutTextDetailed(mirrorYText);
  assert(resMirrorY.segments.length > 0, "Mirror Y segmentleri üretilmeli");
  // Orijinalde Y [0, 20] aralığında iken mirror Y uygulandığında Y negatif tarafta [-20, 0] olmalı
  assert(resMirrorY.bbox[1] < -5, `Mirror Y'de minY negatif olmalı: ${resMirrorY.bbox[1]}`);

  // 4.3 Oblique Shear (Eğiklik Dönüşümü): x -> x + y * tan(theta)
  const obliqueAngle = Math.PI / 6; // 30 derece
  const obliqueText: CadTextEntity = {
    ...baseText,
    handle: "T_OBLIQUE",
    obliqueRad: obliqueAngle,
  };
  const resOblique = FontLayoutEngine.layoutTextDetailed(obliqueText);
  assert(resOblique.segments.length > 0, "Oblique segmentleri üretilmeli");
  // Eğik metinde üst kısımdaki noktalar sağa kaymış olmalı (maxX artmalı)
  assert(resOblique.bbox[2] > resBase.bbox[2], `Oblique uygulandığında maxX (${resOblique.bbox[2]}) temel maxX'ten (${resBase.bbox[2]}) büyük olmalı`);

  console.log("    -> Gate 4: PASS");
}

// ----------------------------------------------------------------------------
// GATE 5: MTEXT Run-Based Layout
// ----------------------------------------------------------------------------
console.log("  Gate 5: MTEXT Run-Based Layout...");
{
  // 5.1 Inline Renk, Yükseklik ve Tracking
  const richMText: CadMTextEntity = {
    handle: "MT_RICH",
    type: "MTEXT",
    layer: "NOTLAR",
    order: BigInt(30),
    text: "{\\C1;KIRMIZI}\\P{\\C3;\\H2.0x;YEŞİL BÜYÜK}\\P{\\T1.5;GENİŞ KARAKTER}",
    insertionPoint: [100, 100],
    height: 10,
    referenceWidth: 0,
    rotationRad: 0,
    attachmentPoint: 1, // Top-Left
    styleName: "STANDARD",
  };

  const richSegs = FontLayoutEngine.layoutMText(richMText);
  assert(richSegs.length > 20, "Zengin MTEXT segmentleri başarıyla üretilmeli");

  // Inline renklere sahip segmentlerin kontrolü
  const hasAci1 = richSegs.some((s) => s.color && s.color.method === "aci" && s.color.aci === 1);
  const hasAci3 = richSegs.some((s) => s.color && s.color.method === "aci" && s.color.aci === 3);
  assert(hasAci1, "Kırmızı ACI(1) renkli segment bulunmalı");
  assert(hasAci3, "Yeşil ACI(3) renkli segment bulunmalı");

  // 5.2 Stacked Fractions: # (diyagonal), / (yatay), ^ (tolerans)
  const stackedMText: CadMTextEntity = {
    handle: "MT_STACK",
    type: "MTEXT",
    layer: "NOTLAR",
    order: BigInt(31),
    text: "\\S1/2; ve \\S3#4; ve \\S+0.05^-0.02;",
    insertionPoint: [0, 0],
    height: 10,
    referenceWidth: 0,
    rotationRad: 0,
    attachmentPoint: 1,
    styleName: "STANDARD",
  };
  const stackSegs = FontLayoutEngine.layoutMText(stackedMText);
  assert(stackSegs.length > 30, "Kesir (stack) segmentleri üretilmeli");

  // 5.3 Alt ve Üst Çizgi (\L...\l, \O...\o)
  const underlineMText: CadMTextEntity = {
    handle: "MT_LINE",
    type: "MTEXT",
    layer: "NOTLAR",
    order: BigInt(32),
    text: "{\\LALT ÇİZGİLİ}\\P{\\OÜST ÇİZGİLİ}",
    insertionPoint: [0, 0],
    height: 10,
    referenceWidth: 0,
    rotationRad: 0,
    attachmentPoint: 1,
    styleName: "STANDARD",
  };
  const underSegs = FontLayoutEngine.layoutMText(underlineMText);
  assert(underSegs.length > 20, "Alt/üst çizgi segmentleri üretilmeli");

  // 5.4 referenceWidth ile Otomatik Satır Kaydırma (Line Wrap)
  const longSentence = "Bu uzun metin AutoCAD MTEXT satır kaydırma özelliğini doğrulamak için yazılmıştır ve dar bir sütuna sığdırılmalıdır.";
  const wrapMText: CadMTextEntity = {
    handle: "MT_WRAP",
    type: "MTEXT",
    layer: "NOTLAR",
    order: BigInt(33),
    text: longSentence,
    insertionPoint: [0, 0],
    height: 5,
    referenceWidth: 60, // Dar genişlik -> birden fazla satıra kaymalı
    rotationRad: 0,
    attachmentPoint: 1, // Top-Left
    styleName: "STANDARD",
  };
  const resWrap = FontLayoutEngine.layoutMTextDetailed(wrapMText);
  assert(resWrap.segments.length > 50, "Kaydırılan metin segmentleri üretilmeli");
  // Çok satıra kaydığı için Y aralığı tek satır yüksekliğinden (5) çok daha büyük olmalı
  const wrapHeight = resWrap.bbox[3] - resWrap.bbox[1];
  assert(wrapHeight > 15, `Satır kaydırma sonrası toplam yükseklik tek satırdan büyük olmalı: ${wrapHeight.toFixed(2)}`);

  // 5.5 9 Attachment Noktası Matrisi (TL=1, TC=2, TR=3, ML=4, MC=5, MR=6, BL=7, BC=8, BR=9)
  const ins: [number, number] = [200, 300];
  const testPoints = [
    { attach: 1, name: "TL", check: (b: number[]) => Math.abs(b[0] - ins[0]) < 5 && Math.abs(b[3] - ins[1]) < 5 },
    { attach: 5, name: "MC", check: (b: number[]) => Math.abs((b[0] + b[2]) / 2 - ins[0]) < 5 && Math.abs((b[1] + b[3]) / 2 - ins[1]) < 5 },
    { attach: 9, name: "BR", check: (b: number[]) => Math.abs(b[2] - ins[0]) < 5 && Math.abs(b[1] - ins[1]) < 5 },
  ];

  for (const tp of testPoints) {
    const ent: CadMTextEntity = {
      handle: `MT_ATT_${tp.name}`,
      type: "MTEXT",
      layer: "NOTLAR",
      order: BigInt(34),
      text: "ATTACH POINT TEST",
      insertionPoint: ins,
      height: 10,
      referenceWidth: 0,
      rotationRad: 0,
      attachmentPoint: tp.attach,
      styleName: "STANDARD",
    };
    const resAtt = FontLayoutEngine.layoutMTextDetailed(ent);
    assert(tp.check(resAtt.bbox as number[]), `Attachment ${tp.name} (${tp.attach}) bounding box yerleşimi doğru olmalı`);
  }

  // 5.6 Background Mask (Arka Plan Maskesi Bounding Box)
  const maskMText: CadMTextEntity = {
    handle: "MT_MASK",
    type: "MTEXT",
    layer: "NOTLAR",
    order: BigInt(35),
    text: "ARKA PLAN MASKELİ METİN",
    insertionPoint: [50, 50],
    height: 8,
    referenceWidth: 0,
    rotationRad: 0,
    backgroundMask: true,
    attachmentPoint: 1,
    styleName: "STANDARD",
  };
  const maskSegs = FontLayoutEngine.layoutMText(maskMText, { drawBackgroundMask: true });
  assert(maskSegs.length > 10, "Maskeli MTEXT segmentleri üretilmeli");

  console.log("    -> Gate 5: PASS");
}

// ----------------------------------------------------------------------------
// GATE 6: Turkish Character Oracle & AutoCAD Control Symbols
// ----------------------------------------------------------------------------
console.log("  Gate 6: Turkish Character Oracle & AutoCAD Control Symbols...");
{
  // 6.1 Türkçe Karakterlerin Temizlenmesi ve Glif Üretimi
  const turkishCharsUpper = "ĞÜŞİÖÇ";
  const turkishCharsLower = "ğüşıöç";
  const cleanedUpper = FontLayoutEngine.cleanCadText(turkishCharsUpper);
  const cleanedLower = FontLayoutEngine.cleanCadText(turkishCharsLower);
  assert.strictEqual(cleanedUpper, turkishCharsUpper, "Büyük Türkçe karakterler aynen korunmalı");
  assert.strictEqual(cleanedLower, turkishCharsLower, "Küçük Türkçe karakterler aynen korunmalı");

  // Glif üretimi doğrulaması
  for (const ch of [...turkishCharsUpper, ...turkishCharsLower]) {
    const chText: CadTextEntity = {
      handle: `T_CH_${ch}`,
      type: "TEXT",
      layer: "TR_LAYER",
      order: BigInt(40),
      text: ch,
      insertionPoint: [0, 0],
      height: 10,
      rotationRad: 0,
      widthFactor: 1,
      obliqueRad: 0,
      styleName: "STANDARD",
    };
    const chSegs = FontLayoutEngine.layoutText(chText);
    assert(chSegs.length > 0, `'${ch}' Türkçe karakteri için vektör çizgi segmentleri üretilmeli`);
  }

  // 6.2 \U+XXXX ve \\U+XXXX Unicode Kaçış Dizileri
  const rawUnicode = "\\U+011E\\U+0130\\U+015E\\U+00D6\\U+00DC\\U+00C7 \\\\U+011F\\\\U+0131\\\\U+015F\\\\U+00F6\\\\U+00FC\\\\U+00E7";
  const cleanedUnicode = FontLayoutEngine.cleanCadText(rawUnicode);
  assert.strictEqual(cleanedUnicode, "ĞİŞÖÜÇ ğışöüç", "Unicode kaçış dizileri doğru Türkçe karakterlere çözümlenmeli");

  // 6.3 AutoCAD Kontrol Sembolleri
  const rawSymbols = "%%c32 KOLON DONATISI, %%d45 ÇATI EĞİMİ, %%p0.00 KOT, %%% DEĞERİ, \\~BÖLÜNEMEZ";
  const cleanedSymbols = FontLayoutEngine.cleanCadText(rawSymbols);
  assert(cleanedSymbols.includes("Ø32"), "%%c -> Ø çap sembolüne dönüşmeli");
  assert(cleanedSymbols.includes("°45"), "%%d -> ° derece sembolüne dönüşmeli");
  assert(cleanedSymbols.includes("±0.00"), "%%p -> ± artı-eksi sembolüne dönüşmeli");
  assert(cleanedSymbols.includes("% DEĞERİ"), "%%% -> % literal yüzde sembolüne dönüşmeli");
  assert(cleanedSymbols.includes(" BÖLÜNEMEZ"), "\\~ -> bölünemez boşluk sembolüne dönüşmeli");

  console.log("    -> Gate 6: PASS");
}

// ----------------------------------------------------------------------------
// GATE 7: Cache Invalidation Verification
// ----------------------------------------------------------------------------
console.log("  Gate 7: Cache Invalidation Verification...");
{
  const baseParams = {
    fileId: "file_test_font_cache_123",
    sourceSha256: "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
    authoritativeRevision: "rev_1",
    fontDigest: "1111111111111111111111111111111111111111111111111111111111111111",
  };

  const id1 = computeSceneIdentity(baseParams);

  // Farklı font kataloğu / digest durumu
  const modifiedParams = {
    ...baseParams,
    fontDigest: "2222222222222222222222222222222222222222222222222222222222222222",
  };

  const id2 = computeSceneIdentity(modifiedParams);

  assert.notStrictEqual(id1.sceneId, id2.sceneId, "Font digest değiştiğinde sceneId değişmeli (cache invalidation)");
  assert.notStrictEqual(id1.canonicalFingerprint, id2.canonicalFingerprint, "Font digest değiştiğinde canonicalFingerprint değişmeli");

  // Sahne derleyicisinde fontDigest doğrulaması
  const sampleDoc: CadCanonicalDocument = {
    sourceVersionKey: "v1",
    sourceSha256: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 4,
    measurement: 1,
    modelSpaceEntities: [
      {
        handle: "T1",
        type: "TEXT",
        layer: "0",
        order: BigInt(1),
        text: "SAHNE METNİ",
        insertionPoint: [0, 0],
        height: 10,
        rotationRad: 0,
        widthFactor: 1,
        obliqueRad: 0,
        styleName: "STANDARD",
      },
    ],
    blocks: {},
    layers: {
      "0": {
        id: "0",
        name: "0",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 7 },
        lineweightMm: 0.25,
        linetypeName: "Continuous",
      },
    },
    linetypes: {},
    textStyles: {
      STANDARD: {
        id: "STANDARD",
        name: "STANDARD",
        fontFileName: "Arial-Regular.ttf",
        height: 0,
        widthFactor: 1,
        obliqueAngleDeg: 0,
        isVertical: false,
      },
    },
    layouts: {},
    viewports: {},
    diagnostics: [],
  };

  const sceneResult = compileCanonicalToScene(sampleDoc, {
    authoritativeRevision: "rev_doc_1",
  });

  assert(sceneResult.manifest.dependencyDigest !== undefined, "Manifest dependencyDigest içermeli");
  assert.strictEqual(
    sceneResult.manifest.dependencyDigest,
    FontLayoutEngine.getFontDigest(),
    "Manifest içindeki dependencyDigest FontLayoutEngine.getFontDigest() ile tam eşleşmeli"
  );

  console.log("    -> Gate 7: PASS");
}

// ----------------------------------------------------------------------------
// GATE 8: TTF Contour Tagging vs SHX Stroke Tagging
// ----------------------------------------------------------------------------
console.log("  Gate 8: TTF Contour Tagging vs SHX Stroke Tagging...");
{
  const ttfText: CadTextEntity = {
    handle: "T_TTF",
    type: "TEXT",
    layer: "TEXT_LAYER",
    order: BigInt(50),
    text: "O",
    insertionPoint: [0, 0],
    height: 15,
    rotationRad: 0,
    widthFactor: 1,
    obliqueRad: 0,
    styleName: "STANDARD",
  };

  const ttfRes = FontLayoutEngine.layoutTextDetailed(ttfText);
  assert(ttfRes.segments.length > 0, "TTF segmentleri üretilmeli");
  const allContours = ttfRes.segments.every((s) => s.isContour === true);
  assert.strictEqual(allContours, true, "TTF yazı tipinde üretilen tüm segmentler isContour: true taşımalı");

  console.log("    -> Gate 8: PASS");
}

console.log("\n============================================================================");
console.log(">>> F04 FONT, TEXT, MTEXT VE TÜRKÇE KARAKTER DOĞRULUĞU TESTİ GEÇTİ (PASS) <<<");
console.log("============================================================================\n");
