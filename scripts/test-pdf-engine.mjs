/**
 * Test the PDF engine by generating PDFs with empty data (simulating "Temizle")
 * and checking if any stain/ghost values remain in the output.
 */
import { readFileSync, writeFileSync } from "fs";
import { PDFDocument, PDFName } from "pdf-lib";

// Simulate the pdf-engine logic but run in Node directly
async function testEmptyPdf(templatePath, outputPath) {
  const bytes = readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`\nTesting: ${templatePath}`);
  console.log(`Fields found: ${fields.length}`);

  let issuesFound = 0;

  for (const field of fields) {
    const acroField = field.acroField;
    const widgets = acroField.getWidgets();

    // Check AP stream on field dict
    if (acroField.dict.has(PDFName.of("AP"))) {
      console.log(`  ⚠️ AP on field dict: ${field.getName()}`);
      issuesFound++;
    }

    // Check AP stream on each widget
    for (const widget of widgets) {
      if (widget.dict.has(PDFName.of("AP"))) {
        console.log(`  ⚠️ AP on widget: ${field.getName()}`);
        issuesFound++;
      }
    }

    // Check DV (default value bleed-through)
    const dv = acroField.dict.get(PDFName.of("DV"));
    if (dv) {
      const dvStr = dv.toString();
      if (dvStr !== "()" && dvStr.length > 2) {
        console.log(`  ⚠️ DV set on field ${field.getName()}: ${dvStr.slice(0, 40)}`);
        issuesFound++;
      }
    }
  }

  if (issuesFound === 0) {
    console.log(`  ✅ No AP/DV issues in original template`);
  } else {
    console.log(`  ❌ Found ${issuesFound} potential issues`);
  }
}

// Now simulate what populateForm does with empty data
async function simulateTemizle(templatePath, fieldNames) {
  const { PDFDocument: PDFDoc, PDFName: PName, PDFString, PDFNumber } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;

  const templateBytes = readFileSync(templatePath);
  const pdfDoc = await PDFDoc.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  // Load Arial Regular (as regular font)
  const regularBytes = readFileSync("public/fonts/Arial-Regular.ttf");
  const regularFont = await pdfDoc.embedFont(regularBytes);

  const form = pdfDoc.getForm();

  // Set all fields to empty string, delete AP+DV from field+widgets
  for (const key of fieldNames) {
    try {
      const field = form.getTextField(key);
      if (!field) continue;

      field.acroField.dict.set(PName.of("DA"), PDFString.of(`/${regularFont.name} 9 Tf 0 0 0 rg`));
      field.acroField.dict.delete(PName.of("AP"));
      field.acroField.dict.delete(PName.of("DV"));

      const widgets = field.acroField.getWidgets();
      for (const widget of widgets) {
        widget.dict.delete(PName.of("AP"));
        widget.dict.delete(PName.of("DV"));
        widget.dict.set(PName.of("DA"), PDFString.of(`/${regularFont.name} 9 Tf 0 0 0 rg`));
      }

      field.setText("");
    } catch (e) {
      console.log(`  ⚠️ Could not clear field ${key}: ${e.message}`);
    }
  }

  // Re-check for remaining issues
  const fields = form.getFields();
  let issuesAfter = 0;
  for (const field of fields) {
    const widgets = field.acroField.getWidgets();
    for (const widget of widgets) {
      if (widget.dict.has(PName.of("AP"))) {
        console.log(`  ❌ AP still present on widget after Temizle: ${field.getName()}`);
        issuesAfter++;
      }
    }
    const v = field.acroField.dict.get(PName.of("V"));
    if (v && v.toString() !== "()" && v.toString().length > 2) {
      console.log(`  ⚠️ V still has value: ${field.getName()} = ${v.toString().slice(0, 40)}`);
    }
  }

  if (issuesAfter === 0) {
    console.log(`  ✅ After Temizle: No AP streams remain — CLEAN!`);
  } else {
    console.log(`  ❌ After Temizle: ${issuesAfter} issues remain`);
  }
}

// Test all 4 templates
await testEmptyPdf("public/belgeler/beton-dokum-tutanagi.pdf", "output/beton-empty.pdf");
await testEmptyPdf("public/belgeler/santiye-sefi-istifa-dilekcesi.pdf", "output/istifa-empty.pdf");
await testEmptyPdf("public/belgeler/santiye-sefi-taahhutnamesi.pdf", "output/taahhut-empty.pdf");
await testEmptyPdf("public/belgeler/insaat-ruhsati-dilekcesi.pdf", "output/insaat-ruhsati-empty.pdf");

console.log("\n--- Simulating Temizle for Taahhütname ---");
await simulateTemizle("public/belgeler/santiye-sefi-taahhutnamesi.pdf", [
  "oda_sicil_no", "tc_kimlik_no", "unvan", "adres", "telefon",
  "il_ilce", "ilgili_idare", "pafta_ada_parsel", "yapi_adresi",
  "yapi_sahibi", "yapi_sahibi_adresi", "tarih", "santiye_sefi_ad_soyad", "unvan_imza"
]);

console.log("\n--- Simulating Temizle for İstifa ---");
await simulateTemizle("public/belgeler/santiye-sefi-istifa-dilekcesi.pdf", [
  "hitap_1", "hitap_2", "ana_paragraf", "sonuc_cumlesi",
  "tarih", "ad_soyad", "adres_etiket", "adres_deger",
  "tc_etiket", "tc_deger", "iletisim_etiket", "iletisim_deger"
]);

console.log("\n--- Simulating Temizle for Beton Döküm ---");
await simulateTemizle("public/belgeler/beton-dokum-tutanagi.pdf", [
  "tutanak_alt_baslik", "tarih", "yer", "yibf", "olay_aciklamasi",
  "gozlem_notlar", "laboratuvar", "muteahhit", "santiye_sefi", "yapi_denetim"
]);

console.log("\n--- Simulating Temizle for İnşaat Ruhsatı ---");
await simulateTemizle("public/belgeler/insaat-ruhsati-dilekcesi.pdf", [
  "tarih", "belediye_adi", "mudurluk_adi", "ana_metin",
  "ad_soyad", "adres", "tel"
]);
