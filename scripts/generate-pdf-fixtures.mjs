import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFName, PDFString, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const fixturesDir = path.join(rootDir, "tests", "fixtures", "pdf");
const manualDir = path.join(fixturesDir, "manual");

const A4_PORTRAIT = [595.28, 841.89];
const A3_LANDSCAPE = [1190.55, 841.89];

function getFontBytes() {
  const regularPath = path.join(rootDir, "public", "fonts", "Arial-Regular.ttf");
  const boldPath = path.join(rootDir, "public", "fonts", "Arial-Bold.ttf");
  if (!fs.existsSync(regularPath) || !fs.existsSync(boldPath)) {
    throw new Error(`Gerekli font dosyalari bulunamadi: ${regularPath} veya ${boldPath}`);
  }
  return {
    regularBytes: fs.readFileSync(regularPath),
    boldBytes: fs.readFileSync(boldPath),
  };
}

async function createBaseDoc() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const { regularBytes, boldBytes } = getFontBytes();
  const regular = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  return { doc, regular, bold };
}

// 1. tr-metin.pdf
async function generateTrMetin() {
  const { doc, regular, bold } = await createBaseDoc();

  // Page 1
  const p1 = doc.addPage(A4_PORTRAIT);
  let y = 790;
  p1.drawText("TÜRKÇE METİN VE VURGULAMA DOĞRULAMA BELGESİ", {
    x: 50,
    y,
    size: 15,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 25;
  p1.drawText("PDF Görüntüleyici v2 Test Dokümanı — Sayfa 1", {
    x: 50,
    y,
    size: 10,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  });

  y -= 35;
  const p1Lines1 = [
    "Bu teknik doküman, PDF görüntüleyici arama motorunun Türkçe karakter katlama",
    "ve vurgulama hassasiyetini doğrulamak amacıyla hazırlanmıştır.",
    "Bilimsel araştırma yöntemleri ve modern analiz araçları kullanılarak",
    "elde edilen bulgular, disiplinler arasında güçlü bir köprü kurar.",
    "Yapılan her yeni araştırma projesinde saha deneyleri ve laboratuvar ölçümleri",
    "titizlikle kaydedilmelidir.",
  ];
  const trWordBoxes = [];
  const targetWords = ["araştırma", "araçları", "arasında", "İSTANBUL", "ığdır", "Isparta", "İzmir", "ÇIĞ", "şeker", "ÖĞRENCİ"];

  function trackWords(line, startX, baselineY, fontSize, font, pageNum) {
    for (const tw of targetWords) {
      let searchPos = 0;
      while (searchPos < line.length) {
        const idx = line.indexOf(tw, searchPos);
        if (idx === -1) break;

        const before = line.substring(0, idx);
        const wordX = startX + font.widthOfTextAtSize(before, fontSize);
        const wordW = font.widthOfTextAtSize(tw, fontSize);
        const wordH = fontSize;

        trWordBoxes.push({
          word: tw,
          page: pageNum,
          pdfX: wordX,
          pdfY: baselineY,
          width: wordW,
          height: wordH,
        });

        searchPos = idx + tw.length;
      }
    }
  }

  for (const line of p1Lines1) {
    p1.drawText(line, { x: 50, y, size: 10.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    trackWords(line, 50, y, 10.5, regular, 1);
    y -= 18;
  }

  y -= 15;
  const p1Lines2 = [
    "Türkiye genelindeki şantiyeler arasında koordinasyon sağlanmaktadır.",
    "İSTANBUL Teknik Üniversitesi ile ortak yürütülen çalışmalar mevcuttur.",
    "Doğu Anadolu bölgesinde ığdır ve Isparta illerinde jeoteknik etütler gerçekleştirilmiş,",
    "İzmir Körfezi zemin yapısı taranmıştır.",
    "Yüksek rakımlı dağ geçitlerinde ÇIĞ riski modellenmiş, sanayi bölgelerinde",
    "şeker fabrikaları ile kimyasal tesisler denetlenmiştir.",
  ];
  for (const line of p1Lines2) {
    p1.drawText(line, { x: 50, y, size: 10.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    trackWords(line, 50, y, 10.5, regular, 1);
    y -= 18;
  }

  y -= 15;
  const p1Lines3 = [
    "Deprem kuşağında bulunan ÖĞRENCİ yurtları ve kamu binalarında yapı denetim süreçleri",
    "tavizsiz uygulanmalıdır.",
    "ÖĞRENCİ güvenliği birinci öncelik olup araştırma heyeti tarafından hazırlanan",
    "raporlar yetkili mercilere sunulmuştur.",
    "Sonuç olarak araştırma araçları ve mühendislik hesapları düzenli olarak doğrulanmalıdır.",
    "Her yeni araştırma aşaması kalite kontrol döngüsüne dâhildir.",
  ];
  for (const line of p1Lines3) {
    p1.drawText(line, { x: 50, y, size: 10.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    trackWords(line, 50, y, 10.5, regular, 1);
    y -= 18;
  }

  // Page 2
  const p2 = doc.addPage(A4_PORTRAIT);
  y = 790;
  p2.drawText("Sayfa 2 — Ek Araştırma Bulguları", {
    x: 50,
    y,
    size: 14,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  trackWords("Sayfa 2 — Ek Araştırma Bulguları", 50, y, 14, bold, 2);

  y -= 30;
  const p2Lines = [
    "İkinci sayfada devam eden araştırma faaliyetleri ve ölçüm araçları hakkında",
    "detaylı tablolar bulunmaktadır.",
    "ÖĞRENCİ komiteleri ile paylaşılan araştırma verileri şeffaf biçimde yayımlanmaktadır.",
    "Laboratuvar testleri ve numune analizleri standartlara uygundur.",
  ];
  for (const line of p2Lines) {
    p2.drawText(line, { x: 50, y, size: 10.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    trackWords(line, 50, y, 10.5, regular, 2);
    y -= 18;
  }

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "tr-metin.pdf"), bytes);
  return trWordBoxes;
}

// 2. satir-sonu-tire.pdf
async function generateSatirSonuTire() {
  const { doc, regular, bold } = await createBaseDoc();
  const page = doc.addPage(A4_PORTRAIT);

  let y = 790;
  page.drawText("Satır Sonu Tire Bölünmesi Test Belgesi", {
    x: 50,
    y,
    size: 15,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 35;
  const lines = [
    { text: "Mühendislik ve mimarlık projelerinde yürütülen kapsamlı araştır-", hyphen: true },
    { text: "ma faaliyetleri kesintisiz olarak devam etmektedir.", hyphen: false },
    { text: "", hyphen: false },
    { text: "Bölgesel zemin incelemeleri ve sismik risk değerlen-", hyphen: true },
    { text: "dirme raporları uzman heyetçe onaylanmıştır.", hyphen: false },
    { text: "", hyphen: false },
    { text: "Taşıyıcı sistem elemanlarının dayanımı üzerine yapılan karşılaş-", hyphen: true },
    { text: "tırma analizleri tamamlanmıştır.", hyphen: false },
  ];

  for (const line of lines) {
    if (line.text) {
      page.drawText(line.text, { x: 50, y, size: 11, font: regular, color: rgb(0.15, 0.15, 0.15) });
    }
    y -= 20;
  }

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "satir-sonu-tire.pdf"), bytes);
}

// 3. iki-kolon.pdf
async function generateIkiKolon() {
  const { doc, regular, bold } = await createBaseDoc();
  const page = doc.addPage(A4_PORTRAIT);

  page.drawText("İki Kolonlu Metin Düzeni Testi", {
    x: 50,
    y: 800,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Sol Kolon (x: 50, width: 230)
  let yLeft = 755;
  page.drawText("Sol Kolon — Kuramsal Çerçeve", {
    x: 50,
    y: yLeft,
    size: 12,
    font: bold,
    color: rgb(0.2, 0.2, 0.2),
  });
  yLeft -= 22;

  const leftLines = [
    "Sol kolonun ilk satırında araştırma hedefleri özetlenir.",
    "Metin akışı yukarıdan aşağıya doğru devam eder.",
    "İkinci paragrafta zemin mekaniği modelleri ele alınır.",
    "Hesaplamalarda elastisite modülü baz alınmaktadır.",
    "Sütun sınırları içindeki metin blokları düzenlidir.",
    "Statik yük dağılımları kolon genişliğine sığdırılmıştır.",
    "Sol kolonun son satırında bir diğer araştırma notu bulunur.",
  ];
  for (const line of leftLines) {
    page.drawText(line, { x: 50, y: yLeft, size: 9.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    yLeft -= 18;
  }

  // Sağ Kolon (x: 320, width: 230)
  let yRight = 755;
  page.drawText("Sağ Kolon — Uygulama ve Saha", {
    x: 320,
    y: yRight,
    size: 12,
    font: bold,
    color: rgb(0.2, 0.2, 0.2),
  });
  yRight -= 22;

  const rightLines = [
    "Sağ kolonda deneysel yöntemler açıklanmaktadır.",
    "Saha ölçümleri sağ sütun boyunca listelenmiştir.",
    "Okuma sırası sol sütundan sonra sağ sütuna geçmelidir.",
    "Sensör verileri sismik ivmeleri kaydetmiştir.",
    "Laboratuvar ortamında paralel araştırma yürütülmüştür.",
    "İki kolonlu okuma sırasında span sıçraması engellenmelidir.",
    "Sağ kolonun kapanış değerlendirmesi buradadır.",
  ];
  for (const line of rightLines) {
    page.drawText(line, { x: 320, y: yRight, size: 9.5, font: regular, color: rgb(0.15, 0.15, 0.15) });
    yRight -= 18;
  }

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "iki-kolon.pdf"), bytes);
}

// 4. dondurulmus-90.pdf
async function generateDondurulmus90() {
  const { doc, regular, bold } = await createBaseDoc();
  const page = doc.addPage(A4_PORTRAIT);
  page.setRotation(degrees(90));

  page.drawText("90 Derece Döndürülmüş Pafta Başlığı", {
    x: 100,
    y: 700,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText("Bu sayfa 90 derece saat yönünde döndürülmüş bir sayfadır.", {
    x: 100,
    y: 665,
    size: 11.5,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawText("Döndürülmüş görünümde metin seçimi ve araştırma vurgularının doğru konumlanması gerekir.", {
    x: 100,
    y: 635,
    size: 11,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawText("Sayfa dönüş parametresi: Rotate = 90 derece.", {
    x: 100,
    y: 605,
    size: 10,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  });

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "dondurulmus-90.pdf"), bytes);
}

// 5. karisik-boyut.pdf
async function generateKarisikBoyut() {
  const { doc, regular, bold } = await createBaseDoc();

  // Page 1: A4 Dikey
  const p1 = doc.addPage(A4_PORTRAIT);
  p1.drawText("Sayfa 1: Standart A4 Dikey Belge (595.28 × 841.89 pt)", {
    x: 50,
    y: 780,
    size: 15,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  p1.drawText("Bu sayfa dikey A4 boyutundadır. Sayfa oranları normal portre düzenindedir.", {
    x: 50,
    y: 745,
    size: 11,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });
  p1.drawText("İlk sayfadaki araştırma metni ve genel parametreler.", {
    x: 50,
    y: 715,
    size: 11,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });

  // Page 2: A3 Yatay
  const p2 = doc.addPage(A3_LANDSCAPE);
  p2.drawText("Sayfa 2: A3 Yatay Mimari Çizim Paftası (1190.55 × 841.89 pt)", {
    x: 80,
    y: 780,
    size: 17,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  p2.drawText("Bu sayfa geniş A3 yatay pafta boyutundadır. Genişlik standart A4'ün iki katıdır.", {
    x: 80,
    y: 740,
    size: 12,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });
  p2.drawText("Geniş pafta içi araştırma detayları, kolon aplikasyon planı ve lejant açıklamaları.", {
    x: 80,
    y: 705,
    size: 12,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });

  // Page 3: A4 Dikey
  const p3 = doc.addPage(A4_PORTRAIT);
  p3.drawText("Sayfa 3: Standart A4 Dikey Sonuç Raporu (595.28 × 841.89 pt)", {
    x: 50,
    y: 780,
    size: 15,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  p3.drawText("Bu sayfa tekrar dikey A4 boyutuna dönmektedir. Scroll ve yerleşim hesapları test edilir.", {
    x: 50,
    y: 745,
    size: 11,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });
  p3.drawText("Karışık boyutlu sayfalar arasında kaydırma sırasında zıplama ve kayma olmamalıdır.", {
    x: 50,
    y: 715,
    size: 11,
    font: regular,
    color: rgb(0.15, 0.15, 0.15),
  });

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "karisik-boyut.pdf"), bytes);
}

// 6. uzun-300.pdf
async function generateUzun300() {
  const { doc, regular, bold } = await createBaseDoc();

  for (let i = 1; i <= 300; i++) {
    const page = doc.addPage(A4_PORTRAIT);
    page.drawText(`Sayfa ${i} / 300`, {
      x: 50,
      y: 800,
      size: 14,
      font: bold,
      color: rgb(0.2, 0.2, 0.2),
    });

    if (i === 1) {
      page.drawText("Uzun 300 Sayfalık Test Dokümanı — Başlangıç Sayfası", {
        x: 50,
        y: 760,
        size: 12,
        font: regular,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (i === 150) {
      page.drawText("Orta Kontrol Noktası — Sayfa 150", {
        x: 50,
        y: 760,
        size: 12,
        font: regular,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (i === 250) {
      page.drawText("Hızlı Kaydırma Hedefi — Sayfa 250", {
        x: 50,
        y: 760,
        size: 12,
        font: regular,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else if (i === 300) {
      page.drawText("Son Sayfa — Sayfa 300 (Bitiş)", {
        x: 50,
        y: 760,
        size: 12,
        font: regular,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  }

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "uzun-300.pdf"), bytes);
}

// 7. linkli.pdf
async function generateLinkli() {
  const { doc, regular, bold } = await createBaseDoc();

  const p1 = doc.addPage(A4_PORTRAIT);
  const p2 = doc.addPage(A4_PORTRAIT);
  const p3 = doc.addPage(A4_PORTRAIT);

  // Page 1: İçindekiler ve linkler
  p1.drawText("Bağlantılı ve İçindekiler Yapılı Test Belgesi", {
    x: 50,
    y: 790,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  p1.drawText("Aşağıdaki bağlantılar iç sayfalara ve harici adrese yönlendirir:", {
    x: 50,
    y: 755,
    size: 11,
    font: regular,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Link 1 -> Page 2
  p1.drawText("• Bölüm 1'e Git (Sayfa 2)", {
    x: 50,
    y: 720,
    size: 11.5,
    font: bold,
    color: rgb(0.1, 0.4, 0.8),
  });
  const linkP2 = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [50, 715, 250, 735],
    Border: [0, 0, 0],
    Dest: [p2.ref, PDFName.of("XYZ"), null, null, null],
  });
  const linkP2Ref = doc.context.register(linkP2);

  // Link 2 -> Page 3
  p1.drawText("• Bölüm 2'ye Git (Sayfa 3)", {
    x: 50,
    y: 685,
    size: 11.5,
    font: bold,
    color: rgb(0.1, 0.4, 0.8),
  });
  const linkP3 = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [50, 680, 250, 700],
    Border: [0, 0, 0],
    Dest: [p3.ref, PDFName.of("XYZ"), null, null, null],
  });
  const linkP3Ref = doc.context.register(linkP3);

  // Link 3 -> Harici URI
  p1.drawText("• Harici Web Sitesi (https://example.com/muhendislik)", {
    x: 50,
    y: 650,
    size: 11.5,
    font: bold,
    color: rgb(0.1, 0.4, 0.8),
  });
  const linkExt = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [50, 645, 380, 665],
    Border: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of("https://example.com/muhendislik"),
    },
  });
  const linkExtRef = doc.context.register(linkExt);

  p1.node.set(PDFName.of("Annots"), doc.context.obj([linkP2Ref, linkP3Ref, linkExtRef]));

  // Page 2: Bölüm 1
  p2.drawText("Bölüm 1 — Yapısal Analizler (Sayfa 2)", {
    x: 50,
    y: 790,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  p2.drawText("Bu sayfada statik ve betonarme hesap raporları yer almaktadır.", {
    x: 50,
    y: 750,
    size: 11,
    font: regular,
    color: rgb(0.2, 0.2, 0.2),
  });
  p2.drawText("← İçindekilere Geri Dön (Sayfa 1)", {
    x: 50,
    y: 705,
    size: 11,
    font: bold,
    color: rgb(0.1, 0.4, 0.8),
  });
  const backFromP2 = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [50, 700, 250, 720],
    Border: [0, 0, 0],
    Dest: [p1.ref, PDFName.of("XYZ"), null, null, null],
  });
  p2.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(backFromP2)]));

  // Page 3: Bölüm 2
  p3.drawText("Bölüm 2 — Dinamik Simülasyonlar (Sayfa 3)", {
    x: 50,
    y: 790,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  p3.drawText("Bu sayfada zaman tanım alanında sismik analiz sonuçları yer almaktadır.", {
    x: 50,
    y: 750,
    size: 11,
    font: regular,
    color: rgb(0.2, 0.2, 0.2),
  });
  p3.drawText("← İçindekilere Geri Dön (Sayfa 1)", {
    x: 50,
    y: 705,
    size: 11,
    font: bold,
    color: rgb(0.1, 0.4, 0.8),
  });
  const backFromP3 = doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [50, 700, 250, 720],
    Border: [0, 0, 0],
    Dest: [p1.ref, PDFName.of("XYZ"), null, null, null],
  });
  p3.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(backFromP3)]));

  // Outlines (Bookmarks)
  const outlineRootRef = doc.context.nextRef();
  const item1Ref = doc.context.nextRef();
  const item2Ref = doc.context.nextRef();
  const item3Ref = doc.context.nextRef();

  const outlineRoot = doc.context.obj({
    Type: "Outlines",
    First: item1Ref,
    Last: item3Ref,
    Count: 3,
  });
  doc.context.assign(outlineRootRef, outlineRoot);
  doc.catalog.set(PDFName.of("Outlines"), outlineRootRef);

  const item1 = doc.context.obj({
    Title: PDFString.of("İçindekiler"),
    Parent: outlineRootRef,
    Next: item2Ref,
    Dest: [p1.ref, PDFName.of("XYZ"), null, null, null],
  });
  doc.context.assign(item1Ref, item1);

  const item2 = doc.context.obj({
    Title: PDFString.of("Bölüm 1 — Yapısal Analizler"),
    Parent: outlineRootRef,
    Prev: item1Ref,
    Next: item3Ref,
    Dest: [p2.ref, PDFName.of("XYZ"), null, null, null],
  });
  doc.context.assign(item2Ref, item2);

  const item3 = doc.context.obj({
    Title: PDFString.of("Bölüm 2 — Dinamik Simülasyonlar"),
    Parent: outlineRootRef,
    Prev: item2Ref,
    Dest: [p3.ref, PDFName.of("XYZ"), null, null, null],
  });
  doc.context.assign(item3Ref, item3);

  const bytes = await doc.save();
  fs.writeFileSync(path.join(fixturesDir, "linkli.pdf"), bytes);
}

function writeManifest(trWordBoxes = []) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    generator: "scripts/generate-pdf-fixtures.mjs",
    fixtures: {
      "tr-metin.pdf": {
        description: "Türkçe karakter ve arama vurgu hizalama test belgesi",
        pageCount: 2,
        words: {
          "araştırma": { total: 8, page1: 6, page2: 2 },
          "araçları": { total: 3, page1: 2, page2: 1 },
          "arasında": { total: 2, page1: 2, page2: 0 },
          "İSTANBUL": { total: 1, page1: 1, page2: 0 },
          "ığdır": { total: 1, page1: 1, page2: 0 },
          "Isparta": { total: 1, page1: 1, page2: 0 },
          "İzmir": { total: 1, page1: 1, page2: 0 },
          "ÇIĞ": { total: 1, page1: 1, page2: 0 },
          "şeker": { total: 1, page1: 1, page2: 0 },
          "ÖĞRENCİ": { total: 3, page1: 2, page2: 1 },
        },
        groundTruthBoxes: trWordBoxes,
      },
      "satir-sonu-tire.pdf": {
        description: "Satır sonunda kelime bölünmesi (tireleme) test belgesi",
        pageCount: 1,
        hyphenatedPairs: [
          { part1: "araştır-", part2: "ma", combined: "araştırma" },
          { part1: "değerlen-", part2: "dirme", combined: "değerlendirme" },
          { part1: "karşılaş-", part2: "tırma", combined: "karşılaştırma" },
        ],
      },
      "iki-kolon.pdf": {
        description: "İki kolonlu paralel metin akışı test belgesi",
        pageCount: 1,
        columns: 2,
      },
      "dondurulmus-90.pdf": {
        description: "Rotate=90 derece döndürülmüş sayfa test belgesi",
        pageCount: 1,
        rotation: 90,
      },
      "karisik-boyut.pdf": {
        description: "Farklı sayfa boyutları içeren test belgesi (A4 Dikey + A3 Yatay + A4 Dikey)",
        pageCount: 3,
        pages: [
          { page: 1, width: 595.28, height: 841.89, format: "A4 Dikey" },
          { page: 2, width: 1190.55, height: 841.89, format: "A3 Yatay" },
          { page: 3, width: 595.28, height: 841.89, format: "A4 Dikey" },
        ],
      },
      "uzun-300.pdf": {
        description: "300 sayfalık hafif bellek ve pencereleme test belgesi",
        pageCount: 300,
        checkpointPages: [1, 150, 250, 300],
      },
      "linkli.pdf": {
        description: "İç bağlantı, dış bağlantı ve outline yer imi hiyerarşisi içeren test belgesi",
        pageCount: 3,
        outlines: ["İçindekiler", "Bölüm 1 — Yapısal Analizler", "Bölüm 2 — Dinamik Simülasyonlar"],
        externalLinks: ["https://example.com/muhendislik"],
      },
    },
    manualCorpusDir: "tests/fixtures/pdf/manual",
  };

  fs.writeFileSync(
    path.join(fixturesDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );
}

function writeManualReadme() {
  if (!fs.existsSync(manualDir)) {
    fs.mkdirSync(manualDir, { recursive: true });
  }

  const manualReadmeContent = `# Manuel Test PDF Fixture Deposu

Bu dizin, telif hakkı, dosya boyutu (50 MB+) veya özel üretim gerektiren dosyalardan oluşur.
Dosyalar **repoya commit edilmez** (\`.gitignore\` kapsamındadır).

## Beklenen Manuel Fixture Dosyaları:

1. \`taranmis-metinsiz.pdf\`
   - Metin katmanı (TextLayer) olmayan, yalnızca raster taranmış görüntüler içeren PDF.
   - Test amacı: Arama motorunun "Bu PDF taranmış görüntü içeriyor, metin araması yapılamaz." uyarısını doğru vermesini doğrulamak.

2. \`sifreli.pdf\`
   - Kullanıcı parolasıyla kilitlenmiş PDF (\`onPassword\` akışı doğrulaması için).
   - Test amacı: Parola iletişim kutusunun açılması, yanlış parolada hata verilmesi ve doğru parola girildiğinde belgenin açılması.

3. \`buyuk-mimari-50mb.pdf\`
   - 50 MB üzeri boyuta sahip, çok sayıda vektörel ve raster katman içeren gerçek mimari/mühendislik paftası.
   - Test amacı: Range (HTTP 206) istekleri, ilk sayfa yükleme hızı ve bellek tüketimi bütçesini doğrulamak.

4. \`bozuk-kesik.pdf\`
   - Bayt dizisinin ortasında kesilmiş veya xref tablosu bozulmuş geçersiz PDF.
   - Test amacı: \`InvalidPDFException\` yakalanıp temiz hata ekranı ve "İndir" butonunun sunulması (sonsuz retry olmamalı).
`;

  fs.writeFileSync(path.join(manualDir, "README.md"), manualReadmeContent, "utf-8");
}

async function main() {
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  writeManualReadme();

  console.log("PDF fixture'ları üretiliyor...");
  const trWordBoxes = await generateTrMetin();
  console.log("  ✓ tr-metin.pdf üretildi");

  await generateSatirSonuTire();
  console.log("  ✓ satir-sonu-tire.pdf üretildi");

  await generateIkiKolon();
  console.log("  ✓ iki-kolon.pdf üretildi");

  await generateDondurulmus90();
  console.log("  ✓ dondurulmus-90.pdf üretildi");

  await generateKarisikBoyut();
  console.log("  ✓ karisik-boyut.pdf üretildi");

  await generateUzun300();
  console.log("  ✓ uzun-300.pdf üretildi");

  await generateLinkli();
  console.log("  ✓ linkli.pdf üretildi");

  writeManifest(trWordBoxes);
  console.log("  ✓ manifest.json yazıldı");
  console.log("Tüm PDF fixture'ları başarıyla oluşturuldu.");
}

main().catch((err) => {
  console.error("Fixture üretimi sırasında hata:", err);
  process.exit(1);
});
