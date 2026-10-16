import type {
  WhaleFlipper,
  WhaleFlukes,
  WhaleMarker,
  WhaleMesh,
  WhaleRib,
  WhaleThemePalette,
} from "./whale-types";

export const LIGHT_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(30, 41, 59, 0.42)",
  secondaryLine: "rgba(71, 85, 105, 0.26)",
  backfaceLine: "rgba(100, 116, 139, 0.14)",
  accentLine: "rgba(217, 119, 6, 0.52)",
  washFill: "rgba(245, 158, 11, 0.022)",
  markerColor: "rgba(180, 83, 9, 0.48)",
  flipperWhiteUnderside: "rgba(255, 255, 255, 0.05)",
};

export const DARK_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(56, 189, 248, 0.46)",
  secondaryLine: "rgba(56, 189, 248, 0.22)",
  backfaceLine: "rgba(14, 165, 233, 0.12)",
  accentLine: "rgba(245, 158, 11, 0.65)",
  washFill: "rgba(56, 189, 248, 0.026)",
  markerColor: "rgba(56, 189, 248, 0.55)",
  flipperWhiteUnderside: "rgba(255, 255, 255, 0.04)",
};

/**
 * Draws a smooth Catmull-Rom or Bezier spline connecting an array of 2D/projected points.
 */
function drawSmoothPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  close = false
) {
  const n = points.length;
  if (n < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (close && n >= 3) {
    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];

      // Cyclic Catmull-Rom to Cubic Bezier control points (seamless C1 continuity)
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();
  } else {
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(n - 1, i + 2)];

      // Open Catmull-Rom to Cubic Bezier control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    if (close) {
      ctx.closePath();
    }
  }
}

/**
 * Renders the volumetric ambient wash (translucent silhouette mass).
 */
function renderVolumetricWash(
  ctx: CanvasRenderingContext2D,
  mesh: WhaleMesh,
  palette: WhaleThemePalette
) {
  if (mesh.silhouettePolygon.length < 4) return;

  ctx.save();
  ctx.fillStyle = palette.washFill;
  drawSmoothPath(ctx, mesh.silhouettePolygon, true);
  ctx.fill();
  ctx.restore();
}

/**
 * Renders cross-sectional ribs with frontface/backface depth separation.
 */
function renderRibs(
  ctx: CanvasRenderingContext2D,
  ribs: WhaleRib[],
  palette: WhaleThemePalette
) {
  ctx.save();
  ribs.forEach((rib, idx) => {
    const pts = rib.points;
    if (pts.length < 3) return;

    // Distinguish major structural stations from intermediate ribs
    const isMajorStation = idx % 4 === 0 || rib.isThoracic;
    ctx.lineWidth = isMajorStation ? 1.0 : 0.65;
    ctx.strokeStyle = isMajorStation ? palette.primaryLine : palette.secondaryLine;

    // Split ring into back (top/deeper) and front (bottom/closer)
    const mid = Math.floor(pts.length / 2);
    const backPts = pts.slice(0, mid + 1);
    const frontPts = [...pts.slice(mid), pts[0]];

    // 1. Backface arc (fainter)
    ctx.save();
    ctx.strokeStyle = palette.backfaceLine;
    ctx.lineWidth = 0.55;
    drawSmoothPath(ctx, backPts, false);
    ctx.stroke();
    ctx.restore();

    // 2. Frontface arc (crisp)
    drawSmoothPath(ctx, frontPts, false);
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Renders longitudinal streamlines running head-to-tail.
 */
function renderStreamlines(
  ctx: CanvasRenderingContext2D,
  streamlines: { x: number; y: number; alpha: number }[][],
  palette: WhaleThemePalette
) {
  ctx.save();
  streamlines.forEach((line, idx) => {
    if (line.length < 2) return;
    // Outer flank lines and spine dorsal line are highlighted
    const isMajorFlank = idx === 0 || idx === 5 || idx === 10 || idx === 15;
    ctx.lineWidth = isMajorFlank ? 0.95 : 0.6;
    ctx.strokeStyle = isMajorFlank ? palette.primaryLine : palette.secondaryLine;

    drawSmoothPath(ctx, line, false);
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Renders ventral throat pleats (Megaptera throat grooves).
 */
function renderVentralPleats(
  ctx: CanvasRenderingContext2D,
  pleats: { x: number; y: number; alpha: number }[][],
  palette: WhaleThemePalette
) {
  ctx.save();
  ctx.lineWidth = 0.65;
  ctx.strokeStyle = palette.accentLine;

  pleats.forEach((pleat) => {
    if (pleat.length < 2) return;
    drawSmoothPath(ctx, pleat, false);
    ctx.stroke();
  });
  ctx.restore();
}

/**
 * Renders Megaptera pectoral flipper with leading-edge tubercles and internal phalange spars.
 */
function renderFlipper(
  ctx: CanvasRenderingContext2D,
  flipper: WhaleFlipper,
  palette: WhaleThemePalette
) {
  ctx.save();

  // Subtle interior fill representing the flipper blade
  const bladePolygon = [...flipper.leadingEdge, ...flipper.trailingEdge.slice().reverse()];
  if (bladePolygon.length > 4) {
    ctx.fillStyle = palette.flipperWhiteUnderside;
    drawSmoothPath(ctx, bladePolygon, true);
    ctx.fill();
  }

  // 1. Leading edge with scalloped tubercles
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = palette.accentLine;
  drawSmoothPath(ctx, flipper.leadingEdge, false);
  ctx.stroke();

  // 2. Trailing edge
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = palette.primaryLine;
  drawSmoothPath(ctx, flipper.trailingEdge, false);
  ctx.stroke();

  // 3. Internal skeletal spars (radiating ray bones)
  ctx.lineWidth = 0.55;
  ctx.strokeStyle = palette.secondaryLine;
  flipper.internalSpars.forEach((spar) => {
    drawSmoothPath(ctx, spar, false);
    ctx.stroke();
  });

  // 4. Highlighted tubercle nodules (small circles)
  ctx.fillStyle = palette.accentLine;
  flipper.tubercles.forEach((tub) => {
    ctx.beginPath();
    ctx.arc(tub.x, tub.y, 1.8 * tub.scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * Renders the bifurcated fluke (tail fin).
 */
function renderFlukes(
  ctx: CanvasRenderingContext2D,
  flukes: WhaleFlukes,
  palette: WhaleThemePalette
) {
  ctx.save();

  // Outer fluke perimeter
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = palette.primaryLine;
  drawSmoothPath(ctx, flukes.outline, false);
  ctx.stroke();

  // Radiating fluke ray lines
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = palette.secondaryLine;
  flukes.ribLines.forEach((ray) => {
    if (ray.length === 2) {
      ctx.beginPath();
      ctx.moveTo(ray[0].x, ray[0].y);
      ctx.lineTo(ray[1].x, ray[1].y);
      ctx.stroke();
    }
  });

  // Notch highlight
  ctx.fillStyle = palette.accentLine;
  ctx.beginPath();
  ctx.arc(flukes.notch.x, flukes.notch.y, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renders technical blueprint station markers and CAD coordinate reticles.
 */
function renderTechnicalMarkers(
  ctx: CanvasRenderingContext2D,
  markers: WhaleMarker[],
  palette: WhaleThemePalette
) {
  ctx.save();
  ctx.font = "9px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.fillStyle = palette.markerColor;
  ctx.strokeStyle = palette.markerColor;
  ctx.lineWidth = 0.75;

  const baseAlpha = ctx.globalAlpha;

  markers.forEach((m) => {
    const { x, y } = m.pos;
    const depthAlpha = Math.max(0.18, Math.min(1.0, m.pos.alpha ?? 1.0));
    ctx.globalAlpha = baseAlpha * depthAlpha;

    if (m.type === "cross") {
      // Crosshair (+)
      const arm = 5;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    } else {
      // Circle node (○)
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Label offset
    ctx.fillText(m.label, x + 7, y - 4);
  });

  ctx.restore();
}

/**
 * Main render function: paints a complete frame of the blueprint whale onto Canvas2D.
 */
export function renderWhaleFrame(
  ctx: CanvasRenderingContext2D,
  mesh: WhaleMesh,
  palette: WhaleThemePalette,
  width: number,
  height: number,
  globalOpacity = 1.0
) {
  if (globalOpacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1.0, globalOpacity));

  // 1. Volumetric ambient wash (softest underlayer)
  renderVolumetricWash(ctx, mesh, palette);

  // 2. Ventral throat pleats
  renderVentralPleats(ctx, mesh.ventralPleats, palette);

  // 3. Longitudinal streamlines
  renderStreamlines(ctx, mesh.streamlines, palette);

  // 4. Cross-sectional ribs
  renderRibs(ctx, mesh.ribs, palette);

  // 5. Megaptera Pectoral Flippers (Left & Right)
  renderFlipper(ctx, mesh.leftFlipper, palette);
  renderFlipper(ctx, mesh.rightFlipper, palette);

  // 6. Dorsal Fin
  ctx.save();
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = palette.primaryLine;
  drawSmoothPath(ctx, mesh.dorsalFin.outline, false);
  ctx.stroke();
  ctx.restore();

  // 7. Flukes (Bifurcated Tail)
  renderFlukes(ctx, mesh.flukes, palette);

  // 8. Technical Blueprint CAD Station Markers
  renderTechnicalMarkers(ctx, mesh.technicalMarkers, palette);

  ctx.restore();
}
