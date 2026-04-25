import { jsPDF } from "jspdf";
import { PDF_SERIF_BOLD_BASE64, PDF_SERIF_REGULAR_BASE64 } from "@/lib/calculations/pdf-fonts.generated";
import { formatM2Fiyat, formatSayi, formatTL, formatYuzde } from "@/lib/calculations/core";
import {
  QUICK_QUANTITY_FOUNDATION_OPTIONS,
  QUICK_QUANTITY_PLAN_OPTIONS,
  QUICK_QUANTITY_RETAINING_OPTIONS,
  QUICK_QUANTITY_SEISMIC_OPTIONS,
  QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,
  QUICK_QUANTITY_SOIL_OPTIONS,
  QUICK_QUANTITY_SPAN_OPTIONS,
  QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,
} from "./presets";
import type { QuickQuantityPdfSnapshot } from "./types";

const FONT_FAMILY = "IBMPlexSerif";

function normalizeText(value: string) {
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
  const fontRegistry = pdf as jsPDF & { __quickQuantityFontsReady?: boolean };
  if (fontRegistry.__quickQuantityFontsReady) {
    return;
  }

  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", FONT_FAMILY, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", FONT_FAMILY, "bold");
  fontRegistry.__quickQuantityFontsReady = true;
}

function createDocument() {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  registerPdfFonts(pdf);
  pdf.setFont(FONT_FAMILY, "normal");
  return pdf;
}

function drawSectionTitle(pdf: jsPDF, title: string, y: number) {
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(12);
  pdf.text(normalizeText(title), 14, y);
  pdf.setFont(FONT_FAMILY, "normal");
}

function drawWrappedLines(
  pdf: jsPDF,
  lines: string[],
  startY: number,
  width = 182,
  lineHeight = 5
) {
  let y = startY;
  pdf.setFontSize(9);

  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(normalizeText(line), width);
    pdf.text(wrapped, 14, y);
    y += wrapped.length * lineHeight;
  }

  return y;
}

function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T
): string {
  return options.find((item) => item.value === value)?.label ?? value;
}

export function buildQuickQuantityPdfSnapshot(
  snapshot: QuickQuantityPdfSnapshot
): QuickQuantityPdfSnapshot {
  return snapshot;
}

export function createQuickQuantityPdfDocument(snapshot: QuickQuantityPdfSnapshot): jsPDF {
  const pdf = createDocument();
  const { result } = snapshot;
  const tasiyiciSistemLabel = getOptionLabel(
    QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS,
    result.input.tasiyiciSistem
  );
  const dosemeSistemiLabel = getOptionLabel(
    QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS,
    result.input.dosemeSistemi
  );
  const temelTipiLabel = getOptionLabel(QUICK_QUANTITY_FOUNDATION_OPTIONS, result.input.temelTipi);
  const zeminSinifiLabel = getOptionLabel(QUICK_QUANTITY_SOIL_OPTIONS, result.input.zeminSinifi);
  const depremTalebiLabel = getOptionLabel(
    QUICK_QUANTITY_SEISMIC_OPTIONS,
    result.input.depremTalebi
  );
  const planKompaktligiLabel = getOptionLabel(
    QUICK_QUANTITY_PLAN_OPTIONS,
    result.input.planKompaktligi
  );
  const bodrumPerdesiLabel =
    result.input.bodrumKatSayisi > 0
      ? getOptionLabel(QUICK_QUANTITY_RETAINING_OPTIONS, result.input.bodrumCevrePerdesi)
      : "Bodrum yok";
  const tipikAciklikLabel = getOptionLabel(QUICK_QUANTITY_SPAN_OPTIONS, result.input.tipikAciklik);
  const sahaZorluguLabel =
    result.kararOzetleri.find((item) => item.id === "saha-zorlugu")?.value ?? "Saha özeti yok";
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(15, 23, 42);
  pdf.roundedRect(10, 10, pageWidth - 20, 24, 6, 6, "F");

  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text("Hızlı Metraj Hesaplayıcı", 16, 21);
  pdf.setFontSize(9.5);
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.text(normalizeText(result.preset.label), 16, 28);
  pdf.text(normalizeText(snapshot.formattedDate), pageWidth - 16, 21, { align: "right" });

  pdf.setTextColor(15, 23, 42);
  let y = 42;

  drawSectionTitle(pdf, "Özet", y);
  y = drawWrappedLines(
    pdf,
    [
      `Toplam alan: ${formatSayi(result.toplamInsaatAlaniM2, 2)} m²`,
      `Beton: ${formatSayi(result.betonM3, 2)} m³`,
      `Donatı: ${formatSayi(result.donatiTon, 2)} ton`,
      `Kalıp: ${formatSayi(result.kalipM2, 2)} m²`,
      `Doğrudan taşıyıcı maliyet: ${formatTL(result.dogrudanTasiyiciMaliyet)}`,
      `Doğrudan maliyet yoğunluğu: ${formatTL(result.yogunlukOzet.directCostPerM2).replace(" TL", " TL/m²")}`,
      `Genişletilmiş kaba yapı: ${formatTL(result.genisletilmisKabaYapiBandi.expectedAmount)}`,
      `Resmî toplam yaklaşık maliyet: ${formatTL(result.officialResult.resmiToplamMaliyet)}`,
      `Saha zorluğu: ${sahaZorluguLabel}`,
      `Taşıyıcı payı: ${formatYuzde(result.tasiyiciPayi.actual)} (bant ${formatYuzde(
        result.tasiyiciPayi.low
      )} - ${formatYuzde(result.tasiyiciPayi.expected)} - ${formatYuzde(
        result.tasiyiciPayi.high
      )})`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Proje Profili", y);
  y = drawWrappedLines(
    pdf,
    [
      `Taşıyıcı sistem: ${tasiyiciSistemLabel}`,
      `Döşeme sistemi: ${dosemeSistemiLabel}`,
      `Temel tipi: ${temelTipiLabel}`,
      `Zemin sınıfı: ${zeminSinifiLabel}`,
      `Deprem talebi: ${depremTalebiLabel}`,
      `Plan kompaktlığı: ${planKompaktligiLabel}`,
      `Bodrum çevre perdesi: ${bodrumPerdesiLabel}`,
      `Tipik açıklık: ${tipikAciklikLabel}`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Dağılım", y);
  y = drawWrappedLines(
    pdf,
    result.breakdowns.map(
      (item) =>
        `${item.label}: ${formatSayi(item.betonM3, 2)} m³ beton, ${formatSayi(
          item.donatiTon,
          2
        )} ton donatı, ${formatSayi(item.kalipM2, 2)} m² kalıp`
    ),
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Yardımcı Kaba İşler", y);
  y = drawWrappedLines(
    pdf,
    [
      ...result.yardimciMetrajlar.map(
        (item) => `${item.label}: ${formatSayi(item.quantity, item.unit === "m" ? 1 : 2)} ${item.unit}`
      ),
      `Yardımcı kaba iş bandı: ${formatTL(result.yardimciKabaIsBandi.expectedAmount)} (${formatYuzde(
        result.yardimciKabaIsBandi.expected
      )})`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Yardımcı İş Muhasebesi", y);
  y = drawWrappedLines(
    pdf,
    result.yardimciKabaIsDagilimi
      .slice(0, 3)
      .map(
        (item) =>
          `${item.label}: ${formatTL(item.amount)} (${formatYuzde(item.share)})`
      ),
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Karar Özeti", y);
  y = drawWrappedLines(
    pdf,
    result.kararOzetleri
      .slice(0, 4)
      .map((item) => `${item.title}: ${item.value} · ${item.note}`),
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Poz ve Fiyat Dayanakları", y);
  y = drawWrappedLines(
    pdf,
    [
      `${result.priceBook.entries.concreteC30_37.pozNo} · ${result.priceBook.entries.concreteC30_37.label} · ${formatM2Fiyat(
        result.betonBirimFiyat
      ).replace("/m²", "/m³")}`,
      `${result.priceBook.entries.rebar8To12.pozNo} ve ${result.priceBook.entries.rebar14To28.pozNo} · Ağırlıklı donatı birim fiyatı · ${formatTL(
        result.donatiBirimFiyat
      ).replace(" TL", " TL/ton")}`,
      `${result.priceBook.entries.formworkPlywood.pozNo} · ${result.priceBook.entries.formworkPlywood.label} · ${formatTL(
        result.kalipBirimFiyat
      ).replace(" TL", " TL/m²")}`,
      `Resmî sınıf: ${result.officialResult.row.sinifKodu} · ${result.officialResult.row.sinifAdi}`,
    ],
    y + 6
  );

  y += 3;
  drawSectionTitle(pdf, "Notlar", y);
  drawWrappedLines(
    pdf,
    [
      ...result.notes,
      ...result.warnings.map((warning) => warning.message),
      `Kaynak: ${result.priceBook.sourceLabel}`,
      `Kaynak bağlantısı: ${result.priceBook.sourceUrl}`,
      "Bu çıktı ön keşif / ön boyutlandırma içindir; statik proje, uygulama metrajı ve gerçek keşif yerine geçmez.",
    ],
    y + 6
  );

  return pdf;
}

export function openQuickQuantityPdfPreview(snapshot: QuickQuantityPdfSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("PDF önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const pdf = createQuickQuantityPdfDocument(snapshot);
  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("PDF önizleme sekmesi açılamadı.");
  }

  try {
    previewWindow.location.href = blobUrl;
  } catch (error) {
    previewWindow.close();
    URL.revokeObjectURL(blobUrl);
    throw error;
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

export function downloadQuickQuantityPdf(
  snapshot: QuickQuantityPdfSnapshot,
  filename: string
): void {
  const pdf = createQuickQuantityPdfDocument(snapshot);
  pdf.save(filename);
}

export function printQuickQuantityPdf(snapshot: QuickQuantityPdfSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("Yazdırma yalnızca tarayıcı ortamında kullanılabilir.");
  }

  const pdf = createQuickQuantityPdfDocument(snapshot);
  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("Yazdırma penceresi açılamadı.");
  }

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Tarayıcı PDF görüntüleyicisi baskı denetimini yeni sekmeye bırakabilir.
    }
  };

  window.setTimeout(triggerPrint, 1200);
  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60_000);
}
