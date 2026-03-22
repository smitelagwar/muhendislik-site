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
  const driversBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN,
    lowerY,
    halfWidth,
    driversSection?.title ?? "Etki sürücüleri",
    sectionRowsToLines(driversSection, 3)
  );
  const comparisonBottom = drawOfficialInfoCard(
    pdf,
    OFFICIAL_MARGIN + halfWidth + OFFICIAL_GAP,
    lowerY,
    halfWidth,
    comparisonSection?.title ?? "Karşılaştırma özeti",
    sectionRowsToLines(comparisonSection, 3)
  );

  const notesY = Math.max(driversBottom, comparisonBottom) + OFFICIAL_GAP;
  drawOfficialNotesCard(pdf, notesY, snapshot.footnotes.slice(0, 4));

  return pdf;
}

export function openOfficialCostPdfPreview(result: OfficialCostResultSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("PDF önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const pdf = createOfficialCostPdfDocument(result);
  const blob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const previewWindow = window.open("", "_blank");

  if (!previewWindow) {
    throw new Error("PDF önizleme sekmesi açılamadı.");
  }

  try {
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

export function downloadOfficialCostPdf(result: OfficialCostResultSnapshot, filename: string): void {
  const pdf = createOfficialCostPdfDocument(result);
  pdf.save(filename);
}

export function openConstructionCostPdfPreview(snapshot: PdfExportSnapshot): void {
  if (typeof window === "undefined") {
    throw new Error("PDF önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const previewWindow = window.open("", "_blank");
  let blobUrl = "";

  if (!previewWindow) {
    throw new Error("PDF önizleme sekmesi açılamadı.");
  }

  try {
    const pdf = createConstructionCostPdfDocument(snapshot);
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
  if (typeof window === "undefined") {
    throw new Error("PDF önizleme yalnızca tarayıcı ortamında açılabilir.");
  }

  const pdf = createEstimatedConstructionAreaPdfDocument(snapshot);
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
