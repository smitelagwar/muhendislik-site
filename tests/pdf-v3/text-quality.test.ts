import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function runTextQualityTests() {
  console.log("=== FAZ R1: Metin Kalitesi ve Değişmez Testleri (I7, I8) ===\n");

  const fixturePath = path.resolve("tests/fixtures/pdf/manual/Copilot - korelasyon.pdf");
  if (!fs.existsSync(fixturePath)) {
    console.warn("[SKIP] 'Copilot - korelasyon.pdf' dosyası bulunamadı. Test atlandı.");
    return;
  }

  const data = new Uint8Array(fs.readFileSync(fixturePath));
  const doc = await getDocument({
    data,
    standardFontDataUrl: path.resolve("public/vendor/pdfjs/standard_fonts") + "/",
  }).promise;

  let totalChars = 0;
  let gCount = 0;
  let iCount = 0;
  const page1 = await doc.getPage(1);
  const textContent = await page1.getTextContent();
  const page1String = textContent.items
    .map((item: any) => ("str" in item ? item.str : ""))
    .join(" ");

  for (let pageNum = 1; pageNum <= Math.min(doc.numPages, 3); pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string") {
        for (const char of item.str) {
          totalChars++;
          if (char === "\u011c") gCount++; // Ĝ
          if (char === "i") iCount++;
        }
      }
    }
  }

  const gRatio = totalChars > 0 ? (gCount / totalChars) * 100 : 0;
  const iRatio = totalChars > 0 ? (iCount / totalChars) * 100 : 0;

  console.log(`İlk 3 sayfa analizi: Toplam karakter: ${totalChars}, Ĝ: ${gCount} (%${gRatio.toFixed(2)}), i: ${iCount} (%${iRatio.toFixed(2)})`);

  // I7: Bozuk ToUnicode Eşlemesi İmzası Tespiti
  const isBrokenMapping = gRatio >= 1.0 && iRatio < 0.5;
  console.log(`[I7 Tespiti] Bozuk Harf Eşlemesi İmzası Saptandı mı? ${isBrokenMapping ? "EVET (Bozuk Belge)" : "HAYIR"}`);
  assert.ok(isBrokenMapping, "Copilot - korelasyon.pdf bozuk ToUnicode imzası taşımalıdır (Ĝ >= %1 ve i < %0.5)");

  // Kabul Kriteri: Henüz onarım modülü (Faz R3) yazılmadığı için metin ham PDF'ten 'ĜlĜşkĜnĜn' olarak çıkar.
  // Bu test HEAD'de kırık olmalı (KIRMIZI) ve R3 uygulandığında YEŞİL olmalıdır!
  console.log("\n[TEST: Doğru Çıkarılmış Metin ve Kopyalama Kalitesi]");
  console.log(`Sayfa 1 örnek metin kesiti: "${page1String.slice(0, 120)}..."`);

  // Assert expected repaired text
  assert.ok(
    page1String.includes("ilişkinin"),
    `HATA (H4/H5 Regresyonu): Metin 'ilişkinin' içermelidir, ancak ham bozuk ToUnicode nedeniyle 'ĜlĜşkĜnĜn' içeriyor. Sayfa 1: ${page1String.slice(0, 100)}`
  );
  assert.ok(
    !page1String.includes("\u011c"),
    `HATA (H4 Regresyonu): Çıkarılan metinde U+011C ('Ĝ') bulunmamalıdır, ancak bulundu.`
  );

  console.log("[PASS] Metin kalitesi değişmezi başarıyla sağlandı.");
}

runTextQualityTests().catch((err) => {
  console.error("\n>>> [BEKLENEN KIRMIZI TEST BAŞARISIZLIĞI (FAZ R1)]:");
  console.error(err.message);
  process.exit(1);
});
