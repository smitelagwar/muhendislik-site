import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS } from "../../src/lib/document-field-contracts";
import { getDocumentPdfProfiles, getBlankDocumentData, type BelgeDocumentId } from "../../src/lib/belgeler-pdf-profiles";
import { generateIstifaDilekcesiPdf, ISTIFA_DILEKCESI_DEFAULT_DATA } from "../../src/lib/pdf-engine";

test("Profiller mevcut 56 alan ve üç sabit etiket sözleşmesini tam karşılar", () => {
  let total = 0;
  for (const id of Object.keys(DOCUMENT_EDITABLE_FIELDS) as BelgeDocumentId[]) {
    const profiles = getDocumentPdfProfiles(id);
    assert.deepEqual(Object.keys(profiles).sort(), [...DOCUMENT_EDITABLE_FIELDS[id], ...DOCUMENT_PDF_ONLY_FIELDS[id]].sort());
    const blank = getBlankDocumentData(id);
    for (const key of DOCUMENT_EDITABLE_FIELDS[id]) assert.equal(blank[key], "");
    for (const key of DOCUMENT_PDF_ONLY_FIELDS[id]) assert.ok(blank[key]);
    total += Object.keys(profiles).length;
  }
  assert.equal(total, 59);
});

test("İstifa adresinin ilk çizim tabanı etiketiyle aynı olmalıdır", async () => {
  const pdf = await PDFDocument.load(await generateIstifaDilekcesiPdf(ISTIFA_DILEKCESI_DEFAULT_DATA));
  const profile = getDocumentPdfProfiles("santiye-sefi-istifa-dilekcesi").adres_deger;
  assert.ok(Math.abs(pdf.getForm().getTextField("adres_deger").acroField.getWidgets()[0].getRectangle().y - profile.rect.y) < 0.01,
    "Eski yukarı kaymış adres kutusu kabul edilmemelidir.");
});

test("Bölünmeyen uzun metin 0.5 pt alt sınırında kırpılmamalıdır", async () => {
  const pdf = await PDFDocument.load(await generateIstifaDilekcesiPdf({ ...ISTIFA_DILEKCESI_DEFAULT_DATA, adres_deger: "W".repeat(1000) }));
  const field = pdf.getForm().getTextField("adres_deger");
  const size = Number(field.acroField.getWidgets()[0].getDefaultAppearance()?.match(/([\d.]+) Tf/)?.[1]);
  assert.equal(field.getText()?.length, 1000);
  assert.ok(size < 0.24, `223 pt alana sığmayan ${size} pt metin kabul edilmemelidir.`);
});
