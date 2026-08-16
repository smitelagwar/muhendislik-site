import { PDFDocument, PDFName, PDFNumber, PDFString } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

async function sanitizeTemplates() {
  const boldFontBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Arial-Bold.ttf"));
  const regularFontBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Arial-Regular.ttf"));

  // 1. Sanitize Insaat Ruhsati Template (Create clean from scratch)
  {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false });
    const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false });
    const page = pdfDoc.addPage([595.28, 841.89]);
    const form = pdfDoc.getForm();

    const addField = (name, x, y, width, height, defaultValue, multiline, fontSize, isBold, alignment) => {
      const font = isBold ? boldFont : regularFont;
      const tf = form.createTextField(name);
      if (multiline) tf.enableMultiline();
      tf.addToPage(page, { x, y, width, height, borderWidth: 0, font });
      tf.acroField.dict.set(PDFName.of("DA"), PDFString.of(`/${font.name} ${fontSize} Tf 0 0 0 rg`));
      tf.acroField.dict.set(PDFName.of("Q"), PDFNumber.of(alignment));
      if (defaultValue) tf.setText(defaultValue);
      tf.acroField.dict.delete(PDFName.of("AP"));
      tf.acroField.dict.delete(PDFName.of("DV"));
      for (const w of tf.acroField.getWidgets()) {
        w.dict.delete(PDFName.of("AP"));
        w.dict.delete(PDFName.of("DV"));
        w.dict.set(PDFName.of("DA"), PDFString.of(`/${font.name} ${fontSize} Tf 0 0 0 rg`));
        w.dict.set(PDFName.of("Q"), PDFNumber.of(alignment));
      }
    };

    addField("tarih", 350, 705, 175, 20, "08.12.2023", false, 11, true, 2);
    addField("belediye_adi", 72, 635, 451, 22, "ÇANKAYA BELEDİYESİ", false, 12, true, 1);
    addField("mudurluk_adi", 72, 615, 451, 20, "İmar ve Şehircilik Müdürlüğüne", false, 11, true, 1);
    const defaultBody = "           İlçenin Örnek Mahallesi 1234 ada, 56 numaralı parselime yeni inşaat yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.";
    addField("ana_metin", 72, 520, 451, 65, defaultBody, true, 11, false, 0);
    addField("ad_soyad", 310, 445, 215, 22, "Hüseyin GÜNAYDIN", false, 11, false, 1);
    addField("unvan", 310, 425, 215, 18, "Yapı Sahibi", false, 10, false, 1);
    const defaultAdres = "Adres: Örnek Mah. Mühendisler Cad. No:24/6\nÇankaya / ANKARA";
    addField("adres", 72, 335, 451, 44, defaultAdres, true, 10.5, false, 0);
    addField("tel", 72, 305, 451, 20, "Tel: 0566 666 66 66", false, 10.5, false, 0);

    form.updateFieldAppearances(boldFont);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(process.cwd(), "public", "belgeler", "insaat-ruhsati-dilekcesi.pdf"), pdfBytes);
    console.log("✅ Sanitized Insaat Ruhsati Template");
  }

  // 2. Sanitize Santiye Sefi Istifa Dilekcesi Template
  {
    const filePath = path.join(process.cwd(), "public", "belgeler", "santiye-sefi-istifa-dilekcesi.pdf");
    const bytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(bytes);
    pdfDoc.registerFontkit(fontkit);
    const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false });
    const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false });
    const form = pdfDoc.getForm();

    const cleanValues = {
      hitap_1: "BELEDİYE BAŞKANLIĞINA",
      hitap_2: "ÇANKAYA",
      ana_paragraf: "Arsa sahibi ABC İNŞAAT adına kayıtlı, Ankara ili, Çankaya ilçesi,\nÖrnek Mahallesi, 1234 ada 56 parselde bulunan inşaatta üstlenmiş olduğum\nşantiye şefliği görevimden, gördüğüm lüzum üzerine bu tarihten itibaren\nistifa ediyorum.",
      sonuc_cumlesi: "İstifa ettiğimi bildirir, gereğinin yapılmasını dilerim.",
      tarih: "29.12.2025",
      unvan: "İNŞAAT MÜHENDİSİ",
      ad_soyad: "HÜSEYİN GÜNAYDIN",
      adres_etiket: "ADRES :",
      adres_deger: "Örnek Mah. İnşaat Cad. No:12/4 Çankaya / ANKARA",
      tc_etiket: "T.C. :",
      tc_deger: "11111111110",
      iletisim_etiket: "İletişim :",
      iletisim_deger: "0566 666 66 66",
    };

    for (const [k, v] of Object.entries(cleanValues)) {
      try {
        const f = form.getTextField(k);
        if (f) {
          f.setText(v);
          f.acroField.dict.delete(PDFName.of("AP"));
          f.acroField.dict.delete(PDFName.of("DV"));
          for (const w of f.acroField.getWidgets()) {
            w.dict.delete(PDFName.of("AP"));
            w.dict.delete(PDFName.of("DV"));
          }
        }
      } catch {}
    }

    form.updateFieldAppearances(boldFont);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
    console.log("✅ Sanitized Istifa Dilekcesi Template");
  }

  // 3. Sanitize Santiye Sefi Taahhutnamesi Template
  {
    const filePath = path.join(process.cwd(), "public", "belgeler", "santiye-sefi-taahhutnamesi.pdf");
    const bytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(bytes);
    pdfDoc.registerFontkit(fontkit);
    const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false });
    const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false });
    const form = pdfDoc.getForm();

    const cleanValues = {
      oda_sicil_no: "12345",
      tc_kimlik_no: "11111111110",
      unvan: "İNŞAAT MÜHENDİSİ",
      adres: "Örnek Mah. Mühendisler Cad. No:1/A Çankaya / ANKARA",
      telefon: "0566 666 66 66",
      il_ilce: "ANKARA / ÇANKAYA",
      ilgili_idare: "ÇANKAYA BELEDİYESİ",
      pafta_ada_parsel: "Pafta: 12, Ada: 345, Parsel: 6",
      yapi_adresi: "Örnek Mah. Yapı Cad. No:10 Çankaya / ANKARA",
      yapi_sahibi: "ABC YAPI İNŞAAT LTD. ŞTİ.",
      yapi_sahibi_adresi: "Çankaya / ANKARA",
      tarih: "16.08.2026",
      santiye_sefi_ad_soyad: "Hüseyin GÜNAYDIN",
      unvan_imza: "İNŞAAT MÜHENDİSİ",
    };

    for (const [k, v] of Object.entries(cleanValues)) {
      try {
        const f = form.getTextField(k);
        if (f) {
          f.setText(v);
          f.acroField.dict.delete(PDFName.of("AP"));
          f.acroField.dict.delete(PDFName.of("DV"));
          for (const w of f.acroField.getWidgets()) {
            w.dict.delete(PDFName.of("AP"));
            w.dict.delete(PDFName.of("DV"));
          }
        }
      } catch {}
    }

    form.updateFieldAppearances(boldFont);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
    console.log("✅ Sanitized Taahhutname Template");
  }

  // 4. Sanitize Beton Dokum Tutanagi Template
  {
    const filePath = path.join(process.cwd(), "public", "belgeler", "beton-dokum-tutanagi.pdf");
    const bytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(bytes);
    pdfDoc.registerFontkit(fontkit);
    const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: false });
    const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: false });
    const form = pdfDoc.getForm();

    const cleanValues = {
      tutanak_alt_baslik: "Beton Dökümü Sistem Onay Sorunu",
      tarih: "10.08.2026",
      yer: "ANKARA İli ÇANKAYA İlçesi Örnek Mahallesi 1234 ada 56 parsel",
      yibf: "1234567",
      olay_aciklamasi: "Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında, E-Devlet sisteminden kaynaklanan hata nedeniyle; şantiye şefi olarak beton dökümü mahallinde hazır bulunmama rağmen sistem üzerinden gerekli onay işlemi gerçekleştirilememiştir.",
      gozlem_notlar: "Beton dökümü gerçekleştirilmiştir. E-Devlet giriş sorunu nedeniyle sistem üzerinden onay işlemi yapılamamıştır.",
      laboratuvar: "XYZ BETON LABORATUVARI A.Ş.",
      muteahhit: "ABC İNŞAAT TAAHHÜT LTD. ŞTİ.",
      santiye_sefi: "İnş. Müh. Hüseyin GÜNAYDIN",
      yapi_denetim: "GÜVEN YAPI DENETİM LTD. ŞTİ.",
    };

    for (const [k, v] of Object.entries(cleanValues)) {
      try {
        const f = form.getTextField(k);
        if (f) {
          f.setText(v);
          f.acroField.dict.delete(PDFName.of("AP"));
          f.acroField.dict.delete(PDFName.of("DV"));
          for (const w of f.acroField.getWidgets()) {
            w.dict.delete(PDFName.of("AP"));
            w.dict.delete(PDFName.of("DV"));
          }
        }
      } catch {}
    }

    form.updateFieldAppearances(boldFont);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);
    console.log("✅ Sanitized Beton Dokum Template");
  }
}

sanitizeTemplates().catch(console.error);
