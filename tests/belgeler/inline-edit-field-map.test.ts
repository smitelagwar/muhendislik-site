import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  DOCUMENT_EDITABLE_FIELDS,
  DOCUMENT_PDF_ONLY_FIELDS,
} from "../../src/lib/document-field-contracts";
import {
  convertPdfRectToViewportRect,
  mapPdfAnnotationsToInlineFields,
  type BelgeDocumentId,
  type RawPdfAnnotation,
  type ViewportLike,
} from "../../src/lib/belge-studio-inline-field-map";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

// =========================================================================
// 1. SAF BİRİM TESTLERİ (MOCKED / SYNTHETIC DATA)
// =========================================================================

function createMockViewport(options: {
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
} = {}): ViewportLike {
  const width = options.width ?? 595.28;
  const height = options.height ?? 841.89;
  const scale = options.scale ?? 1;
  const rotation = options.rotation ?? 0;

  return {
    width: width * scale,
    height: height * scale,
    scale,
    rotation,
    convertToViewportPoint(x: number, y: number): [number, number] {
      // PDF coordinate system: origin at bottom-left, y goes up.
      // Standard 0 deg viewport: origin at top-left, y goes down.
      if (rotation === 0) {
        return [x * scale, (height - y) * scale];
      }
      if (rotation === 90) {
        return [y * scale, x * scale];
      }
      if (rotation === 180) {
        return [(width - x) * scale, y * scale];
      }
      if (rotation === 270) {
        return [(height - y) * scale, (width - x) * scale];
      }
      return [x * scale, (height - y) * scale];
    },
  };
}

console.log("--- 1. Saf Birim Testleri Çalıştırılıyor ---");

// Test: convertPdfRectToViewportRect temel koordinat hesabı
{
  const vp = createMockViewport({ width: 600, height: 800, scale: 1 });
  // PDF rect: [x1=100, y1=200, x2=300, y2=250] (y1 < y2)
  // Viewport: p1(100, 200) -> [100, 800-200=600], p2(300, 250) -> [300, 800-250=550]
  // Beklenen: left=100, top=550, right=300, bottom=600, width=200, height=50
  const vr = convertPdfRectToViewportRect(vp, [100, 200, 300, 250]);
  assert.ok(vr, "Viewport rect hesaplanmalı");
  assert.equal(vr.left, 100);
  assert.equal(vr.top, 550);
  assert.equal(vr.right, 300);
  assert.equal(vr.bottom, 600);
  assert.equal(vr.width, 200);
  assert.equal(vr.height, 50);
}

// Test: Scale ve DPR dönüşümü (scale = 1.5)
{
  const vp = createMockViewport({ width: 600, height: 800, scale: 1.5 });
  const vr = convertPdfRectToViewportRect(vp, [100, 200, 300, 250]);
  assert.ok(vr, "Scaled viewport rect hesaplanmalı");
  assert.equal(vr.left, 150);
  assert.equal(vr.top, 825); // (800 - 250) * 1.5 = 550 * 1.5 = 825
  assert.equal(vr.width, 300); // 200 * 1.5 = 300
  assert.equal(vr.height, 75); // 50 * 1.5 = 75
}

// Test: convertToViewportRectangle alternatifi desteği
{
  const altVp: ViewportLike = {
    width: 600,
    height: 800,
    convertToViewportRectangle(rect: number[]): [number, number, number, number] {
      return [rect[0], 800 - rect[3], rect[2], 800 - rect[1]];
    },
  };
  const vr = convertPdfRectToViewportRect(altVp, [100, 200, 300, 250]);
  assert.ok(vr, "convertToViewportRectangle ile hesaplanmalı");
  assert.equal(vr.left, 100);
  assert.equal(vr.top, 550);
  assert.equal(vr.width, 200);
  assert.equal(vr.height, 50);
}

// Test: Geçersiz rect girişleri
{
  const vp = createMockViewport();
  assert.equal(convertPdfRectToViewportRect(vp, []), null);
  assert.equal(convertPdfRectToViewportRect(vp, [10, 20] as any), null);
  assert.equal(convertPdfRectToViewportRect(vp, [NaN, 10, 20, 30]), null);
  assert.equal(convertPdfRectToViewportRect(vp, [10, Infinity, 20, 30]), null);
  assert.equal(convertPdfRectToViewportRect(vp, [100, 200, 100, 250]), null); // width 0
  assert.equal(convertPdfRectToViewportRect(vp, [100, 200, 300, 200]), null); // height 0
}

// Test: mapPdfAnnotationsToInlineFields Allowlist ve Filtre Kuralları
{
  const vp = createMockViewport();
  const mockAnnotations: RawPdfAnnotation[] = [
    // 1. Geçerli editable alan
    {
      id: "a1",
      fieldName: "tutanak_alt_baslik",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [72, 700, 523, 720],
      readOnly: false,
    },
    // 2. İsimsiz annotasyon -> MISSING_FIELD_NAME
    {
      id: "a2",
      subtype: "Widget",
      rect: [100, 100, 200, 200],
    },
    // 3. Widget olmayan annotasyon (FreeText) -> NON_WIDGET_SUBTYPE
    {
      id: "a3",
      fieldName: "not_kutusu",
      subtype: "FreeText",
      rect: [100, 100, 200, 200],
    },
    // 4. Allowlist dışı alan -> NOT_IN_ALLOWLIST
    {
      id: "a4",
      fieldName: "bilinmeyen_alan",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [100, 100, 200, 200],
    },
    // 5. PDF-Only etiket alanı -> PDF_ONLY_LABEL (istifa şablonu için test edilecek)
  ];

  const result = mapPdfAnnotationsToInlineFields({
    documentId: "beton-dokum-tutanagi",
    pageNumber: 1,
    annotations: mockAnnotations,
    viewport: vp,
  });

  assert.equal(result.fields.length, 1, "Yalnızca 1 geçerli alan dönmeli");
  assert.equal(result.fields[0].fieldKey, "tutanak_alt_baslik");
  assert.equal(result.fields[0].label, "Tutanak Alt Başlığı");

  const diagCodes = result.diagnostics.map((d) => d.code);
  assert.ok(diagCodes.includes("MISSING_FIELD_NAME"));
  assert.ok(diagCodes.includes("NON_WIDGET_SUBTYPE"));
  assert.ok(diagCodes.includes("NOT_IN_ALLOWLIST"));
}

// Test: PDF_ONLY_LABEL reddi (İstifa şablonu)
{
  const vp = createMockViewport();
  const mockAnnotations: RawPdfAnnotation[] = [
    {
      id: "e1",
      fieldName: "adres_etiket",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [68, 347, 143, 365],
    },
    {
      id: "e2",
      fieldName: "adres_deger",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [143, 347, 335, 365],
    },
  ];

  const result = mapPdfAnnotationsToInlineFields({
    documentId: "santiye-sefi-istifa-dilekcesi",
    pageNumber: 1,
    annotations: mockAnnotations,
    viewport: vp,
  });

  assert.equal(result.fields.length, 1, "Sadece adres_deger dönmeli");
  assert.equal(result.fields[0].fieldKey, "adres_deger");
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].code, "PDF_ONLY_LABEL");
}

// Test: Aynı sayfada DUPLICATE_FIELD kontrolü
{
  const vp = createMockViewport();
  const mockAnnotations: RawPdfAnnotation[] = [
    {
      id: "d1",
      fieldName: "tarih",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [420, 675, 523, 695],
    },
    {
      id: "d2",
      fieldName: "tarih",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [420, 675, 523, 695],
    },
  ];

  const result = mapPdfAnnotationsToInlineFields({
    documentId: "beton-dokum-tutanagi",
    pageNumber: 1,
    annotations: mockAnnotations,
    viewport: vp,
  });

  assert.equal(result.fields.length, 1, "İlk alan alınmalı");
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].code, "DUPLICATE_FIELD");
}

// Test: OUT_OF_BOUNDS kontrolü
{
  const vp = createMockViewport({ width: 500, height: 700 });
  const mockAnnotations: RawPdfAnnotation[] = [
    {
      id: "oob1",
      fieldName: "tarih",
      subtype: "Widget",
      fieldType: "Tx",
      rect: [600, 800, 700, 900], // Viewport dışı (width: 500, height: 700)
    },
  ];

  const result = mapPdfAnnotationsToInlineFields({
    documentId: "beton-dokum-tutanagi",
    pageNumber: 1,
    annotations: mockAnnotations,
    viewport: vp,
  });

  assert.equal(result.fields.length, 0);
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].code, "OUT_OF_BOUNDS");
}

console.log("Saf birim testleri başarıyla geçti.");

// =========================================================================
// 2. GERÇEK BEŞ ŞABLON PDF İLE ENTEGRASYON TESTİ
// =========================================================================

console.log("\n--- 2. Gerçek Şablon PDF Entegrasyon Testleri Çalıştırılıyor ---");

const templates: Record<
  BelgeDocumentId,
  { path: string; expectedPages: number; expectedFieldCount: number }
> = {
  "beton-dokum-tutanagi": {
    path: "public/belgeler/beton-dokum-tutanagi.pdf",
    expectedPages: 1,
    expectedFieldCount: 10,
  },
  "insaat-ruhsati-dilekcesi": {
    path: "public/belgeler/insaat-ruhsati-dilekcesi.pdf",
    expectedPages: 1,
    expectedFieldCount: 8,
  },
  "santiye-sefi-istifa-dilekcesi": {
    path: "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
    expectedPages: 1,
    expectedFieldCount: 10,
  },
  "santiye-sefi-sozlesmesi": {
    path: "public/belgeler/santiye-sefi-sozlesmesi.pdf",
    expectedPages: 2,
    expectedFieldCount: 14,
  },
  "santiye-sefi-taahhutnamesi": {
    path: "public/belgeler/santiye-sefi-taahhutnamesi.pdf",
    expectedPages: 1,
    expectedFieldCount: 14,
  },
};

async function testRealTemplates() {
  let grandTotalMappedFields = 0;

  for (const [docIdStr, config] of Object.entries(templates)) {
    const docId = docIdStr as BelgeDocumentId;
    const fullPath = path.resolve(repoRoot, config.path);
    const data = new Uint8Array(fs.readFileSync(fullPath));

    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    assert.equal(
      pdf.numPages,
      config.expectedPages,
      `${docId}: Beklenen sayfa sayısı uyuşmuyor`
    );

    const docMappedFields = [];
    const docDiagnostics = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const rawAnnotations = await page.getAnnotations({ intent: "display" });

      const result = mapPdfAnnotationsToInlineFields({
        documentId: docId,
        pageNumber: pageNum,
        annotations: rawAnnotations,
        viewport,
      });

      docMappedFields.push(...result.fields);
      docDiagnostics.push(...result.diagnostics);
    }

    await loadingTask.destroy();

    // 1. Alan sayısı sözleşmeyle tam uyuşmalı
    assert.equal(
      docMappedFields.length,
      config.expectedFieldCount,
      `${docId}: Eşleşen alan sayısı (${docMappedFields.length}) beklenen (${config.expectedFieldCount}) ile uyuşmuyor!`
    );

    // 2. Eşleşen tüm alan adları DOCUMENT_EDITABLE_FIELDS içinde olmalı ve birebir küme eşitliği sağlamalı
    const mappedKeys = docMappedFields.map((f) => f.fieldKey).sort();
    const expectedKeys = [...DOCUMENT_EDITABLE_FIELDS[docId]].sort();
    assert.deepEqual(
      mappedKeys,
      expectedKeys,
      `${docId}: Eşleşen alan listesi DOCUMENT_EDITABLE_FIELDS ile birebir aynı olmalı!`
    );

    // 3. Hiçbir PDF-only etiket eşleşmemeli
    const pdfOnlyKeys = new Set(DOCUMENT_PDF_ONLY_FIELDS[docId]);
    for (const field of docMappedFields) {
      assert.ok(
        !pdfOnlyKeys.has(field.fieldKey),
        `${docId}: '${field.fieldKey}' PDF-only etiket alanı olmasına rağmen inline alana map edilmiş!`
      );
    }

    // 4. Her bir alanın koordinat bütünlüğü (pozitif ve sonlu genişlik/yükseklik, sayfa sınırları içinde)
    for (const field of docMappedFields) {
      const vr = field.viewportRect;
      assert.ok(
        Number.isFinite(vr.left) && vr.left >= 0,
        `${docId} [${field.fieldKey}]: Geçersiz left koordinatı: ${vr.left}`
      );
      assert.ok(
        Number.isFinite(vr.top) && vr.top >= 0,
        `${docId} [${field.fieldKey}]: Geçersiz top koordinatı: ${vr.top}`
      );
      assert.ok(
        Number.isFinite(vr.width) && vr.width > 0,
        `${docId} [${field.fieldKey}]: Pozitif genişlik olmalı: ${vr.width}`
      );
      assert.ok(
        Number.isFinite(vr.height) && vr.height > 0,
        `${docId} [${field.fieldKey}]: Pozitif yükseklik olmalı: ${vr.height}`
      );
      assert.ok(
        field.label && field.label.trim().length > 0,
        `${docId} [${field.fieldKey}]: Türkçe etiket tanımlı olmalı`
      );
    }

    // 5. Belirli şablon özel tanı kontrolleri:
    if (docId === "santiye-sefi-istifa-dilekcesi") {
      const pdfOnlyDiag = docDiagnostics.filter((d) => d.code === "PDF_ONLY_LABEL");
      assert.equal(
        pdfOnlyDiag.length,
        3,
        "İstifa dilekçesinde 3 adet PDF_ONLY_LABEL tanısı üretilmeli"
      );
      const diagKeys = pdfOnlyDiag.map((d) => d.fieldName).sort();
      assert.deepEqual(diagKeys, ["adres_etiket", "iletisim_etiket", "tc_etiket"].sort());
    }

    if (docId === "santiye-sefi-taahhutnamesi") {
      const nonWidgetDiag = docDiagnostics.filter((d) => d.code === "NON_WIDGET_SUBTYPE");
      assert.equal(
        nonWidgetDiag.length,
        7,
        "Taahhütnamede 7 adet form dışı FreeText annotasyonu NON_WIDGET_SUBTYPE ile elenmeli"
      );
    }

    if (docId === "santiye-sefi-sozlesmesi") {
      // 2 sayfa kontrolü
      const p1Fields = docMappedFields.filter((f) => f.pageNumber === 1);
      const p2Fields = docMappedFields.filter((f) => f.pageNumber === 2);
      assert.equal(p1Fields.length, 11, "Sözleşme Sayfa 1'de 11 alan olmalı");
      assert.equal(p2Fields.length, 3, "Sözleşme Sayfa 2'de 3 alan olmalı (sozlesme_tarihi, santiye_sefi_imza_adi, muteahhit_imza_unvan)");
    }

    grandTotalMappedFields += docMappedFields.length;
    console.log(`✓ ${docId}: ${docMappedFields.length}/${config.expectedFieldCount} alan kusursuz eşleşti.`);
  }

  assert.equal(
    grandTotalMappedFields,
    56,
    `Tüm 5 belgede toplam 56 düzenlenebilir alan eşleşmeli (Bulunan: ${grandTotalMappedFields})`
  );

  console.log(`\nBAŞARILI: 5 belgenin tamamında toplam ${grandTotalMappedFields}/56 alan eksiksiz doğrulandı!`);
}

testRealTemplates()
  .then(() => {
    console.log("Tüm inline field map testleri başarıyla tamamlandı.");
  })
  .catch((err) => {
    console.error("Test başarısız:", err);
    process.exitCode = 1;
  });
