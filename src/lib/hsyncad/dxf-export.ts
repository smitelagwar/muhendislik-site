import type { CadModel, ColumnElement, BeamElement, WallElement, SlabElement, AxisElement } from "./model";
import { elementFootprint, distance } from "./geometry";
import type { RebarDetail } from "./detailing";

/**
 * Generates an AutoCAD ASCII DXF (Release 12 / 2000 compatible)
 * with dedicated structural engineering layers and text labels.
 */
export function exportModelToDxf(model: CadModel, floorId?: string): string {
  const elements = floorId ? model.elements.filter(e => e.floorId === floorId) : model.elements;
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(typeof value === "number" ? Number(value.toFixed(4)).toString() : value.toString());
  };

  // 1. HEADER SECTION
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009");
  add(9, "$INSUNITS");
  add(70, 6); // 6 = Metres
  add(0, "ENDSEC");

  // 2. TABLES SECTION
  add(0, "SECTION");
  add(2, "TABLES");

  // Layer table
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 11); // number of layers

  const defineLayer = (name: string, color: number) => {
    add(0, "LAYER");
    add(2, name);
    add(70, 0);
    add(62, color); // ACI color number
    add(6, "CONTINUOUS");
  };

  defineLayer("0", 7);
  defineLayer("AKSLAR", 1);      // Red
  defineLayer("KOLONLAR", 5);    // Blue
  defineLayer("KIRISLER", 6);    // Magenta
  defineLayer("PERDELER", 4);    // Cyan
  defineLayer("DOSEMELER", 3);   // Green
  defineLayer("TEMELLER", 8);    // Gray
  defineLayer("OLCUDUZEYI", 2);  // Yellow
  defineLayer("YAZILAR", 7);     // White
  defineLayer("DONATI", 1);      // Red
  defineLayer("ANTET", 7);       // White

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // 3. BLOCKS SECTION (Required for AC1009 compliance)
  add(0, "SECTION");
  add(2, "BLOCKS");
  add(0, "ENDSEC");

  // 4. ENTITIES SECTION
  add(0, "SECTION");
  add(2, "ENTITIES");

  const writeLine = (layer: string, x1: number, y1: number, x2: number, y2: number) => {
    add(0, "LINE");
    add(8, layer);
    add(10, x1);
    add(20, y1);
    add(30, 0);
    add(11, x2);
    add(21, y2);
    add(31, 0);
  };

  const writeCircle = (layer: string, cx: number, cy: number, radius: number) => {
    add(0, "CIRCLE");
    add(8, layer);
    add(10, cx);
    add(20, cy);
    add(30, 0);
    add(40, radius);
  };

  const writeText = (layer: string, text: string, x: number, y: number, height: number, rotationDeg = 0) => {
    if (!text) return;
    add(0, "TEXT");
    add(8, layer);
    add(10, x);
    add(20, y);
    add(30, 0);
    add(40, height);
    add(1, text);
    if (rotationDeg !== 0) {
      add(50, rotationDeg);
    }
  };

  const writePolyline = (layer: string, points: { x: number; y: number }[], closed = true) => {
    if (points.length < 2) return;
    add(0, "POLYLINE");
    add(8, layer);
    add(66, 1); // Vertices follow
    add(70, closed ? 1 : 0);
    add(10, 0);
    add(20, 0);
    add(30, 0);

    for (const p of points) {
      add(0, "VERTEX");
      add(8, layer);
      add(10, p.x);
      add(20, p.y);
      add(30, 0);
    }
    add(0, "SEQEND");
  };

  // Export Axes
  for (const el of elements) {
    if (el.type === "axis") {
      const ax = el as AxisElement;
      writeLine("AKSLAR", ax.start.x, ax.start.y, ax.end.x, ax.end.y);
      // Bubble at end
      const bubbleRadius = 0.25;
      const angle = Math.atan2(ax.end.y - ax.start.y, ax.end.x - ax.start.x);
      const bx = ax.end.x + Math.cos(angle) * bubbleRadius;
      const by = ax.end.y + Math.sin(angle) * bubbleRadius;
      writeCircle("AKSLAR", bx, by, bubbleRadius);
      writeText("YAZILAR", ax.name, bx - 0.08, by - 0.08, 0.20);
    }
  }

  // Export Columns
  for (const el of elements) {
    if (el.type === "column") {
      const col = el as ColumnElement;
      const footprint = elementFootprint(col);
      writePolyline("KOLONLAR", footprint, true);
      writeText("YAZILAR", col.name, col.position.x - 0.15, col.position.y - 0.08, 0.18);
    }
  }

  // Export Beams
  for (const el of elements) {
    if (el.type === "beam") {
      const beam = el as BeamElement;
      const footprint = elementFootprint(beam);
      writePolyline("KIRISLER", footprint, true);
      const mx = (beam.start.x + beam.end.x) / 2;
      const my = (beam.start.y + beam.end.y) / 2;
      const angle = Math.atan2(beam.end.y - beam.start.y, beam.end.x - beam.start.x) * 180 / Math.PI;
      const textAngle = angle > 90 || angle < -90 ? angle + 180 : angle;
      const beamText = `${beam.name} ${(beam.width * 100).toFixed(0)}/${(beam.height * 100).toFixed(0)}`;
      writeText("YAZILAR", beamText, mx, my, 0.16, textAngle);
    }
  }

  // Export Walls (Perdeler)
  for (const el of elements) {
    if (el.type === "wall") {
      const wall = el as WallElement;
      const footprint = elementFootprint(wall);
      writePolyline("PERDELER", footprint, true);
      const mx = (wall.start.x + wall.end.x) / 2;
      const my = (wall.start.y + wall.end.y) / 2;
      writeText("YAZILAR", wall.name, mx, my, 0.20);
    }
  }

  // Export Slabs (Döşemeler)
  for (const el of elements) {
    if (el.type === "slab") {
      const slab = el as SlabElement;
      writePolyline("DOSEMELER", slab.points, true);
      const lp = slab.labelPosition ?? slab.points[0];
      const slabText = `${slab.name} h=${(slab.thickness * 100).toFixed(0)}cm`;
      writeText("YAZILAR", slabText, lp.x + 0.3, lp.y + 0.3, 0.22);
    }
  }

  // Export Drafting & Dimensions
  if (model.drafting?.items) {
    for (const item of model.drafting.items) {
      if (floorId && item.floorId !== floorId) continue;
      if (item.points.length >= 2) {
        const [p1, p2] = item.points;
        writeLine("OLCUDUZEYI", p1.x, p1.y, p2.x, p2.y);
        const dist = distance(p1, p2);
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        writeText("OLCUDUZEYI", `${dist.toFixed(2)} m`, mx, my + 0.05, 0.15);
      }
    }
  }

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\r\n");
}

export function downloadDxfFile(model: CadModel, floorId?: string) {
  const content = exportModelToDxf(model, floorId);
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(model.name || "hsyncad-proje").replace(/\s+/g, "_")}.dxf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports rebar detailing geometry and schedule to standard AutoCAD ASCII DXF.
 */
export function exportDetailToDxf(detail: RebarDetail): string {
  const lines: string[] = [];

  const add = (code: number, value: string | number) => {
    lines.push(code.toString());
    lines.push(typeof value === "number" ? Number(value.toFixed(4)).toString() : value.toString());
  };

  // HEADER SECTION
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$ACADVER");
  add(1, "AC1009");
  add(9, "$INSUNITS");
  add(70, 4); // 4 = Millimetres / Centimetres
  add(0, "ENDSEC");

  // TABLES SECTION
  add(0, "SECTION");
  add(2, "TABLES");
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 7);

  const defineLayer = (name: string, color: number) => {
    add(0, "LAYER");
    add(2, name);
    add(70, 0);
    add(62, color);
    add(6, "CONTINUOUS");
  };

  defineLayer("0", 7);
  defineLayer("KIRISLER", 6);
  defineLayer("KOLONLAR", 5);
  defineLayer("DONATI", 1);
  defineLayer("OLCUDUZEYI", 2);
  defineLayer("YAZILAR", 7);
  defineLayer("ANTET", 7);

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  add(0, "SECTION");
  add(2, "BLOCKS");
  add(0, "ENDSEC");

  // ENTITIES SECTION
  add(0, "SECTION");
  add(2, "ENTITIES");

  for (const l of detail.lines) {
    add(0, "LINE");
    add(8, l.layer);
    add(10, l.x1);
    add(20, l.y1);
    add(30, 0);
    add(11, l.x2);
    add(21, l.y2);
    add(31, 0);
  }

  for (const c of detail.circles) {
    add(0, "CIRCLE");
    add(8, c.layer);
    add(10, c.cx);
    add(20, c.cy);
    add(30, 0);
    add(40, c.r);
  }

  for (const t of detail.texts) {
    add(0, "TEXT");
    add(8, t.layer);
    add(10, t.x);
    add(20, t.y);
    add(30, 0);
    add(40, t.height);
    add(1, t.text);
    if (t.angle) add(50, t.angle);
  }

  // Draw title and antet
  add(0, "TEXT");
  add(8, "ANTET");
  add(10, 0);
  add(20, -50);
  add(30, 0);
  add(40, 10);
  add(1, detail.title);

  add(0, "TEXT");
  add(8, "ANTET");
  add(10, 0);
  add(20, -65);
  add(30, 0);
  add(40, 7);
  add(1, detail.scaleText);

  // Rebar Schedule Table
  let tableY = -85;
  add(0, "TEXT");
  add(8, "YAZILAR");
  add(10, 0);
  add(20, tableY);
  add(30, 0);
  add(40, 8);
  add(1, "DONATI METRAJ LİSTESİ");

  tableY -= 15;
  for (const item of detail.rebarSchedule) {
    const row = `Poz ${item.mark}: ${item.count}Φ${item.diameterMm} - L=${item.lengthCm}cm - ${item.shape} - Ağr: ${item.totalWeightKg} kg`;
    add(0, "TEXT");
    add(8, "YAZILAR");
    add(10, 0);
    add(20, tableY);
    add(30, 0);
    add(40, 6);
    add(1, row);
    tableY -= 12;
  }

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\r\n");
}

export function downloadDetailDxf(detail: RebarDetail) {
  const content = exportDetailToDxf(detail);
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${detail.name.toLowerCase()}_donati_detayi.dxf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export { exportPaftaToDxf } from "./pafta-dxf";
import type { PaftaSheetData } from "./pafta-engine";
import { exportPaftaToDxf } from "./pafta-dxf";

export function downloadPaftaDxf(sheet: PaftaSheetData, model: CadModel) {
  const content = exportPaftaToDxf(sheet, model);
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${sheet.sheetNo}_${sheet.title.replace(/\s+/g, "_")}.dxf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
