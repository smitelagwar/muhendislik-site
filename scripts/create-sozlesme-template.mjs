/**
 * Builds the editable two-page Şantiye Şefliği Hizmet Sözleşmesi PDF.
 * Coordinates use pdf-lib's bottom-left origin.
 * Run: node scripts/create-sozlesme-template.mjs
 */

import { PDFDict, PDFDocument, PDFName, PDFNumber, PDFString, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

const W = 595.28;
const H = 841.89;
const ML = 57;
const MR = 538;
const BODY = 9.5;
const SECTION = 10;
const TITLE = 13;
const LH = 14;

function text(page, font, value, x, y, size = BODY) {
  page.drawText(value, { x, y, size, font, color: rgb(0, 0, 0) });
}

function section(page, bold, label, y) {
  text(page, bold, label, ML, y, SECTION);
  page.drawLine({
    start: { x: ML, y: y - 3 },
    end: { x: MR, y: y - 3 },
    thickness: 0.45,
    color: rgb(0.15, 0.15, 0.15),
  });
  return y - 19;
}

function field(form, page, font, name, value, x, baseline, width, options = {}) {
  const { size = BODY, align = 0 } = options;
  const height = size + 4;
  const tf = form.createTextField(name);
  tf.addToPage(page, {
    x,
    y: baseline - 2,
    width,
    height,
    borderWidth: 0,
    backgroundColor: undefined,
    font,
  });
  const da = PDFString.of(`/${font.name} ${size} Tf 0 0 0 rg`);
  tf.acroField.dict.set(PDFName.of("DA"), da);
  tf.acroField.dict.set(PDFName.of("Q"), PDFNumber.of(align));
  tf.acroField.dict.delete(PDFName.of("DV"));
  tf.setText(value);
  tf.acroField.dict.delete(PDFName.of("DV"));
  for (const widget of tf.acroField.getWidgets()) {
    widget.dict.delete(PDFName.of("DV"));
    widget.dict.set(PDFName.of("DA"), da);
    widget.dict.set(PDFName.of("Q"), PDFNumber.of(align));
    widget.dict.delete(PDFName.of("Border"));
    const appearance = widget.dict.lookup(PDFName.of("MK"), PDFDict);
    appearance.delete(PDFName.of("BC"));
    appearance.delete(PDFName.of("BG"));
  }
  tf.updateAppearances(font);
  return x + width;
}

function staticWidth(font, value, size = BODY) {
  return font.widthOfTextAtSize(value, size);
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const boldBytes = fs.readFileSync(path.join(publicDir, "fonts", "Arial-Bold.ttf"));
  const regularBytes = fs.readFileSync(path.join(publicDir, "fonts", "Arial-Regular.ttf"));

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(regularBytes, { subset: false });
  const bold = await pdf.embedFont(boldBytes, { subset: false });
  const form = pdf.getForm();

  const p1 = pdf.addPage([W, H]);
  const title = "ŞANTİYE ŞEFLİĞİ HİZMET SÖZLEŞMESİ";
  text(p1, bold, title, (W - staticWidth(bold, title, TITLE)) / 2, 800, TITLE);

  let y = section(p1, bold, "Taraflar", 758);
  const m1Prefix = "MADDE 1- ";
  text(p1, regular, m1Prefix, ML, y);
  let x = ML + staticWidth(regular, m1Prefix);
  x = field(form, p1, bold, "muteahhit_unvan", "ABC İNŞAAT", x, y, 160, { size: 8.5, align: 1 });
  text(p1, regular, " isimli/unvanlı Yapı Müteahhidi ile", x + 2, y);
  y -= LH;
  const chiefPrefix = "Şantiye Şefi olarak ";
  text(p1, regular, chiefPrefix, ML, y);
  x = ML + staticWidth(regular, chiefPrefix);
  x = field(form, p1, bold, "santiye_sefi_ad", "HÜSEYİN GÜNAYDIN", x, y, 145, { size: 8.5, align: 1 });
  text(p1, regular, " arasında aşağıdaki şartlarla bir sözleşme düzenlenmiştir.", x + 2, y);
  y -= LH;
  text(p1, regular, "Bu sözleşmede taraflar Yapı Müteahhidi ile Şantiye Şefi olarak anılacaktır.", ML, y);

  y = section(p1, bold, "İşyeri", y - 25);
  const m2Prefix = "MADDE 2- Şantiye şefinin işyeri ";
  text(p1, regular, m2Prefix, ML, y);
  x = ML + staticWidth(regular, m2Prefix);
  x = field(form, p1, bold, "il", "YOZGAT", x, y, 55, { align: 1 });
  text(p1, regular, " ili, ", x, y);
  x += staticWidth(regular, " ili, ");
  x = field(form, p1, bold, "ilce", "AKDAĞMADENİ", x, y, 89, { align: 1 });
  text(p1, regular, " ilçesi,", x, y);
  y -= LH;

  x = field(form, p1, regular, "adres", "-", ML, y, 170, { size: 7.5, align: 1 });
  text(p1, regular, " adresindeki, ", x, y);
  x += staticWidth(regular, " adresindeki, ");
  x = field(form, p1, regular, "yibf", "-", x, y, 62, { align: 1 });
  text(p1, regular, " YİBF nolu, tapunun ", x, y);
  x += staticWidth(regular, " YİBF nolu, tapunun ");
  x = field(form, p1, regular, "pafta", "-", x, y, 35, { align: 1 });
  text(p1, regular, " pafta,", x, y);
  y -= LH;

  x = field(form, p1, bold, "mahalle", "EMEK MAHALLESİ", ML, y, 170, { size: 7.8, align: 1 });
  text(p1, regular, ", ", x, y);
  x += staticWidth(regular, ", ");
  x = field(form, p1, bold, "ada", "666", x, y, 38, { align: 1 });
  text(p1, regular, " ada, ", x, y);
  x += staticWidth(regular, " ada, ");
  x = field(form, p1, bold, "parsel", "66", x, y, 38, { align: 1 });
  text(p1, regular, " parsel numarasıyla kayıtlı olan ve", x, y);
  y -= LH;
  text(p1, regular, "ilgili idareden alınan yapı ruhsatı ve eklerine göre inşa edilecek yapıdır.", ML, y);

  y = section(p1, bold, "Görev ve Yükümlülükleri", y - 24);
  const m3Lines = [
    "MADDE 3- Şantiye şefi; yapıyı yapı denetim kuruluşunun teknik konulardaki talimatlarına",
    "uygun olarak yönetmek ve inşa ettirmekle yükümlüdür. Şantiye şefi, yapılacak",
    "denetimler için hazırlık yaparak yapı denetim kuruluşuna bildirmek, yapı denetiminde",
    "bizzat bulunarak denetime ilişkin tutanak ve belgeleri imzalamak, yapı denetimine",
    "mani olanlar varsa bunları öncelikle yapı denetim kuruluşuna, yapı denetim kuruluşunca",
    "denetimin sağlanamaması halinde Yapı Denetim Komisyonuna bildirmek zorundadır.",
    "",
    "Bunun yanında şantiye şefi; görevinin gerektirdiği işler ile verilecek diğer görevleri,",
    "öncelik sırası ile yürürlükteki Yapı Denetimi Hakkında Kanuna, İmar Kanunu, imar planı,",
    "yönetmelik, ruhsat ve ekleri, standart, şartname, fen ve sanat kuralları ile ilgili idare,",
    "yapı denetim kuruluşu ve yapı müteahhidinin talimatlarına uygun olarak yapmayı",
    "taahhüt eder ve bu hizmetleri karşılığında 5 inci maddede belirtilen aylık sözleşme",
    "ücretini alır.",
  ];
  for (const line of m3Lines) {
    if (line) text(p1, regular, line, ML, y);
    y -= LH;
  }

  y = section(p1, bold, "Sözleşme Süresi", y - 8);
  text(p1, regular, "MADDE 4- Sözleşme süresi, inşa edilecek yapının ruhsat tarihi ile yapı kullanma izni tarihi", ML, y);
  y -= LH;
  text(p1, regular, "arasında geçen süredir.", ML, y);

  y = section(p1, bold, "Ücret", y - 24);
  text(p1, regular, "MADDE 5- Şantiye şefine yapacağı işe karşılık, sözleşme süresince iş gerekleri, işyeri ve", ML, y);
  y -= LH;
  const feePrefix = "çalışma şartlarına göre birinci yıl için brüt ";
  text(p1, regular, feePrefix, ML, y);
  x = ML + staticWidth(regular, feePrefix);
  x = field(form, p1, bold, "ucret", "40.000,00 TL", x, y, 84, { align: 1 });
  text(p1, regular, " aylık sözleşme ücreti ödenir.", x, y);
  y -= LH;
  text(p1, regular, "Aylık sözleşme ücreti ilgili ayın son iş günü nakden ödenir.", ML, y);
  y -= LH * 2;
  text(p1, regular, "Ertesi yıllarda, enflasyon oranı dikkate alınarak beher yıl için brüt ücret yeniden belirlenir.", ML, y);
  y -= LH;
  text(p1, regular, "Belirlenen bu ücret aylık sözleşme ücreti kabul edilir.", ML, y);
  y -= LH * 2;
  text(p1, regular, "Şantiye şefine sözleşme ücreti dışında, görevi ile bu görevin iş gereklerine uygun olarak", ML, y);
  y -= LH;
  text(p1, regular, "verilen diğer görevler için, bu sözleşmede belirtilenlerin (yabancı dil tazminatı, ödül, fazla", ML, y);
  y -= LH;
  text(p1, regular, "çalışma ücreti, harcırah) dışında herhangi bir ad altında", ML, y);

  const p2 = pdf.addPage([W, H]);
  y = 800;
  text(p2, regular, "başka bir ödeme yapılmayacaktır.", ML, y);

  y = section(p2, bold, "Çalışma Saat ve Süreleri", y - 27);
  text(p2, regular, "MADDE 6- Şantiye şefi haftalık ve günlük çalışmanın şekli ve saatleri bakımından görevin ifa", ML, y);
  y -= LH;
  text(p2, regular, "edildiği işyeri için tespit edilen esas, usul, saat ve sürelere ve kendisine verilen görevleri", ML, y);
  y -= LH;
  text(p2, regular, "çalışma saat ve sürelerine bağlı kalmaksızın sonuçlandırmak zorundadır.", ML, y);

  y = section(p2, bold, "Sosyal Güvenlik", y - 25);
  text(p2, regular, "MADDE 7- Şantiye şefi sosyal güvenlik bakımından 506 sayılı Sosyal Sigortalar Kanununa", ML, y);
  y -= LH;
  text(p2, regular, "tabidir.", ML, y);

  y = section(p2, bold, "Çeşitli Hükümler", y - 25);
  text(p2, regular, "MADDE 8- Bu Sözleşmede yer almayan hususlarda, öncelik sırası ile Sosyal Sigortalar", ML, y);
  y -= LH;
  text(p2, regular, "Kanunu, İş Kanunu, Borçlar Kanunu ve ilgili mevzuat hükümleri uygulanır. İş bu", ML, y);
  y -= LH;
  text(p2, regular, "sözleşme ", ML, y);
  x = ML + staticWidth(regular, "sözleşme ");
  x = field(form, p2, bold, "sozlesme_tarihi", "01.05.2026", x, y, 72, { align: 1 });
  text(p2, regular, " tarihinde, ", x, y);
  x += staticWidth(regular, " tarihinde, ");
  text(p2, bold, "2", x, y);
  x += staticWidth(bold, "2");
  text(p2, regular, " nüsha olarak düzenlenmiştir.", x, y);

  const leftCenter = 176;
  const rightCenter = 419;
  const signatureTop = y - 64;
  const leftHeading = "Şantiye Şefi (işçi)";
  const rightHeading = "Yapı Müteahhidi (işveren)";
  text(p2, bold, leftHeading, leftCenter - staticWidth(bold, leftHeading) / 2, signatureTop);
  text(p2, bold, rightHeading, rightCenter - staticWidth(bold, rightHeading) / 2, signatureTop);
  text(p2, regular, "Adı-Soyadı", leftCenter - staticWidth(regular, "Adı-Soyadı") / 2, signatureTop - 18);
  text(p2, regular, "Adı-Soyadı veya Unvanı", rightCenter - staticWidth(regular, "Adı-Soyadı veya Unvanı") / 2, signatureTop - 18);
  field(form, p2, regular, "santiye_sefi_imza_adi", "Hüseyin GÜNAYDIN", leftCenter - 88, signatureTop - 42, 176, { size: 8.2, align: 1 });
  field(form, p2, regular, "muteahhit_imza_unvan", "ABC İNŞAAT", rightCenter - 88, signatureTop - 42, 176, { size: 8.2, align: 1 });
  text(p2, regular, "İmza", leftCenter - staticWidth(regular, "İmza") / 2, signatureTop - 66);
  text(p2, regular, "İmza", rightCenter - staticWidth(regular, "İmza") / 2, signatureTop - 66);

  form.acroForm.dict.set(PDFName.of("NeedAppearances"), PDFName.of("false"));
  pdf.setTitle("Şantiye Şefliği Hizmet Sözleşmesi");
  pdf.setSubject("Düzenlenebilir şantiye şefliği hizmet sözleşmesi");
  pdf.setCreator("muhendislik-site");
  pdf.setProducer("pdf-lib");

  const out = path.join(publicDir, "belgeler", "santiye-sefi-sozlesmesi.pdf");
  fs.writeFileSync(out, await pdf.save({ useObjectStreams: false }));
  console.log(`Created ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
