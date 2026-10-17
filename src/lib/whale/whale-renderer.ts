import type { Point2D, ProjectedPoint, WhaleFlipper, WhaleMesh, WhaleThemePalette } from "./whale-types";

export const LIGHT_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(28, 56, 69, 0.60)", secondaryLine: "rgba(61, 91, 104, 0.15)",
  backfaceLine: "rgba(80, 110, 124, 0.07)", accentLine: "rgba(162, 111, 43, 0.56)",
  washFill: "rgba(74, 116, 132, 0.035)", markerColor: "rgba(98, 111, 117, 0.52)",
  flipperWhiteUnderside: "rgba(206, 219, 219, 0.92)", surfaceRgb: "153, 181, 190",
  highlightLine: "rgba(37, 76, 92, 0.66)",
  skinShadow: "#3c5865", skinLight: "#9bb2b7", belly: "#dce4df",
};
export const DARK_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(131, 211, 231, 0.55)", secondaryLine: "rgba(92, 182, 209, 0.18)",
  backfaceLine: "rgba(74, 157, 186, 0.075)", accentLine: "rgba(222, 181, 111, 0.64)",
  washFill: "rgba(89, 184, 210, 0.035)", markerColor: "rgba(132, 184, 195, 0.55)",
  flipperWhiteUnderside: "rgba(148, 186, 195, 0.92)", surfaceRgb: "131, 189, 206",
  highlightLine: "rgba(190, 235, 239, 0.76)",
  skinShadow: "#18333e", skinLight: "#668d9b", belly: "#abc6ca",
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
  ctx.save();
  smoothPath(ctx, outline, true); ctx.clip();
  const root = flipper.leadingEdge[0], tip = flipper.leadingEdge.at(-1)!;
  const shade = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  shade.addColorStop(0, palette.skinShadow); shade.addColorStop(0.35, "transparent");
  shade.addColorStop(0.82, "transparent"); shade.addColorStop(1, palette.skinLight);
  ctx.fillStyle = shade; ctx.fill();
  ctx.restore();
  stroke(ctx, outline, palette.primaryLine, near ? 1.15 : 0.8, true);
  stroke(ctx, flipper.leadingEdge, palette.accentLine, near ? 1.25 : 0.8);
  for (const spar of flipper.internalSpars) stroke(ctx, spar, palette.secondaryLine, 0.7);
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
  const shoulder = mesh.spine[Math.round(mesh.spine.length * 0.28)];
  const waist = mesh.spine[Math.round(mesh.spine.length * 0.5)];
  const length = Math.hypot(waist.x - shoulder.x, waist.y - shoulder.y) || 1;
  const nx = -(waist.y - shoulder.y) / length, ny = (waist.x - shoulder.x) / length;
  const radius = Math.max(8, ...mesh.ribs[Math.round(mesh.ribs.length * 0.28)].points.map(v => Math.abs((v.x - shoulder.x) * nx + (v.y - shoulder.y) * ny)));
  const shade = ctx.createLinearGradient(shoulder.x - nx * radius, shoulder.y - ny * radius,
    shoulder.x + nx * radius, shoulder.y + ny * radius);
  shade.addColorStop(0, p.skinShadow); shade.addColorStop(0.38, p.skinLight);
  shade.addColorStop(1, p.skinShadow);
  smoothPath(ctx, mesh.silhouettePolygon, true);
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.save();
  smoothPath(ctx, mesh.silhouettePolygon, true); ctx.clip();
  // Normale bağlı hacim, açık karın ve kenar ışığı; ağ çizgisi yerine deri yüzeyi.
  for (const patch of mesh.surface) {
    ctx.beginPath();
    patch.points.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y));
    ctx.closePath();
    ctx.fillStyle = `rgba(${p.surfaceRgb}, ${patch.light * 0.20})`;
    ctx.fill();
    if (patch.ventral > 0.05) {
      ctx.save(); ctx.globalAlpha *= patch.ventral * 0.50;
      ctx.fillStyle = p.belly; ctx.fill(); ctx.restore();
    }
  }
  for (const mark of mesh.skinMarks) {
    if ((mark.points[0].visibility ?? 0) < 0.1) continue;
    ctx.save(); ctx.globalAlpha *= mark.opacity;
    smoothPath(ctx, mark.points, true);
    ctx.fillStyle = mark.light ? p.belly : p.skinShadow; ctx.fill(); ctx.restore();
  }
  for (const mark of mesh.etching) {
    ctx.save();
    ctx.globalAlpha *= mark.opacity;
    surfaceLine(ctx, mark.points, p.primaryLine, 0.5);
    ctx.restore();
  }
  // Teknik görünüm doğal oluk ve gravürle korunur; derinin üstünde tel kafes çizilmez.
  mesh.ventralPleats.forEach((line, i) => {
    if (small && i % 2) return;
    surfaceLine(ctx, line, p.primaryLine, 1.1);
    surfaceLine(ctx, mesh.pleatHighlights[i], p.belly, 0.6);
  });
  ctx.restore();
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
    ctx.fillStyle = p.skinShadow;
    ctx.beginPath(); ctx.arc(eye.x, eye.y, Math.max(1.2, 2.4 * eye.scale), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.belly;
    ctx.beginPath(); ctx.arc(eye.x - eye.scale * 0.55, eye.y - eye.scale * 0.55, Math.max(0.5, 0.75 * eye.scale), 0, Math.PI * 2); ctx.fill();
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
    const tailShade = ctx.createLinearGradient(mesh.flukes.tips[0].x, mesh.flukes.tips[0].y, mesh.flukes.tips[1].x, mesh.flukes.tips[1].y);
    tailShade.addColorStop(0, palette.skinShadow); tailShade.addColorStop(0.3, palette.skinLight);
    tailShade.addColorStop(0.5, palette.skinShadow); tailShade.addColorStop(0.7, palette.skinLight); tailShade.addColorStop(1, palette.skinShadow);
    ctx.fillStyle = tailShade; ctx.fill();
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
  ctx.fillStyle = palette.skinShadow; ctx.fill();
  stroke(ctx, mesh.dorsalFin.outline, palette.primaryLine, 1, true);
  if (mesh.flukes.depth <= mesh.depth) drawTail();
  for (const f of fins) if (f.depth <= mesh.depth) fin(ctx, f, palette, true);

  ctx.restore();
}
