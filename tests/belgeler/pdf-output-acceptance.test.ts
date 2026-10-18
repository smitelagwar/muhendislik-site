import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream, drawTextField, PDFHexString, rgb } from "pdf-lib";
import {
  generateBelgeDocument, generateBlankBelgePdf, measureBelgeDraft,
  BETON_DOKUM_DEFAULT_DATA, ISTIFA_DILEKCESI_DEFAULT_DATA, INSAAT_RUHSATI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA, TAAHHUTNAME_DEFAULT_DATA,
} from "../../src/lib/pdf-engine";
import { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS } from "../../src/lib/document-field-contracts";
import { getDocumentPdfProfiles, type BelgeDocumentId } from "../../src/lib/belgeler-pdf-profiles";
import { measurePdfAppearance, validatePdfFieldLayout, type PdfFieldLayout } from "../../src/lib/belgeler-pdf-layout";
import { assessFieldReadability } from "../../src/lib/belgeler-pdf-readability";

const cases: Array<[BelgeDocumentId, object, number]> = [
  ["beton-dokum-tutanagi", BETON_DOKUM_DEFAULT_DATA, 1],
  ["santiye-sefi-istifa-dilekcesi", ISTIFA_DILEKCESI_DEFAULT_DATA, 1],
  ["insaat-ruhsati-dilekcesi", INSAAT_RUHSATI_DEFAULT_DATA, 1],
  ["santiye-sefi-sozlesmesi", SOZLESME_DEFAULT_DATA, 2],
  ["santiye-sefi-taahhutnamesi", TAAHHUTNAME_DEFAULT_DATA, 1],
];

for (const [id, data, pages] of cases) {
  test(`${id}: bütün alanlar nominal puntoda ve doğru tabanda çizilir; gerçek AP raporla aynıdır`, async () => {
    const result = await generateBelgeDocument(id, data);
    const pdf = await PDFDocument.load(result.bytes);
    const profiles = getDocumentPdfProfiles(id);
    assert.equal(pdf.getPageCount(), pages);
    assert.equal(Object.keys(result.layouts).length, Object.keys(profiles).length);
    for (const field of pdf.getForm().getFields()) {
      const key = field.getName();
      const layout = result.layouts[key];
      assert.deepEqual(validatePdfFieldLayout(layout, profiles[key], true), [], `${id}/${key}`);
      for (const [index, widget] of field.acroField.getWidgets().entries()) {
        assert.equal(pdf.getForm().getTextField(key).getText(), layout.value);
        assert.equal((widget.dict.get(PDFName.of("V")) ?? field.acroField.dict.get(PDFName.of("V")))?.toString(), field.acroField.dict.get(PDFName.of("V"))?.toString(), `${key}: widget ve kanonik değer farklı`);
        const stream = widget.getAppearances()?.normal;
        assert.ok(stream instanceof PDFRawStream);
        const content = new TextDecoder().decode(decodePDFRawStream(stream).decode());
        const size = Number(content.match(/([\d.]+) Tf/)?.[1]);
        assert.ok(Math.abs(size - layout.widgets[index].fontSize) < 0.000001, key);
        const first = content.match(/(?:[-\d.]+ ){5}([-\d.]+) Tm/);
        assert.ok(first);
        assert.ok(Math.abs(Number(first[1]) + widget.getRectangle().y - profiles[key].baseline) < 0.25, key);
      }
    }
  });

  test(`${id}: boş çıktı gerçekten boş ve doldurulabilirdir; sabit etiketler ve görünüm akışları korunur`, async () => {
    const pdf = await PDFDocument.load(await generateBlankBelgePdf(id));
    assert.equal(pdf.getPageCount(), pages);
    const form = pdf.getForm();
    for (const key of DOCUMENT_EDITABLE_FIELDS[id]) {
      const field = form.getTextField(key);
      assert.equal(field.getText() ?? "", "", `${id}/${key}`);
      for (const widget of field.acroField.getWidgets()) {
        const stream = widget.getAppearances()?.normal;
        assert.ok(stream instanceof PDFRawStream);
        const content = new TextDecoder().decode(decodePDFRawStream(stream).decode());
        assert.equal(/<[0-9A-Fa-f]+> Tj/.test(content), false, `${id}/${key}: eski örnek yazı`);
      }
    }
    for (const key of DOCUMENT_PDF_ONLY_FIELDS[id]) {
      assert.equal(form.getTextField(key).getText(), getDocumentPdfProfiles(id)[key].fixedValue);
    }
  });
}

test("Uzun metin ve Türkçe glifler bütün düzenlenebilir alanlarda kutuda kalır; kısaltılmaz", async () => {
  for (const [id, defaults] of cases) {
    const data = { ...defaults, ...Object.fromEntries(DOCUMENT_EDITABLE_FIELDS[id].map((key) => [key, "ÇĞİÖŞÜ çğıöşü ".repeat(12)])) };
    const result = await generateBelgeDocument(id, data);
    for (const key of DOCUMENT_EDITABLE_FIELDS[id]) {
      assert.equal(result.layouts[key].value, data[key as keyof typeof data]);
      assert.deepEqual(validatePdfFieldLayout(result.layouts[key], getDocumentPdfProfiles(id)[key]), [], `${id}/${key}`);
    }
  }
  const result = await measureBelgeDraft("santiye-sefi-istifa-dilekcesi", "adres_deger", "W".repeat(1000));
  assert.equal(result.overflow, false);
  assert.ok(result.fontSize < 0.24);
  assert.equal(result.value.length, 1000);
  assert.equal(assessFieldReadability(result.documentId, result.fieldKey, result.value, result).risk, "serious");
  for (const value of ["A\n".repeat(100), "j adres"]) {
    const measured = await measureBelgeDraft("santiye-sefi-istifa-dilekcesi", "adres_deger", value);
    assert.equal(measured.value, value);
    assert.equal(measured.overflow, false, "Çok sayıda satır veya negatif sol taşmalı glif kesilmemelidir.");
  }
});

test("Kabul denetimi 5 pt, kaymış taban, örnek verili boş belge ve gerçek kırpılma örneklerini reddeder", async () => {
  const id = "santiye-sefi-taahhutnamesi";
  const good = await measureBelgeDraft(id, "oda_sicil_no", "12345");
  const profile = getDocumentPdfProfiles(id).oda_sicil_no;
  assert.ok(validatePdfFieldLayout({ ...good, fontSize: 5 }, profile, true).includes("unexpected-font-reduction"));
  const shifted: PdfFieldLayout = { ...good, widgets: good.widgets.map((widget) => ({ ...widget, baselines: widget.baselines.map((y) => y + 18.35) })) };
  assert.ok(validatePdfFieldLayout(shifted, profile, true).includes("misaligned-baseline"));
  assert.throws(() => assert.equal(good.value, ""), "Örnek verili belge boş kabul edilmemelidir.");

  const metrics = fontkit.create(readFileSync("public/fonts/Arial-Regular.ttf"));
  const text = "W".repeat(1000);
  const encoded = PDFHexString.of(metrics.layout(text).glyphs.map((glyph) => glyph.id.toString(16).padStart(4, "0")).join(""));
  const operations = drawTextField({ x: 0, y: 0, width: 225, height: 36, borderWidth: 0, padding: 1,
    color: undefined, borderColor: undefined, textColor: rgb(0, 0, 0), font: "ArialMT", fontSize: 0.5,
    textLines: [{ encoded, x: 1, y: 10 }],
  });
  const clipped = measurePdfAppearance(operations, metrics, { x: 0, y: 0, width: 225, height: 36 }, 1);
  assert.equal(clipped.overflow, true);
  assert.ok(validatePdfFieldLayout({ ...good, overflow: clipped.overflow, widgets: [clipped] }, profile).includes("clipped-glyphs"));
});
