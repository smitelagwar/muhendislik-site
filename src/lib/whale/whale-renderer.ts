import type { Point2D, ProjectedPoint, WhaleFlipper, WhaleMesh, WhaleThemePalette } from "./whale-types";

export const LIGHT_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(42, 68, 81, 0.48)", secondaryLine: "rgba(61, 91, 104, 0.17)",
  backfaceLine: "rgba(80, 110, 124, 0.07)", accentLine: "rgba(162, 111, 43, 0.56)",
  washFill: "rgba(74, 116, 132, 0.035)", markerColor: "rgba(98, 111, 117, 0.52)",
  flipperWhiteUnderside: "rgba(105, 142, 155, 0.055)", surfaceRgb: "55, 108, 128",
  highlightLine: "rgba(37, 76, 92, 0.66)",
};
export const DARK_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(131, 211, 231, 0.55)", secondaryLine: "rgba(92, 182, 209, 0.18)",
  backfaceLine: "rgba(74, 157, 186, 0.075)", accentLine: "rgba(222, 181, 111, 0.64)",
  washFill: "rgba(89, 184, 210, 0.035)", markerColor: "rgba(132, 184, 195, 0.55)",
  flipperWhiteUnderside: "rgba(172, 222, 226, 0.075)", surfaceRgb: "104, 197, 220",
  highlightLine: "rgba(190, 235, 239, 0.76)",
};

/** Açık ve kapalı eğriler aynı C1 sürekli çizim dilini kullanır. */
function smoothPath(ctx: CanvasRenderingContext2D, points: Point2D[], closed = false) {
  const n = points.length;
  if (n < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = points[i], p2 = points[(i + 1) % n];
    const p3 = points[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    ctx.bezierCurveTo(p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y);
  }
  if (closed) ctx.closePath();
}

/** Arka yüz çizgileri öne sızmaz; görünür parçalar kesintisiz spline olarak çizilir. */
function surfaceLine(ctx: CanvasRenderingContext2D, points: ProjectedPoint[], color: string, weight: number, closed = false) {
  const path = closed ? [...points, points[0]] : points;
  let segment: ProjectedPoint[] = [];
  const flush = () => {
    if (segment.length < 2) { segment = []; return; }
    const depth = segment.reduce((a, p) => a + p.alpha, 0) / segment.length;
    ctx.save();
    ctx.globalAlpha *= depth;
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    smoothPath(ctx, segment);
    ctx.stroke();
    ctx.restore();
    segment = [];
  };
  for (const p of path) {
    if ((p.visibility ?? 1) > -0.045) segment.push(p);
    else flush();
  }
  flush();
}

function stroke(ctx: CanvasRenderingContext2D, points: Point2D[], color: string, weight: number, closed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  smoothPath(ctx, points, closed);
  ctx.stroke();
}

function fin(ctx: CanvasRenderingContext2D, flipper: WhaleFlipper, palette: WhaleThemePalette, near: boolean) {
  ctx.save();
  ctx.globalAlpha *= near ? 1 : 0.38;
  const outline = [...flipper.leadingEdge, ...flipper.trailingEdge.slice().reverse()];
  if (near) {
    // Yakın yüzgecin altında kalan gövde çizgilerini gerçek bir örtüşmeyle keser.
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    smoothPath(ctx, outline, true); ctx.fill();
    ctx.restore();
  }
  smoothPath(ctx, outline, true);
  ctx.fillStyle = palette.flipperWhiteUnderside;
  ctx.fill();
  stroke(ctx, outline, palette.primaryLine, near ? 1.15 : 0.8, true);
  stroke(ctx, flipper.leadingEdge, palette.accentLine, near ? 1.25 : 0.8);
  for (const spar of flipper.internalSpars) stroke(ctx, spar, palette.secondaryLine, 0.6);
  for (const section of flipper.sections) stroke(ctx, section, palette.secondaryLine, 0.45);
  ctx.save();
  ctx.globalAlpha *= 0.5;
  for (const line of flipper.etching) stroke(ctx, line, palette.primaryLine, 0.45);
  ctx.restore();
  ctx.fillStyle = palette.highlightLine;
  for (const p of flipper.tubercles) {
    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.65, 1.1 * p.scale), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function body(ctx: CanvasRenderingContext2D, mesh: WhaleMesh, p: WhaleThemePalette, small: boolean) {
  smoothPath(ctx, mesh.silhouettePolygon, true);
  ctx.fillStyle = p.washFill;
  ctx.fill();
  // Tek dolgu yerine yüzey normallerinden aydınlanan ince hacim katmanları.
  for (const patch of mesh.surface) {
    ctx.beginPath();
    patch.points.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y));
    ctx.closePath();
    ctx.fillStyle = `rgba(${p.surfaceRgb}, ${0.023 + patch.light * 0.080})`;
    ctx.fill();
  }
  for (const mark of mesh.etching) {
    ctx.save();
    ctx.globalAlpha *= mark.opacity;
    surfaceLine(ctx, mark.points, p.primaryLine, 0.5);
    ctx.restore();
  }
  // Seyrek arka istasyonlar, yoğunluğu artırmadan teknik derinlik verir.
  ctx.save();
  ctx.setLineDash([2, 5]);
  for (let i = 4; i < mesh.ribs.length - 2; i += 8) stroke(ctx, mesh.ribs[i].points, p.backfaceLine, 0.5, true);
  ctx.restore();
  mesh.streamlines.forEach((line, i) => {
    if (small && i % 2) return;
    surfaceLine(ctx, line, i % 5 === 0 ? p.primaryLine : p.secondaryLine, i % 5 === 0 ? 0.65 : 0.4);
  });
  mesh.ribs.forEach((rib, i) => {
    if (i < 2 || (small && i % 2)) return;
    surfaceLine(ctx, rib.points, i % 7 === 0 ? p.primaryLine : p.secondaryLine, i % 7 === 0 ? 0.65 : 0.4, true);
  });
  mesh.ventralPleats.forEach((line, i) => {
    if (small && i % 2) return;
    surfaceLine(ctx, line, i % 6 === 0 ? p.accentLine : p.primaryLine, i % 6 === 0 ? 0.9 : 0.65);
    surfaceLine(ctx, mesh.pleatHighlights[i], p.secondaryLine, 0.4);
  });
  ctx.save();
  ctx.globalAlpha *= 0.18;
  stroke(ctx, mesh.silhouettePolygon, p.highlightLine, 3.2, true);
  ctx.restore();
  stroke(ctx, mesh.silhouettePolygon, p.primaryLine, small ? 0.95 : 1.25, true);

  for (const feature of mesh.featureLines) {
    const major = feature.kind === "jaw" || feature.kind === "eye" || feature.kind === "blowhole";
    surfaceLine(ctx, feature.points, major ? p.highlightLine : p.primaryLine,
      feature.kind === "jaw" ? 1.3 : major ? 1.05 : 0.6);
  }
  ctx.fillStyle = p.highlightLine;
  for (const eye of mesh.eyes) {
    if ((eye.visibility ?? 0) < 0) continue;
    ctx.beginPath(); ctx.arc(eye.x, eye.y, Math.max(0.9, 1.55 * eye.scale), 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.globalAlpha *= 0.6;
    ctx.strokeStyle = p.accentLine; ctx.lineWidth = 0.55;
    ctx.beginPath(); ctx.arc(eye.x, eye.y, Math.max(1.5, 2.6 * eye.scale), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  for (const nodule of mesh.nodules) {
    if ((nodule.center.visibility ?? 0) < 0) continue;
    smoothPath(ctx, nodule.outline, true);
    ctx.fillStyle = p.flipperWhiteUnderside; ctx.fill();
    stroke(ctx, nodule.outline, p.primaryLine, 0.7, true);
    stroke(ctx, nodule.crown, p.highlightLine, 0.65);
  }
  ctx.globalAlpha *= 0.5;
  ctx.fillStyle = p.primaryLine;
  mesh.stipples.forEach((pt, i) => {
    if ((pt.visibility ?? 0) < 0.1) return;
    const size = (0.4 + (Math.sin(i * 3.7) + 1) * 0.28) * pt.scale;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(0.3, size), 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}

export function renderWhaleFrame(ctx: CanvasRenderingContext2D, mesh: WhaleMesh, palette: WhaleThemePalette,
  width: number, height: number, globalOpacity = 1) {
  if (globalOpacity <= 0 || width <= 0 || height <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, globalOpacity));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const small = width < 1024;
  // Uzaktaki kanat önce, yakındaki kanat gövdeden sonra çizilir.
  const fins = [mesh.leftFlipper, mesh.rightFlipper].sort((a, b) => b.depth - a.depth);
  for (const f of fins) if (f.depth > mesh.depth) fin(ctx, f, palette, false);
  const drawTail = () => {
    smoothPath(ctx, mesh.flukes.outline, true);
    ctx.fillStyle = palette.flipperWhiteUnderside; ctx.fill();
    stroke(ctx, mesh.flukes.outline, palette.primaryLine, 1.2, true);
    mesh.flukes.ribLines.forEach(line => stroke(ctx, line, palette.secondaryLine, 0.6));
    mesh.flukes.contours.forEach(line => stroke(ctx, line, palette.secondaryLine, 0.45));
  };
  if (mesh.flukes.depth > mesh.depth) drawTail();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-out";
  smoothPath(ctx, mesh.silhouettePolygon, true); ctx.fill();
  ctx.restore();
  body(ctx, mesh, palette, small);
  smoothPath(ctx, mesh.dorsalFin.outline, true);
  ctx.fillStyle = palette.flipperWhiteUnderside; ctx.fill();
  stroke(ctx, mesh.dorsalFin.outline, palette.primaryLine, 1, true);
  if (mesh.flukes.depth <= mesh.depth) drawTail();
  for (const f of fins) if (f.depth <= mesh.depth) fin(ctx, f, palette, true);

  // Küçük ekranda anatomiye yer bırakılır; masaüstünde iki hafif gravür notu.
  if (!small) {
    ctx.save();
    ctx.globalAlpha *= 0.65;
    ctx.font = "8px ui-monospace, monospace";
    ctx.fillStyle = palette.markerColor;
    for (const i of [0, 3]) {
      const m = mesh.technicalMarkers[i];
      const offset = i === 0 ? -44 : 46;
      const end = { x: Math.max(18, Math.min(width - 170, m.pos.x + 32)), y: Math.max(24, Math.min(height - 20, m.pos.y + offset)) };
      stroke(ctx, [m.pos, { x: end.x - 8, y: end.y }, { x: end.x + 20, y: end.y }], palette.markerColor, 0.55);
      ctx.fillText(m.label, end.x + 24, end.y + 3);
      ctx.beginPath(); ctx.arc(m.pos.x, m.pos.y, 2.2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
