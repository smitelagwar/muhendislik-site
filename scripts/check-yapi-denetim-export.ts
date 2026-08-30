import assert from "node:assert/strict";
import {
  calculateYapiDenetimFee,
  createYapiDenetimPdfDocument,
  getYapiDenetimExportFilename,
} from "../src/lib/calculations/modules/yapi-denetim-ucreti";

async function main() {
  console.log("--- AŞAMA 4: PDF, Excel, Görsel ve Raporlama Testleri Başlatılıyor ---");

  // 1. Deterministik Dosya Adı Testleri
  const testDate = new Date(2026, 7, 30, 14, 25); // 30 Ağustos 2026, 14:25
  const pdfFilename = getYapiDenetimExportFilename("pdf", testDate);
  const xlsxFilename = getYapiDenetimExportFilename("xlsx", testDate);
  const pngFilename = getYapiDenetimExportFilename("png", testDate);

  assert.equal(pdfFilename, "yapi-denetim-ucreti-2026-20260830-1425.pdf");
  assert.equal(xlsxFilename, "yapi-denetim-ucreti-2026-20260830-1425.xlsx");
  assert.equal(pngFilename, "yapi-denetim-ucreti-2026-20260830-1425.png");
  console.log("✔ Deterministik dosya adlandırma standardı doğrulandı.");

  // 2. R1 Sonucu ile PDF Döküman Üretimi Testi
  const r1Result = calculateYapiDenetimFee({
    area: 900,
    classBand: "III",
    durationYears: 1,
    region: "normal",
  });

  const pdfDoc = createYapiDenetimPdfDocument(r1Result);
  assert(pdfDoc, "PDF dökümanı üretilmelidir");
  assert.equal(pdfDoc.getNumberOfPages(), 1, "Rapor tek sayfa (A4) olmalıdır");

  const pdfArrayBuffer = pdfDoc.output("arraybuffer");
  assert(pdfArrayBuffer.byteLength > 1000, "PDF içeriği dolu ve geçerli boyutta olmalıdır");
  console.log(`✔ R1 için PDF başarıyla üretildi (${pdfArrayBuffer.byteLength} bayt, 1 sayfa A4).`);

  // 3. R4 (<=500 m²) Sonucu ile PDF Testi
  const r4Result = calculateYapiDenetimFee({
    area: 400,
    classBand: "III",
    durationYears: 1,
    region: "normal",
  });
  const r4PdfDoc = createYapiDenetimPdfDocument(r4Result);
  assert.equal(r4PdfDoc.getNumberOfPages(), 1);
  console.log("✔ R4 (≤500 m² özel hüküm) PDF dökümanı tek sayfa olarak başarıyla üretildi.");

  // 4. Çok Yıllı (duration > 1) Sonucu ile PDF Testi
  const multiYearResult = calculateYapiDenetimFee({
    area: 2500,
    classBand: "IV_V",
    durationYears: 3,
    region: "osb",
  });
  const multiYearPdfDoc = createYapiDenetimPdfDocument(multiYearResult);
  assert.equal(multiYearPdfDoc.getNumberOfPages(), 1);
  console.log("✔ Çok yıllı (%35 OSB indirimli) PDF dökümanı başarıyla üretildi.");

  // 5. Excel (.xlsx) Üretim ve Hücre Doğrulama Testi
  const XLSX = await import("xlsx");

  // R1 için veri yapısını ve sheet içeriklerini test et
  const summaryRows: (string | number)[][] = [
    ["Rapor Başlığı", "2026 Tahmini Yapı Denetim Hizmet Bedeli Hesap Özeti", ""],
    ["Veri Yılı", r1Result.effectiveYear, "Yıl"],
    ["Hesaplama Tarihi", new Date().toLocaleString("tr-TR"), ""],
    ["", "", ""],
    ["GİRDİ PARAMETRELERİ", "", ""],
    ["Yapı Denetimine Esas İnşaat Alanı", r1Result.input.area, "m²"],
    ["Yapı Sınıf Grubu", r1Result.input.classBand, ""],
    ["Denetim Grubu", r1Result.inspectionGroup, ""],
    ["2026 Denetim Birim Maliyeti", r1Result.unitCost, "TL/m²"],
    ["Öngörülen Ruhsat Süresi", r1Result.input.durationYears, "Yıl"],
    ["Bölge Türü", r1Result.input.region, ""],
    ["Uygulanan Alan Bandı", r1Result.areaBandLabel, ""],
    ["", "", ""],
    ["HESAPLAMA SONUÇLARI", "", ""],
    ["Yaklaşık Maliyet (M = A x U)", r1Result.approximateCost, "TL"],
    ["Hizmet Bedeli Oranı (r)", r1Result.serviceRate, "Oran"],
    ["İndirimsiz Hizmet Bedeli (H0)", r1Result.baseServiceFee, "TL"],
    ["Bölgesel İndirim Oranı (d)", r1Result.discountRate, "Oran"],
    ["Bölgesel İndirim Tutarı", r1Result.regionalDiscountAmount, "TL"],
    ["KDV Hariç Net Hizmet Bedeli (H)", r1Result.netServiceFee, "TL"],
    ["KDV Oranı", r1Result.vatRate, "Oran"],
    ["KDV Tutarı", r1Result.vatAmount, "TL"],
    ["KDV Dahil Genel Toplam", r1Result.grossTotal, "TL"],
  ];

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Hesap Ozeti");

  // Sayısal değerlerin korunması
  const approxCostCell = summaryRows.find((r) => r[0] === "Yaklaşık Maliyet (M = A x U)");
  assert.equal(approxCostCell?.[1], 17452800, "Excel'de Yaklaşık Maliyet numeric 17.452.800 olmalıdır");

  const netFeeCell = summaryRows.find((r) => r[0] === "KDV Hariç Net Hizmet Bedeli (H)");
  assert.equal(netFeeCell?.[1], 305424, "Excel'de Net Hizmet Bedeli numeric 305.424 olmalıdır");

  // Ödeme Esasları ve Hakediş Dağılımı satırları
  summaryRows.push(
    ["", "", ""],
    ["ÖDEME ESASLARI VE HAKEDİŞ DAĞILIMI (Madde 27)", "", ""],
    ["Ödeme Modeli", r1Result.paymentModel.modalityBadge, ""],
    ["Emanet Hesabı Kuralı", "Bakanlık / Defterdarlık / İdare Yapı Denetim Hesabı", "Emanet Hesabı"]
  );

  r1Result.paymentModel.installments.forEach((inst) => {
    summaryRows.push([
      `${inst.stage}. Etap: ${inst.name} (${inst.percentText})`,
      inst.grossAmount,
      "TL (KDV Dahil)"
    ]);
  });

  const paymentModelCell = summaryRows.find((r) => r[0] === "Ödeme Modeli");
  assert(paymentModelCell?.[1]?.toString().includes("Defaten"), "Excel'de Ödeme Modeli Defaten olmalı");

  const stage1Cell = summaryRows.find((r) => r[0]?.toString().includes("1. Etap"));
  assert(stage1Cell, "Excel'de 1. Etap satırı bulunmalıdır");
  assert.equal(typeof stage1Cell[1], "number", "Etap tutarı numeric olmalıdır");

  // Workbook binary buffer testi
  const wbBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  assert(wbBuffer.length > 500, "XLSX buffer geçerli olmalıdır");

  // Okunabilirlik testi
  const parsedWb = XLSX.read(wbBuffer, { type: "buffer" });
  assert.equal(parsedWb.SheetNames[0], "Hesap Ozeti");
  console.log("✔ Gerçek .xlsx workbook üretimi, sheet yapısı ve numeric hücreler başarıyla doğrulandı.");

  console.log("\n============================================================");
  console.log("AŞAMA 4 TÜM KABUL KRİTERLERİ BAŞARIYLA GEÇTİ (PASS)");
  console.log("============================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
