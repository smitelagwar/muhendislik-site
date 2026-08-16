/**
 * create-sozlesme-template.mjs
 * Creates the editable "Şantiye Şefliği Hizmet Sözleşmesi" PDF template
 * from scratch using pdf-lib, embedding AcroForm fields at the exact
 * positions matching the original 2-page PDF layout.
 *
 * Run: node scripts/create-sozlesme-template.mjs
 */

import { PDFDocument, PDFName, PDFNumber, PDFString, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

// ─────────────────────────── helpers ────────────────────────────────────────

/**
 * Draw static text on a page using a pdf-lib embedded font.
 */
function drawText(page, font, text, x, y, size, color = rgb(0, 0, 0)) {
  page.drawText(text, { x, y, size, font, color });
}

/**
 * Draw a horizontal line.
 */
function drawLine(page, x1, y1, x2, y2, thickness = 0.5) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color: rgb(0, 0, 0),
  });
}

/**
 * Add an AcroForm text field with zero border, clean DA, aligned text.
 * alignment: 0=left 1=center 2=right
 */
function addField(form, page, font, name, x, y, w, h, defaultValue, multiline, fontSize, alignment) {
  const tf = form.createTextField(name);
  if (multiline) tf.enableMultiline();
  tf.addToPage(page, { x, y, width: w, height: h, borderWidth: 0, font });
  const da = PDFString.of(`/${font.name} ${fontSize} Tf 0 0 0 rg`);
  tf.acroField.dict.set(PDFName.of("DA"), da);
  tf.acroField.dict.set(PDFName.of("Q"), PDFNumber.of(alignment));
  tf.acroField.dict.delete(PDFName.of("AP"));
  tf.acroField.dict.delete(PDFName.of("DV"));
  if (defaultValue) tf.setText(defaultValue);
  for (const w_ of tf.acroField.getWidgets()) {
    w_.dict.delete(PDFName.of("AP"));
    w_.dict.delete(PDFName.of("DV"));
    w_.dict.set(PDFName.of("DA"), da);
    w_.dict.set(PDFName.of("Q"), PDFNumber.of(alignment));
  }
}

// ─────────────────────────── main ───────────────────────────────────────────

async function main() {
  const boldBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Arial-Bold.ttf"));
  const regularBytes = fs.readFileSync(path.join(process.cwd(), "public", "fonts", "Arial-Regular.ttf"));

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const bold = await pdfDoc.embedFont(boldBytes, { subset: false });
  const regular = await pdfDoc.embedFont(regularBytes, { subset: false });
  const form = pdfDoc.getForm();

  // ── A4 dimensions ──────────────────────────────────────────────────────────
  const W = 595.28;
  const H = 841.89;
  const ML = 57;   // margin left
  const MR = 538;  // margin right (content area right edge)
  const CW = MR - ML; // content width ≈ 481

  // ─────────────────────────── PAGE 1 ──────────────────────────────────────

  const p1 = pdfDoc.addPage([W, H]);

  // Title
  const title = "ŞANTİYE ŞEFLİĞİ HİZMET SÖZLEŞMESİ";
  const titleWidth = bold.widthOfTextAtSize(title, 13);
  drawText(p1, bold, title, (W - titleWidth) / 2, 780, 13);

  // ── MADDE 1 – Taraflar ───────────────────────────────────────────────────
  const m1y = 745;
  drawText(p1, bold, "Taraflar", ML, m1y, 10);
  drawLine(p1, ML, m1y - 2, MR, m1y - 2);

  // Static prefix "MADDE 1- "
  drawText(p1, regular, "MADDE 1-", ML, m1y - 18, 9.5);

  // Muteahhit field (inline in "MADDE 1- [FIELD] isimli/unvanlı...")
  // After "MADDE 1- " → x≈115
  addField(form, p1, bold, "muteahhit_unvan", 116, m1y - 28, 148, 18, "ABC İNŞAAT", false, 9.5, 0);
  drawText(p1, regular, "isimli/unvanlı Yapı Müteahhidi ile Şantiye Şefi olarak", 266, m1y - 18, 9.5);

  // Santiye sefi field
  addField(form, p1, bold, "santiye_sefi_ad", ML, m1y - 46, 200, 18, "HÜSEYİN GÜNAYDIN", false, 9.5, 0);
  drawText(p1, regular, "arasında aşağıdaki şartlarla bir sözleşme", 252, m1y - 38, 9.5);

  drawText(p1, regular, "düzenlenmiştir. Bu sözleşmede taraflar Yapı Müteahhidi ile Şantiye Şefi olarak", ML, m1y - 56, 9.5);
  drawText(p1, regular, "anılacaktır.", ML, m1y - 70, 9.5);

  // ── MADDE 2 – İşyeri ────────────────────────────────────────────────────
  const m2y = 645;
  drawText(p1, bold, "İşyeri", ML, m2y, 10);
  drawLine(p1, ML, m2y - 2, MR, m2y - 2);

  drawText(p1, regular, "MADDE 2- Şantiye şefinin işyeri", ML, m2y - 18, 9.5);
  // İl / İlçe / adres field (Yozgat, Akdağmadeni, İstanbulluoğlu Mah. 368 ada 2 parsel)
  addField(form, p1, bold, "is_yeri", ML, m2y - 64, CW, 46,
    "YOZGAT ili, AKDAĞMADENİ ilçesi, İSTANBULLUOĞLU MAHALLESİ, 368 ada, 2 parsel",
    true, 9.5, 0);
  drawText(p1, regular, "nolu tapuya kayıtlı olan ve ilgili idareden alınan yapı ruhsatı ve eklerine", ML, m2y - 78, 9.5);
  drawText(p1, regular, "göre inşa edilecek yapıdır.", ML, m2y - 92, 9.5);

  // ── MADDE 3 – Görev ve Yükümlülükleri ───────────────────────────────────
  const m3y = 530;
  drawText(p1, bold, "Görev ve Yükümlülükleri", ML, m3y, 10);
  drawLine(p1, ML, m3y - 2, MR, m3y - 2);

  const m3lines = [
    "MADDE 3- Şantiye şefi; yapıyı yapı denetim kuruluşunun teknik konulardaki talimatlarına",
    "uygun olarak yönetmek ve inşa ettirmekle yükümlüdür. Şantiye şefi, yapılacak",
    "denetimler için hazırlık yaparak yapı denetim kuruluşuna bildirmek, yapı denetiminde",
    "bizzat bulunarak denetime ilişkin tutanak ve belgeleri imzalamak, yapı denetimine",
    "mani olanlar varsa bunları öncelikle yapı denetim kuruluşuna, yapı denetim kuruluşunca",
    "denetimin sağlanamaması halinde Yapı Denetim Komisyonuna bildirmek zorundadır.",
    "Bunun yanında şantiye şefi; görevinin gerektirdiği işler ile verilecek diğer görevleri,",
    "öncelik sırası ile yürürlükteki Yapı Denetimi Hakkında Kanuna, İmar Kanunu, imar planı,",
    "yönetmelik, ruhsat ve ekleri, standart, şartname, fen ve sanat kuralları ile ilgili idare,",
    "yapı denetim kuruluşu ve yapı müteahhidinin talimatlarına uygun olarak yapmayı",
    "taahhüt eder ve bu hizmetleri karşılığında 5 inci maddede belirtilen aylık sözleşme",
    "ücretini alır.",
  ];
  m3lines.forEach((line, i) => drawText(p1, regular, line, ML, m3y - 18 - i * 13, 9.5));

  // ── MADDE 4 – Sözleşme Süresi ────────────────────────────────────────────
  const m4y = 355;
  drawText(p1, bold, "Sözleşme Süresi", ML, m4y, 10);
  drawLine(p1, ML, m4y - 2, MR, m4y - 2);

  drawText(p1, regular,
    "MADDE 4- Sözleşme süresi, inşa edilecek yapının ruhsat tarihi ile yapı kullanma izni tarihi",
    ML, m4y - 18, 9.5);
  drawText(p1, regular, "arasında geçen süredir.", ML, m4y - 32, 9.5);

  // ── MADDE 5 – Ücret ──────────────────────────────────────────────────────
  const m5y = 300;
  drawText(p1, bold, "Ücret", ML, m5y, 10);
  drawLine(p1, ML, m5y - 2, MR, m5y - 2);

  drawText(p1, regular, "MADDE 5- Şantiye şefine yapacağı işe karşılık, sözleşme süresince iş gerekleri, işyeri ve", ML, m5y - 18, 9.5);
  drawText(p1, regular, "çalışma şartlarına göre birinci yıl için brüt", ML, m5y - 32, 9.5);

  // Ücret field
  addField(form, p1, bold, "ucret", 295, m5y - 42, 90, 16, "40.000,00 TL", false, 9.5, 0);
  drawText(p1, regular, "aylık sözleşme ücreti ödenir.", 390, m5y - 32, 9.5);

  drawText(p1, regular, "Aylık sözleşme ücreti ilgili ayın son iş günü nakden ödenir.", ML, m5y - 48, 9.5);
  drawText(p1, regular, "Ertesi yıllarda, enflasyon oranı dikkate alınarak beher yıl için brüt ücret yeniden belirlenir.", ML, m5y - 62, 9.5);
  drawText(p1, regular, "Belirlenen bu ücret aylık sözleşme ücreti kabul edilir.", ML, m5y - 76, 9.5);
  drawText(p1, regular, "Şantiye şefine sözleşme ücreti dışında, görevi ile bu görevin iş gereklerine uygun olarak", ML, m5y - 90, 9.5);
  drawText(p1, regular, "verilen diğer görevler için, bu sözleşmede belirtilenlerin (yabancı dil tazminatı, ödül, fazla", ML, m5y - 104, 9.5);
  drawText(p1, regular, "çalışma ücreti, harcırah) dışında herhangi bir ad altında başka bir ödeme yapılmayacaktır.", ML, m5y - 118, 9.5);

  // ─────────────────────────── PAGE 2 ──────────────────────────────────────

  const p2 = pdfDoc.addPage([W, H]);

  // ── MADDE 6 – Çalışma Saat ve Süreleri ───────────────────────────────────
  const m6y = 790;
  drawText(p2, bold, "Çalışma Saat ve Süreleri", ML, m6y, 10);
  drawLine(p2, ML, m6y - 2, MR, m6y - 2);

  drawText(p2, regular, "MADDE 6- Şantiye şefi haftalık ve günlük çalışmanın şekli ve saatleri bakımından görevin ifa", ML, m6y - 18, 9.5);
  drawText(p2, regular, "edildiği işyeri için tespit edilen esas, usul, saat ve sürelere ve kendisine verilen görevleri", ML, m6y - 32, 9.5);
  drawText(p2, regular, "çalışma saat ve sürelerine bağlı kalmaksızın sonuçlandırmak zorundadır.", ML, m6y - 46, 9.5);

  // ── MADDE 7 – Sosyal Güvenlik ─────────────────────────────────────────────
  const m7y = 715;
  drawText(p2, bold, "Sosyal Güvenlik", ML, m7y, 10);
  drawLine(p2, ML, m7y - 2, MR, m7y - 2);

  drawText(p2, regular, "MADDE 7- Şantiye şefi sosyal güvenlik bakımından 506 sayılı Sosyal Sigortalar Kanununa", ML, m7y - 18, 9.5);
  drawText(p2, regular, "tabidir.", ML, m7y - 32, 9.5);

  // ── MADDE 8 – Çeşitli Hükümler ───────────────────────────────────────────
  const m8y = 655;
  drawText(p2, bold, "Çeşitli Hükümler", ML, m8y, 10);
  drawLine(p2, ML, m8y - 2, MR, m8y - 2);

  drawText(p2, regular, "MADDE 8- Bu Sözleşmede yer almayan hususlarda, öncelik sırası ile Sosyal Sigortalar", ML, m8y - 18, 9.5);
  drawText(p2, regular, "Kanunu, İş Kanunu, Borçlar Kanunu ve ilgili mevzuat hükümleri uygulanır. İş bu", ML, m8y - 32, 9.5);
  drawText(p2, regular, "sözleşme", ML, m8y - 46, 9.5);
  // Tarih field (inline)
  addField(form, p2, bold, "sozlesme_tarihi", 110, m8y - 56, 90, 16, "01.05.2026", false, 9.5, 0);
  drawText(p2, regular, "tarihinde,", 202, m8y - 46, 9.5);
  addField(form, p2, bold, "sozlesme_nushalari", 260, m8y - 56, 28, 16, "2", false, 9.5, 1);
  drawText(p2, regular, "nüsha olarak düzenlenmiştir.", 292, m8y - 46, 9.5);

  // ── İmza Alanları ─────────────────────────────────────────────────────────
  const sigY = 520;

  // Şantiye Şefi column (left)
  const leftX = ML;
  const leftColW = 190;
  drawText(p2, bold, "Şantiye Şefi (işçi)", leftX, sigY, 9.5);
  drawText(p2, regular, "Adı-Soyadı:", leftX, sigY - 18, 9.5);
  addField(form, p2, regular, "santiye_sefi_imza_adi", leftX, sigY - 48, leftColW, 18, "Hüseyin GÜNAYDIN", false, 9.5, 0);
  drawText(p2, regular, "İmza:", leftX, sigY - 68, 9.5);
  drawLine(p2, leftX + 38, sigY - 66, leftX + leftColW, sigY - 66);
  drawLine(p2, leftX + 38, sigY - 82, leftX + leftColW, sigY - 82);
  drawLine(p2, leftX + 38, sigY - 98, leftX + leftColW, sigY - 98);

  // Yapı Müteahhidi column (right)
  const rightX = MR - 200;
  const rightColW = 200;
  drawText(p2, bold, "Yapı Müteahhidi (işveren)", rightX, sigY, 9.5);
  drawText(p2, regular, "Adı-Soyadı veya Unvanı:", rightX, sigY - 18, 9.5);
  addField(form, p2, regular, "muteahhit_imza_unvan", rightX, sigY - 48, rightColW, 18, "ABC İNŞAAT", false, 9.5, 0);
  drawText(p2, regular, "İmza:", rightX, sigY - 68, 9.5);
  drawLine(p2, rightX + 38, sigY - 66, rightX + rightColW, sigY - 66);
  drawLine(p2, rightX + 38, sigY - 82, rightX + rightColW, sigY - 82);
  drawLine(p2, rightX + 38, sigY - 98, rightX + rightColW, sigY - 98);

  // ── Finalize ──────────────────────────────────────────────────────────────
  form.updateFieldAppearances(bold);
  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(process.cwd(), "public", "belgeler", "santiye-sefi-sozlesmesi.pdf");
  fs.writeFileSync(outPath, pdfBytes);
  console.log("✅ Şantiye Şefi Hizmet Sözleşmesi PDF şablonu oluşturuldu:", outPath);
}

main().catch((err) => {
  console.error("❌ Hata:", err);
  process.exit(1);
});
