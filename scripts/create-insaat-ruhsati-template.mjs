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
    fontSize = 10,
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

  // 1. Tarih (Sağ Üst)
  addField("tarih", 380, 755, 160, 22, "08.12.2023", false, 11, true, 2);

  // 2. Muhatap İdare (Ortalı & Kalın)
  addField("belediye_adi", 54, 690, 487, 24, "AKDAĞMADENİ BELEDİYESİ", false, 13, true, 1);
  addField("mudurluk_adi", 54, 662, 487, 22, "İmar ve Şehircilik Müdürlüğüne", false, 12, true, 1);

  // 3. Konu
  addField("konu_baslik", 54, 615, 487, 20, "KONU: Yapı (İnşaat) Ruhsatı Başvurusu", false, 10, true, 0);

  // 4. Ana Dilekçe Metni (Paragraf)
  const defaultBody = "           İlçenin Gültepe Mahallesi 351 ada, 162 numaralı parselime yeni inşaat yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.";
  addField("ana_metin", 54, 480, 487, 120, defaultBody, true, 10.5, false, 0);

  // 5. Başvuru Sahibi / İmza Bloğu (Sağ Blok)
  addField("ad_soyad", 310, 425, 230, 22, "Eda AKÇA", false, 11, true, 1);
  addField("unvan", 310, 405, 230, 18, "Yapı Sahibi", false, 9.5, false, 1);
  addField("imza_alani", 310, 375, 230, 25, "(İmza)", false, 9.5, false, 1);

  // 6. İletişim / Tebligat Bilgileri (Sol Alt Blok)
  addField("adres_etiket", 54, 325, 60, 18, "ADRES :", false, 9.5, true, 0);
  addField("adres_deger", 120, 275, 420, 65, "Tunahan Mah. Üç Şehitler Cad. 12/C blok no:29\nEtimesgut / ANKARA", true, 9.5, false, 0);

  addField("tel_etiket", 54, 245, 60, 18, "TEL :", false, 9.5, true, 0);
  addField("tel_deger", 120, 245, 200, 18, "0532 397 92 34", false, 9.5, false, 0);

  addField("tc_etiket", 54, 218, 60, 18, "T.C. NO :", false, 9.5, true, 0);
  addField("tc_deger", 120, 218, 200, 18, "", false, 9.5, false, 0);

  addField("ekler_etiket", 54, 180, 60, 18, "EKLER :", false, 9.5, true, 0);
  const defaultEkler = "1. Tapu Senedi Örneği\n2. İmar Durum Belgesi (Çap)\n3. Aplikasyon Krokisi\n4. Mimari, Statik, Mekanik ve Elektrik Projeleri";
  addField("ekler_deger", 120, 95, 420, 100, defaultEkler, true, 9, false, 0);

  form.updateFieldAppearances(boldFont);

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(process.cwd(), "public", "belgeler", "insaat-ruhsati-dilekcesi.pdf");
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✅ Generated template at: ${outputPath} (${pdfBytes.length} bytes)`);
}

createInsaatRuhsatiTemplate().catch(console.error);
