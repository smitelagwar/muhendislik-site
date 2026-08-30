import { jsPDF } from "jspdf";
import {
  PDF_SERIF_BOLD_BASE64,
  PDF_SERIF_REGULAR_BASE64,
} from "@/lib/calculations/pdf-fonts.generated";
import { formatCurrencyTL2, formatSayi } from "@/lib/calculations/core";
import {
  INSPECTION_CLASS_GROUP_OPTIONS,
  INSTALLMENT_STAGES,
  REGIONAL_DISCOUNT_OPTIONS,
  YAPI_DENETIM_RATE_TABLE,
} from "./constants";
import type { YapiDenetimCalculationResult } from "./types";

const FONT_FAMILY = "IBMPlexSerif";

function normalizeText(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function registerPdfFonts(pdf: jsPDF) {
  const fontRegistry = pdf as jsPDF & { __yapiDenetimFontsReady?: boolean };
  if (fontRegistry.__yapiDenetimFontsReady) {
    return;
  }

  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", FONT_FAMILY, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", FONT_FAMILY, "bold");
  fontRegistry.__yapiDenetimFontsReady = true;
}

export function getYapiDenetimExportFilename(
  extension: "pdf" | "xlsx" | "png",
  date = new Date()
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `yapi-denetim-ucreti-2026-${year}${month}${day}-${hours}${minutes}.${extension}`;
}

/**
 * 2026 Yapı Denetimi Raporu için A4 jsPDF dökümanı üretir.
 */
export function createYapiDenetimPdfDocument(
  result: YapiDenetimCalculationResult
): jsPDF {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  registerPdfFonts(pdf);
  pdf.setFont(FONT_FAMILY, "normal");

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let y = 16;

  // 1. Üst Başlık ve Kurumsal Antet
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin, y, contentWidth, 18, "F");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(245, 158, 11); // amber-500
  pdf.text("MÜHENDİS MİMAR PORTALI", margin + 4, y + 6);

  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(
    `${result.effectiveYear} TAHMİNİ YAPI DENETİM HİZMET BEDELİ RAPORU`,
    margin + 4,
    y + 12
  );

  const dateText = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(203, 213, 225); // slate-300
  pdf.text(dateText, margin + contentWidth - 4, y + 12, { align: "right" });

  y += 24;

  // 2. Yasal Dayanak Alt Başlığı
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(7.5);
  const legalNote =
    "Bu rapor, 4708 sayılı Yapı Denetimi Hakkında Kanun ve Yapı Denetimi Uygulama Yönetmeliği Madde 26 uyarınca 2026 yılı birim maliyetleri seviyesinde tahmini hizmet bedeli hesaplamasıdır.";
  const wrappedLegal = pdf.splitTextToSize(normalizeText(legalNote), contentWidth);
  pdf.text(wrappedLegal, margin, y);
  y += wrappedLegal.length * 4 + 4;

  // 3. Proje Girdi Özeti Kutusu (2 Sütun)
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.roundedRect(margin, y, contentWidth, 26, 2, 2, "FD");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text("HESAPLAMAYA ESAS PROJE BİLGİLERİ", margin + 4, y + 5);

  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);

  const col1X = margin + 4;
  const col2X = margin + 95;
  const row1Y = y + 11;
  const row2Y = y + 17;
  const row3Y = y + 23;

  // Sol Sütun
  pdf.text(
    `İnşaat Alanı: ${formatSayi(result.input.area)} m²`,
    col1X,
    row1Y
  );
  pdf.text(
    `Yapı Sınıfı: ${result.inspectionGroup} (${result.input.classBand === "I_II" ? "I–II. Sınıf" : result.input.classBand === "III" ? "III. Sınıf" : "IV–V. Sınıf"})`,
    col1X,
    row2Y
  );
  pdf.text(
    `2026 Denetim Birim Maliyeti: ${formatSayi(result.unitCost)} TL/m²`,
    col1X,
    row3Y
  );

  // Sağ Sütun
  const regOption = REGIONAL_DISCOUNT_OPTIONS.find((r) => r.id === result.input.region);
  pdf.text(`Ruhsat Süresi: ${result.input.durationYears} Yıl`, col2X, row1Y);
  pdf.text(
    `Bölge Statüsü: ${regOption ? regOption.label : "Normal"} (%${Math.round(result.discountRate * 100)} İndirim)`,
    col2X,
    row2Y
  );
  pdf.text(`Uygulanan Alan Bandı: ${result.areaBandLabel}`, col2X, row3Y);

  y += 32;

  // 4. Ana Sonuç Kutusu (Hero Result Box)
  pdf.setFillColor(254, 243, 199); // amber-100
  pdf.setDrawColor(245, 158, 11); // amber-500
  pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "FD");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(180, 83, 9); // amber-700
  pdf.text("KDV HARİÇ TAHMİNİ HİZMET BEDELİ", margin + 6, y + 7);

  pdf.setFontSize(16);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(formatCurrencyTL2(result.netServiceFee), margin + 6, y + 16);

  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `KDV (%${Math.round(result.vatRate * 100)}): ${formatCurrencyTL2(result.vatAmount)}`,
    margin + 6,
    y + 23
  );

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setTextColor(180, 83, 9);
  pdf.text(
    `KDV Dahil Toplam: ${formatCurrencyTL2(result.grossTotal)}`,
    margin + contentWidth - 6,
    y + 23,
    { align: "right" }
  );

  y += 34;

  // 5. Teknik Hesap Dökümü Tablosu
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text("TEKNİK HESAPLAMA DÖKÜMÜ", margin, y);
  y += 4;

  const tableData: [string, string][] = [
    ["Yapı Denetimine Esas Yaklaşık Maliyet (M = A x U)", formatCurrencyTL2(result.approximateCost)],
    ["Uygulanan Hizmet Oranı Cetvel Oranı (r)", `%${(result.serviceRate * 100).toFixed(2).replace(".", ",")}`],
    ["İndirimsiz Hizmet Bedeli (H0 = M x r)", formatCurrencyTL2(result.baseServiceFee)],
    ["Uygulanan Bölgesel İndirim Oranı (d)", `%${Math.round(result.discountRate * 100)}`],
    ["Bölgesel İndirim Tutarı", formatCurrencyTL2(result.regionalDiscountAmount)],
    ["KDV Hariç Net Hizmet Bedeli (H = H0 x (1 - d))", formatCurrencyTL2(result.netServiceFee)],
    ["KDV Tutarı (%20)", formatCurrencyTL2(result.vatAmount)],
    ["KDV Dahil Genel Toplam", formatCurrencyTL2(result.grossTotal)],
  ];

  pdf.setDrawColor(226, 232, 240);
  tableData.forEach(([label, value], idx) => {
    const rowY = y + idx * 6;
    if (idx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, rowY, contentWidth, 6, "F");
    }
    pdf.setFont(FONT_FAMILY, idx >= 5 ? "bold" : "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(idx >= 5 ? 15 : 71, idx >= 5 ? 23 : 85, idx >= 5 ? 42 : 105);
    pdf.text(normalizeText(label), margin + 3, rowY + 4.2);
    pdf.text(normalizeText(value), margin + contentWidth - 3, rowY + 4.2, { align: "right" });
    pdf.line(margin, rowY + 6, margin + contentWidth, rowY + 6);
  });

  y += tableData.length * 6 + 6;

  // 6. Koşullu Not Kutuları (500 m², Çok Yıllı, Kapsam)
  if (result.smallBuilding.applies) {
    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.setDrawColor(191, 219, 254); // blue-200
    pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(29, 78, 216); // blue-700
    pdf.text("500 m² VE ALTI YAPILARDA ÖZEL HÜKÜM (Madde 26/4)", margin + 3, y + 4.5);

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(30, 58, 138);
    const smallText = `Cetvel oranı ana hesapta kullanılmıştır. Sözleşmeyle azami %3,50 uygulanması halinde: KDV Hariç Azami: ${formatCurrencyTL2(result.smallBuilding.maxNetServiceFee)} | KDV Dahil Azami: ${formatCurrencyTL2(result.smallBuilding.maxGrossTotal)}`;
    pdf.text(normalizeText(smallText), margin + 3, y + 9.5);

    y += 18;
  }

  if (result.flags.isMultiYear) {
    pdf.setFillColor(254, 243, 199); // amber-50
    pdf.setDrawColor(253, 230, 138); // amber-200
    pdf.roundedRect(margin, y, contentWidth, 13, 2, 2, "FD");

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text(`2026 FİYAT SEVİYESİNDE TAHMİN (${result.input.durationYears} YILLIK PROJE)`, margin + 3, y + 4.5);

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(146, 64, 14);
    const multiText =
      "Sonraki takvim yıllarına devreden iş kısmı, uygulama yılının resmî birim maliyeti üzerinden değerlendirilir (Yönetmelik Madde 26/6).";
    pdf.text(normalizeText(multiText), margin + 3, y + 9.5);

    y += 17;
  }

  if (result.flags.possibleScopeReview) {
    pdf.setFillColor(250, 245, 255); // purple-50
    pdf.setDrawColor(233, 213, 255); // purple-200
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, "FD");

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(126, 34, 206);
    pdf.text("KAPSAM İNCELEME NOTU (≤200 m²)", margin + 3, y + 4.5);

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(88, 28, 135);
    pdf.text(
      "200 m² ve altındaki bazı bağımsız yapılar kat ve kullanım koşullarına göre 4708 kapsamı dışında kalabilir.",
      margin + 3,
      y + 9
    );

    y += 16;
  }

  // 7. Alt Bilgi (Footer)
  const footerY = 285;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, footerY - 3, margin + contentWidth, footerY - 3);

  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(
    "Mühendis Mimar Portalı · muhendislik-site.vercel.app · 4708 s. Kanun ve İlgili Mevzuat",
    margin,
    footerY
  );
  pdf.text("Sayfa 1 / 1", margin + contentWidth, footerY, { align: "right" });

  return pdf;
}

/**
 * PDF indirme işlemini tetikler.
 */
export function downloadYapiDenetimPdf(
  result: YapiDenetimCalculationResult,
  customFilename?: string
): string {
  const pdf = createYapiDenetimPdfDocument(result);
  const filename = customFilename || getYapiDenetimExportFilename("pdf");
  pdf.save(filename);
  return filename;
}

/**
 * PDF önizleme için güvenli bir Blob Object URL üretir.
 */
export function createYapiDenetimPdfBlobUrl(
  result: YapiDenetimCalculationResult
): { url: string; revoke: () => void } {
  const pdf = createYapiDenetimPdfDocument(result);
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  return {
    url,
    revoke: () => {
      URL.revokeObjectURL(url);
    },
  };
}

/**
 * PDF yazdırma penceresini açar.
 */
export function printYapiDenetimPdf(
  result: YapiDenetimCalculationResult
): void {
  if (typeof window === "undefined") {
    throw new Error("Yazdırma yalnızca tarayıcı ortamında kullanılabilir.");
  }

  const { url, revoke } = createYapiDenetimPdfBlobUrl(result);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    revoke();
    throw new Error("Yazdırma penceresi açılamadı. Lütfen açılır pencerelere izin verin.");
  }

  window.setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Tarayıcı PDF görüntüleyicisi print'i kendi yönetebilir
    }
  }, 1000);

  window.setTimeout(() => {
    revoke();
  }, 60_000);
}

/**
 * Gerçek Excel (.xlsx) dosyasını dinamik (lazy) import ile üretir.
 */
export async function exportYapiDenetimExcel(
  result: YapiDenetimCalculationResult,
  customFilename?: string
): Promise<string> {
  const XLSX = await import("xlsx");
  const filename = customFilename || getYapiDenetimExportFilename("xlsx");

  // Sheet 1: Hesap Özeti (Sayısal hücreler numeric tutulur)
  const summaryRows: (string | number)[][] = [
    ["Rapor Başlığı", "2026 Tahmini Yapı Denetim Hizmet Bedeli Hesap Özeti", ""],
    ["Veri Yılı", result.effectiveYear, "Yıl"],
    ["Hesaplama Tarihi", new Date().toLocaleString("tr-TR"), ""],
    ["", "", ""],
    ["GİRDİ PARAMETRELERİ", "", ""],
    ["Yapı Denetimine Esas İnşaat Alanı", result.input.area, "m²"],
    ["Yapı Sınıf Grubu", result.input.classBand, ""],
    ["Denetim Grubu", result.inspectionGroup, ""],
    ["2026 Denetim Birim Maliyeti", result.unitCost, "TL/m²"],
    ["Öngörülen Ruhsat Süresi", result.input.durationYears, "Yıl"],
    ["Bölge Türü", result.input.region, ""],
    ["Uygulanan Alan Bandı", result.areaBandLabel, ""],
    ["", "", ""],
    ["HESAPLAMA SONUÇLARI", "", ""],
    ["Yaklaşık Maliyet (M = A x U)", result.approximateCost, "TL"],
    ["Hizmet Bedeli Oranı (r)", result.serviceRate, "Oran"],
    ["İndirimsiz Hizmet Bedeli (H0)", result.baseServiceFee, "TL"],
    ["Bölgesel İndirim Oranı (d)", result.discountRate, "Oran"],
    ["Bölgesel İndirim Tutarı", result.regionalDiscountAmount, "TL"],
    ["KDV Hariç Net Hizmet Bedeli (H)", result.netServiceFee, "TL"],
    ["KDV Oranı", result.vatRate, "Oran"],
    ["KDV Tutarı", result.vatAmount, "TL"],
    ["KDV Dahil Genel Toplam", result.grossTotal, "TL"],
  ];

  if (result.smallBuilding.applies) {
    summaryRows.push(
      ["", "", ""],
      ["500 m² VE ALTI ÖZEL HÜKÜM (%3,50)", "", ""],
      ["Azami Oran", result.smallBuilding.maxRate, "Oran"],
      ["Azami Net Hizmet Bedeli", result.smallBuilding.maxNetServiceFee, "TL"],
      ["Azami KDV Tutarı", result.smallBuilding.maxVatAmount, "TL"],
      ["Azami Genel Toplam", result.smallBuilding.maxGrossTotal, "TL"]
    );
  }

  // Sheet 2: 2026 Referans Tabloları
  const referenceRows: (string | number)[][] = [
    ["2026 YAPI DENETİMİ BİRİM MALİYETLERİ", "", ""],
    ["Denetim Grubu", "Birim Maliyet (TL/m²)", "Kapsanan Sınıflar"],
    ...INSPECTION_CLASS_GROUP_OPTIONS.map((g) => [
      g.groupCode,
      g.unitCostTL,
      g.officialClasses.join(", "),
    ]),
    ["", "", ""],
    ["HİZMET BEDELİ ORANLARI CETVELİ (Madde 26)", "", ""],
    ["Süre (Yıl)", "A ≤ 1.000 m²", "1.000 < A ≤ 50.000 m²", "A > 50.000 m²"],
    ...([1, 2, 3, 4, 5] as const).map((y) => {
      const r = YAPI_DENETIM_RATE_TABLE[y];
      return [y, r.upTo1000, r.from1000To50000, r.over50000];
    }),
    ["", "", ""],
    ["BÖLGESEL İNDİRİMLER (Madde 26/8)", "", ""],
    ["Bölge", "İndirim Oranı", "Açıklama"],
    ...REGIONAL_DISCOUNT_OPTIONS.map((reg) => [reg.label, reg.discountRate, reg.description]),
    ["", "", ""],
    ["HAKEDİŞ ETAPLARI (Madde 27)", "", ""],
    ["Etap", "Aşama", "Hakediş Oranı"],
    ...INSTALLMENT_STAGES.map((s) => [s.stage, s.name, s.percentage]),
  ];

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceRows);

  // Hücre genişlikleri
  summarySheet["!cols"] = [{ wch: 38 }, { wch: 22 }, { wch: 16 }];
  referenceSheet["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Hesap Ozeti");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "2026 Referans");

  XLSX.writeFile(workbook, filename);
  return filename;
}

/**
 * html2canvas kullanarak elementin yüksek çözünürlüklü PNG Blob'unu üretir.
 */
export async function captureYapiDenetimPng(element: HTMLElement): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: null,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Görsel yakalama başarısız oldu."));
      }
    }, "image/png");
  });
}
