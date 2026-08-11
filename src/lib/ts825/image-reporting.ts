import type { InsulationCalculationResult } from "@/lib/ts825/types";

export interface Ts825WallImageInput {
  calculation: InsulationCalculationResult;
  wallPresetName: string;
}

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const EXPORT_WIDTH = 2480;
const EXPORT_HEIGHT = 3508;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const colors = {
  page: "#f4f7fb",
  ink: "#101827",
  body: "#334155",
  muted: "#64748b",
  border: "#d8e0ea",
  white: "#ffffff",
  blue: "#2563eb",
  blueSoft: "#eaf1ff",
  green: "#047857",
  greenSoft: "#dcfce7",
};

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function fillCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = colors.white,
) {
  roundedRect(context, x, y, width, height, 12);
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = colors.border;
  context.lineWidth = 1;
  context.stroke();
}

function drawSectionTitle(context: CanvasRenderingContext2D, title: string, y: number) {
  context.fillStyle = colors.blue;
  roundedRect(context, MARGIN, y - 13, 4, 24, 2);
  context.fill();
  context.fillStyle = colors.ink;
  context.font = "700 18px Arial, sans-serif";
  context.fillText(title, MARGIN + 14, y + 6);
}

function drawRows(
  context: CanvasRenderingContext2D,
  rows: Array<{ label: string; value: string }>,
  y: number,
) {
  const rowHeight = 39;
  fillCard(context, MARGIN, y, CONTENT_WIDTH, rowHeight * rows.length);
  rows.forEach((row, index) => {
    const rowY = y + index * rowHeight;
    if (index > 0) {
      context.strokeStyle = colors.border;
      context.beginPath();
      context.moveTo(MARGIN + 16, rowY);
      context.lineTo(PAGE_WIDTH - MARGIN - 16, rowY);
      context.stroke();
    }
    context.fillStyle = colors.muted;
    context.font = "400 12px Arial, sans-serif";
    context.fillText(row.label, MARGIN + 16, rowY + 24);
    context.fillStyle = colors.ink;
    context.font = "700 12px Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(row.value, PAGE_WIDTH - MARGIN - 16, rowY + 24);
    context.textAlign = "left";
  });
  return y + rowHeight * rows.length;
}

function drawMetric(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  helper: string,
  highlighted = false,
) {
  fillCard(context, x, y, width, 92, highlighted ? colors.greenSoft : colors.white);
  context.fillStyle = highlighted ? colors.green : colors.muted;
  context.font = "700 10px Arial, sans-serif";
  context.fillText(label.toLocaleUpperCase("tr-TR"), x + 16, y + 22);
  context.fillStyle = colors.ink;
  context.font = "800 28px Arial, sans-serif";
  context.fillText(value, x + 16, y + 55);
  context.fillStyle = colors.muted;
  context.font = "400 10px Arial, sans-serif";
  context.fillText(helper, x + 16, y + 76);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) context.fillText(line, x, currentY);
  return currentY;
}

export function createTs825WallImageCanvas(input: Ts825WallImageInput) {
  if (typeof document === "undefined") {
    throw new Error("Görsel çıktı yalnızca tarayıcı ortamında oluşturulabilir.");
  }

  const { calculation, wallPresetName } = input;
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Görsel çıktı alanı oluşturulamadı.");

  context.scale(EXPORT_WIDTH / PAGE_WIDTH, EXPORT_HEIGHT / PAGE_HEIGHT);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = colors.page;
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  roundedRect(context, MARGIN, 42, CONTENT_WIDTH, 146, 20);
  context.fillStyle = colors.ink;
  context.fill();
  roundedRect(context, MARGIN + 24, 64, 108, 28, 14);
  context.fillStyle = colors.blue;
  context.fill();
  context.fillStyle = colors.white;
  context.font = "700 11px Arial, sans-serif";
  context.fillText("TS 825:2024", MARGIN + 43, 82);
  context.font = "800 29px Arial, sans-serif";
  context.fillText("Dış Duvar Isıl Performans Föyü", MARGIN + 24, 128);
  context.fillStyle = "#cbd5e1";
  context.font = "400 12px Arial, sans-serif";
  context.fillText(
    `${calculation.location.province.name} · ${calculation.location.bucket}. iklim bölgesi`,
    MARGIN + 24,
    157,
  );
  context.textAlign = "right";
  context.fillText(new Date().toLocaleDateString("tr-TR"), PAGE_WIDTH - MARGIN - 24, 82);
  context.textAlign = "left";

  const metricGap = 14;
  const metricWidth = (CONTENT_WIDTH - metricGap * 2) / 3;
  drawMetric(
    context,
    MARGIN,
    210,
    metricWidth,
    "U hedefi için",
    `${formatNumber(calculation.recommendedThicknessMm / 10, 0)} cm`,
    calculation.material.name,
    true,
  );
  drawMetric(context, MARGIN + metricWidth + metricGap, 210, metricWidth, "Mevcut U", formatNumber(calculation.currentUValue), "W/m²K");
  drawMetric(context, MARGIN + (metricWidth + metricGap) * 2, 210, metricWidth, "Hedef U", formatNumber(calculation.targetUValue), "W/m²K");

  drawSectionTitle(context, "Girdiler", 338);
  let cursorY = drawRows(
    context,
    [
      { label: "Konum", value: calculation.location.province.name },
      { label: "Duvar kurgusu", value: wallPresetName },
      { label: "Yalıtım malzemesi", value: `${calculation.material.name} · λ ${formatNumber(calculation.material.conductivity, 3)} W/mK` },
      { label: "Mevcut / planlanan kalınlık", value: `${formatNumber(calculation.currentInsulationThicknessMm / 10, 1)} cm` },
    ],
    360,
  );

  drawSectionTitle(context, "Hesap sonucu", cursorY + 38);
  const insulationResistance = calculation.currentInsulationThicknessMm / 1000 / calculation.material.conductivity;
  cursorY = drawRows(
    context,
    [
      { label: "Yalıtımsız duvar direnci", value: `${formatNumber(calculation.baseResistance)} m²K/W` },
      { label: "Yalıtım direnci", value: `${formatNumber(insulationResistance)} m²K/W` },
      { label: "Toplam direnç", value: `${formatNumber(calculation.currentResistance)} m²K/W` },
      { label: "Mevcut kesit U değeri", value: `${formatNumber(calculation.currentUValue)} W/m²K` },
      { label: "U hedefi kalınlığıyla U değeri", value: `${formatNumber(calculation.achievedUValue)} W/m²K` },
      { label: "Durum", value: calculation.statusLabel },
    ],
    cursorY + 60,
  );

  drawSectionTitle(context, "Malzeme karşılaştırması", cursorY + 38);
  cursorY = drawRows(
    context,
    calculation.materialComparison.map((row) => ({
      label: `${row.material.name} · λ ${formatNumber(row.material.conductivity, 3)}`,
      value: `${formatNumber(row.recommendedThicknessMm / 10, 0)} cm · U ${formatNumber(row.achievedUValue)}`,
    })),
    cursorY + 60,
  );

  fillCard(context, MARGIN, cursorY + 24, CONTENT_WIDTH, 64, colors.blueSoft);
  context.fillStyle = colors.body;
  context.font = "400 11px Arial, sans-serif";
  drawWrappedText(
    context,
    "Hesap: U = 1 / (Rsi + Σ d/λ + Rse). Bu föy dış duvar bileşeni hesabıdır; tam bina enerji ve yoğuşma raporu değildir.",
    MARGIN + 18,
    cursorY + 52,
    CONTENT_WIDTH - 36,
    18,
  );

  context.fillStyle = colors.muted;
  context.font = "400 10px Arial, sans-serif";
  context.fillText("Mühendis Mimar Portalı · Hesap Föyü", MARGIN, PAGE_HEIGHT - 24);
  context.textAlign = "right";
  context.fillText("2480 × 3508 px", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 24);
  context.textAlign = "left";
  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG çıktısı oluşturulamadı."));
    }, "image/png");
  });
}
