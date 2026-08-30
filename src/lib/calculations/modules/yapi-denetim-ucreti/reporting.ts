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
  let y = 14;

  // 1. Üst Başlık ve Kurumsal Antet (16 mm)
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin, y, contentWidth, 16, "F");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(245, 158, 11); // amber-500
  pdf.text("MÜHENDİS MİMAR PORTALI", margin + 4, y + 5.8);

  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(
    `${result.effectiveYear} TAHMİNİ YAPI DENETİM HİZMET BEDELİ RAPORU`,
    margin + 4,
    y + 11.8
  );

  const dateText = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(7.2);
  pdf.setTextColor(203, 213, 225); // slate-300
  pdf.text(dateText, margin + contentWidth - 4, y + 11.8, { align: "right" });

  y += 20;

  // 2. Yasal Dayanak Alt Başlığı
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(7.2);
  const legalNote =
    "4708 sayılı Kanun ve Yapı Denetimi Uygulama Yönetmeliği Madde 26-27 uyarınca 2026 yılı resmi birim maliyetleri ve oran cetvelleri seviyesinde tahmini hesap dökümüdür.";
  const wrappedLegal = pdf.splitTextToSize(normalizeText(legalNote), contentWidth);
  pdf.text(wrappedLegal, margin, y);
  y += wrappedLegal.length * 3.8 + 2;

  // 3. Proje Girdi Özeti Kutusu (2 Sütun, 22 mm)
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text("HESAPLAMAYA ESAS PROJE PARAMETRELERİ", margin + 4, y + 4.6);

  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);

  const col1X = margin + 4;
  const col2X = margin + 95;
  const row1Y = y + 10;
  const row2Y = y + 15;
  const row3Y = y + 20;

  // Sol Sütun
  pdf.text(`İnşaat Alanı: ${formatSayi(result.input.area)} m²`, col1X, row1Y);
  pdf.text(
    `Denetim Grubu: ${result.inspectionGroup} (${result.input.classBand === "I_II" ? "I–II. Sınıf" : result.input.classBand === "III" ? "III. Sınıf" : "IV–V. Sınıf"})`,
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

  y += 26;

  // 4. Ana Sonuç Kutusu (Hero Result Box, 24 mm)
  pdf.setFillColor(254, 243, 199); // amber-100
  pdf.setDrawColor(245, 158, 11); // amber-500
  pdf.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(180, 83, 9); // amber-700
  pdf.text("KDV HARİÇ TAHMİNİ HİZMET BEDELİ", margin + 5, y + 6);

  pdf.setFontSize(15);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(formatCurrencyTL2(result.netServiceFee), margin + 5, y + 14.5);

  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `KDV (%${Math.round(result.vatRate * 100)}): ${formatCurrencyTL2(result.vatAmount)}`,
    margin + 5,
    y + 20.5
  );

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setTextColor(180, 83, 9);
  pdf.text(
    `KDV Dahil Genel Toplam: ${formatCurrencyTL2(result.grossTotal)}`,
    margin + contentWidth - 5,
    y + 20.5,
    { align: "right" }
  );

  y += 28;

  // 5. Teknik Hesap Dökümü Tablosu (8 satır, her biri 4.8 mm)
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text("TEKNİK HESAPLAMA DÖKÜMÜ", margin, y);
  y += 3.5;

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
    const rowY = y + idx * 4.8;
    if (idx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, rowY, contentWidth, 4.8, "F");
    }
    pdf.setFont(FONT_FAMILY, idx >= 5 ? "bold" : "normal");
    pdf.setFontSize(7.2);
    pdf.setTextColor(idx >= 5 ? 15 : 71, idx >= 5 ? 23 : 85, idx >= 5 ? 42 : 105);
    pdf.text(normalizeText(label), margin + 3, rowY + 3.4);
    pdf.text(normalizeText(value), margin + contentWidth - 3, rowY + 3.4, { align: "right" });
    pdf.line(margin, rowY + 4.8, margin + contentWidth, rowY + 4.8);
  });

  y += tableData.length * 4.8 + 5;

  // 6. Ödeme Esasları ve 6 Etaplık Hakediş Dağılımı Tablosu (Madde 27)
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text("ÖDEME ESASLARI VE 6 ETAPLIK HAKEDİŞ DAĞILIMI (Madde 27)", margin, y);

  pdf.setFontSize(7.2);
  pdf.setTextColor(
    result.paymentModel.isUpfrontMandatory ? 29 : 4,
    result.paymentModel.isUpfrontMandatory ? 78 : 120,
    result.paymentModel.isUpfrontMandatory ? 216 : 87
  );
  pdf.text(
    `[ ${result.paymentModel.modalityBadge} ]`,
    margin + contentWidth,
    y,
    { align: "right" }
  );
  y += 3.5;

  // Hakediş Tablosu Başlık Satırı
  const thY = y;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, thY, contentWidth, 4.2, "F");
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, thY, margin + contentWidth, thY);
  pdf.line(margin, thY + 4.2, margin + contentWidth, thY + 4.2);

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(6.8);
  pdf.setTextColor(51, 65, 85);
  pdf.text("Etap", margin + 2, thY + 3);
  pdf.text("İnşaat Fiziki İlerleme Seviyesi", margin + 18, thY + 3);
  pdf.text("Hakediş Payı", margin + 115, thY + 3, { align: "center" });
  pdf.text("KDV Hariç", margin + 148, thY + 3, { align: "right" });
  pdf.text("KDV Dahil Tutar", margin + contentWidth - 2, thY + 3, { align: "right" });

  y += 4.2;

  // 6 Hakediş Satırı
  result.paymentModel.installments.forEach((inst, idx) => {
    const rY = y + idx * 4.2;
    if (idx % 2 === 1) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, rY, contentWidth, 4.2, "F");
    }
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(6.8);
    pdf.setTextColor(30, 41, 59);

    pdf.text(`${inst.stage}. Etap`, margin + 2, rY + 3);
    pdf.text(normalizeText(inst.name), margin + 18, rY + 3);
    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setTextColor(180, 83, 9);
    pdf.text(inst.percentText, margin + 115, rY + 3, { align: "center" });
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setTextColor(71, 85, 105);
    pdf.text(formatCurrencyTL2(inst.netAmount), margin + 148, rY + 3, { align: "right" });
    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setTextColor(15, 23, 42);
    pdf.text(formatCurrencyTL2(inst.grossAmount), margin + contentWidth - 2, rY + 3, { align: "right" });

    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, rY + 4.2, margin + contentWidth, rY + 4.2);
  });

  y += result.paymentModel.installments.length * 4.2 + 2;

  // Emanet Hesabı Bilgilendirme Notu
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(6.4);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    normalizeText("Yasal Zorunluluk: Bedel doğrudan şirkete değil, Bakanlık/İdare Yapı Denetim Emanet Hesabına yatırılır. İdare hakediş onaylandıkça kuruluşa aktarır."),
    margin,
    y
  );
  y += 4.5;

  // 7. Koşullu Not Kutuları (500 m², Çok Yıllı, Kapsam)
  if (result.smallBuilding.applies) {
    pdf.setFillColor(239, 246, 255); // blue-50
    pdf.setDrawColor(191, 219, 254); // blue-200
    pdf.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, "FD");

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(29, 78, 216); // blue-700
    pdf.text("500 m² VE ALTI YAPILARDA ÖZEL HÜKÜM (Madde 26/4)", margin + 3, y + 3.8);

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(30, 58, 138);
    const smallText = `Cetvel oranı uygulanmıştır. Sözleşmeyle azami %3,50 uygulanması halinde: KDV Hariç: ${formatCurrencyTL2(result.smallBuilding.maxNetServiceFee)} | KDV Dahil: ${formatCurrencyTL2(result.smallBuilding.maxGrossTotal)}`;
    pdf.text(normalizeText(smallText), margin + 3, y + 8);

    y += 13.5;
  }

  if (result.flags.isMultiYear) {
    pdf.setFillColor(254, 243, 199); // amber-50
    pdf.setDrawColor(253, 230, 138); // amber-200
    pdf.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "FD");

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(180, 83, 9);
    pdf.text(`2026 FİYAT SEVİYESİNDE TAHMİN (${result.input.durationYears} YILLIK PROJE)`, margin + 3, y + 3.8);

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(146, 64, 14);
    const multiText =
      "Sonraki takvim yıllarına devreden iş kısmı, uygulama yılının resmi birim maliyeti üzerinden değerlendirilir (Madde 26/6).";
    pdf.text(normalizeText(multiText), margin + 3, y + 7.8);

    y += 12.5;
  }

  if (result.flags.possibleScopeReview) {
    pdf.setFillColor(250, 245, 255); // purple-50
    pdf.setDrawColor(233, 213, 255); // purple-200
    pdf.roundedRect(margin, y, contentWidth, 9.5, 1.5, 1.5, "FD");

    pdf.setFont(FONT_FAMILY, "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(126, 34, 206);
    pdf.text("KAPSAM İNCELEME NOTU (≤200 m²)", margin + 3, y + 3.6);

    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(88, 28, 135);
    pdf.text(
      "200 m² ve altındaki bazı yapılar fenni mesuliyet sisteminde kalabilir. 4708 denetime tabi olduğu varsayılmıştır.",
      margin + 3,
      y + 7.4
    );

    y += 12;
  }

  // 8. Alt Bilgi (Footer)
  const footerY = 282;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin, footerY - 2.5, margin + contentWidth, footerY - 2.5);

  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(6.8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(
    "Mühendis Mimar Portalı · muhendislik-site.vercel.app · 4708 sayılı Kanun ve İlgili Mevzuat",
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

  // Ödeme Esasları ve 6 Etaplık Hakediş/Taksit Dağılımı
  summaryRows.push(
    ["", "", ""],
    ["ÖDEME ESASLARI VE HAKEDİŞ DAĞILIMI (Madde 27)", "", ""],
    ["Ödeme Modeli", result.paymentModel.modalityBadge, ""],
    ["Emanet Hesabı Kuralı", "Bakanlık / Defterdarlık / İdare Yapı Denetim Hesabı", "Emanet Hesabı"],
    ["", "", ""]
  );

  result.paymentModel.installments.forEach((inst) => {
    summaryRows.push([
      `${inst.stage}. Etap: ${inst.name} (${inst.percentText})`,
      inst.grossAmount,
      "TL (KDV Dahil)"
    ]);
  });

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

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string | CanvasGradient,
  strokeColor?: string,
  lineWidth = 1
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * HTML5 Canvas 2D kullanarak yüksek çözünürlüklü (Retina 2x), paylaşıma hazır
 * ve kurumsal tasarıma sahip PNG hesap kartı üretir.
 * CSS veya oklch renk ayrıştırma bağımlılığı yoktur; tüm tarayıcılarda %100 güvenli çalışır.
 */
export async function generateYapiDenetimCardPng(
  result: YapiDenetimCalculationResult
): Promise<Blob> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Görsel üretimi yalnızca tarayıcı ortamında çalışır.");
  }

  const canvas = document.createElement("canvas");
  const scale = 2; // Retina sharpness
  const logicalWidth = 800; // Genişlik px
  
  // Dinamik yükseklik: koşullu bloklara göre hesaplanır
  let logicalHeight = 1040;
  if (result.smallBuilding.applies) logicalHeight += 70;
  if (result.flags.isMultiYear) logicalHeight += 60;
  if (result.flags.possibleScopeReview) logicalHeight += 60;

  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context oluşturulamadı.");
  }

  ctx.scale(scale, scale);

  // 1. Koyu Arka Plan
  const bgGrad = ctx.createLinearGradient(0, 0, 0, logicalHeight);
  bgGrad.addColorStop(0, "#0b0f19");
  bgGrad.addColorStop(1, "#080b12");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Dış Çerçeve
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, logicalWidth, logicalHeight);

  const margin = 28;
  const contentWidth = logicalWidth - margin * 2; // 744px
  let y = 28;

  // 2. Üst Header Kartı
  drawRoundedRect(ctx, margin, y, contentWidth, 72, 14, "#131b2e", "#1e293b");

  ctx.fillStyle = "#f59e0b"; // Gold
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("MÜHENDİS MİMAR PORTALI", margin + 20, y + 28);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`${result.effectiveYear} TAHMİNİ YAPI DENETİM HİZMET BEDELİ`, margin + 20, y + 52);

  // Yıl rozeti (sağda)
  drawRoundedRect(
    ctx,
    margin + contentWidth - 116,
    y + 20,
    96,
    32,
    16,
    "rgba(245, 158, 11, 0.15)",
    "rgba(245, 158, 11, 0.4)"
  );
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${result.effectiveYear} Fiyatı`, margin + contentWidth - 68, y + 40);
  ctx.textAlign = "left";

  y += 86;

  // 3. Proje Bilgileri Mini Kartları (4 Sütun)
  const colWidth = (contentWidth - 24) / 4;
  const inputCards = [
    { label: "İnşaat Alanı", val: `${formatSayi(result.input.area)} m²` },
    { label: "Yapı Sınıfı", val: `${result.inspectionGroup}` },
    { label: "Ruhsat Süresi", val: `${result.input.durationYears} Yıl` },
    {
      label: "Bölge İndirimi",
      val: result.discountRate > 0 ? `%${Math.round(result.discountRate * 100)}` : "Normal (%0)",
    },
  ];

  inputCards.forEach((c, i) => {
    const cardX = margin + i * (colWidth + 8);
    drawRoundedRect(ctx, cardX, y, colWidth, 54, 10, "#111827", "#1e293b");
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(c.label, cardX + 12, y + 22);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(c.val, cardX + 12, y + 42);
  });

  y += 68;

  // 4. Hero Result Kutusu (Fiyat Kartı)
  const heroGrad = ctx.createLinearGradient(margin, y, margin + contentWidth, y + 126);
  heroGrad.addColorStop(0, "rgba(245, 158, 11, 0.12)");
  heroGrad.addColorStop(1, "rgba(245, 158, 11, 0.03)");
  drawRoundedRect(ctx, margin, y, contentWidth, 126, 14, heroGrad, "rgba(245, 158, 11, 0.35)");

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("KDV HARİÇ TAHMİNİ HİZMET BEDELİ", margin + 22, y + 32);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 36px monospace, -apple-system, sans-serif";
  ctx.fillText(formatCurrencyTL2(result.netServiceFee), margin + 22, y + 74);

  // KDV & KDV Dahil alt çubuk
  const subBoxY = y + 88;
  ctx.strokeStyle = "rgba(245, 158, 11, 0.2)";
  ctx.beginPath();
  ctx.moveTo(margin + 20, subBoxY);
  ctx.lineTo(margin + contentWidth - 20, subBoxY);
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`KDV (%${Math.round(result.vatRate * 100)}):`, margin + 22, subBoxY + 24);

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 13px monospace";
  ctx.fillText(formatCurrencyTL2(result.vatAmount), margin + 85, subBoxY + 24);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`KDV Dahil Toplam:  ${formatCurrencyTL2(result.grossTotal)}`, margin + contentWidth - 22, subBoxY + 24);
  ctx.textAlign = "left";

  y += 140;

  // 5. Ödeme Modeli ve 6 Etaplık Hakediş Tablosu (Madde 27)
  drawRoundedRect(ctx, margin, y, contentWidth, 316, 12, "#111827", "#1e293b");

  // Tablo başlık çubuğu
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("ÖDEME ESASLARI VE 6 ETAPLIK HAKEDİŞ DAĞILIMI (Madde 27)", margin + 18, y + 26);

  // Rozet
  const isUpfront = result.paymentModel.isUpfrontMandatory;
  const badgeText = isUpfront ? "Defaten Yatırma Esastır" : "Taksitli / Defaten";
  const badgeW = isUpfront ? 160 : 130;
  drawRoundedRect(
    ctx,
    margin + contentWidth - badgeW - 16,
    y + 11,
    badgeW,
    26,
    13,
    isUpfront ? "rgba(59, 130, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
    isUpfront ? "rgba(59, 130, 246, 0.4)" : "rgba(16, 185, 129, 0.4)"
  );
  ctx.fillStyle = isUpfront ? "#60a5fa" : "#34d399";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, margin + contentWidth - badgeW / 2 - 16, y + 28);
  ctx.textAlign = "left";

  // Bilgilendirme Notu
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const noteText = isUpfront
    ? "İnşaat alanı ≤ 3.000 m²: Bedelin tamamı ruhsat öncesinde resmi Yapı Denetim Emanet Hesabına defaten yatırılır."
    : "İnşaat alanı > 3.000 m²: Bedel defaten veya fiziki seviyelere göre 6 taksitte emanet hesabına yatırılabilir.";
  ctx.fillText(noteText, margin + 18, y + 48);

  // Tablo Sütun Başlıkları
  const thY = y + 64;
  drawRoundedRect(ctx, margin + 12, thY, contentWidth - 24, 26, 6, "#1e293b");
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Etap", margin + 24, thY + 17);
  ctx.fillText("İlerleme Aşaması", margin + 80, thY + 17);
  ctx.textAlign = "center";
  ctx.fillText("Pay", margin + 490, thY + 17);
  ctx.textAlign = "right";
  ctx.fillText("KDV Dahil Tutar", margin + contentWidth - 28, thY + 17);
  ctx.textAlign = "left";

  // 6 Etap Satırları
  let rowY = thY + 28;
  const stages = result.paymentModel.installments;
  stages.forEach((st, idx) => {
    if (idx % 2 === 1) {
      drawRoundedRect(ctx, margin + 12, rowY, contentWidth - 24, 34, 4, "rgba(255, 255, 255, 0.02)");
    }
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`${st.stage}. Etap`, margin + 24, rowY + 21);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(st.name, margin + 80, rowY + 21);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(st.percentText, margin + 490, rowY + 21);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "right";
    ctx.fillText(formatCurrencyTL2(st.grossAmount), margin + contentWidth - 28, rowY + 21);
    ctx.textAlign = "left";

    rowY += 34;
  });

  // Emanet hesabı kuralı notu
  ctx.fillStyle = "#64748b";
  ctx.font = "10px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Yasal Kural: Bedel şirkete değil, Bakanlık/İdare Yapı Denetim Emanet Hesabına yatırılır. İdare hakediş onaylandıkça aktarır.", margin + 18, y + 304);

  y += 330;

  // 6. Teknik Parametreler Grid (4 Kutu)
  const paramW = (contentWidth - 12) / 2;
  const paramBoxes = [
    { label: "Yaklaşık Maliyet (M = A x U)", val: formatCurrencyTL2(result.approximateCost) },
    { label: "Uygulanan Cetvel Oranı (r)", val: `%${(result.serviceRate * 100).toFixed(2).replace(".", ",")}` },
    { label: "İndirimsiz Hizmet Bedeli (H0)", val: formatCurrencyTL2(result.baseServiceFee) },
    { label: "2026 Denetim Birim Maliyeti", val: `${formatSayi(result.unitCost)} TL/m²` },
  ];

  paramBoxes.forEach((p, i) => {
    const px = margin + (i % 2) * (paramW + 12);
    const py = y + Math.floor(i / 2) * 44;
    drawRoundedRect(ctx, px, py, paramW, 36, 8, "#111827", "#1e293b");

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(p.label, px + 12, py + 22);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "right";
    ctx.fillText(p.val, px + paramW - 12, py + 22);
    ctx.textAlign = "left";
  });

  y += 98;

  // 7. Koşullu Not Kutuları (eğer varsa)
  if (result.smallBuilding.applies) {
    drawRoundedRect(ctx, margin, y, contentWidth, 54, 10, "rgba(59, 130, 246, 0.08)", "rgba(59, 130, 246, 0.3)");
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("500 m² ve Altı Yapılarda Özel Hüküm (Madde 26/4):", margin + 16, y + 20);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      `Sözleşmeyle oran azami %3,50'ye çıkarılabilir. Azami Net: ${formatCurrencyTL2(result.smallBuilding.maxNetServiceFee)} | Azami KDV Dahil: ${formatCurrencyTL2(result.smallBuilding.maxGrossTotal)}`,
      margin + 16,
      y + 38
    );
    y += 62;
  }

  if (result.flags.isMultiYear) {
    drawRoundedRect(ctx, margin, y, contentWidth, 48, 10, "rgba(245, 158, 11, 0.08)", "rgba(245, 158, 11, 0.3)");
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`2026 Fiyat Seviyesinde Tahmin (${result.input.durationYears} Yıllık Proje):`, margin + 16, y + 20);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      "Sonraki takvim yıllarına devreden iş kısmı, ilgili yılın resmî birim maliyetine tabidir (Yönetmelik Madde 26/6).",
      margin + 16,
      y + 36
    );
    y += 56;
  }

  if (result.flags.possibleScopeReview) {
    drawRoundedRect(ctx, margin, y, contentWidth, 48, 10, "rgba(168, 85, 247, 0.08)", "rgba(168, 85, 247, 0.3)");
    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Kapsam İnceleme Notu (≤ 200 m² Bağımsız Yapı):", margin + 16, y + 20);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      "200 m² ve altındaki bazı yapılar fenni mesuliyet kapsamına girebilir. 4708 denetime tabi olduğu varsayılmıştır.",
      margin + 16,
      y + 36
    );
    y += 56;
  }

  // 8. Alt Footer
  y += 6;
  ctx.strokeStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(margin + contentWidth, y);
  ctx.stroke();

  y += 20;
  ctx.fillStyle = "#64748b";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("4708 sayılı Kanun & Yapı Denetimi Uygulama Yönetmeliği · muhendislik-site.vercel.app", margin, y);

  ctx.textAlign = "right";
  ctx.fillText("Tahmini Bilgilendirme Amaçlıdır", margin + contentWidth, y);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas PNG Blob dönüştürme başarısız oldu."));
      }
    }, "image/png");
  });
}

/**
 * Geriye dönük uyumluluk: HTMLElement veya Result ile PNG Blob üretir.
 */
export async function captureYapiDenetimPng(
  element: HTMLElement,
  result?: YapiDenetimCalculationResult
): Promise<Blob> {
  if (result) {
    return generateYapiDenetimCardPng(result);
  }

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#0c0d12",
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
  } catch (err) {
    console.error("captureYapiDenetimPng hatası:", err);
    throw err;
  }
}
