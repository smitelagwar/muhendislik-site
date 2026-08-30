import type { CadPoint2d, CadReviewDocument } from "./schema";
import { filterReviewItems, type CadExportFilters } from "./export-json";


function dxfText(str: string): string {
  return str.replace(/\r\n/g, "\\P").replace(/\n/g, "\\P").replace(/\r/g, "\\P");
}

function writeLineEntity(
  p1: CadPoint2d,
  p2: CadPoint2d,
  layer: string
): string[] {
  return [
    "  0",
    "LINE",
    "  8",
    layer,
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
    "0.0",
  ];
}

function writeLwPolylineEntity(
  points: readonly CadPoint2d[],
  layer: string,
  closed = false
): string[] {
  if (points.length < 2) return [];

  const out = [
    "  0",
    "LWPOLYLINE",
    "  8",
    layer,
    " 90",
    points.length.toString(),
    " 70",
    closed ? "1" : "0",
  ];

  for (const pt of points) {
    out.push(" 10", pt.x.toFixed(4), " 20", pt.y.toFixed(4));
  }

  return out;
}

function writeCircleEntity(
  center: CadPoint2d,
  radius: number,
  layer: string
): string[] {
  return [
    "  0",
    "CIRCLE",
    "  8",
    layer,
    " 10",
    center.x.toFixed(4),
    " 20",
    center.y.toFixed(4),
    " 30",
    "0.0",
    " 40",
    Math.max(radius, 0.1).toFixed(4),
  ];
}

function writeTextEntity(
  pos: CadPoint2d,
  text: string,
  layer: string,
  height = 5.0,
  rotationDeg = 0
): string[] {
  return [
    "  0",
    "TEXT",
    "  8",
    layer,
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
    rotationDeg.toFixed(2),
  ];
}

/**
 * Generates standard DXF ASCII string from review items mapped to dedicated layers.
 */
export function exportReviewToDxf(
  document: CadReviewDocument,
  filters?: CadExportFilters
): string {
  const items = filterReviewItems(document.items, filters);
  const lines: string[] = [];

  // 1. HEADER SECTION
  lines.push("  0", "SECTION", "  2", "HEADER", "  9", "$ACADVER", "  1", "AC1015", "  0", "ENDSEC");

  // 2. TABLES SECTION (Standard Review Layers)
  lines.push(
    "  0",
    "SECTION",
    "  2",
    "TABLES",
    "  0",
    "TABLE",
    "  2",
    "LAYER",
    " 70",
    "4",
    // Layer: REVIEW_MEASURE
    "  0",
    "LAYER",
    "  2",
    "REVIEW_MEASURE",
    " 70",
    "0",
    " 62",
    "1", // Red
    "  6",
    "CONTINUOUS",
    // Layer: REVIEW_COMMENT
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
    // Layer: REVIEW_MARKUP
    "  0",
    "LAYER",
    "  2",
    "REVIEW_MARKUP",
    " 70",
    "0",
    " 62",
    "5", // Blue
    "  6",
    "CONTINUOUS",
    // Layer: REVIEW_SKETCH
    "  0",
    "LAYER",
    "  2",
    "REVIEW_SKETCH",
    " 70",
    "0",
    " 62",
    "4", // Cyan
    "  6",
    "CONTINUOUS",
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
    switch (item.type) {
      case "distance": {
        lines.push(...writeLineEntity(item.start, item.end, "REVIEW_MEASURE"));
        const mid = {
          x: (item.start.x + item.end.x) / 2,
          y: (item.start.y + item.end.y) / 2,
        };
        const label = item.label || item.measuredLength.toFixed(2);
        lines.push(...writeTextEntity(mid, label, "REVIEW_MEASURE", 4.0));
        break;
      }

      case "chain_distance": {
        lines.push(...writeLwPolylineEntity(item.points, "REVIEW_MEASURE", false));
        if (item.points.length > 0) {
          const first = item.points[0]!;
          lines.push(...writeTextEntity(first, `Toplam: ${item.totalDistance.toFixed(2)}`, "REVIEW_MEASURE", 4.0));
        }
        break;
      }

      case "area": {
        lines.push(...writeLwPolylineEntity(item.points, "REVIEW_MEASURE", true));
        if (item.points.length > 0) {
          let cx = 0;
          let cy = 0;
          for (const p of item.points) {
            cx += p.x;
            cy += p.y;
          }
          cx /= item.points.length;
          cy /= item.points.length;
          lines.push(...writeTextEntity({ x: cx, y: cy }, `Alan: ${item.measuredArea.toFixed(2)}`, "REVIEW_MEASURE", 4.0));
        }
        break;
      }

      case "comment_pin": {
        lines.push(...writeCircleEntity(item.position, 8.0, "REVIEW_COMMENT"));
        lines.push(
          ...writeTextEntity(
            { x: item.position.x + 10, y: item.position.y },
            `#${item.pinIndex} ${item.title}: ${item.comment}`,
            "REVIEW_COMMENT",
            5.0
          )
        );
        break;
      }

      case "shape": {
        if (item.shapeKind === "rect" || item.shapeKind === "cloud") {
          const corners = [
            { x: item.p1.x, y: item.p1.y },
            { x: item.p2.x, y: item.p1.y },
            { x: item.p2.x, y: item.p2.y },
            { x: item.p1.x, y: item.p2.y },
          ];
          lines.push(...writeLwPolylineEntity(corners, "REVIEW_MARKUP", true));
        } else if (item.shapeKind === "circle") {
          const radius = item.radius ?? Math.hypot(item.p2.x - item.p1.x, item.p2.y - item.p1.y);
          lines.push(...writeCircleEntity(item.p1, radius, "REVIEW_MARKUP"));
        }
        break;
      }

      case "callout": {
        lines.push(...writeLineEntity(item.tip, item.anchor, "REVIEW_MARKUP"));
        lines.push(...writeTextEntity(item.anchor, item.text, "REVIEW_MARKUP", 5.0));
        break;
      }

      case "text": {
        lines.push(...writeTextEntity(item.position, item.text, "REVIEW_MARKUP", 5.0, item.rotationDeg));
        break;
      }

      case "stroke": {
        lines.push(...writeLwPolylineEntity(item.points, "REVIEW_SKETCH", false));
        break;
      }
    }
  }

  lines.push("  0", "ENDSEC");

  // 5. EOF
  lines.push("  0", "EOF");

  return lines.join("\n") + "\n";
}