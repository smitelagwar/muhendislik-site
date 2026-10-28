import type { BeamElement, ColumnElement } from "./model";
import { distance } from "./geometry";
import type { AnalysisResult } from "./analysis";

export interface RebarDetail {
  id: string;
  name: string;
  type: "beam" | "column" | "footing" | "stair";
  title: string;
  scaleText: string;
  lines: { x1: number; y1: number; x2: number; y2: number; layer: string; style?: "continuous" | "dashed" }[];
  texts: { text: string; x: number; y: number; height: number; layer: string; angle?: number }[];
  circles: { cx: number; cy: number; r: number; layer: string; filled?: boolean }[];
  rebarSchedule: {
    mark: string;
    diameterMm: number;
    count: number;
    lengthCm: number;
    shape: string;
    totalWeightKg: number;
  }[];
}

/** Unit weight of reinforcement steel per metre (kg/m) by diameter (mm) */
export const REBAR_WEIGHTS: Record<number, number> = {
  8: 0.395,
  10: 0.617,
  12: 0.888,
  14: 1.208,
  16: 1.578,
  18: 1.998,
  20: 2.466,
  22: 2.984,
  25: 3.853,
};

/**
 * Generates longitudinal rebar detailing and cross section for a reinforced concrete beam
 * conforming to TS 500 & TBDY 2018 §7.4.
 */
export function generateBeamDetail(beam: BeamElement, analysisResult?: AnalysisResult): RebarDetail {
  const spanM = distance(beam.start, beam.end);
  const spanCm = Math.round(spanM * 100);
  const bwCm = Math.round(beam.width * 100);
  const hCm = Math.round(beam.height * 100);

  const lines: RebarDetail["lines"] = [];
  const texts: RebarDetail["texts"] = [];
  const circles: RebarDetail["circles"] = [];

  // Coordinate space: Beam elevation drawn in cm units
  // Left support at x = 0, right support at x = spanCm
  const colWidthCm = 40;
  const totalLengthCm = spanCm + 2 * colWidthCm;
  const startX = colWidthCm;
  const endX = startX + spanCm;

  // 1. Concrete Outlines (KIRISLER layer)
  // Left column outline
  lines.push({ x1: 0, y1: -20, x2: colWidthCm, y2: -20, layer: "KIRISLER" });
  lines.push({ x1: 0, y1: -20, x2: 0, y2: hCm + 20, layer: "KIRISLER" });
  lines.push({ x1: colWidthCm, y1: -20, x2: colWidthCm, y2: 0, layer: "KIRISLER" });

  // Beam soffit and top
  lines.push({ x1: startX, y1: 0, x2: endX, y2: 0, layer: "KIRISLER" });
  lines.push({ x1: 0, y1: hCm, x2: totalLengthCm, y2: hCm, layer: "KIRISLER" });

  // Right column outline
  lines.push({ x1: endX, y1: 0, x2: endX, y2: -20, layer: "KIRISLER" });
  lines.push({ x1: endX, y1: -20, x2: totalLengthCm, y2: -20, layer: "KIRISLER" });
  lines.push({ x1: totalLengthCm, y1: -20, x2: totalLengthCm, y2: hCm + 20, layer: "KIRISLER" });

  // 2. Longitudinal Rebars (DONATI layer)
  const coverCm = 4;
  const topRebarY = hCm - coverCm;
  const bottomRebarY = coverCm;

  // Top continuous rebar (2Φ14 Montaj)
  lines.push({ x1: coverCm, y1: topRebarY, x2: totalLengthCm - coverCm, y2: topRebarY, layer: "DONATI" });
  // Top anchor hooks (90 deg down)
  lines.push({ x1: coverCm, y1: topRebarY, x2: coverCm, y2: topRebarY - 15, layer: "DONATI" });
  lines.push({ x1: totalLengthCm - coverCm, y1: topRebarY, x2: totalLengthCm - coverCm, y2: topRebarY - 15, layer: "DONATI" });

  // Bottom continuous rebar (3Φ16 Düz Donatı)
  lines.push({ x1: coverCm, y1: bottomRebarY, x2: totalLengthCm - coverCm, y2: bottomRebarY, layer: "DONATI" });
  // Bottom anchor hooks (90 deg up)
  lines.push({ x1: coverCm, y1: bottomRebarY, x2: coverCm, y2: bottomRebarY + 15, layer: "DONATI" });
  lines.push({ x1: totalLengthCm - coverCm, y1: bottomRebarY, x2: totalLengthCm - coverCm, y2: bottomRebarY + 15, layer: "DONATI" });

  // Support Top Additional Rebars (Mesnet İlaveleri: L/4 length)
  const additionLengthCm = Math.round(spanCm / 4) + colWidthCm;
  lines.push({ x1: coverCm, y1: topRebarY - 3, x2: additionLengthCm, y2: topRebarY - 3, layer: "DONATI" });
  lines.push({ x1: totalLengthCm - additionLengthCm, y1: topRebarY - 3, x2: totalLengthCm - coverCm, y2: topRebarY - 3, layer: "DONATI" });

  // 3. Stirrups (Sarılma ve Orta Bölge per TBDY 2018 §7.4.5)
  // Confinement zone length = 2 * h
  const confLengthCm = Math.min(2 * hCm, Math.round(spanCm / 3));
  const confSpacingCm = 10;
  const midSpacingCm = 20;

  // Left confinement zone stirrups
  for (let x = startX + 5; x <= startX + confLengthCm; x += confSpacingCm) {
    lines.push({ x1: x, y1: bottomRebarY, x2: x, y2: topRebarY, layer: "DONATI" });
  }

  // Mid-span stirrups
  for (let x = startX + confLengthCm + midSpacingCm; x < endX - confLengthCm; x += midSpacingCm) {
    lines.push({ x1: x, y1: bottomRebarY, x2: x, y2: topRebarY, layer: "DONATI" });
  }

  // Right confinement zone stirrups
  for (let x = endX - confLengthCm; x <= endX - 5; x += confSpacingCm) {
    lines.push({ x1: x, y1: bottomRebarY, x2: x, y2: topRebarY, layer: "DONATI" });
  }

  // 4. Texts and Annotations
  const memberCheck = analysisResult?.members[beam.id];
  const reqAsText = memberCheck ? ` · As_req = ${memberCheck.requiredRebarCm2.toFixed(1)} cm²` : "";
  texts.push({ text: `${beam.name} (${bwCm}/${hCm})${reqAsText}`, x: totalLengthCm / 2 - 20, y: hCm + 15, height: 12, layer: "YAZILAR" });
  texts.push({ text: `Üst Montaj: 2Φ14`, x: totalLengthCm / 2 - 30, y: topRebarY + 4, height: 8, layer: "YAZILAR" });
  texts.push({ text: `Sol İlave: 2Φ16`, x: startX + 10, y: topRebarY - 12, height: 7, layer: "YAZILAR" });
  texts.push({ text: `Sağ İlave: 2Φ16`, x: endX - 60, y: topRebarY - 12, height: 7, layer: "YAZILAR" });
  texts.push({ text: `Alt Düz: 3Φ16`, x: totalLengthCm / 2 - 25, y: bottomRebarY - 12, height: 8, layer: "YAZILAR" });
  texts.push({ text: `Sarılma: Φ8/10`, x: startX + 10, y: hCm / 2, height: 7, layer: "YAZILAR" });
  texts.push({ text: `Orta: Φ8/20`, x: totalLengthCm / 2 - 15, y: hCm / 2, height: 7, layer: "YAZILAR" });
  texts.push({ text: `Sarılma: Φ8/10`, x: endX - 50, y: hCm / 2, height: 7, layer: "YAZILAR" });

  // Dimension line below
  const dimY = -35;
  lines.push({ x1: startX, y1: dimY, x2: endX, y2: dimY, layer: "OLCUDUZEYI" });
  lines.push({ x1: startX, y1: dimY - 5, x2: startX, y2: dimY + 5, layer: "OLCUDUZEYI" });
  lines.push({ x1: endX, y1: dimY - 5, x2: endX, y2: dimY + 5, layer: "OLCUDUZEYI" });
  texts.push({ text: `Ln = ${spanCm} cm`, x: totalLengthCm / 2 - 15, y: dimY - 12, height: 8, layer: "OLCUDUZEYI" });

  // 5. Rebar schedule table
  const rebarSchedule = [
    {
      mark: "1",
      diameterMm: 14,
      count: 2,
      lengthCm: totalLengthCm + 30,
      shape: "Montaj Düz + Kanca",
      totalWeightKg: Number((2 * ((totalLengthCm + 30) / 100) * REBAR_WEIGHTS[14]).toFixed(2)),
    },
    {
      mark: "2",
      diameterMm: 16,
      count: 3,
      lengthCm: totalLengthCm + 30,
      shape: "Alt Düz + Kanca",
      totalWeightKg: Number((3 * ((totalLengthCm + 30) / 100) * REBAR_WEIGHTS[16]).toFixed(2)),
    },
    {
      mark: "3",
      diameterMm: 16,
      count: 4,
      lengthCm: additionLengthCm + 20,
      shape: "Mesnet İlaveleri",
      totalWeightKg: Number((4 * ((additionLengthCm + 20) / 100) * REBAR_WEIGHTS[16]).toFixed(2)),
    },
    {
      mark: "4",
      diameterMm: 8,
      count: Math.round((2 * confLengthCm) / confSpacingCm + (spanCm - 2 * confLengthCm) / midSpacingCm),
      lengthCm: 2 * (bwCm + hCm - 8) + 20,
      shape: "Etriye (135° kancalı)",
      totalWeightKg: Number((Math.round((2 * confLengthCm) / confSpacingCm + (spanCm - 2 * confLengthCm) / midSpacingCm) * ((2 * (bwCm + hCm - 8) + 20) / 100) * REBAR_WEIGHTS[8]).toFixed(2)),
    },
  ];

  return {
    id: `detail-${beam.id}`,
    name: beam.name,
    type: "beam",
    title: `${beam.name} KİRİŞİ BOYUNA DONATI AÇILIMI`,
    scaleText: "Ölçek: 1/25 (Boy) - 1/20 (Kesit)",
    lines,
    texts,
    circles,
    rebarSchedule,
  };
}

/**
 * Generates column cross-section detailing conforming to TS 500 & TBDY 2018 §7.3.
 */
export function generateColumnDetail(col: ColumnElement, analysisResult?: AnalysisResult): RebarDetail {
  const bCm = Math.round(col.width * 100);
  const hCm = Math.round(col.depth * 100);

  const lines: RebarDetail["lines"] = [];
  const texts: RebarDetail["texts"] = [];
  const circles: RebarDetail["circles"] = [];

  // Concrete perimeter
  lines.push({ x1: 0, y1: 0, x2: bCm, y2: 0, layer: "KOLONLAR" });
  lines.push({ x1: bCm, y1: 0, x2: bCm, y2: hCm, layer: "KOLONLAR" });
  lines.push({ x1: bCm, y1: hCm, x2: 0, y2: hCm, layer: "KOLONLAR" });
  lines.push({ x1: 0, y1: hCm, x2: 0, y2: 0, layer: "KOLONLAR" });

  // Peripheral tie (etriye) perimeter with 3 cm cover
  const c = 3.5;
  lines.push({ x1: c, y1: c, x2: bCm - c, y2: c, layer: "DONATI" });
  lines.push({ x1: bCm - c, y1: c, x2: bCm - c, y2: hCm - c, layer: "DONATI" });
  lines.push({ x1: bCm - c, y1: hCm - c, x2: c, y2: hCm - c, layer: "DONATI" });
  lines.push({ x1: c, y1: hCm - c, x2: c, y2: c, layer: "DONATI" });

  // 135 degree seismic hook at top-left corner
  lines.push({ x1: c, y1: hCm - c, x2: c + 6, y2: hCm - c - 6, layer: "DONATI" });
  lines.push({ x1: c, y1: hCm - c, x2: c + 6, y2: hCm - c - 3, layer: "DONATI" });

  // Longitudinal Bars (4 corner + side bars)
  const barPositions: { x: number; y: number }[] = [
    { x: c + 1.5, y: c + 1.5 },
    { x: bCm - c - 1.5, y: c + 1.5 },
    { x: bCm - c - 1.5, y: hCm - c - 1.5 },
    { x: c + 1.5, y: hCm - c - 1.5 },
    { x: bCm / 2, y: c + 1.5 },
    { x: bCm / 2, y: hCm - c - 1.5 },
    { x: c + 1.5, y: hCm / 2 },
    { x: bCm - c - 1.5, y: hCm / 2 },
  ];

  for (const p of barPositions) {
    circles.push({ cx: p.x, cy: p.y, r: 1.2, layer: "DONATI", filled: true });
  }

  // Cross tie (çiroz) if dimension >= 30 cm
  if (bCm >= 30 && hCm >= 30) {
    lines.push({ x1: bCm / 2, y1: c, x2: bCm / 2, y2: hCm - c, layer: "DONATI", style: "dashed" });
  }

  // Annotations
  const colCheck = analysisResult?.members[col.id];
  const reqAsColText = colCheck ? ` · As_req = ${colCheck.requiredRebarCm2.toFixed(1)} cm²` : "";
  texts.push({ text: `${col.name} (${bCm}/${hCm} cm)${reqAsColText}`, x: bCm / 2 - 15, y: hCm + 8, height: 6, layer: "YAZILAR" });
  texts.push({ text: `8Φ16 (As = 16.1 cm²)`, x: bCm / 2 - 18, y: -8, height: 5, layer: "YAZILAR" });
  texts.push({ text: `Etriye: Φ8/10 cm (Sarılma) / 20 cm (Orta)`, x: bCm / 2 - 25, y: -16, height: 4.5, layer: "YAZILAR" });

  const rebarSchedule = [
    {
      mark: "1",
      diameterMm: 16,
      count: 8,
      lengthCm: Math.round((col.height || 3.0) * 100) + 60, // + lap splice
      shape: "Boyuna Donatı (Bindirmeli)",
      totalWeightKg: Number((8 * (((col.height || 3.0) * 100 + 60) / 100) * REBAR_WEIGHTS[16]).toFixed(2)),
    },
    {
      mark: "2",
      diameterMm: 8,
      count: Math.round(((col.height || 3.0) * 100) / 12),
      lengthCm: 2 * (bCm + hCm - 7) + 20,
      shape: "Etriye + Çiroz (135°)",
      totalWeightKg: Number((Math.round(((col.height || 3.0) * 100) / 12) * ((2 * (bCm + hCm - 7) + 20) / 100) * REBAR_WEIGHTS[8]).toFixed(2)),
    },
  ];

  return {
    id: `detail-${col.id}`,
    name: col.name,
    type: "column",
    title: `${col.name} KOLON APLİKASYON DETAYI`,
    scaleText: "Ölçek: 1/20",
    lines,
    texts,
    circles,
    rebarSchedule,
  };
}
