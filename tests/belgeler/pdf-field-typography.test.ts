import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PDFArray, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  generateTaahhutnamePdf, TAAHHUTNAME_DEFAULT_DATA,
  generateSozlesmePdf, SOZLESME_DEFAULT_DATA,
} from "../../src/lib/pdf-engine";

function pageStreams(document: PDFDocument) {
  return document.getPages().map((page) => {
    const contents = document.context.lookup(page.node.get(PDFName.of("Contents")));
    assert.ok(contents instanceof PDFArray || contents instanceof PDFRawStream);
    const streams = contents instanceof PDFArray ? contents.asArray() : [contents];
    return streams.map((stream) => {
      const resolved = document.context.lookup(stream);
      assert.ok(resolved instanceof PDFRawStream);
      return Buffer.from(resolved.getContents()).toString("base64");
    });
  });
}

async function textItems(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice(), useSystemFonts: true });
  try {
    const document = await task.promise;
    const pages = [];
    for (let index = 1; index <= document.numPages; index++) {
      const text = await (await document.getPage(index)).getTextContent();
      pages.push(text.items.filter((item) => "str" in item));
    }
    return pages.flat();
  } finally {
    await task.destroy();
  }
}

test("Taahhütname değeri etiketle aynı 9 pt ve aynı tabanda; kaynak sayfa korunur", async () => {
  const source = await PDFDocument.load(readFileSync("public/belgeler/santiye-sefi-taahhutnamesi.pdf"));
  const bytes = await generateTaahhutnamePdf(TAAHHUTNAME_DEFAULT_DATA);
  const result = await PDFDocument.load(bytes);
  assert.deepEqual(pageStreams(result), pageStreams(source));
  for (const field of result.getForm().getFields()) {
    const appearance = field.acroField.getWidgets()[0].getDefaultAppearance();
    assert.match(appearance ?? "", /\s9 Tf\b/, field.getName());
  }
  const flat = await generateTaahhutnamePdf(TAAHHUTNAME_DEFAULT_DATA, { flatten: true });
  assert.equal((await PDFDocument.load(flat)).getForm().getFields().length, 0);
  const items = await textItems(flat);
  const label = items.find((item) => item.str === "Oda Sicil No")!;
  const value = items.find((item) => item.str === "12345")!;
  assert.ok(label && value, "Etiket ve alan gerçek çizim akışında bulunmalıdır.");
  assert.equal(value.transform[0], label.transform[0]);
  assert.ok(Math.abs(value.transform[5] - label.transform[5]) < 0.02, "Değer etiketiyle aynı satır tabanında olmalıdır.");
});

test("Sözleşme değerleri 9.5 pt gövdeye hizalanır; kaynak çizgiler ve sayfa içeriği korunur", async () => {
  const source = await PDFDocument.load(readFileSync("public/belgeler/santiye-sefi-sozlesmesi.pdf"));
  const result = await PDFDocument.load(await generateSozlesmePdf(SOZLESME_DEFAULT_DATA));
  assert.deepEqual(pageStreams(result), pageStreams(source));
  for (const field of result.getForm().getFields()) {
    assert.match(field.acroField.getWidgets()[0].getDefaultAppearance() ?? "", /\s9\.5 Tf\b/, field.getName());
  }
  const items = await textItems(await generateSozlesmePdf(SOZLESME_DEFAULT_DATA, { flatten: true }));
  const label = items.find((item) => item.str === "MADDE 1-")!;
  const value = items.find((item) => item.str === SOZLESME_DEFAULT_DATA.muteahhit_unvan)!;
  assert.ok(label && value);
  assert.equal(value.transform[0], label.transform[0]);
  assert.ok(Math.abs(value.transform[5] - label.transform[5]) < 0.02);
});

test("Uzun tek satır bütünüyle saklanır, yalnız gerektiği kadar küçülür; boş alan eski görünümü taşımaz", async () => {
  const text = "ÇĞİÖŞÜ çğıöşü Mühendislik ".repeat(12);
  const result = await PDFDocument.load(await generateTaahhutnamePdf({ ...TAAHHUTNAME_DEFAULT_DATA, adres: text, oda_sicil_no: "" }));
  assert.equal(result.getForm().getTextField("adres").getText(), text);
  const field = result.getForm().getTextField("adres");
  const size = Number(field.acroField.getWidgets()[0].getDefaultAppearance()?.match(/\s([\d.]+) Tf/)?.[1]);
  assert.ok(size > 0 && size < 9);
  const items = await textItems(await generateTaahhutnamePdf({ ...TAAHHUTNAME_DEFAULT_DATA, oda_sicil_no: "" }, { flatten: true }));
  assert.equal(items.some((item) => item.str === "12345"), false);
});
