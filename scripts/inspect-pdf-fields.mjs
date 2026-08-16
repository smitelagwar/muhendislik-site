import { readFileSync } from "fs";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";

const files = [
  { name: "İstifa", path: "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf" },
  { name: "Taahhütname", path: "public/belgeler/santiye-sefi-taahhutnamesi.pdf" },
  { name: "Beton Döküm", path: "public/belgeler/beton-dokum-tutanagi.pdf" },
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
    
    // Get DA (Default Appearance) string
    const da = acroField.dict.get(PDFName.of("DA"));
    // Get Q (Quadding / Alignment): 0=Left, 1=Center, 2=Right
    const q = acroField.dict.get(PDFName.of("Q"));
    // Get Ff (Field Flags)
    const ff = acroField.dict.get(PDFName.of("Ff"));
    
    console.log(`  Field: ${name}`);
    console.log(`    DA: ${da ? da.toString() : "not set"}`);
    console.log(`    Q (alignment): ${q ? q.toString() : "not set (default=left)"}`);
    console.log(`    Ff (flags): ${ff ? ff.toString() : "not set"}`);
  }
}
