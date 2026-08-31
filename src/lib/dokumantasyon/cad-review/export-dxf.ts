// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — CAD REVIEW DXF EXPORT ENGINE
// AutoCAD AC1015 (AutoCAD 2000+) Uyumlu DXF R15 Dışa Aktarım Motoru
// ============================================================================

import type { CadPoint2d, CadReviewDocument, CadReviewItem } from "./schema";
import { filterReviewItems, type CadExportFilters } from "./export-json";
import { formatCadDistance, formatCadArea } from "./units";

/**
 * Escapes text for DXF entity strings.
 */
function dxfText(str: string): string {
  return str.replace(/\r\n/g, "\\P").replace(/\n/g, "\\P").replace(/\r/g, "\\P");
}

/**
 * Converts a hex color string (e.g. #ef4444) to a 24-bit TrueColor integer for DXF group code 420.
 */
export function hexToTrueColor(hex?: string): number {
  if (!hex) return 0;
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return isNaN(num) ? 0 : num;
}

/**
 * Maps common hex colors to standard AutoCAD Color Index (ACI 1-7).
 */
export function hexToAci(hex?: string): number {
  if (!hex) return 7;
  const clean = hex.replace("#", "").toLowerCase();
  if (clean.startsWith("ef44") || clean.startsWith("ff3b") || clean.startsWith("dc26") || clean.startsWith("f871")) return 1; // Red
  if (clean.startsWith("f59e") || clean.startsWith("eab3") || clean.startsWith("ca8a") || clean.startsWith("f973")) return 2; // Yellow/Orange
  if (clean.startsWith("10b9") || clean.startsWith("16a3") || clean.startsWith("22c5") || clean.startsWith("34c7")) return 3; // Green
  if (clean.startsWith("06b6") || clean.startsWith("0891") || clean.startsWith("38bdf8")) return 4; // Cyan
  if (clean.startsWith("3b82") || clean.startsWith("2563") || clean.startsWith("007a") || clean.startsWith("60a5fa")) return 5; // Blue
  if (clean.startsWith("a855") || clean.startsWith("9333") || clean.startsWith("af52") || clean.startsWith("c084fc")) return 6; // Magenta
  if (clean === "ffffff" || clean === "fff") return 7; // White
  if (clean === "000000" || clean === "000") return 7; // Black/White
  return 7;
}

/**
 * Maps internal line dash enum to standard DXF Linetype name.
 */
export function mapLineDashToDxf(lineDash?: "continuous" | "dashed" | "dotted"): string {
  if (lineDash === "dashed") return "DASHED";
  if (lineDash === "dotted") return "DOT";
  return "CONTINUOUS";
}

/**
 * Maps pixel stroke width to DXF lineweight in 100ths of a mm (Group code 370).
 */
export function mapStrokeWidthToDxf(width?: number): number {
  if (!width || width <= 1) return 18; // 0.18 mm
  if (width === 2) return 30; // 0.30 mm
  if (width === 3) return 50; // 0.50 mm
  if (width === 5) return 80; // 0.80 mm
  return 100; // 1.00 mm
}

function writeLineEntity(
  p1: CadPoint2d,
  p2: CadPoint2d,
  layer: string,
  options?: {
    colorHex?: string;
    lineDash?: "continuous" | "dashed" | "dotted";
    strokeWidth?: number;
  }
): string[] {
  const aci = hexToAci(options?.colorHex);
  const trueColor = hexToTrueColor(options?.colorHex);
  const linetype = mapLineDashToDxf(options?.lineDash);
  const lineweight = mapStrokeWidthToDxf(options?.strokeWidth);

  const out = [
    "  0",
    "LINE",
    "  8",
    layer,
    " 62",
    aci.toString(),
  ];

  if (trueColor > 0) {
    out.push("420", trueColor.toString());
  }

  if (linetype !== "CONTINUOUS") {
    out.push("  6", linetype);
  }

  out.push("370", lineweight.toString());

  out.push(
    " 10",
    p1.x.toFixed(4),
    " 20",
    p1.y.toFixed(4),
    " 30",
    "0.0",
    " 11",
    p2.x.toFixed(4),
    " 21",
    p2.y.toFixed(4),
    " 31",
    "0.0"
  );

  return out;
}

function writeLwPolylineEntity(
  points: readonly (CadPoint2d & { bulge?: number })[],
  layer: string,
  closed = false,
  options?: {
    colorHex?: string;
    lineDash?: "continuous" | "dashed" | "dotted";
    strokeWidth?: number;
  }
): string[] {
  if (points.length < 2) return [];

  const aci = hexToAci(options?.colorHex);
  const trueColor = hexToTrueColor(options?.colorHex);
  const linetype = mapLineDashToDxf(options?.lineDash);
  const lineweight = mapStrokeWidthToDxf(options?.strokeWidth);

  const out = [
    "  0",
    "LWPOLYLINE",
    "  8",
    layer,
    " 62",
    aci.toString(),
  ];

  if (trueColor > 0) {
    out.push("420", trueColor.toString());
  }

  if (linetype !== "CONTINUOUS") {
    out.push("  6", linetype);
  }

  out.push("370", lineweight.toString());

  out.push(
    " 90",
    points.length.toString(),
    " 70",
    closed ? "1" : "0"
  );

  for (const pt of points) {
    out.push(" 10", pt.x.toFixed(4), " 20", pt.y.toFixed(4));
    if (typeof pt.bulge === "number" && pt.bulge !== 0) {
      out.push(" 42", pt.bulge.toFixed(4));
    }
  }

  return out;
}

function writeCircleEntity(
  center: CadPoint2d,
  radius: number,
  layer: string,
  options?: {
    colorHex?: string;
    lineDash?: "continuous" | "dashed" | "dotted";
    strokeWidth?: number;
  }
): string[] {
  const aci = hexToAci(options?.colorHex);
  const trueColor = hexToTrueColor(options?.colorHex);
  const linetype = mapLineDashToDxf(options?.lineDash);
  const lineweight = mapStrokeWidthToDxf(options?.strokeWidth);

  const out = [
    "  0",
    "CIRCLE",
    "  8",
    layer,
    " 62",
    aci.toString(),
  ];

  if (trueColor > 0) {
    out.push("420", trueColor.toString());
  }

  if (linetype !== "CONTINUOUS") {
    out.push("  6", linetype);
  }

  out.push("370", lineweight.toString());

  out.push(
    " 10",
    center.x.toFixed(4),
    " 20",
    center.y.toFixed(4),
    " 30",
    "0.0",
    " 40",
    Math.max(radius, 0.1).toFixed(4)
  );

  return out;
}

function writeTextEntity(
  pos: CadPoint2d,
  text: string,
  layer: string,
  height = 5.0,
  rotationDeg = 0,
  options?: {
    colorHex?: string;
  }
): string[] {
  const aci = hexToAci(options?.colorHex);
  const trueColor = hexToTrueColor(options?.colorHex);

  const out = [
    "  0",
    "TEXT",
    "  8",
    layer,
    " 62",
    aci.toString(),
  ];

  if (trueColor > 0) {
    out.push("420", trueColor.toString());
  }

  out.push(
    " 10",
    pos.x.toFixed(4),
    " 20",
    pos.y.toFixed(4),
    " 30",
    "0.0",
    " 40",
    height.toFixed(2),
    "  1",
    dxfText(text),
    " 50",
    rotationDeg.toFixed(2)
  );

  return out;
}

/**
 * Creates an authentic AutoCAD Revision Cloud with arc bulges.
 */
function createCloudVertices(p1: CadPoint2d, p2: CadPoint2d): (CadPoint2d & { bulge?: number })[] {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  const w = maxX - minX;
  const h = maxY - minY;
  const arcLen = Math.max(15, Math.min(w, h) / 6);

  const nx = Math.max(2, Math.round(w / arcLen));
  const ny = Math.max(2, Math.round(h / arcLen));

  const dx = w / nx;
  const dy = h / ny;

  const pts: (CadPoint2d & { bulge?: number })[] = [];
  const bulge = 0.45; // Curved arc bulge

  // Top edge (Left to Right)
  for (let i = 0; i < nx; i++) {
    pts.push({ x: minX + i * dx, y: maxY, bulge });
  }

  // Right edge (Top to Bottom)
  for (let i = 0; i < ny; i++) {
    pts.push({ x: maxX, y: maxY - i * dy, bulge });
  }

  // Bottom edge (Right to Left)
  for (let i = 0; i < nx; i++) {
    pts.push({ x: maxX - i * dx, y: minY, bulge });
  }

  // Left edge (Bottom to Top)
  for (let i = 0; i < ny; i++) {
    pts.push({ x: minX, y: minY + i * dy, bulge });
  }

  return pts;
}

/**
 * Generates standard DXF AC1015 string from review items mapped to dedicated layers.
 */
export function exportReviewToDxf(
  document: CadReviewDocument,
  filters?: CadExportFilters
): string {
  const items = filterReviewItems(document.items, filters);
  const lines: string[] = [];

  // 1. HEADER SECTION
  lines.push(
    "  0",
    "SECTION",
    "  2",
    "HEADER",
    "  9",
    "$ACADVER",
    "  1",
    "AC1015",
    "  9",
    "$INSUNITS",
    " 70",
    "6", // Meters
    "  0",
    "ENDSEC"
  );

  // 2. TABLES SECTION (Linetypes & Review Layers)
  lines.push(
    "  0",
    "SECTION",
    "  2",
    "TABLES",
    // ── LTYPE Table ──
    "  0",
    "TABLE",
    "  2",
    "LTYPE",
    " 70",
    "3",
    // Linetype: CONTINUOUS
    "  0",
    "LTYPE",
    "  2",
    "CONTINUOUS",
    " 70",
    "0",
    "  3",
    "Solid line",
    " 72",
    "65",
    " 73",
    "0",
    " 40",
    "0.0",
    // Linetype: DASHED
    "  0",
    "LTYPE",
    "  2",
    "DASHED",
    " 70",
    "0",
    "  3",
    "Dashed __ __ __ __ __ __",
    " 72",
    "65",
    " 73",
    "2",
    " 40",
    "12.7",
    " 49",
    "6.35",
    " 49",
    "-6.35",
    // Linetype: DOT
    "  0",
    "LTYPE",
    "  2",
    "DOT",
    " 70",
    "0",
    "  3",
    "Dot . . . . . . . . . .",
    " 72",
    "65",
    " 73",
    "2",
    " 40",
    "6.35",
    " 49",
    "0.0",
    " 49",
    "-6.35",
    "  0",
    "ENDTAB",

    // ── LAYER Table ──
    "  0",
    "TABLE",
    "  2",
    "LAYER",
    " 70",
    "4",
    // Layer: REVIEW_MEASURE (Cyan/Blue)
    "  0",
    "LAYER",
    "  2",
    "REVIEW_MEASURE",
    " 70",
    "0",
    " 62",
    "5", // Blue
    "  6",
    "CONTINUOUS",
    "370",
    "30",
    // Layer: REVIEW_COMMENT (Yellow/Amber)
    "  0",
    "LAYER",
    "  2",
    "REVIEW_COMMENT",
    " 70",
    "0",
    " 62",
    "2", // Yellow
    "  6",
    "CONTINUOUS",
    "370",
    "30",
    // Layer: REVIEW_MARKUP (Red)
    "  0",
    "LAYER",
    "  2",
    "REVIEW_MARKUP",
    " 70",
    "0",
    " 62",
    "1", // Red
    "  6",
    "CONTINUOUS",
    "370",
    "50",
    // Layer: REVIEW_SKETCH (Green/Custom)
    "  0",
    "LAYER",
    "  2",
    "REVIEW_SKETCH",
    " 70",
    "0",
    " 62",
    "3", // Green
    "  6",
    "CONTINUOUS",
    "370",
    "30",
    "  0",
    "ENDTAB",
    "  0",
    "ENDSEC"
  );

  // 3. BLOCKS SECTION
  lines.push("  0", "SECTION", "  2", "BLOCKS", "  0", "ENDSEC");

  // 4. ENTITIES SECTION
  lines.push("  0", "SECTION", "  2", "ENTITIES");

  for (const item of items) {
    const styleOpts = {
      colorHex: item.style?.color,
      lineDash: item.style?.lineDash,
      strokeWidth: item.style?.strokeWidth,
    };

    switch (item.type) {
      case "distance": {
        lines.push(...writeLineEntity(item.start, item.end, "REVIEW_MEASURE", styleOpts));
        const mid = {
          x: (item.start.x + item.end.x) / 2,
          y: (item.start.y + item.end.y) / 2,
        };
        const label = item.label || formatCadDistance(item.measuredLength, "m", 2);
        lines.push(...writeTextEntity(mid, label, "REVIEW_MEASURE", 4.5, 0, styleOpts));
        break;
      }

      case "chain_distance": {
        lines.push(...writeLwPolylineEntity(item.points, "REVIEW_MEASURE", false, styleOpts));
        if (item.points.length > 0) {
          const first = item.points[0]!;
          const label = formatCadDistance(item.totalDistance, "m", 2);
          lines.push(...writeTextEntity(first, `Toplam: ${label}`, "REVIEW_MEASURE", 4.5, 0, styleOpts));
        }
        break;
      }

      case "area": {
        lines.push(...writeLwPolylineEntity(item.points, "REVIEW_MEASURE", true, styleOpts));
        if (item.points.length > 0) {
          let cx = 0;
          let cy = 0;
          for (const p of item.points) {
            cx += p.x;
            cy += p.y;
          }
          cx /= item.points.length;
          cy /= item.points.length;
          const label = formatCadArea(item.measuredArea, "m", 2);
          lines.push(...writeTextEntity({ x: cx, y: cy }, `Alan: ${label}`, "REVIEW_MEASURE", 4.5, 0, styleOpts));
        }
        break;
      }

      case "comment_pin": {
        lines.push(...writeCircleEntity(item.position, 8.0, "REVIEW_COMMENT", styleOpts));
        const statusLabel =
          item.status === "closed"
            ? "[Çözüldü]"
            : item.status === "question"
            ? "[İnceleme]"
            : item.status === "answered"
            ? "[Cevaplandı]"
            : "[Açık]";
        lines.push(
          ...writeTextEntity(
            { x: item.position.x + 10, y: item.position.y },
            `#${item.pinIndex} ${statusLabel} ${item.title}: ${item.comment}`,
            "REVIEW_COMMENT",
            5.0,
            0,
            styleOpts
          )
        );
        break;
      }

      case "shape": {
        if (item.shapeKind === "rect") {
          const corners = [
            { x: item.p1.x, y: item.p1.y },
            { x: item.p2.x, y: item.p1.y },
            { x: item.p2.x, y: item.p2.y },
            { x: item.p1.x, y: item.p2.y },
          ];
          lines.push(...writeLwPolylineEntity(corners, "REVIEW_MARKUP", true, styleOpts));
        } else if (item.shapeKind === "cloud") {
          const cloudPts = createCloudVertices(item.p1, item.p2);
          lines.push(...writeLwPolylineEntity(cloudPts, "REVIEW_MARKUP", true, styleOpts));
        } else if (item.shapeKind === "circle") {
          const radius = item.radius ?? Math.hypot(item.p2.x - item.p1.x, item.p2.y - item.p1.y);
          lines.push(...writeCircleEntity(item.p1, radius, "REVIEW_MARKUP", styleOpts));
        }
        break;
      }

      case "callout": {
        lines.push(...writeLineEntity(item.tip, item.anchor, "REVIEW_MARKUP", styleOpts));
        lines.push(...writeCircleEntity(item.tip, 2.5, "REVIEW_MARKUP", styleOpts));
        lines.push(...writeTextEntity(item.anchor, item.text, "REVIEW_MARKUP", item.style?.fontSize ? item.style.fontSize / 3 : 5.0, 0, styleOpts));
        break;
      }

      case "text": {
        const textHeight = item.style?.fontSize ? item.style.fontSize / 3 : 5.0;
        lines.push(
          ...writeTextEntity(
            item.position,
            item.text,
            "REVIEW_MARKUP",
            textHeight,
            item.rotationDeg ?? 0,
            styleOpts
          )
        );
        break;
      }

      case "stroke": {
        lines.push(...writeLwPolylineEntity(item.points, "REVIEW_SKETCH", false, styleOpts));
        break;
      }
    }
  }

  lines.push("  0", "ENDSEC");

  // 5. EOF
  lines.push("  0", "EOF");

  return lines.join("\n") + "\n";
}