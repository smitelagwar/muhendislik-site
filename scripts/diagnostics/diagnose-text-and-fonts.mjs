import fs from "fs";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath = path.resolve("tests/fixtures/pdf/manual/Copilot - korelasyon.pdf");
const data = new Uint8Array(fs.readFileSync(pdfPath));

console.log("PDF Dosyası Yüklendi:", pdfPath, "Boyut:", data.byteLength);

async function runDiagnosis() {
  const loadingTask = pdfjs.getDocument({
    data,
    verbosity: 5, // Yüksek verbosity
    cMapUrl: path.resolve("node_modules/pdfjs-dist/cmaps") + "/",
    cMapPacked: true,
    standardFontDataUrl: path.resolve("node_modules/pdfjs-dist/standard_fonts") + "/",
  });

  const pdfDoc = await loadingTask.promise;
  console.log(`Toplam Sayfa Sayısı: ${pdfDoc.numPages}`);

  let totalChars = 0;
  let gHatCount = 0; // Ĝ (U+011C)
  let iCount = 0; // i (U+0069)
  let foundSampleLines = [];

  for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 5); pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const commonObjs = page.commonObjs;

    console.log(`\n=== SAYFA ${pageNum} ===`);

    for (const item of textContent.items) {
      if (!("str" in item)) continue;
      const str = item.str;
      totalChars += str.length;

      for (const char of str) {
        if (char === "Ĝ" || char.codePointAt(0) === 0x011c) {
          gHatCount++;
        }
        if (char === "i" || char.codePointAt(0) === 0x0069) {
          iCount++;
        }
      }

      // H4 belirtisi: 'Ĝ' içeren satırları yakala
      if (str.includes("Ĝ") || str.toLowerCase().includes("korelasyon") || str.includes("Değ") || str.includes("lĜşk")) {
        foundSampleLines.push({
          page: pageNum,
          fontName: item.fontName,
          str: str,
          codePoints: [...str].map((c) => `U+${c.codePointAt(0).toString(16).padStart(4, "0")} (${c})`).join(" "),
        });
      }
    }
  }

  console.log("\n================ METİN ANALİZİ SONUÇLARI ================");
  console.log(`İlk 5 sayfadaki toplam karakter: ${totalChars}`);
  console.log(`'Ĝ' (U+011C) karakter sayısı: ${gHatCount}`);
  console.log(`'i' (U+0069) karakter sayısı: ${iCount}`);
  console.log(`Ĝ oranı: %${((gHatCount / totalChars) * 100).toFixed(2)}`);
  console.log(`i oranı: %${((iCount / totalChars) * 100).toFixed(2)}`);

  console.log("\n=== ÖRNEK BULUNAN SATIRLAR VE UNICODE DÖKÜMÜ ===");
  foundSampleLines.slice(0, 10).forEach((sample, idx) => {
    console.log(`\n[${idx + 1}] Sayfa ${sample.page} | Font: ${sample.fontName}`);
    console.log(`    Metin: "${sample.str}"`);
    console.log(`    Kod Noktaları: ${sample.codePoints}`);
  });
}

runDiagnosis().catch((err) => {
  console.error("Teşhis Hatası:", err);
});
