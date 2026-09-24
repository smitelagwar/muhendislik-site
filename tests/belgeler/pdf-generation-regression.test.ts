import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFTextField } from "pdf-lib";
import {
  BETON_DOKUM_DEFAULT_DATA,
  INSAAT_RUHSATI_DEFAULT_DATA,
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA,
  TAAHHUTNAME_DEFAULT_DATA,
  generateBetonDokumPdf,
  generateInsaatRuhsatiPdf,
  generateIstifaDilekcesiPdf,
  generateSozlesmePdf,
  generateTaahhutnamePdf,
  type BetonDokumData,
  type InsaatRuhsatiData,
  type IstifaDilekcesiData,
  type SozlesmeData,
  type TaahhutnameData,
} from "../../src/lib/pdf-engine";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

type RegressionCase = {
  id: string;
  templatePath: string;
  expectedPages: number;
  defaults: object;
  generate: (data: object) => Promise<Uint8Array>;
};

const cases: RegressionCase[] = [
  {
    id: "beton-dokum-tutanagi",
    templatePath: "public/belgeler/beton-dokum-tutanagi.pdf",
    expectedPages: 1,
    defaults: BETON_DOKUM_DEFAULT_DATA,
    generate: (data) =>
      generateBetonDokumPdf(data as BetonDokumData, { flatten: false }),
  },
  {
    id: "insaat-ruhsati-dilekcesi",
    templatePath: "public/belgeler/insaat-ruhsati-dilekcesi.pdf",
    expectedPages: 1,
    defaults: INSAAT_RUHSATI_DEFAULT_DATA,
    generate: (data) =>
      generateInsaatRuhsatiPdf(data as InsaatRuhsatiData, { flatten: false }),
  },
  {
    id: "santiye-sefi-istifa-dilekcesi",
    templatePath: "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
    expectedPages: 1,
    defaults: ISTIFA_DILEKCESI_DEFAULT_DATA,
    generate: (data) =>
      generateIstifaDilekcesiPdf(data as IstifaDilekcesiData, { flatten: false }),
  },
  {
    id: "santiye-sefi-sozlesmesi",
    templatePath: "public/belgeler/santiye-sefi-sozlesmesi.pdf",
    expectedPages: 2,
    defaults: SOZLESME_DEFAULT_DATA,
    generate: (data) =>
      generateSozlesmePdf(data as SozlesmeData, { flatten: false }),
  },
  {
    id: "santiye-sefi-taahhutnamesi",
    templatePath: "public/belgeler/santiye-sefi-taahhutnamesi.pdf",
    expectedPages: 1,
    defaults: TAAHHUTNAME_DEFAULT_DATA,
    generate: (data) =>
      generateTaahhutnamePdf(data as TaahhutnameData, { flatten: false }),
  },
];

async function main() {
  for (const testCase of cases) {
    const blankBytes = readFileSync(resolve(repoRoot, testCase.templatePath));
    assert.ok(blankBytes.byteLength > 0, `${testCase.id}: boş PDF şablonu okunamadı`);

    const blankPdf = await PDFDocument.load(blankBytes);
    assert.equal(
      blankPdf.getPageCount(),
      testCase.expectedPages,
      `${testCase.id}: boş PDF sayfa sayısı değişti`
    );

    const generatedBytes = await testCase.generate(testCase.defaults);
    assert.ok(
      generatedBytes.byteLength > 0,
      `${testCase.id}: default PDF üretilemedi`
    );

    const generatedPdf = await PDFDocument.load(generatedBytes);
    assert.equal(
      generatedPdf.getPageCount(),
      testCase.expectedPages,
      `${testCase.id}: default PDF sayfa sayısı değişti`
    );

    const generatedForm = generatedPdf.getForm();

    for (const [fieldName, expectedValue] of Object.entries(testCase.defaults)) {
      if (typeof expectedValue !== "string") continue;

      const field = generatedForm.getFieldMaybe(fieldName);
      if (!(field instanceof PDFTextField)) continue;

      assert.equal(
        field.getText(),
        expectedValue,
        `${testCase.id}/${fieldName}: default PDF alan değeri değişti`
      );
    }
  }

  console.log("Belge blank + default PDF üretim regresyon testi başarılı.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
