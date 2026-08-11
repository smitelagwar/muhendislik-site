import { jsPDF } from "jspdf";
import {
  PDF_SERIF_BOLD_BASE64,
  PDF_SERIF_REGULAR_BASE64,
} from "@/lib/calculations/pdf-fonts.generated";
import {
  EXTERNAL_SURFACE_RESISTANCE,
  INTERNAL_SURFACE_RESISTANCE,
} from "@/lib/ts825/calculator";
import type { InsulationCalculationResult } from "@/lib/ts825/types";

export interface Ts825WallPdfInput {
  calculation: InsulationCalculationResult;
  wallPresetName: string;
}

const FONT_FAMILY = "IBMPlexSerif";
const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = {
  ink: [15, 23, 42] as const,
  body: [51, 65, 85] as const,
  muted: [100, 116, 139] as const,
  border: [214, 223, 233] as const,
  paper: [247, 249, 252] as const,
  white: [255, 255, 255] as const,
  cyan: [8, 145, 178] as const,
  cyanSoft: [224, 247, 250] as const,
  greenSoft: [220, 252, 231] as const,
} as const;

function registerFonts(pdf: jsPDF) {
  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", FONT_FAMILY, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", FONT_FAMILY, "bold");
  pdf.setFont(FONT_FAMILY, "normal");
}

function setFill(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setFillColor(color[0], color[1], color[2]);
}

function setStroke(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

function setText(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function normalizeText(value: string) {
  return value.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

function drawMetric(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  helper: string,
  highlighted = false,
) {
  setFill(pdf, highlighted ? COLORS.greenSoft : COLORS.white);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(x, y, width, 25, 4, 4, "FD");
  setText(pdf, COLORS.muted);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(7.5);
  pdf.text(label.toLocaleUpperCase("tr-TR"), x + 5, y + 6);
  setText(pdf, COLORS.ink);
  pdf.setFontSize(16);
  pdf.text(value, x + 5, y + 15.5);
  setText(pdf, COLORS.muted);
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(7.5);
  pdf.text(helper, x + 5, y + 21.5);
}

function drawSectionTitle(pdf: jsPDF, title: string, y: number) {
  setFill(pdf, COLORS.cyan);
  pdf.roundedRect(MARGIN, y - 3, 2.2, 7, 1, 1, "F");
  setText(pdf, COLORS.ink);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(11);
  pdf.text(title, MARGIN + 6, y + 2);
}

function drawRows(
  pdf: jsPDF,
  rows: Array<{ label: string; value: string }>,
  y: number,
) {
  const rowHeight = 7.5;
  setFill(pdf, COLORS.white);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, rowHeight * rows.length, 4, 4, "FD");

  rows.forEach((row, index) => {
    const rowY = y + index * rowHeight;
    if (index > 0) pdf.line(MARGIN + 4, rowY, PAGE_WIDTH - MARGIN - 4, rowY);
    setText(pdf, COLORS.muted);
    pdf.setFont(FONT_FAMILY, "normal");
    pdf.setFontSize(8.5);
    pdf.text(normalizeText(row.label), MARGIN + 5, rowY + 5);
    setText(pdf, COLORS.ink);
    pdf.setFont(FONT_FAMILY, "bold");
    pdf.text(normalizeText(row.value), PAGE_WIDTH - MARGIN - 5, rowY + 5, { align: "right" });
  });
  return y + rowHeight * rows.length;
}

export function createTs825WallPdfDocument(input: Ts825WallPdfInput) {
  const { calculation, wallPresetName } = input;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  registerFonts(pdf);

  setFill(pdf, COLORS.paper);
  pdf.rect(0, 0, 210, 297, "F");
  setFill(pdf, COLORS.ink);
  pdf.roundedRect(MARGIN, 14, CONTENT_WIDTH, 34, 7, 7, "F");
  setFill(pdf, COLORS.cyan);
  pdf.roundedRect(MARGIN + 6, 19, 38, 7, 3.5, 3.5, "F");
  setText(pdf, COLORS.white);
  pdf.setFont(FONT_FAMILY, "bold");
  pdf.setFontSize(7.5);
  pdf.text("TS 825:2024", MARGIN + 14, 23.8);
  pdf.setFontSize(20);
  pdf.text("Dış Duvar Isıl Performans Föyü", MARGIN + 6, 34.5);
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(8.5);
  pdf.text(
    `${calculation.location.province.name} · ${calculation.location.bucket}. iklim bölgesi`,
    MARGIN + 6,
    42.5,
  );
  pdf.text(new Date().toLocaleDateString("tr-TR"), PAGE_WIDTH - MARGIN - 6, 23.8, { align: "right" });

  const gap = 5;
  const metricWidth = (CONTENT_WIDTH - gap * 2) / 3;
  const metricY = 54;
  drawMetric(
    pdf,
    MARGIN,
    metricY,
    metricWidth,
    "U hedefi için",
    `${formatNumber(calculation.recommendedThicknessMm / 10, 0)} cm`,
    calculation.material.name,
    true,
  );
  drawMetric(
    pdf,
    MARGIN + metricWidth + gap,
    metricY,
    metricWidth,
    "Mevcut U",
    formatNumber(calculation.currentUValue),
    "W/m²K",
  );
  drawMetric(
    pdf,
    MARGIN + (metricWidth + gap) * 2,
    metricY,
    metricWidth,
    "Hedef U",
    formatNumber(calculation.targetUValue),
    "W/m²K",
  );

  drawSectionTitle(pdf, "Girdiler", 88);
  let cursorY = drawRows(
    pdf,
    [
      { label: "Konum", value: calculation.location.province.name },
      { label: "Duvar kurgusu", value: wallPresetName },
      { label: "Yalıtım malzemesi", value: `${calculation.material.name} (λ ${formatNumber(calculation.material.conductivity, 3)} W/mK)` },
      { label: "Mevcut / planlanan kalınlık", value: `${formatNumber(calculation.currentInsulationThicknessMm / 10, 1)} cm` },
    ],
    94,
  );

  drawSectionTitle(pdf, "Hesap sonucu", cursorY + 10);
  const insulationResistance =
    calculation.currentInsulationThicknessMm / 1000 / calculation.material.conductivity;
  cursorY = drawRows(
    pdf,
    [
      { label: "Yalıtımsız duvar direnci", value: `${formatNumber(calculation.baseResistance)} m²K/W` },
      { label: "Yalıtım direnci", value: `${formatNumber(insulationResistance)} m²K/W` },
      { label: "Toplam direnç", value: `${formatNumber(calculation.currentResistance)} m²K/W` },
      { label: "Mevcut kesit U değeri", value: `${formatNumber(calculation.currentUValue)} W/m²K` },
      { label: "U hedefi kalınlığıyla U değeri", value: `${formatNumber(calculation.achievedUValue)} W/m²K` },
      { label: "Durum", value: calculation.statusLabel },
    ],
    cursorY + 16,
  );

  drawSectionTitle(pdf, "Malzeme karşılaştırması", cursorY + 10);
  cursorY = drawRows(
    pdf,
    calculation.materialComparison.map((row) => ({
      label: `${row.material.name} · λ ${formatNumber(row.material.conductivity, 3)}`,
      value: `${formatNumber(row.recommendedThicknessMm / 10, 0)} cm · U ${formatNumber(row.achievedUValue)}`,
    })),
    cursorY + 16,
  );

  setFill(pdf, COLORS.cyanSoft);
  setStroke(pdf, COLORS.border);
  pdf.roundedRect(MARGIN, cursorY + 8, CONTENT_WIDTH, 27, 4, 4, "FD");
  setText(pdf, COLORS.body);
  pdf.setFont(FONT_FAMILY, "normal");
  pdf.setFontSize(8);
  const scopeText =
    `Hesap: U = 1 / (Rsi + Σ d/λ + Rse), Rsi = ${formatNumber(INTERNAL_SURFACE_RESISTANCE)}, Rse = ${formatNumber(EXTERNAL_SURFACE_RESISTANCE)} m²K/W. ` +
    "Bu föy dış duvar bileşeni hesabıdır; tam bina enerji ve yoğuşma raporu değildir.";
  pdf.text(pdf.splitTextToSize(scopeText, CONTENT_WIDTH - 10), MARGIN + 5, cursorY + 15);

  setText(pdf, COLORS.muted);
  pdf.setFontSize(7.5);
  pdf.text("Muhendis Mimar Portali · Hesap Föyü", MARGIN, 287);
  pdf.text("Sayfa 1 / 1", PAGE_WIDTH - MARGIN, 287, { align: "right" });
  return pdf;
}

export function downloadTs825WallPdf(input: Ts825WallPdfInput) {
  const pdf = createTs825WallPdfDocument(input);
  const provinceSlug = input.calculation.location.province.name
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  pdf.save(`ts825-dis-duvar-${provinceSlug || "hesap"}.pdf`);
}
