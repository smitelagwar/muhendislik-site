import { PDFDocument, rgb, PDFName, PDFNumber, PDFString } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

async function createInsaatRuhsatiTemplate() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const boldFontBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Arial-Bold.ttf"));
  const regularFontBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Arial-Regular.ttf"));

  const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false });
  const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false });

  // A4 Page (595.28 x 841.89)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const form = pdfDoc.getForm();

  // Helper to create styled AcroForm text fields
  const addField = (
    name,
    x,
    y,
    width,
    height,
    defaultValue = "",
    multiline = false,
    fontSize = 11,
    isBold = false,
    alignment = 0 // 0=left, 1=center, 2=right
  ) => {
    const font = isBold ? boldFont : regularFont;
    const tf = form.createTextField(name);
    if (multiline) {
      tf.enableMultiline();
    }
    tf.addToPage(page, {
      x,
      y,
      width,
      height,
      borderWidth: 0,
      font: font,
    });

    tf.acroField.dict.set(
      PDFName.of("DA"),
      PDFString.of(`/${font.name} ${fontSize} Tf 0 0 0 rg`)
    );
    tf.acroField.dict.set(PDFName.of("Q"), PDFNumber.of(alignment));

    if (defaultValue) {
      tf.setText(defaultValue);
    }

    // Clean widget and field AP/DV dictionaries
    tf.acroField.dict.delete(PDFName.of("AP"));
    tf.acroField.dict.delete(PDFName.of("DV"));
    const widgets = tf.acroField.getWidgets();
    for (const w of widgets) {
      w.dict.delete(PDFName.of("AP"));
      w.dict.delete(PDFName.of("DV"));
      w.dict.set(
        PDFName.of("DA"),
        PDFString.of(`/${font.name} ${fontSize} Tf 0 0 0 rg`)
      );
      w.dict.set(PDFName.of("Q"), PDFNumber.of(alignment));
    }
    return tf;
  };

  // Exact coordinates matching the provided Word document screenshot:
  // 1. Tarih (Sağ Üst: y ≈ 705)
  addField("tarih", 350, 705, 175, 20, "08.12.2023", false, 11, true, 2);

  // 2. Muhatap İdare (Ortalı, Kalın: y ≈ 635 & 615)
  addField("belediye_adi", 72, 635, 451, 22, "AKDAĞMADENİ BELEDİYESİ", false, 12, true, 1);
  addField("mudurluk_adi", 72, 615, 451, 20, "İmar ve Şehircilik Müdürlüğüne", false, 11, true, 1);

  // 3. Ana Dilekçe Metni (Paragraf, girintili: y ≈ 530)
  const defaultBody = "           İlçenin Gültepe Mahallesi 351 ada, 162 numaralı parselime yeni inşaat yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.";
  addField("ana_metin", 72, 520, 451, 65, defaultBody, true, 11, false, 0);

  // 4. Başvuru Sahibi (Sağ Taraf: y ≈ 445)
  addField("ad_soyad", 310, 445, 215, 22, "Hüseyin GÜNAYDIN", false, 11, false, 1);
  addField("unvan", 310, 425, 215, 18, "Yapı Sahibi", false, 10, false, 1);

  // 5. Adres ve Telefon (Sol Alt: y ≈ 345 & 310)
  const defaultAdres = "Adres: Tunahan Mah. Üç Şehitler Cad. 12/C blok no:29\nEtimesgut/Ankara";
  addField("adres", 72, 335, 451, 44, defaultAdres, true, 10.5, false, 0);

  addField("tel", 72, 305, 451, 20, "Tel: 0546 414 57 13", false, 10.5, false, 0);

  form.updateFieldAppearances(boldFont);

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(process.cwd(), "public", "belgeler", "insaat-ruhsati-dilekcesi.pdf");
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✅ Generated perfect 1:1 Insaat Ruhsati Template at: ${outputPath} (${pdfBytes.length} bytes)`);
}

createInsaatRuhsatiTemplate().catch(console.error);
