import { jsPDF } from "jspdf";
import { PDF_SERIF_BOLD_BASE64, PDF_SERIF_REGULAR_BASE64 } from "./pdf-fonts.generated";
import { formatM2Fiyat, formatSayi, formatTL, formatYuzde } from "./core";
import type { OfficialCostResultSnapshot } from "./official-unit-costs";
import type {
  EstimatedConstructionAreaInput,
  EstimatedConstructionAreaResult,
} from "./modules/tahmini-insaat-alani/types";
import type { CalculationResultSnapshot } from "./types";

type PdfVariant = "calculation" | "official";
type PdfHighlightTone = "amber" | "blue" | "emerald" | "violet" | "slate";
type RgbColor = [number, number, number];
type PdfFontStyle = "normal" | "bold";

export interface PdfExportSectionRow {
  label: string;
  value: string;
}

export interface PdfExportSection {
  title: string;
  rows: PdfExportSectionRow[];
}

export interface PdfChartSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
  description?: string;
}

export interface PdfHighlight {
  label: string;
  value: string;
  helper?: string;
  tone?: PdfHighlightTone;
}

export interface PdfExportSnapshot {
  variant: PdfVariant;
  title: string;
  subtitle: string;
  generatedAt: string;
  highlights: PdfHighlight[];
  sections: PdfExportSection[];
  footnotes: string[];
  chart?: PdfChartSlice[];
}

export interface EstimatedConstructionAreaPdfSnapshot {
  input: EstimatedConstructionAreaInput;
  result: EstimatedConstructionAreaResult;
  profileLabel: string;
  formattedDate: string;
}

const PDF_FONT_FAMILY = "IBMPlexSerif";
const PAGE_MARGIN = 12;
const PAGE_TOP = 12;
const PAGE_BOTTOM = 14;
const SECTION_GAP = 7;
const OFFICIAL_MARGIN = 14;
const OFFICIAL_GAP = 6;
const OFFICIAL_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const COLORS = {
  background: [243, 247, 252] as RgbColor,
  card: [255, 255, 255] as RgbColor,
  border: [217, 226, 239] as RgbColor,
  ink: [15, 23, 42] as RgbColor,
  body: [51, 65, 85] as RgbColor,
  muted: [100, 116, 139] as RgbColor,
  softBlue: [232, 240, 254] as RgbColor,
  softAmber: [255, 243, 217] as RgbColor,
  softEmerald: [223, 248, 235] as RgbColor,
  softViolet: [239, 232, 255] as RgbColor,
  softSlate: [233, 238, 246] as RgbColor,
  accentBlue: [37, 99, 235] as RgbColor,
  accentAmber: [217, 119, 6] as RgbColor,
  accentEmerald: [5, 150, 105] as RgbColor,
  accentViolet: [124, 58, 237] as RgbColor,
  accentSlate: [71, 85, 105] as RgbColor,
  darkBlue: [15, 23, 42] as RgbColor,
  white: [255, 255, 255] as RgbColor,
  paper: [249, 248, 244] as RgbColor,
  paperBorder: [210, 216, 226] as RgbColor,
  officialBlue: [16, 44, 84] as RgbColor,
  officialAccent: [185, 106, 36] as RgbColor,
} as const;

function normalizePdfText(input: string): string {
  return input
    .replace(/\r?\n/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function formatOfficialDate(date = new Date()): string {
  return OFFICIAL_DATE_FORMATTER.format(date);
}

function getOfficialExampleTitle(result: OfficialCostResultSnapshot): string {
  return `${result.row.anaGrupKodu}. ${result.row.altGrupKodu} sınıfına giren yapılar`;
}

function getTonePalette(tone: PdfHighlightTone | undefined): {
  fill: RgbColor;
  text: RgbColor;
  accent: RgbColor;
} {
  switch (tone) {
    case "amber":
      return { fill: COLORS.softAmber, text: COLORS.ink, accent: COLORS.accentAmber };
    case "emerald":
      return { fill: COLORS.softEmerald, text: COLORS.ink, accent: COLORS.accentEmerald };
    case "violet":
      return { fill: COLORS.softViolet, text: COLORS.ink, accent: COLORS.accentViolet };
    case "slate":
      return { fill: COLORS.softSlate, text: COLORS.ink, accent: COLORS.accentSlate };
    case "blue":
    default:
      return { fill: COLORS.softBlue, text: COLORS.ink, accent: COLORS.accentBlue };
  }
}

function setFill(pdf: jsPDF, color: RgbColor) {
  pdf.setFillColor(color[0], color[1], color[2]);
}

function setStroke(pdf: jsPDF, color: RgbColor) {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

function setText(pdf: jsPDF, color: RgbColor) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function setFont(pdf: jsPDF, style: PdfFontStyle = "normal") {
  pdf.setFont(PDF_FONT_FAMILY, style);
}

function registerPdfFonts(pdf: jsPDF) {
  const fontRegistry = pdf as jsPDF & { __insaPdfFontsReady?: boolean };
  if (fontRegistry.__insaPdfFontsReady) {
    return;
  }

  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", PDF_FONT_FAMILY, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", PDF_FONT_FAMILY, "bold");
  fontRegistry.__insaPdfFontsReady = true;
}

function createPdfDocument(): jsPDF {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  registerPdfFonts(pdf);
  setFont(pdf);
  return pdf;
}

function openPdfBlobPreview(createDocument: () => jsPDF): void {
  if (typeof window === "undefined") {
    throw new Error("PDF önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const previewWindow = window.open("", "_blank");
  let blobUrl = "";

  if (!previewWindow) {
    throw new Error("PDF önizleme sekmesi açılamadı.");
  }

  try {
    const pdf = createDocument();
    const blob = pdf.output("blob");
    blobUrl = URL.createObjectURL(blob);
    previewWindow.location.href = blobUrl;
  } catch (error) {
    previewWindow.close();
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    throw error;
  }

  window.setTimeout(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }, 60_000);
}

function paintPageBackground(pdf: jsPDF, pageNumber: number) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  setFill(pdf, COLORS.background);
  pdf.rect(0, 0, width, height, "F");

  setText(pdf, COLORS.muted);
  setFont(pdf);
  pdf.setFontSize(8);
  pdf.text(`Sayfa ${pageNumber}`, width - PAGE_MARGIN, height - 6, { align: "right" });
}

function drawHero(pdf: jsPDF, snapshot: PdfExportSnapshot): number {
  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const heroY = PAGE_TOP;
  const heroHeight = 40;
  const accent = snapshot.variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;

  setFill(pdf, COLORS.darkBlue);
  pdf.roundedRect(PAGE_MARGIN, heroY, width, heroHeight, 8, 8, "F");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 6, heroY + 6, 38, 8, 4, 4, "F");

  setText(pdf, COLORS.white);
  setFont(pdf, "bold");
  pdf.setFontSize(8);
  pdf.text(
    snapshot.variant === "official" ? "RESMÎ REFERANS" : "MALİYET RAPORU",
    PAGE_MARGIN + 11,
    heroY + 11.5
  );

  pdf.setFontSize(20);
  pdf.text(normalizePdfText(snapshot.title), PAGE_MARGIN + 6, heroY + 23);

  setFont(pdf);
  pdf.setFontSize(9.5);
  pdf.text(
    pdf.splitTextToSize(normalizePdfText(snapshot.subtitle), width - 24),
    PAGE_MARGIN + 6,
    heroY + 30
  );

  setText(pdf, [210, 222, 255]);
  pdf.setFontSize(8.5);
  pdf.text(normalizePdfText(snapshot.generatedAt), PAGE_MARGIN + width - 6, heroY + 11.5, {
    align: "right",
  });

  return heroY + heroHeight + 8;
}

function drawContinuationHeader(pdf: jsPDF, snapshot: PdfExportSnapshot, pageNumber: number): number {
  paintPageBackground(pdf, pageNumber);

  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const accent = snapshot.variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;

  setFill(pdf, COLORS.darkBlue);
  pdf.roundedRect(PAGE_MARGIN, PAGE_TOP, width, 16, 6, 6, "F");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 4, PAGE_TOP + 4, 3, 8, 2, 2, "F");

  setText(pdf, COLORS.white);
  setFont(pdf, "bold");
  pdf.setFontSize(10);
  pdf.text(normalizePdfText(snapshot.title), PAGE_MARGIN + 11, PAGE_TOP + 10);

  setText(pdf, [210, 222, 255]);
  setFont(pdf);
  pdf.setFontSize(8);
  pdf.text(normalizePdfText(snapshot.subtitle), PAGE_MARGIN + width - 5, PAGE_TOP + 10, {
    align: "right",
  });

  return PAGE_TOP + 22;
}

function drawHighlightCards(pdf: jsPDF, highlights: PdfHighlight[], startY: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const cardGap = 5;
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - cardGap) / 2;
  const cardHeight = 23;
  const y = startY;

  highlights.slice(0, 4).forEach((highlight, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = PAGE_MARGIN + col * (cardWidth + cardGap);
    const top = y + row * (cardHeight + cardGap);
    const palette = getTonePalette(highlight.tone);

    setFill(pdf, palette.fill);
    pdf.roundedRect(x, top, cardWidth, cardHeight, 6, 6, "F");

    setFill(pdf, palette.accent);
    pdf.roundedRect(x + 3.5, top + 4, 2.5, cardHeight - 8, 1.5, 1.5, "F");

    setText(pdf, COLORS.muted);
    setFont(pdf, "bold");
    pdf.setFontSize(7.5);
    pdf.text(normalizePdfText(highlight.label.toLocaleUpperCase("tr-TR")), x + 9, top + 8);

    setText(pdf, palette.text);
    pdf.setFontSize(14);
    pdf.text(
      pdf.splitTextToSize(normalizePdfText(highlight.value), cardWidth - 16),
      x + 9,
      top + 15
    );

    if (highlight.helper) {
      setText(pdf, COLORS.muted);
      setFont(pdf);
      pdf.setFontSize(7.5);
      pdf.text(
        pdf.splitTextToSize(normalizePdfText(highlight.helper), cardWidth - 16),
        x + 9,
        top + 20
      );
    }
  });

  return y + Math.ceil(Math.min(highlights.length, 4) / 2) * (cardHeight + cardGap);
}

function getRowHeight(pdf: jsPDF, row: PdfExportSectionRow, labelWidth: number, valueWidth: number) {
  const labelLines = pdf.splitTextToSize(normalizePdfText(row.label), labelWidth);
  const valueLines = pdf.splitTextToSize(normalizePdfText(row.value), valueWidth);
  const maxLines = Math.max(labelLines.length, valueLines.length);

  return 5 + maxLines * 4.6;
}

function getSectionHeight(pdf: jsPDF, section: PdfExportSection, cardWidth: number) {
  const innerWidth = cardWidth - 18;
  const labelWidth = innerWidth * 0.34;
  const valueWidth = innerWidth - labelWidth - 8;
  let height = 18;

  for (const row of section.rows) {
    height += getRowHeight(pdf, row, labelWidth, valueWidth);
  }

  return height + Math.max(section.rows.length - 1, 0) * 4 + 10;
}

function drawSectionCard(pdf: jsPDF, section: PdfExportSection, y: number, variant: PdfVariant): number {
  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const height = getSectionHeight(pdf, section, width);
  const accent = variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;
  const innerWidth = width - 18;
  const labelWidth = innerWidth * 0.34;
  const valueWidth = innerWidth - labelWidth - 8;

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(PAGE_MARGIN, y, width, height, 7, 7, "FD");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 6, y + 3, width - 12, 2.5, 1.2, 1.2, "F");

  setText(pdf, COLORS.muted);
  setFont(pdf, "bold");
  pdf.setFontSize(8);
  pdf.text(normalizePdfText(section.title.toLocaleUpperCase("tr-TR")), PAGE_MARGIN + 9, y + 11);

  let cursorY = y + 18;

  section.rows.forEach((row, index) => {
    const labelLines = pdf.splitTextToSize(normalizePdfText(row.label), labelWidth);
    const valueLines = pdf.splitTextToSize(normalizePdfText(row.value), valueWidth);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = 5 + lineCount * 4.6;

    if (index > 0) {
      setStroke(pdf, COLORS.border);
      pdf.setLineWidth(0.2);
      pdf.line(PAGE_MARGIN + 8, cursorY, PAGE_MARGIN + width - 8, cursorY);
      cursorY += 4;
    }

    setText(pdf, COLORS.muted);
    setFont(pdf, "bold");
    pdf.setFontSize(8.5);
    pdf.text(labelLines, PAGE_MARGIN + 9, cursorY + 4.5);

    setText(pdf, COLORS.ink);
    setFont(pdf);
    pdf.setFontSize(9.5);
    pdf.text(valueLines, PAGE_MARGIN + 9 + labelWidth + 8, cursorY + 4.5);

    cursorY += rowHeight;
  });

  return y + height + SECTION_GAP;
}

function drawFootnotes(pdf: jsPDF, footnotes: string[], y: number, variant: PdfVariant) {
  if (footnotes.length === 0) {
    return;
  }

  const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
  const accent = variant === "official" ? COLORS.accentBlue : COLORS.accentAmber;
  let height = 18;

  footnotes.forEach((note) => {
    height += pdf.splitTextToSize(normalizePdfText(note), width - 18).length * 4.6;
  });

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(PAGE_MARGIN, y, width, height, 7, 7, "FD");

  setFill(pdf, accent);
  pdf.roundedRect(PAGE_MARGIN + 5, y + 5, 3, height - 10, 1.5, 1.5, "F");

  setText(pdf, COLORS.ink);
  setFont(pdf, "bold");
  pdf.setFontSize(9);
  pdf.text("Notlar", PAGE_MARGIN + 12, y + 11);

  let cursorY = y + 17;
  footnotes.forEach((note) => {
    const wrapped = pdf.splitTextToSize(normalizePdfText(note), width - 22);
    setText(pdf, COLORS.body);
    setFont(pdf);
    pdf.setFontSize(8.5);
    pdf.text(wrapped, PAGE_MARGIN + 12, cursorY);
    cursorY += wrapped.length * 4.6 + 2.5;
  });
}

function drawOfficialPaperBackground(pdf: jsPDF) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  setFill(pdf, COLORS.paper);
  pdf.rect(0, 0, width, height, "F");
  setStroke(pdf, COLORS.paperBorder);
  pdf.setLineWidth(0.35);
  pdf.rect(7, 7, width - 14, height - 14);
}

function drawOfficialBrandBlock(pdf: jsPDF, x: number, y: number) {
  setStroke(pdf, COLORS.officialBlue);
  pdf.setLineWidth(0.9);
  pdf.line(x, y + 5, x, y);
  pdf.line(x, y, x + 5, y);
  pdf.line(x + 8, y, x + 8, y + 5);
  pdf.line(x, y + 10, x, y + 15);
  pdf.line(x, y + 15, x + 5, y + 15);
  pdf.line(x + 8, y + 10, x + 8, y + 15);

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(10);
  pdf.text("İB", x + 1.4, y + 10.4);

  pdf.setLineWidth(0.2);
  setStroke(pdf, COLORS.paperBorder);
  pdf.line(x + 12, y, x + 12, y + 15);

  setText(pdf, COLORS.ink);
  pdf.setFontSize(15);
  pdf.text("İNŞA BLOG", x + 15, y + 6.5);

  setText(pdf, COLORS.muted);
  setFont(pdf);
  pdf.setFontSize(7.3);
  pdf.text("Mühendislik · Yapı · Analiz", x + 15, y + 12.5);
}

function drawOfficialDateCard(pdf: jsPDF, x: number, y: number, width: number, dateLabel: string) {
  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, 17, 5, 5, "FD");

  setText(pdf, COLORS.muted);
  setFont(pdf, "bold");
  pdf.setFontSize(7);
  pdf.text("Tarih", x + 5, y + 6.3);

  setText(pdf, COLORS.ink);
  pdf.setFontSize(10.5);
  pdf.text(dateLabel, x + 5, y + 12.1);
}

function drawOfficialTitleBlock(pdf: jsPDF, result: OfficialCostResultSnapshot, y: number): number {
  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(22);
  pdf.text("Resmî Birim Maliyet Raporu", OFFICIAL_MARGIN, y);

  setText(pdf, COLORS.body);
  setFont(pdf);
  pdf.setFontSize(10.5);
  pdf.text(
    normalizePdfText(`${result.row.sinifAdi} · ${result.row.sinifKodu}`),
    OFFICIAL_MARGIN,
    y + 6.5
  );

  return y + 12;
}

function drawOfficialMetricCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
) {
  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, 24, 5, 5, "FD");

  setFill(pdf, COLORS.officialAccent);
  pdf.roundedRect(x + 4, y + 4, 2.3, 16, 1.2, 1.2, "F");

  setText(pdf, COLORS.muted);
  setFont(pdf, "bold");
  pdf.setFontSize(7.1);
  pdf.text(normalizePdfText(label.toLocaleUpperCase("tr-TR")), x + 9, y + 7.5);

  setText(pdf, COLORS.ink);
  setFont(pdf, "bold");
  pdf.setFontSize(12.8);
  pdf.text(pdf.splitTextToSize(normalizePdfText(value), width - 18), x + 9, y + 15);
}

function drawOfficialMetricGrid(pdf: jsPDF, result: OfficialCostResultSnapshot, y: number): number {
  const width = pdf.internal.pageSize.getWidth() - OFFICIAL_MARGIN * 2;
  const cardGap = 6;
  const cardWidth = (width - cardGap) / 2;
  const metrics = [
    { label: "Resmî sınıf kodu", value: result.row.sinifKodu },
    { label: "Resmî m² birim maliyeti", value: formatM2Fiyat(result.row.m2BirimMaliyet) },
    { label: "Toplam inşaat alanı", value: `${result.toplamInsaatAlani.toLocaleString("tr-TR")} m²` },
    { label: "Toplam resmî maliyet", value: formatTL(result.resmiToplamMaliyet) },
  ];

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = OFFICIAL_MARGIN + col * (cardWidth + cardGap);
    const top = y + row * (24 + cardGap);
    drawOfficialMetricCard(pdf, x, top, cardWidth, metric.label, metric.value);
  });

  return y + 24 * 2 + cardGap;
}

function getOfficialSummaryCardHeight(pdf: jsPDF, rows: PdfExportSectionRow[], width: number): number {
  const innerWidth = width - 16;
  const labelWidth = innerWidth * 0.34;
  const valueWidth = innerWidth - labelWidth - 6;
  let height = 16;

  rows.forEach((row) => {
    const labelLines = pdf.splitTextToSize(normalizePdfText(row.label), labelWidth);
    const valueLines = pdf.splitTextToSize(normalizePdfText(row.value), valueWidth);
    height += Math.max(labelLines.length, valueLines.length) * 4.4 + 4.5;
  });

  return height + Math.max(rows.length - 1, 0) * 2 + 8;
}

function drawOfficialSummaryCard(pdf: jsPDF, x: number, y: number, width: number, rows: PdfExportSectionRow[]): number {
  const height = getOfficialSummaryCardHeight(pdf, rows, width);
  const innerWidth = width - 16;
  const labelWidth = innerWidth * 0.34;
  const valueWidth = innerWidth - labelWidth - 6;

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, height, 6, 6, "FD");

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(9);
  pdf.text("Resmî seçim özeti", x + 6, y + 10.5);

  let cursorY = y + 17;
  rows.forEach((row, index) => {
    const labelLines = pdf.splitTextToSize(normalizePdfText(row.label), labelWidth);
    const valueLines = pdf.splitTextToSize(normalizePdfText(row.value), valueWidth);
    const rowHeight = Math.max(labelLines.length, valueLines.length) * 4.4 + 4.5;

    if (index > 0) {
      setStroke(pdf, COLORS.paperBorder);
      pdf.setLineWidth(0.2);
      pdf.line(x + 5, cursorY, x + width - 5, cursorY);
      cursorY += 2.5;
    }

    setText(pdf, COLORS.muted);
    setFont(pdf, "bold");
    pdf.setFontSize(8);
    pdf.text(labelLines, x + 6, cursorY + 4.2);

    setText(pdf, COLORS.ink);
    setFont(pdf);
    pdf.setFontSize(8.8);
    pdf.text(valueLines, x + 6 + labelWidth + 6, cursorY + 4.2);

    cursorY += rowHeight;
  });

  return y + height;
}

function getOfficialExamplesCardHeight(pdf: jsPDF, examples: string[], width: number): number {
  let height = 16;
  examples.forEach((example) => {
    height += pdf.splitTextToSize(normalizePdfText(example), width - 18).length * 4.2 + 2;
  });
  return height + 8;
}

function drawOfficialExamplesCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  result: OfficialCostResultSnapshot
): number {
  const title = getOfficialExampleTitle(result);
  const examples = result.row.ornekYapilar.slice(0, 3);
  const height = getOfficialExamplesCardHeight(pdf, examples, width);

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, height, 6, 6, "FD");

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(8.5);
  pdf.text(pdf.splitTextToSize(title, width - 12), x + 6, y + 10.5);

  let cursorY = y + 17;
  examples.forEach((example, index) => {
    setFill(pdf, COLORS.officialAccent);
    pdf.circle(x + 6.5, cursorY - 1.3, 0.85, "F");

    setText(pdf, COLORS.body);
    setFont(pdf);
    pdf.setFontSize(8.1);
    const lines = pdf.splitTextToSize(normalizePdfText(example), width - 18);
    pdf.text(lines, x + 9, cursorY);
    cursorY += lines.length * 4.2 + (index === examples.length - 1 ? 0 : 2.2);
  });

  return y + height;
}

function drawOfficialSourceCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  result: OfficialCostResultSnapshot
): number {
  const height = 28;

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, height, 6, 6, "FD");

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(8.7);
  pdf.text("Kaynak", x + 6, y + 9.5);

  setText(pdf, COLORS.body);
  setFont(pdf);
  pdf.setFontSize(8.2);
  pdf.text(pdf.splitTextToSize(normalizePdfText(result.row.kaynakPdf), width - 12), x + 6, y + 16);

  return y + height;
}

function getOfficialNotesHeight(pdf: jsPDF, footnotes: string[], width: number): number {
  let height = 16;
  footnotes.forEach((note) => {
    height += pdf.splitTextToSize(normalizePdfText(note), width - 18).length * 4.2 + 2;
  });
  return height + 8;
}

function drawOfficialNotesCard(pdf: jsPDF, y: number, footnotes: string[]) {
  const width = pdf.internal.pageSize.getWidth() - OFFICIAL_MARGIN * 2;
  const height = getOfficialNotesHeight(pdf, footnotes, width);

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(OFFICIAL_MARGIN, y, width, height, 6, 6, "FD");

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(9);
  pdf.text("Notlar", OFFICIAL_MARGIN + 6, y + 10);

  let cursorY = y + 17;
  footnotes.forEach((note) => {
    setFill(pdf, COLORS.officialAccent);
    pdf.circle(OFFICIAL_MARGIN + 6.5, cursorY - 1.3, 0.85, "F");

    setText(pdf, COLORS.body);
    setFont(pdf);
    pdf.setFontSize(8.3);
    const lines = pdf.splitTextToSize(normalizePdfText(note), width - 18);
    pdf.text(lines, OFFICIAL_MARGIN + 9, cursorY);
    cursorY += lines.length * 4.2 + 2;
  });
}

function getOfficialInfoCardHeight(pdf: jsPDF, lines: string[], width: number): number {
  let height = 16;

  lines.forEach((line) => {
    height += pdf.splitTextToSize(normalizePdfText(line), width - 12).length * 4.2 + 2;
  });

  return height + 8;
}

function drawOfficialInfoCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  lines: string[]
): number {
  const height = getOfficialInfoCardHeight(pdf, lines, width);

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, height, 6, 6, "FD");

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(8.7);
  pdf.text(title, x + 6, y + 9.5);

  let cursorY = y + 16;
  lines.forEach((line) => {
    setText(pdf, COLORS.body);
    setFont(pdf);
    pdf.setFontSize(8.1);
    const wrapped = pdf.splitTextToSize(normalizePdfText(line), width - 12);
    pdf.text(wrapped, x + 6, cursorY);
    cursorY += wrapped.length * 4.2 + 2;
  });

  return y + height;
}

function drawEstimatedConstructionAreaTitleBlock(
  pdf: jsPDF,
  snapshot: EstimatedConstructionAreaPdfSnapshot,
  y: number
): number {
  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(22);
  pdf.text("Tahmini İnşaat Alanı Raporu", OFFICIAL_MARGIN, y);

  setText(pdf, COLORS.body);
  setFont(pdf);
  pdf.setFontSize(10.2);
  pdf.text(
    normalizePdfText(`${snapshot.profileLabel} · Emsalden toplam inşaat alanına ön fizibilite`),
    OFFICIAL_MARGIN,
    y + 6.5
  );

  return y + 12;
}

function drawEstimatedConstructionAreaMetricGrid(
  pdf: jsPDF,
  snapshot: EstimatedConstructionAreaPdfSnapshot,
  y: number
): number {
  const width = pdf.internal.pageSize.getWidth() - OFFICIAL_MARGIN * 2;
  const cardGap = 6;
  const cardWidth = (width - cardGap) / 2;
  const metrics = [
    {
      label: "Tahmini toplam inşaat alanı",
      value: `${formatSayi(snapshot.result.yaklasikToplamInsaatAlaniM2, 2)} m²`,
    },
    {
      label: "Emsal alanı",
      value: `${formatSayi(snapshot.result.emsalAreaM2, 2)} m²`,
    },
    {
      label: "Emsal harici ek alan",
      value: `${formatSayi(snapshot.result.emsalHariciEkAlanM2, 2)} m²`,
    },
    {
      label: "Toplam bodrum alanı",
      value: `${formatSayi(snapshot.result.toplamBodrumAlanM2, 2)} m²`,
    },
  ];

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = OFFICIAL_MARGIN + col * (cardWidth + cardGap);
    const top = y + row * (24 + cardGap);
    drawOfficialMetricCard(pdf, x, top, cardWidth, metric.label, metric.value);
  });

  return y + 24 * 2 + cardGap;
}

function createCalculationPdfDocument(snapshot: PdfExportSnapshot): jsPDF {
  const pdf = createPdfDocument();
  let pageNumber = 1;

  paintPageBackground(pdf, pageNumber);

  let y = drawHero(pdf, snapshot);
  y = drawHighlightCards(pdf, snapshot.highlights, y);
  y += 4;

  const pageHeight = pdf.internal.pageSize.getHeight();

  snapshot.sections.forEach((section) => {
    const needed = getSectionHeight(pdf, section, pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2);
    if (y + needed > pageHeight - PAGE_BOTTOM - 28) {
      pdf.addPage();
      pageNumber += 1;
      y = drawContinuationHeader(pdf, snapshot, pageNumber);
    }

    y = drawSectionCard(pdf, section, y, snapshot.variant);
  });

  const notesHeight = snapshot.footnotes.reduce((total, note) => {
    return total + pdf.splitTextToSize(normalizePdfText(note), pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2 - 18).length * 4.6;
  }, 24);

  if (y + notesHeight > pageHeight - PAGE_BOTTOM) {
    pdf.addPage();
    pageNumber += 1;
    y = drawContinuationHeader(pdf, snapshot, pageNumber);
  }

  drawFootnotes(pdf, snapshot.footnotes, y, snapshot.variant);

  return pdf;
}

export function buildCalculationPdfSnapshot(
  snapshot: CalculationResultSnapshot,
  officialBaseline?: OfficialCostResultSnapshot | null
): PdfExportSnapshot {
  const summaryRows: PdfExportSectionRow[] = [
    { label: "Yapı türü", value: snapshot.project.yapiTuru },
    {
      label: "Toplam inşaat alanı",
      value: `${snapshot.project.insaatAlani.toLocaleString("tr-TR")} m²`,
    },
    { label: "Kat adedi", value: String(snapshot.project.katAdedi) },
    { label: "Bağımsız bölüm", value: String(snapshot.project.bagimsizBolumSayisi) },
    { label: "Kalite seviyesi", value: snapshot.project.kaliteSeviyesi },
    { label: "Fiyat veri tarihi", value: snapshot.priceDate },
  ];

  const totalsRows: PdfExportSectionRow[] = [
    { label: "Net inşaat maliyeti", value: formatTL(snapshot.genelToplam) },
    {
      label: "Kaba işler",
      value: `${formatTL(snapshot.kabaIsToplamı)} (${(snapshot.kabaIsPct * 100).toFixed(1)}%)`,
    },
    {
      label: "İnce işler",
      value: `${formatTL(snapshot.inceIsToplamı)} (${(snapshot.inceIsPct * 100).toFixed(1)}%)`,
    },
    {
      label: "Diğer giderler",
      value: `${formatTL(snapshot.digerToplamı)} (${(snapshot.digerPct * 100).toFixed(1)}%)`,
    },
    { label: "Müteahhit kârı", value: formatTL(snapshot.muteahhitKariTutari) },
    { label: "KDV", value: formatTL(snapshot.kdvTutari) },
    { label: "Anahtar teslim satış", value: formatTL(snapshot.anahtarTeslimSatisFiyati) },
  ];

  const categoryRows: PdfExportSectionRow[] = snapshot.categories.map((category) => ({
    label: category.label,
    value: formatTL(category.altToplam),
  }));

  const sections: PdfExportSection[] = [
    { title: "Proje özeti", rows: summaryRows },
    { title: "Toplamlar", rows: totalsRows },
    { title: "Kategori dağılımı", rows: categoryRows },
  ];

  if (officialBaseline) {
    const fark = snapshot.genelToplam - officialBaseline.resmiToplamMaliyet;
    const farkPct =
      officialBaseline.resmiToplamMaliyet > 0
        ? (fark / officialBaseline.resmiToplamMaliyet) * 100
        : 0;

    sections.push({
      title: "Resmî birim maliyet karşılaştırması",
      rows: [
        { label: "Seçilen resmî sınıf", value: officialBaseline.row.sinifAdi },
        {
          label: "Resmî m² birim maliyeti",
          value: formatM2Fiyat(officialBaseline.row.m2BirimMaliyet),
        },
        { label: "Resmî toplam", value: formatTL(officialBaseline.resmiToplamMaliyet) },
        {
          label: "Detaylı hesap farkı",
          value: `${formatTL(fark)} (${farkPct.toFixed(1)}%)`,
        },
      ],
    });
  }

  return {
    variant: "calculation",
    title: "İnşaat Maliyeti Raporu",
    subtitle: "Detaylı kategori dağılımı ve toplu maliyet özeti",
    generatedAt: new Date().toLocaleString("tr-TR"),
    highlights: [
      {
        label: "Net maliyet",
        value: formatTL(snapshot.genelToplam),
        helper: "Sadece net proje toplamı",
        tone: "amber",
      },
      {
        label: "Anahtar teslim",
        value: formatTL(snapshot.anahtarTeslimSatisFiyati),
        helper: "Kâr ve KDV dahil",
        tone: "blue",
      },
      {
        label: "m² birim",
        value: formatM2Fiyat(snapshot.m2BasinaFiyat),
        helper: `${snapshot.project.insaatAlani.toLocaleString("tr-TR")} m² proje`,
        tone: "emerald",
      },
      {
        label: "Bölüm başı",
        value:
          snapshot.project.bagimsizBolumSayisi > 0
            ? formatTL(snapshot.bolumBasinaFiyat)
            : "Takip dışı",
        helper:
          snapshot.project.bagimsizBolumSayisi > 0
            ? `${snapshot.project.bagimsizBolumSayisi} bağımsız bölüm`
            : "Bölüm verisi girilmedi",
        tone: "violet",
      },
    ],
    sections,
    footnotes: [
      "Bu rapor referans amaçlıdır; piyasa tekliflerinin ve saha koşullarının yerini almaz.",
      "PDF raporu yapılandırılmış veri üzerinden üretilmiştir; ekran görüntüsü kullanılmaz.",
    ],
  };
}

export function buildOfficialCostPdfSnapshot(result: OfficialCostResultSnapshot): PdfExportSnapshot {
  return {
    variant: "official",
    title: "Resmî Birim Maliyet Raporu",
    subtitle: `${result.row.sinifKodu} · ${result.row.sinifAdi}`,
    generatedAt: formatOfficialDate(),
    highlights: [
      {
        label: "Resmî sınıf kodu",
        value: result.row.sinifKodu,
        helper: result.row.anaGrupAdi,
        tone: "blue",
      },
      {
        label: "Resmî m² birim maliyeti",
        value: formatM2Fiyat(result.row.m2BirimMaliyet),
        helper: "2026 tebliğ referansı",
        tone: "amber",
      },
      {
        label: "Toplam inşaat alanı",
        value: `${result.toplamInsaatAlani.toLocaleString("tr-TR")} m²`,
        helper: "Kullanıcı girdisi",
        tone: "emerald",
      },
      {
        label: "Toplam resmî maliyet",
        value: formatTL(result.resmiToplamMaliyet),
        helper: "Alan × resmî m² birim maliyeti",
        tone: "violet",
      },
    ],
    sections: [
      {
        title: "Resmî seçim özeti",
        rows: [
          { label: "Yıl", value: String(result.selection.yil) },
          { label: "Ana grup", value: result.row.anaGrupAdi },
          { label: "Alt grup / sınıf", value: result.row.sinifAdi },
          { label: "Resmî sınıf kodu", value: result.row.sinifKodu },
          { label: "Formül", value: result.formula },
          { label: "Kapsam", value: "Resmî yaklaşık birim maliyet referansı" },
        ],
      },
      {
        title: getOfficialExampleTitle(result),
        rows: result.row.ornekYapilar.map((item, index) => ({
          label: `Örnek ${index + 1}`,
          value: item,
        })),
      },
      {
        title: "Kaynak",
        rows: [{ label: "Tebliğ", value: result.row.kaynakPdf }],
      },
    ],
    footnotes: [
      "Bu değer resmî yaklaşık birim maliyettir; piyasa teklifi değildir.",
      result.row.not,
    ],
  };
}

export function createOfficialCostPdfDocument(result: OfficialCostResultSnapshot): jsPDF {
  const pdf = createPdfDocument();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const summaryWidth = 112;
  const sideWidth = pageWidth - OFFICIAL_MARGIN * 2 - summaryWidth - OFFICIAL_GAP;
  const summaryRows: PdfExportSectionRow[] = [
    { label: "Yıl", value: String(result.selection.yil) },
    { label: "Ana grup", value: result.row.anaGrupAdi },
    { label: "Alt grup / sınıf", value: result.row.sinifAdi },
    { label: "Resmî sınıf kodu", value: result.row.sinifKodu },
    { label: "Formül", value: result.formula },
    { label: "Kapsam", value: "Resmî yaklaşık birim maliyet referansı" },
  ];
  const footnotes = [
    "Bu belge resmî referans niteliğinde olup piyasa teklifi yerine geçmez.",
    result.row.not,
  ];

  drawOfficialPaperBackground(pdf);
  drawOfficialBrandBlock(pdf, OFFICIAL_MARGIN, 16);
  drawOfficialDateCard(pdf, pageWidth - OFFICIAL_MARGIN - 54, 14, 54, formatOfficialDate());

  let y = drawOfficialTitleBlock(pdf, result, 42);
  y = drawOfficialMetricGrid(pdf, result, y);
  y += OFFICIAL_GAP;

  const summaryBottom = drawOfficialSummaryCard(pdf, OFFICIAL_MARGIN, y, summaryWidth, summaryRows);
  const sourceBottom = drawOfficialSourceCard(pdf, OFFICIAL_MARGIN + summaryWidth + OFFICIAL_GAP, y, sideWidth, result);
  const exampleBottom = drawOfficialExamplesCard(
    pdf,
    OFFICIAL_MARGIN + summaryWidth + OFFICIAL_GAP,
    sourceBottom + OFFICIAL_GAP,
    sideWidth,
    result
  );
  const notesY = Math.max(summaryBottom, exampleBottom) + OFFICIAL_GAP;

  drawOfficialNotesCard(pdf, notesY, footnotes);

  return pdf;
}

export function createEstimatedConstructionAreaPdfDocument(
  snapshot: EstimatedConstructionAreaPdfSnapshot
): jsPDF {
  const pdf = createPdfDocument();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const summaryWidth = 112;
  const sideWidth = pageWidth - OFFICIAL_MARGIN * 2 - summaryWidth - OFFICIAL_GAP;
  const summaryRows: PdfExportSectionRow[] = [
    { label: "Net parsel alanı", value: `${formatSayi(snapshot.input.parcelAreaM2, 2)} m²` },
    { label: "TAKS", value: formatSayi(snapshot.input.taks, 2) },
    { label: "KAKS / emsal", value: formatSayi(snapshot.input.kaks, 2) },
    { label: "Normal kat sayısı", value: String(snapshot.input.normalFloorCount) },
    { label: "Kullanım profili", value: snapshot.profileLabel },
    {
      label: "Bodrum kat sayısı",
      value: snapshot.input.hasBasement ? String(snapshot.input.basementFloorCount) : "Yok",
    },
    {
      label: "Bodrum kat alanı kabulü",
      value: snapshot.input.hasBasement
        ? `${formatSayi(snapshot.result.resolvedBasementFloorAreaM2, 2)} m²`
        : "Yok",
    },
  ];
  const profileLines = [
    `${snapshot.profileLabel} profili için baz emsal harici artış oranı ${formatYuzde(snapshot.result.bazEmsalHariciOrani)} kabul edildi.`,
    `Kat adedi düzeltmesi ${formatYuzde(snapshot.result.katAdediDuzeltmesiOrani)} ile toplam oran ${formatYuzde(snapshot.result.emsalHariciEkAlanOrani)} seviyesine taşındı.`,
    "Ön fizibilite yaklaşımı, emsal dışı büyümeyi %30 üst sınırı altında tutar.",
  ];
  const formulaLines = [
    `${formatSayi(snapshot.input.parcelAreaM2, 2)} × ${formatSayi(snapshot.input.kaks, 2)} = ${formatSayi(snapshot.result.emsalAreaM2, 2)} m² emsal alanı`,
    `${formatSayi(snapshot.result.emsalAreaM2, 2)} × ${formatYuzde(snapshot.result.emsalHariciEkAlanOrani)} = ${formatSayi(snapshot.result.emsalHariciEkAlanM2, 2)} m² emsal harici ek alan`,
    snapshot.input.hasBasement
      ? `${snapshot.input.basementFloorCount} × ${formatSayi(snapshot.result.resolvedBasementFloorAreaM2, 2)} = ${formatSayi(snapshot.result.toplamBodrumAlanM2, 2)} m² toplam bodrum alanı`
      : "Bodrum katkısı bu senaryoda sıfır kabul edildi.",
    `${formatSayi(snapshot.result.emsalAreaM2, 2)} + ${formatSayi(snapshot.result.emsalHariciEkAlanM2, 2)} + ${formatSayi(snapshot.result.toplamBodrumAlanM2, 2)} = ${formatSayi(snapshot.result.yaklasikToplamInsaatAlaniM2, 2)} m² tahmini toplam`,
  ];
  const footnotes = [
    "Bu belge ruhsat hesabı değil, ön fizibilite amaçlı yaklaşık inşaat alanı raporudur.",
    ...snapshot.result.notes.slice(0, 3),
  ];

  drawOfficialPaperBackground(pdf);
  drawOfficialBrandBlock(pdf, OFFICIAL_MARGIN, 16);
  drawOfficialDateCard(
    pdf,
    pageWidth - OFFICIAL_MARGIN - 54,
    14,
    54,
    snapshot.formattedDate || formatOfficialDate()
  );

  let y = drawEstimatedConstructionAreaTitleBlock(pdf, snapshot, 42);
  y = drawEstimatedConstructionAreaMetricGrid(pdf, snapshot, y);
  y += OFFICIAL_GAP;

  const summaryBottom = drawOfficialSummaryCard(pdf, OFFICIAL_MARGIN, y, summaryWidth, summaryRows);
  const profileBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN + summaryWidth + OFFICIAL_GAP,
    y,
    sideWidth,
    "Profil varsayımı",
    profileLines
  );
  const formulaBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN + summaryWidth + OFFICIAL_GAP,
    profileBottom + OFFICIAL_GAP,
    sideWidth,
    "Hesap formülü",
    formulaLines
  );
  const notesY = Math.max(summaryBottom, formulaBottom) + OFFICIAL_GAP;

  drawOfficialNotesCard(pdf, notesY, footnotes);

  return pdf;
}

function drawConstructionCostTitleBlock(
  pdf: jsPDF,
  snapshot: PdfExportSnapshot,
  y: number
): number {
  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(22);
  pdf.text(normalizePdfText(snapshot.title), OFFICIAL_MARGIN, y);

  setText(pdf, COLORS.body);
  setFont(pdf);
  pdf.setFontSize(10.2);
  pdf.text(
    pdf.splitTextToSize(normalizePdfText(snapshot.subtitle), pdf.internal.pageSize.getWidth() - OFFICIAL_MARGIN * 2),
    OFFICIAL_MARGIN,
    y + 6.5
  );

  return y + 12;
}

function drawConstructionCostMetricGrid(
  pdf: jsPDF,
  snapshot: PdfExportSnapshot,
  y: number
): number {
  const width = pdf.internal.pageSize.getWidth() - OFFICIAL_MARGIN * 2;
  const cardGap = 6;
  const cardWidth = (width - cardGap) / 2;
  const metrics = snapshot.highlights.slice(0, 4).map((highlight) => ({
    label: highlight.label,
    value: highlight.value,
  }));

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = OFFICIAL_MARGIN + col * (cardWidth + cardGap);
    const top = y + row * (24 + cardGap);
    drawOfficialMetricCard(pdf, x, top, cardWidth, metric.label, metric.value);
  });

  return y + 24 * 2 + cardGap;
}

function sectionRowsToLines(section: PdfExportSection | undefined, limit = 6): string[] {
  if (!section) {
    return [];
  }

  return section.rows.slice(0, limit).map((row) => `${row.label}: ${row.value}`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseHexColor(color: string): RgbColor {
  const normalized = color.trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return COLORS.accentAmber;
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function buildConicGradient(chart: PdfChartSlice[] | undefined): string {
  if (!chart || chart.length === 0) {
    return "conic-gradient(#f59e0b 0deg 360deg)";
  }

  let cursor = 0;
  const stops = chart.map((slice) => {
    const start = cursor;
    const sweep = Math.max(0.2, slice.percent * 3.6);
    cursor += sweep;
    return `${slice.color} ${start.toFixed(2)}deg ${cursor.toFixed(2)}deg`;
  });

  if (cursor < 360) {
    stops.push(`${chart[chart.length - 1].color} ${cursor.toFixed(2)}deg 360deg`);
  }

  return `conic-gradient(${stops.join(", ")})`;
}

function getChartTotal(chart: PdfChartSlice[] | undefined): number {
  return chart?.reduce((total, slice) => total + Math.max(slice.value, 0), 0) ?? 0;
}

function drawPdfDonutChart(
  pdf: jsPDF,
  chart: PdfChartSlice[] | undefined,
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number
) {
  const chartTotal = getChartTotal(chart);

  if (!chart || chart.length === 0 || chartTotal <= 0) {
    setFill(pdf, COLORS.softAmber);
    pdf.circle(centerX, centerY, outerRadius, "F");
    setFill(pdf, COLORS.card);
    pdf.circle(centerX, centerY, innerRadius, "F");
    return;
  }

  let startAngle = -Math.PI / 2;

  chart.forEach((slice) => {
    const sweep = (Math.max(slice.value, 0) / chartTotal) * Math.PI * 2;
    const endAngle = startAngle + sweep;
    const steps = Math.max(4, Math.ceil(sweep / (Math.PI / 18)));
    const points: Array<[number, number]> = [[centerX, centerY]];

    for (let step = 0; step <= steps; step += 1) {
      const angle = startAngle + (sweep * step) / steps;
      points.push([
        centerX + Math.cos(angle) * outerRadius,
        centerY + Math.sin(angle) * outerRadius,
      ]);
    }

    const lineSegments = points.slice(1).map((point, index) => {
      const previous = points[index];
      return [point[0] - previous[0], point[1] - previous[1]];
    });

    setFill(pdf, parseHexColor(slice.color));
    pdf.lines(lineSegments, points[0][0], points[0][1], [1, 1], "F", true);
    startAngle = endAngle;
  });

  setFill(pdf, COLORS.card);
  pdf.circle(centerX, centerY, innerRadius, "F");
}

function drawConstructionCostChartCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  chart: PdfChartSlice[] | undefined
): number {
  const height = 70;

  setFill(pdf, COLORS.card);
  setStroke(pdf, COLORS.paperBorder);
  pdf.roundedRect(x, y, width, height, 6, 6, "FD");

  setText(pdf, COLORS.officialBlue);
  setFont(pdf, "bold");
  pdf.setFontSize(8.7);
  pdf.text("Maliyet dağılımı", x + 6, y + 9.5);

  drawPdfDonutChart(pdf, chart, x + 24, y + 36, 17, 10);

  const rows = (chart ?? []).slice(0, 6);
  let cursorY = y + 17;

  rows.forEach((slice) => {
    setFill(pdf, parseHexColor(slice.color));
    pdf.circle(x + 47, cursorY - 1.4, 1.1, "F");

    setText(pdf, COLORS.body);
    setFont(pdf);
    pdf.setFontSize(7.4);
    const label = normalizePdfText(slice.label);
    pdf.text(pdf.splitTextToSize(label, width - 62), x + 50, cursorY);

    setText(pdf, COLORS.ink);
    setFont(pdf, "bold");
    pdf.setFontSize(7.5);
    pdf.text(`%${slice.percent.toFixed(0)}`, x + width - 6, cursorY, { align: "right" });

    cursorY += 7.2;
  });

  return y + height;
}

function writeConstructionContinuationPage(pdf: jsPDF, snapshot: PdfExportSnapshot): number {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.addPage();
  drawOfficialPaperBackground(pdf);
  drawOfficialBrandBlock(pdf, OFFICIAL_MARGIN, 16);
  drawOfficialDateCard(pdf, pageWidth - OFFICIAL_MARGIN - 54, 14, 54, snapshot.generatedAt);

  return drawConstructionCostTitleBlock(
    pdf,
    {
      ...snapshot,
      subtitle: `${snapshot.subtitle} - devam`,
    },
    42
  );
}

export function createConstructionCostPdfDocument(snapshot: PdfExportSnapshot): jsPDF {
  const pdf = createPdfDocument();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const contentWidth = pageWidth - OFFICIAL_MARGIN * 2;
  const summaryWidth = 108;
  const sideWidth = contentWidth - summaryWidth - OFFICIAL_GAP;
  const projectSection = snapshot.sections[0];
  const breakdownSection = snapshot.sections[1];
  const topItemsSection = snapshot.sections[2];
  const driversSection = snapshot.sections[3];
  const comparisonSection = snapshot.sections[4];

  drawOfficialPaperBackground(pdf);
  drawOfficialBrandBlock(pdf, OFFICIAL_MARGIN, 16);
  drawOfficialDateCard(pdf, pageWidth - OFFICIAL_MARGIN - 54, 14, 54, snapshot.generatedAt);

  let y = drawConstructionCostTitleBlock(pdf, snapshot, 42);
  y = drawConstructionCostMetricGrid(pdf, snapshot, y);
  y += OFFICIAL_GAP;

  const summaryBottom = drawOfficialSummaryCard(
    pdf,
    OFFICIAL_MARGIN,
    y,
    summaryWidth,
    projectSection?.rows ?? []
  );
  const breakdownBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN + summaryWidth + OFFICIAL_GAP,
    y,
    sideWidth,
    breakdownSection?.title ?? "Maliyet kırılımı",
    sectionRowsToLines(breakdownSection, 4)
  );
  const topItemsBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN + summaryWidth + OFFICIAL_GAP,
    breakdownBottom + OFFICIAL_GAP,
    sideWidth,
    topItemsSection?.title ?? "En yüksek maliyet kalemleri",
    sectionRowsToLines(topItemsSection, 4)
  );

  const lowerY = Math.max(summaryBottom, topItemsBottom) + OFFICIAL_GAP;
  const halfWidth = (contentWidth - OFFICIAL_GAP) / 2;
  const chartBottom = drawConstructionCostChartCard(
    pdf,
    OFFICIAL_MARGIN,
    lowerY,
    halfWidth,
    snapshot.chart
  );
  const driversBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN + halfWidth + OFFICIAL_GAP,
    lowerY,
    halfWidth,
    driversSection?.title ?? "Etki sürücüleri",
    sectionRowsToLines(driversSection, 3)
  );

  let notesY = Math.max(chartBottom, driversBottom) + OFFICIAL_GAP;
  const comparisonBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN,
    notesY,
    contentWidth,
    comparisonSection?.title ?? "Karşılaştırma özeti",
    sectionRowsToLines(comparisonSection, 2)
  );

  notesY = comparisonBottom + OFFICIAL_GAP;
  const footnotes = snapshot.footnotes.slice(0, 4);
  const notesHeight = getOfficialNotesHeight(pdf, footnotes, contentWidth);

  if (notesY + notesHeight > pdf.internal.pageSize.getHeight() - 10) {
    notesY = writeConstructionContinuationPage(pdf, snapshot) + OFFICIAL_GAP;
  }

  drawOfficialNotesCard(pdf, notesY, footnotes);

  return pdf;
}

export function openOfficialCostPdfPreview(result: OfficialCostResultSnapshot): void {
  openPdfBlobPreview(() => createOfficialCostPdfDocument(result));
}

/**
 * Resmî birim maliyet raporu için düzenlenebilir HTML şablonu oluşturur.
 */
// PDF önizleme blob sekmesi kullandığı için bu düzenlenebilir HTML şablonu şimdilik yedek tutuluyor.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateOfficialCostHtml(result: OfficialCostResultSnapshot): string {
  const { row, selection, toplamInsaatAlani, resmiToplamMaliyet, formula } = result;
  const dateLabel = formatOfficialDate();

  const colors = {
    paper: "#F9F8F4",
    paperBorder: "#D2D8E2",
    officialBlue: "#102C54",
    officialAccent: "#B96A24",
    ink: "#0F172A",
    body: "#334155",
    muted: "#64748B",
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Resmî Birim Maliyet Raporu - ${dateLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;700&display=swap');
    :root {
      --paper-bg: ${colors.paper};
      --paper-border: ${colors.paperBorder};
      --official-blue: ${colors.officialBlue};
      --official-accent: ${colors.officialAccent};
      --ink: ${colors.ink};
      --body: ${colors.body};
      --muted: ${colors.muted};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #F1F5F9;
      font-family: 'IBM Plex Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--paper-bg);
      padding: 20mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      border: 1px solid var(--paper-border);
    }
    .paper::before {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 0.4mm solid var(--paper-border);
      pointer-events: none;
    }
    .toolbar {
      width: 210mm;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      background: white;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-primary { background: var(--official-blue); color: white; }
    .btn-secondary { background: #E2E8F0; color: var(--body); }
    
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .brand { display: flex; align-items: flex-start; gap: 15px; }
    .logo-mark {
      width: 10mm; height: 14mm;
      border-left: 1mm solid var(--official-blue);
      border-top: 1mm solid var(--official-blue);
      position: relative;
    }
    .logo-mark::after {
      content: 'İB';
      position: absolute; left: 1.5mm; top: 5mm;
      font-weight: 800; font-size: 11px; color: var(--official-blue);
    }
    .brand-text h2 { font-size: 16px; font-weight: 800; color: var(--ink); }
    .brand-text p { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .date-box {
      border: 1px solid var(--paper-border);
      background: white;
      padding: 5px 15px;
      border-radius: 6px;
      height: fit-content;
      font-size: 10px;
      font-weight: 700;
      color: var(--official-blue);
    }

    .title-area { margin-bottom: 25px; }
    .title-area h1 { font-family: 'IBM Plex Serif', serif; font-size: 26pt; color: var(--official-blue); margin-bottom: 6px; }
    .title-area p { font-size: 11pt; color: var(--body); }

    .grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; margin-bottom: 8mm; }
    .card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px 20px; }
    .card .label { font-size: 9pt; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
    .card .value { font-family: 'IBM Plex Serif', serif; font-size: 18pt; font-weight: 700; color: var(--official-blue); }

    .main-grid { display: grid; grid-template-columns: 112mm 1fr; gap: 6mm; margin-bottom: 8mm; }
    .section-card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; margin-bottom: 6mm; }
    .section-card h3 { font-size: 10pt; font-weight: 700; color: var(--official-blue); border-bottom: 1px solid var(--paper-border); padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; }
    .data-row { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 6px; }
    .data-row .l { color: var(--muted); }
    .data-row .v { font-weight: 700; color: var(--ink); text-align: right; }
    .notes { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; }
    .notes h3 { font-size: 9pt; font-weight: 700; color: var(--official-blue); margin-bottom: 10px; }
    .notes ul { list-style: none; }
    .notes li { font-size: 8.5pt; color: var(--muted); margin-bottom: 5px; position: relative; padding-left: 15px; }
    .notes li::before { content: '•'; position: absolute; left: 0; color: var(--official-accent); }

    [contenteditable="true"]:hover { outline: 1px dashed var(--official-accent); background: rgba(0,0,0,0.02); }
    [contenteditable="true"]:focus { outline: 2px solid var(--official-accent); background: white; }

    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .paper { box-shadow: none; border: none; padding: 15mm; margin: 0; }
      .paper::before { inset: 5mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 10px; height: 10px; background: var(--official-accent); border-radius: 50%;"></div>
      <span style="font-size: 13px; font-weight: 600; color: var(--body);">Düzenlenebilir Resmî Rapor</span>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" onclick="window.close()">Kapat</button>
      <button class="btn btn-primary" onclick="window.print()">Yazdır veya PDF Kaydet</button>
    </div>
  </div>

  <div class="paper">
    <div class="header">
      <div class="brand">
        <div class="logo-mark"></div>
        <div class="brand-text">
          <h2 contenteditable="true">İNŞA BLOG</h2>
          <p contenteditable="true">Mühendislik · Yapı · Analiz</p>
        </div>
      </div>
      <div class="date-box" contenteditable="true">${dateLabel}</div>
    </div>

    <div class="title-area">
      <h1 contenteditable="true">Resmî Birim Maliyet Raporu</h1>
      <p contenteditable="true">${row.sinifAdi} · ${row.sinifKodu}</p>
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="label" contenteditable="true">Resmî Sınıf Kodu</div>
        <div class="value" contenteditable="true">${row.sinifKodu}</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Resmî m² Birim Maliyeti</div>
        <div class="value" contenteditable="true">${formatM2Fiyat(row.m2BirimMaliyet)}</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Toplam İnşaat Alanı</div>
        <div class="value" contenteditable="true">${toplamInsaatAlani.toLocaleString('tr-TR')} m²</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Toplam Resmî Maliyet</div>
        <div class="value" contenteditable="true">${formatTL(resmiToplamMaliyet)}</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="col-left">
        <div class="section-card">
          <h3 contenteditable="true">Resmî Seçim Özeti</h3>
          <div class="data-row"><span class="l" contenteditable="true">Yıl</span><span class="v" contenteditable="true">${selection.yil}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Ana Grup</span><span class="v" contenteditable="true">${row.anaGrupAdi}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Alt Grup / Sınıf</span><span class="v" contenteditable="true">${row.sinifAdi}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Hesap Formülü</span><span class="v" contenteditable="true">${formula}</span></div>
        </div>
      </div>
      <div class="col-right">
        <div class="section-card">
          <h3 contenteditable="true">${row.anaGrupKodu}. ${row.altGrupKodu} Sınıfına Giren Yapılar</h3>
          ${row.ornekYapilar.slice(0, 3).map((ex, i) => `
            <div class="data-row">
              <span class="l" contenteditable="true">Örnek ${i + 1}</span>
              <span class="v" contenteditable="true">${ex}</span>
            </div>
          `).join('')}
        </div>
        <div class="section-card">
          <h3 contenteditable="true">Kaynak</h3>
          <div class="data-row">
            <span class="v" style="text-align: left; font-size: 8pt;" contenteditable="true">${row.kaynakPdf}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="notes">
      <h3 contenteditable="true">Notlar</h3>
      <ul>
        <li contenteditable="true">Bu belge resmî referans niteliğinde olup piyasa teklifi yerine geçmez.</li>
        <li contenteditable="true">${row.not}</li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;
}

export function downloadOfficialCostPdf(result: OfficialCostResultSnapshot, filename: string): void {
  const pdf = createOfficialCostPdfDocument(result);
  pdf.save(filename);
}

/**
 * İnşaat maliyeti analiz raporunu tarayıcıda düzenlenebilir bir HTML penceresi olarak açar.
 * Bu pencere "contenteditable" özelliğine sahiptir, böylece kullanıcılar yazdırmadan önce metinleri düzenleyebilir.
 */
export function openConstructionCostPdfPreview(snapshot: PdfExportSnapshot): void {
  openPdfBlobPreview(() => createConstructionCostPdfDocument(snapshot));
}

/**
 * Rapor için düzenlenebilir HTML şablonu oluşturur.
 */
// PDF önizleme blob sekmesi kullandığı için bu düzenlenebilir HTML şablonu şimdilik yedek tutuluyor.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateConstructionCostHtml(snapshot: PdfExportSnapshot): string {
  const { title, subtitle, generatedAt, highlights, sections, footnotes } = snapshot;

  const projectSection = sections[0];
  const breakdownSection = sections[1];
  const topItemsSection = sections[2];
  const driversSection = sections[3];
  const comparisonSection = sections[4];
  const chartGradient = buildConicGradient(snapshot.chart);
  const chartRows = snapshot.chart ?? [];

  const colors = {
    paper: "#F9F8F4",
    paperBorder: "#D2D8E2",
    officialBlue: "#102C54",
    officialAccent: "#B96A24",
    ink: "#0F172A",
    body: "#334155",
    muted: "#64748B",
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${generatedAt}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;700&display=swap');
    :root {
      --paper-bg: ${colors.paper};
      --paper-border: ${colors.paperBorder};
      --official-blue: ${colors.officialBlue};
      --official-accent: ${colors.officialAccent};
      --ink: ${colors.ink};
      --body: ${colors.body};
      --muted: ${colors.muted};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #F1F5F9;
      font-family: 'IBM Plex Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--paper-bg);
      padding: 20mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      border: 1px solid var(--paper-border);
    }
    .paper::before {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 0.4mm solid var(--paper-border);
      pointer-events: none;
    }
    .toolbar {
      width: 210mm;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      background: white;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-primary { background: var(--official-blue); color: white; }
    .btn-secondary { background: #E2E8F0; color: var(--body); }
    
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .brand { display: flex; align-items: flex-start; gap: 15px; }
    .logo-mark {
      width: 10mm; height: 14mm;
      border-left: 1mm solid var(--official-blue);
      border-top: 1mm solid var(--official-blue);
      position: relative;
    }
    .logo-mark::after {
      content: 'İB';
      position: absolute; left: 1.5mm; top: 5mm;
      font-weight: 800; font-size: 11px; color: var(--official-blue);
    }
    .brand-text h2 { font-size: 16px; font-weight: 800; color: var(--ink); }
    .brand-text p { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .date-box {
      border: 1px solid var(--paper-border);
      background: white;
      padding: 5px 15px;
      border-radius: 6px;
      height: fit-content;
      font-size: 10px;
      font-weight: 700;
      color: var(--official-blue);
    }

    .title-area { margin-bottom: 25px; }
    .title-area h1 { font-family: 'IBM Plex Serif', serif; font-size: 26pt; color: var(--official-blue); margin-bottom: 6px; }
    .title-area p { font-size: 11pt; color: var(--body); }

    .grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; margin-bottom: 8mm; }
    .card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px 20px; }
    .card .label { font-size: 9pt; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
    .card .value { font-family: 'IBM Plex Serif', serif; font-size: 18pt; font-weight: 700; color: var(--official-blue); }

    .main-grid { display: grid; grid-template-columns: 105mm 1fr; gap: 6mm; margin-bottom: 8mm; }
    .section-card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; margin-bottom: 6mm; }
    .section-card h3 { font-size: 10pt; font-weight: 700; color: var(--official-blue); border-bottom: 1px solid var(--paper-border); padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; }
    .data-row { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 6px; }
    .data-row .l { color: var(--muted); }
    .data-row .v { font-weight: 700; color: var(--ink); text-align: right; }
    .chart-wrap { display: grid; grid-template-columns: 34mm 1fr; gap: 7mm; align-items: center; }
    .donut {
      width: 32mm;
      height: 32mm;
      border-radius: 50%;
      background: ${chartGradient};
      position: relative;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
    }
    .donut::after {
      content: '';
      position: absolute;
      inset: 9mm;
      border-radius: 50%;
      background: white;
      box-shadow: inset 0 0 0 1px var(--paper-border);
    }
    .legend-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 8.2pt; margin-bottom: 5px; }
    .legend-label { display: inline-flex; align-items: center; gap: 6px; color: var(--body); min-width: 0; }
    .legend-dot { width: 7px; height: 7px; border-radius: 999px; flex: 0 0 auto; }
    .legend-percent { color: var(--ink); font-weight: 700; }

    .notes { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; }
    .notes h3 { font-size: 9pt; font-weight: 700; color: var(--official-blue); margin-bottom: 10px; }
    .notes ul { list-style: none; }
    .notes li { font-size: 8.5pt; color: var(--muted); margin-bottom: 5px; position: relative; padding-left: 15px; }
    .notes li::before { content: '•'; position: absolute; left: 0; color: var(--official-accent); }

    [contenteditable="true"]:hover { outline: 1px dashed var(--official-accent); background: rgba(0,0,0,0.02); }
    [contenteditable="true"]:focus { outline: 2px solid var(--official-accent); background: white; }

    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .paper { box-shadow: none; border: none; padding: 15mm; margin: 0; }
      .paper::before { inset: 5mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 10px; height: 10px; background: var(--official-accent); border-radius: 50%;"></div>
      <span style="font-size: 13px; font-weight: 600; color: var(--body);">Düzenlenebilir Rapor Önizlemesi</span>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" onclick="window.close()">Kapat</button>
      <button class="btn btn-primary" onclick="window.print()">Yazdır veya PDF Kaydet</button>
    </div>
  </div>

  <div class="paper">
    <div class="header">
      <div class="brand">
        <div class="logo-mark"></div>
        <div class="brand-text">
          <h2 contenteditable="true">İNŞA BLOG</h2>
          <p contenteditable="true">Mühendislik · Yapı · Analiz</p>
        </div>
      </div>
      <div class="date-box" contenteditable="true">${generatedAt}</div>
    </div>

    <div class="title-area">
      <h1 contenteditable="true">${title}</h1>
      <p contenteditable="true">${subtitle}</p>
    </div>

    <div class="grid-4">
      ${highlights.slice(0, 4).map(h => `
        <div class="card">
          <div class="label" contenteditable="true">${h.label}</div>
          <div class="value" contenteditable="true">${h.value}</div>
        </div>
      `).join('')}
    </div>

    <div class="main-grid">
      <div class="col-left">
        <div class="section-card">
          <h3 contenteditable="true">Maliyet Dağılımı</h3>
          <div class="chart-wrap">
            <div class="donut" aria-label="Maliyet dağılımı pasta grafiği"></div>
            <div>
              ${chartRows.slice(0, 6).map(r => `
                <div class="legend-row">
                  <span class="legend-label"><span class="legend-dot" style="background:${r.color}"></span><span contenteditable="true">${escapeHtml(r.label)}</span></span>
                  <span class="legend-percent" contenteditable="true">%${r.percent.toFixed(0)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="section-card">
          <h3 contenteditable="true">${projectSection?.title || 'Proje Özeti'}</h3>
          ${(projectSection?.rows || []).map(r => `
            <div class="data-row">
              <span class="l" contenteditable="true">${r.label}</span>
              <span class="v" contenteditable="true">${r.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="col-right">
        <div class="section-card">
          <h3 contenteditable="true">${breakdownSection?.title || 'Maliyet Kırılımı'}</h3>
          ${(breakdownSection?.rows || []).slice(0, 4).map(r => `
            <div class="data-row">
              <span class="l" contenteditable="true">${r.label}</span>
              <span class="v" contenteditable="true">${r.value}</span>
            </div>
          `).join('')}
        </div>
        <div class="section-card">
          <h3 contenteditable="true">${topItemsSection?.title || 'En Yüksek Kalemler'}</h3>
          ${(topItemsSection?.rows || []).slice(0, 4).map(r => `
            <div class="data-row">
              <span class="l" contenteditable="true">${r.label}</span>
              <span class="v" contenteditable="true">${r.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 8mm;">
      <div class="section-card">
        <h3 contenteditable="true">${driversSection?.title || 'Etki Sürücüleri'}</h3>
        ${(driversSection?.rows || []).slice(0, 3).map(r => `
          <div class="data-row">
            <span class="l" contenteditable="true">${r.label}</span>
            <span class="v" contenteditable="true">${r.value}</span>
          </div>
        `).join('')}
      </div>
      <div class="section-card">
        <h3 contenteditable="true">${comparisonSection?.title || 'Karşılaştırma'}</h3>
        ${(comparisonSection?.rows || []).slice(0, 3).map(r => `
          <div class="data-row">
            <span class="l" contenteditable="true">${r.label}</span>
            <span class="v" contenteditable="true">${r.value}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="notes">
      <h3 contenteditable="true">Notlar ve Dayanaklar</h3>
      <ul>
        ${footnotes.slice(0, 4).map(f => `
          <li contenteditable="true">${f}</li>
        `).join('')}
      </ul>
    </div>
  </div>
</body>
</html>
  `;
}

function buildConstructionImagePayload(snapshot: PdfExportSnapshot) {
  const projectSection = snapshot.sections[0];
  const breakdownSection = snapshot.sections[1];
  const macroSection = snapshot.sections[2];
  const breakdownRows = (snapshot.chart ?? []).map((slice, index) => ({
    label: slice.label,
    description: slice.description ?? "",
    color: slice.color,
    percent: slice.percent,
    value: breakdownSection?.rows[index]?.value ?? "",
  }));

  return {
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    generatedAt: snapshot.generatedAt,
    highlights: snapshot.highlights,
    projectRows: (projectSection?.rows ?? []).slice(0, 8),
    breakdownRows,
    macroRows: (macroSection?.rows ?? []).slice(0, 6),
    footnotes: snapshot.footnotes.slice(0, 6),
    chart: snapshot.chart ?? [],
  };
}

function generateConstructionCostImagePreviewHtml(
  snapshot: PdfExportSnapshot,
  filename: string
): string {
  const payloadJson = JSON.stringify(buildConstructionImagePayload(snapshot)).replace(
    /</g,
    "\\u003c"
  );
  const filenameJson = JSON.stringify(filename);

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(snapshot.title)} - Görsel Önizleme</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #e2e8f0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0f172a;
      padding: 28px 16px 44px;
    }
    .toolbar {
      width: min(100%, 980px);
      margin: 0 auto 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border: 1px solid #dbe4ef;
      border-radius: 16px;
      background: #fff;
      padding: 12px 16px;
      box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
    }
    .toolbar-title { font-size: 13px; font-weight: 800; color: #334155; }
    .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .btn {
      border: 0;
      border-radius: 10px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
    }
    .btn-primary { background: #102c54; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .canvas-wrap {
      width: min(100%, 980px);
      margin: 0 auto;
      overflow: auto;
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
      background: white;
    }
    canvas { display: block; width: 100%; height: auto; background: white; }
    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .canvas-wrap { width: 100%; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-title">Kaydedilebilir görsel önizleme</div>
    <div class="toolbar-actions">
      <button class="btn btn-secondary" type="button" onclick="window.close()">Kapat</button>
      <button class="btn btn-secondary" type="button" onclick="window.print()">Yazdır</button>
      <button class="btn btn-primary" type="button" id="download-png">PNG indir</button>
    </div>
  </div>
  <div class="canvas-wrap">
    <canvas id="report-canvas" width="1400" height="1600" aria-label="İnşaat maliyeti rapor görseli"></canvas>
  </div>
  <script>
    const payload = ${payloadJson};
    const filename = ${filenameJson};
    const canvas = document.getElementById("report-canvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    function roundedRect(x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }

    function card(x, y, w, h, fill, stroke, radius = 24) {
      roundedRect(x, y, w, h, radius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    function setFont(size, weight = 500, family = "Segoe UI") {
      ctx.font = weight + " " + size + "px " + family + ", Arial, sans-serif";
    }

    function drawText(text, x, y, size, color, weight = 500, align = "left") {
      setFont(size, weight);
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.fillText(String(text ?? ""), x, y);
      ctx.textAlign = "left";
    }

    function fittedFontSize(text, maxWidth, size, weight = 500, minSize = 10) {
      let nextSize = size;
      setFont(nextSize, weight);
      while (nextSize > minSize && ctx.measureText(String(text ?? "")).width > maxWidth) {
        nextSize -= 1;
        setFont(nextSize, weight);
      }
      return nextSize;
    }

    function drawFittedText(text, x, y, maxWidth, size, color, weight = 500, align = "left", minSize = 10) {
      const nextSize = fittedFontSize(text, maxWidth, size, weight, minSize);
      drawText(text, x, y, nextSize, color, weight, align);
      return nextSize;
    }

    function wrapText(text, maxWidth, size, weight = 500) {
      setFont(size, weight);
      const words = String(text ?? "").split(/\\s+/).filter(Boolean);
      const lines = [];
      let line = "";
      for (const word of words) {
        const next = line ? line + " " + word : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else if (!line && ctx.measureText(word).width > maxWidth) {
          let chunk = "";
          for (const char of word) {
            const nextChunk = chunk + char;
            if (ctx.measureText(nextChunk).width > maxWidth && chunk) {
              lines.push(chunk);
              chunk = char;
            } else {
              chunk = nextChunk;
            }
          }
          line = chunk;
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    function drawWrapped(text, x, y, maxWidth, size, color, weight = 500, lineHeight = size * 1.35, maxLines = 3) {
      const lines = wrapText(text, maxWidth, size, weight).slice(0, maxLines);
      lines.forEach((line, index) => drawText(line, x, y + index * lineHeight, size, color, weight));
      return y + lines.length * lineHeight;
    }

    function drawDonut(slices, cx, cy, outerR, innerR) {
      const total = slices.reduce((sum, slice) => sum + Math.max(Number(slice.value) || 0, 0), 0);
      let start = -Math.PI / 2;
      for (const slice of slices) {
        const value = Math.max(Number(slice.value) || 0, 0);
        const end = start + (total > 0 ? (value / total) * Math.PI * 2 : Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, start, end);
        ctx.closePath();
        ctx.fillStyle = slice.color || "#f59e0b";
        ctx.fill();
        start = end;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }

    function drawHeader() {
      drawText(payload.title, 120, 82, 31, "#020617", 900);
      drawText(payload.generatedAt, 120, 122, 16, "#64748b", 500);
      drawText("muhendislik-site.vercel.app", 1280, 86, 15, "#64748b", 500, "right");
      drawText("Ön Boyutlandırma Amaçlıdır", 1280, 112, 15, "#64748b", 500, "right");
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 168);
      ctx.lineTo(1280, 168);
      ctx.stroke();
    }

    function drawTotalCard() {
      const total = payload.highlights[0] || { label: "Toplam", value: "-" };
      const unit = payload.highlights[1] || { value: "" };
      const range = payload.highlights[2] || { value: "" };
      card(120, 220, 360, 235, "#fff7ed", "#fcd34d", 28);
      drawText(total.label.toLocaleUpperCase("tr-TR"), 150, 250, 14, "#ea580c", 900);
      drawFittedText(total.value, 150, 292, 300, 40, "#020617", 900, "left", 28);
      drawFittedText(unit.value, 150, 345, 300, 18, "#64748b", 600, "left", 13);
      ctx.strokeStyle = "#fde68a";
      ctx.beginPath();
      ctx.moveTo(150, 386);
      ctx.lineTo(450, 386);
      ctx.stroke();
      card(150, 408, 135, 50, "#ecfdf5", "#d1fae5", 14);
      card(305, 408, 145, 50, "#fff1f2", "#ffe4e6", 14);
      const rangeParts = String(range.value || "").split("/");
      drawText("İyimser", 165, 420, 12, "#059669", 900);
      drawFittedText(rangeParts[0]?.trim() || "-", 165, 438, 105, 15, "#047857", 900, "left", 11);
      drawText("Kötümser", 320, 420, 12, "#e11d48", 900);
      drawFittedText(rangeParts[1]?.trim() || "-", 320, 438, 110, 15, "#be123c", 900, "left", 11);
    }

    function drawChartCard() {
      card(120, 480, 360, 410, "#ffffff", "#e2e8f0", 28);
      drawText("MALİYET DAĞILIMI", 150, 512, 14, "#64748b", 900);
      drawDonut(payload.chart, 300, 636, 86, 52);
      let y = 755;
      for (const slice of payload.chart.slice(0, 6)) {
        ctx.beginPath();
        ctx.arc(150, y + 9, 6, 0, Math.PI * 2);
        ctx.fillStyle = slice.color;
        ctx.fill();
        drawWrapped(slice.label, 168, y, 210, 14, "#334155", 600, 18, 1);
        drawText("%" + Math.round(slice.percent), 450, y, 14, "#0f172a", 800, "right");
        y += 32;
      }
    }

    function drawProjectCard() {
      card(120, 915, 360, 360, "#ffffff", "#e2e8f0", 28);
      drawText("PROJE ÖZETİ", 150, 947, 14, "#64748b", 900);
      let y = 990;
      for (const row of payload.projectRows) {
        drawText(row.label, 150, y, 15, "#64748b", 500);
        const valueLines = wrapText(row.value, 150, 14, 800).slice(0, 2);
        valueLines.forEach((line, index) => {
          drawText(line, 450, y + index * 17, 14, "#0f172a", 800, "right");
        });
        ctx.strokeStyle = "#f1f5f9";
        ctx.beginPath();
        ctx.moveTo(150, y + 29);
        ctx.lineTo(450, y + 29);
        ctx.stroke();
        y += 41;
      }
    }

    function drawBreakdownCard() {
      card(506, 220, 774, 670, "#ffffff", "#e2e8f0", 28);
      roundedRect(506, 220, 774, 58, 28);
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      drawText("DETAYLI MALİYET KIRILIMI", 536, 244, 14, "#64748b", 900);
      let y = 310;
      for (const row of payload.breakdownRows.slice(0, 6)) {
        ctx.beginPath();
        ctx.arc(536, y + 10, 8, 0, Math.PI * 2);
        ctx.fillStyle = row.color;
        ctx.fill();
        drawFittedText(row.label, 560, y, 430, 19, "#0f172a", 800, "left", 14);
        drawWrapped(row.description, 560, y + 27, 420, 13, "#64748b", 500, 17, 1);
        drawFittedText(row.value.split("(")[0].trim(), 1250, y, 235, 18, "#020617", 900, "right", 13);
        drawText("%" + row.percent.toFixed(1), 1250, y + 27, 13, "#f97316", 800, "right");
        roundedRect(536, y + 61, 690, 7, 4);
        ctx.fillStyle = "#eef2f7";
        ctx.fill();
        roundedRect(536, y + 61, Math.max(8, 690 * row.percent / 100), 7, 4);
        ctx.fillStyle = row.color;
        ctx.fill();
        y += 92;
      }
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(506, 830, 774, 60);
      drawText("TOPLAM", 536, 850, 19, "#020617", 900);
      drawFittedText(payload.highlights[0]?.value || "-", 1250, 846, 270, 25, "#ea580c", 900, "right", 18);
    }

    function drawMacroCards() {
      const colors = [
        ["#eff6ff", "#bfdbfe", "#1d4ed8"],
        ["#f8fafc", "#e2e8f0", "#334155"],
        ["#fff7ed", "#fed7aa", "#c2410c"],
      ];
      payload.macroRows.slice(0, 3).forEach((row, index) => {
        const x = 506 + index * 260;
        const [fill, stroke, textColor] = colors[index] || colors[0];
        card(x, 915, 238, 120, fill, stroke, 22);
        drawText(row.label.toLocaleUpperCase("tr-TR"), x + 22, 938, 14, textColor, 900);
        drawFittedText(row.value, x + 22, 968, 190, 24, textColor, 900, "left", 15);
      });
    }

    function drawNotes() {
      card(506, 1060, 774, 250, "#fffbeb", "#fcd34d", 24);
      drawText("VARSAYIMLAR VE NOTLAR", 536, 1090, 14, "#b45309", 900);
      let y = 1128;
      for (const note of payload.footnotes) {
        drawText("•", 536, y, 16, "#f59e0b", 900);
        y = drawWrapped(note, 558, y, 675, 14, "#92400e", 500, 21, 2) + 3;
      }
    }

    function drawFooter() {
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(120, 1370);
      ctx.lineTo(1280, 1370);
      ctx.stroke();
      drawWrapped(
        "Bu rapor muhendislik-site.vercel.app tarafından otomatik üretilmiştir. Ön boyutlandırma amaçlıdır; kesin teklif için müteahhit ile iletişime geçiniz.",
        258,
        1400,
        884,
        14,
        "#94a3b8",
        500,
        18,
        2
      );
    }

    function render() {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      drawHeader();
      drawTotalCard();
      drawChartCard();
      drawProjectCard();
      drawBreakdownCard();
      drawMacroCards();
      drawNotes();
      drawFooter();
    }

    function downloadPng() {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    }

    render();
    document.getElementById("download-png").addEventListener("click", downloadPng);
  </script>
</body>
</html>
  `;
}

export function openConstructionCostImagePreview(
  snapshot: PdfExportSnapshot,
  filename = "insaat-maliyeti-onizleme.png"
): void {
  if (typeof window === "undefined") {
    throw new Error("Görsel önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    throw new Error("Önizleme penceresi açılamadı. Lütfen pop-up engelleyicisini kontrol edin.");
  }

  const html = generateConstructionCostImagePreviewHtml(snapshot, filename);
  previewWindow.document.write(html);
  previewWindow.document.close();
}

export function downloadConstructionCostPdf(
  snapshot: PdfExportSnapshot,
  filename: string
): void {
  const pdf = createConstructionCostPdfDocument(snapshot);
  pdf.save(filename);
}

export function printConstructionCostPdf(snapshot: PdfExportSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("Yazdırma yalnızca tarayıcı ortamında kullanılabilir.");
  }

  const printWindow = window.open("", "_blank");
  let blobUrl = "";

  if (!printWindow) {
    throw new Error("Yazdırma penceresi açılamadı.");
  }

  try {
    const pdf = createConstructionCostPdfDocument(snapshot);
    const blob = pdf.output("blob");
    blobUrl = URL.createObjectURL(blob);
    printWindow.location.href = blobUrl;
  } catch (error) {
    printWindow.close();
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
    throw error;
  }

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // The browser PDF viewer may defer print control to the new tab.
    }
  };

  window.setTimeout(triggerPrint, 1200);
  window.setTimeout(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }, 60_000);
}

export function openEstimatedConstructionAreaPdfPreview(
  snapshot: EstimatedConstructionAreaPdfSnapshot
): void {
  openPdfBlobPreview(() => createEstimatedConstructionAreaPdfDocument(snapshot));
}

/**
 * Tahmini inşaat alanı raporu için düzenlenebilir HTML şablonu oluşturur.
 */
// PDF önizleme blob sekmesi kullandığı için bu düzenlenebilir HTML şablonu şimdilik yedek tutuluyor.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateEstimatedConstructionAreaHtml(snapshot: EstimatedConstructionAreaPdfSnapshot): string {
  const { input, result, profileLabel, formattedDate } = snapshot;
  const dateLabel = formattedDate || formatOfficialDate();

  const colors = {
    paper: "#F9F8F4",
    paperBorder: "#D2D8E2",
    officialBlue: "#102C54",
    officialAccent: "#B96A24",
    ink: "#0F172A",
    body: "#334155",
    muted: "#64748B",
  };

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Tahmini İnşaat Alanı Raporu - ${dateLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;700&display=swap');
    :root {
      --paper-bg: ${colors.paper};
      --paper-border: ${colors.paperBorder};
      --official-blue: ${colors.officialBlue};
      --official-accent: ${colors.officialAccent};
      --ink: ${colors.ink};
      --body: ${colors.body};
      --muted: ${colors.muted};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #F1F5F9;
      font-family: 'IBM Plex Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      background-color: var(--paper-bg);
      padding: 20mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      position: relative;
      border: 1px solid var(--paper-border);
    }
    .paper::before {
      content: '';
      position: absolute;
      inset: 8mm;
      border: 0.4mm solid var(--paper-border);
      pointer-events: none;
    }
    .toolbar {
      width: 210mm;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      background: white;
      padding: 12px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-primary { background: var(--official-blue); color: white; }
    .btn-secondary { background: #E2E8F0; color: var(--body); }
    
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .brand { display: flex; align-items: flex-start; gap: 15px; }
    .logo-mark {
      width: 10mm; height: 14mm;
      border-left: 1mm solid var(--official-blue);
      border-top: 1mm solid var(--official-blue);
      position: relative;
    }
    .logo-mark::after {
      content: 'İB';
      position: absolute; left: 1.5mm; top: 5mm;
      font-weight: 800; font-size: 11px; color: var(--official-blue);
    }
    .brand-text h2 { font-size: 16px; font-weight: 800; color: var(--ink); }
    .brand-text p { font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
    
    .date-box {
      border: 1px solid var(--paper-border);
      background: white;
      padding: 5px 15px;
      border-radius: 6px;
      height: fit-content;
      font-size: 10px;
      font-weight: 700;
      color: var(--official-blue);
    }

    .title-area { margin-bottom: 25px; }
    .title-area h1 { font-family: 'IBM Plex Serif', serif; font-size: 26pt; color: var(--official-blue); margin-bottom: 6px; }
    .title-area p { font-size: 11pt; color: var(--body); }

    .grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; margin-bottom: 8mm; }
    .card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px 20px; }
    .card .label { font-size: 9pt; font-weight: 700; color: var(--muted); text-transform: uppercase; margin-bottom: 4px; }
    .card .value { font-family: 'IBM Plex Serif', serif; font-size: 18pt; font-weight: 700; color: var(--official-blue); }

    .main-grid { display: grid; grid-template-columns: 112mm 1fr; gap: 6mm; margin-bottom: 8mm; }
    .section-card { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; margin-bottom: 6mm; }
    .section-card h3 { font-size: 10pt; font-weight: 700; color: var(--official-blue); border-bottom: 1px solid var(--paper-border); padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; }
    .data-row { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 6px; }
    .data-row .l { color: var(--muted); }
    .data-row .v { font-weight: 700; color: var(--ink); text-align: right; }

    .notes { background: white; border: 1px solid var(--paper-border); border-radius: 8px; padding: 15px; }
    .notes h3 { font-size: 9pt; font-weight: 700; color: var(--official-blue); margin-bottom: 10px; }
    .notes ul { list-style: none; }
    .notes li { font-size: 8.5pt; color: var(--muted); margin-bottom: 5px; position: relative; padding-left: 15px; }
    .notes li::before { content: '•'; position: absolute; left: 0; color: var(--official-accent); }

    [contenteditable="true"]:hover { outline: 1px dashed var(--official-accent); background: rgba(0,0,0,0.02); }
    [contenteditable="true"]:focus { outline: 2px solid var(--official-accent); background: white; }

    @media print {
      body { background: white; padding: 0; }
      .toolbar { display: none; }
      .paper { box-shadow: none; border: none; padding: 15mm; margin: 0; }
      .paper::before { inset: 5mm; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 10px; height: 10px; background: var(--official-accent); border-radius: 50%;"></div>
      <span style="font-size: 13px; font-weight: 600; color: var(--body);">Düzenlenebilir Alan Raporu</span>
    </div>
    <div style="display: flex; gap: 12px;">
      <button class="btn btn-secondary" onclick="window.close()">Kapat</button>
      <button class="btn btn-primary" onclick="window.print()">Yazdır veya PDF Kaydet</button>
    </div>
  </div>

  <div class="paper">
    <div class="header">
      <div class="brand">
        <div class="logo-mark"></div>
        <div class="brand-text">
          <h2 contenteditable="true">İNŞA BLOG</h2>
          <p contenteditable="true">Mühendislik · Yapı · Analiz</p>
        </div>
      </div>
      <div class="date-box" contenteditable="true">${dateLabel}</div>
    </div>

    <div class="title-area">
      <h1 contenteditable="true">Tahmini İnşaat Alanı Raporu</h1>
      <p contenteditable="true">${profileLabel} · Emsalden toplam inşaat alanına ön fizibilite</p>
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="label" contenteditable="true">Tahmini Toplam İnşaat Alanı</div>
        <div class="value" contenteditable="true">${formatSayi(result.yaklasikToplamInsaatAlaniM2, 2)} m²</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Emsal Alanı</div>
        <div class="value" contenteditable="true">${formatSayi(result.emsalAreaM2, 2)} m²</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Emsal Harici Ek Alan</div>
        <div class="value" contenteditable="true">${formatSayi(result.emsalHariciEkAlanM2, 2)} m²</div>
      </div>
      <div class="card">
        <div class="label" contenteditable="true">Toplam Bodrum Alanı</div>
        <div class="value" contenteditable="true">${formatSayi(result.toplamBodrumAlanM2, 2)} m²</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="col-left">
        <div class="section-card">
          <h3 contenteditable="true">Hesap Özeti</h3>
          <div class="data-row"><span class="l" contenteditable="true">Net Parsel Alanı</span><span class="v" contenteditable="true">${formatSayi(input.parcelAreaM2, 2)} m²</span></div>
          <div class="data-row"><span class="l" contenteditable="true">TAKS</span><span class="v" contenteditable="true">${formatSayi(input.taks, 2)}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">KAKS / Emsal</span><span class="v" contenteditable="true">${formatSayi(input.kaks, 2)}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Normal Kat Sayısı</span><span class="v" contenteditable="true">${input.normalFloorCount}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Kullanım Profili</span><span class="v" contenteditable="true">${profileLabel}</span></div>
          <div class="data-row"><span class="l" contenteditable="true">Bodrum Kat Sayısı</span><span class="v" contenteditable="true">${input.hasBasement ? input.basementFloorCount : 'Yok'}</span></div>
        </div>
      </div>
      <div class="col-right">
        <div class="section-card">
          <h3 contenteditable="true">Profil Varsayımı</h3>
          <div class="data-row"><span class="v" style="text-align: left;" contenteditable="true">${profileLabel} profili için baz emsal harici artış oranı ${formatYuzde(result.bazEmsalHariciOrani)} kabul edildi.</span></div>
          <div class="data-row"><span class="v" style="text-align: left;" contenteditable="true">Toplam oran ${formatYuzde(result.emsalHariciEkAlanOrani)} seviyesindedir.</span></div>
        </div>
        <div class="section-card">
          <h3 contenteditable="true">Hesap Formülü</h3>
          <div class="data-row"><span class="v" style="text-align: left; font-size: 8pt;" contenteditable="true">Emsal Alanı: ${formatSayi(input.parcelAreaM2, 2)} × ${formatSayi(input.kaks, 2)} = ${formatSayi(result.emsalAreaM2, 2)} m²</span></div>
          <div class="data-row"><span class="v" style="text-align: left; font-size: 8pt;" contenteditable="true">Toplam: ${formatSayi(result.emsalAreaM2, 2)} + ${formatSayi(result.emsalHariciEkAlanM2, 2)} + ${formatSayi(result.toplamBodrumAlanM2, 2)} = ${formatSayi(result.yaklasikToplamInsaatAlaniM2, 2)} m²</span></div>
        </div>
      </div>
    </div>

    <div class="notes">
      <h3 contenteditable="true">Notlar</h3>
      <ul>
        <li contenteditable="true">Bu belge ruhsat hesabı değil, ön fizibilite amaçlı yaklaşık inşaat alanı raporudur.</li>
        ${result.notes.slice(0, 2).map(n => `<li contenteditable="true">${n}</li>`).join('')}
      </ul>
    </div>
  </div>
</body>
</html>
  `;
}

export function downloadEstimatedConstructionAreaPdf(
  snapshot: EstimatedConstructionAreaPdfSnapshot,
  filename: string
): void {
  const pdf = createEstimatedConstructionAreaPdfDocument(snapshot);
  pdf.save(filename);
}

export function printEstimatedConstructionAreaPdf(
  snapshot: EstimatedConstructionAreaPdfSnapshot
): void {
  if (typeof window === "undefined") {
    throw new Error("Yazdırma yalnızca tarayıcı ortamında kullanılabilir.");
  }

  const pdf = createEstimatedConstructionAreaPdfDocument(snapshot);
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
      // The browser PDF viewer may defer print control to the new tab.
    }
  };

  window.setTimeout(triggerPrint, 1200);
  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

export function exportPdf(snapshot: PdfExportSnapshot, filename: string): void {
  const pdf = createCalculationPdfDocument(snapshot);
  pdf.save(filename);
}

export type { QuickQuantityPdfSnapshot } from "./modules/hizli-metraj/types";
export {
  buildQuickQuantityPdfSnapshot,
  createQuickQuantityPdfDocument,
  downloadQuickQuantityPdf,
  openQuickQuantityPdfPreview,
  printQuickQuantityPdf,
} from "./modules/hizli-metraj/reporting";
