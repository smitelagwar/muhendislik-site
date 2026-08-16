import { readFileSync } from "fs";
import { PDFDocument, PDFName } from "pdf-lib";

const files = [
  { name: "Taahhütname", path: "public/belgeler/santiye-sefi-taahhutnamesi.pdf" },
  { name: "İstifa", path: "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf" },
  { name: "Beton Döküm", path: "public/belgeler/beton-dokum-tutanagi.pdf" },
  { name: "İnşaat Ruhsatı Dilekçesi", path: "public/belgeler/insaat-ruhsati-dilekcesi.pdf" },
];

for (const f of files) {
  console.log(`\n===== ${f.name} =====`);
  const bytes = readFileSync(f.path);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const field of fields) {
    const name = field.getName();
    const acroField = field.acroField;

    // Check AP on the acroField dict itself
    const apOnField = acroField.dict.has(PDFName.of("AP"));
    // Check DV (Default Value)
    const dv = acroField.dict.get(PDFName.of("DV"));
    // Check V (Value)
    const v = acroField.dict.get(PDFName.of("V"));

    // Check widgets separately
    const widgets = acroField.getWidgets();
    const widgetAPs = widgets.map((w, i) => {
      const ap = w.dict.has(PDFName.of("AP"));
      const wDV = w.dict.get(PDFName.of("DV"));
      const wV = w.dict.get(PDFName.of("V"));
      return `widget[${i}]: AP=${ap}, DV=${wDV ? wDV.toString().slice(0,30) : "none"}, V=${wV ? wV.toString().slice(0,30) : "none"}`;
    });

    if (apOnField || dv || v || widgetAPs.some(w => w.includes("AP=true") || w.includes("DV=") && !w.includes("DV=none"))) {
      console.log(`  Field: ${name}`);
      console.log(`    AP on AcroField dict: ${apOnField}`);
      console.log(`    DV: ${dv ? dv.toString().slice(0, 60) : "none"}`);
      console.log(`    V:  ${v ? v.toString().slice(0, 60) : "none"}`);
      for (const wa of widgetAPs) {
        console.log(`    ${wa}`);
      }
    }
  }
}
