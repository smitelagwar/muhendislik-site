import type {
  Point2D,
  ProjectedPoint,
  WhaleFlipper,
  WhaleMesh,
  WhaleSurfacePatch,
  WhaleThemePalette,
} from "./whale-types";

export const LIGHT_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(20, 48, 66, 0.68)",
  secondaryLine: "rgba(42, 84, 108, 0.22)",
  backfaceLine: "rgba(56, 98, 120, 0.08)",
  accentLine: "rgba(180, 118, 32, 0.68)",
  washFill: "rgba(38, 78, 102, 0.06)",
  markerColor: "rgba(32, 68, 88, 0.58)",
  flipperWhiteUnderside: "rgba(232, 242, 245, 0.95)",
  surfaceRgb: "74, 118, 142",
  highlightLine: "rgba(22, 62, 84, 0.78)",
  skinShadow: "#183142",
  skinLight: "#6f9db5",
  belly: "#e8f0f2",
};

export const DARK_WHALE_PALETTE: WhaleThemePalette = {
  primaryLine: "rgba(138, 220, 242, 0.62)",
  secondaryLine: "rgba(88, 186, 218, 0.22)",
  backfaceLine: "rgba(64, 152, 184, 0.085)",
  accentLine: "rgba(238, 186, 98, 0.72)",
  washFill: "rgba(56, 156, 192, 0.06)",
  markerColor: "rgba(142, 204, 220, 0.60)",
  flipperWhiteUnderside: "rgba(188, 224, 234, 0.94)",
  surfaceRgb: "84, 158, 188",
  highlightLine: "rgba(204, 244, 252, 0.84)",
  skinShadow: "#0c2030",
  skinLight: "#4d88a8",
  belly: "#c8e2ea",
};

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothStep = (a: number, b: number, n: number) => {
  const u = clamp((n - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/**
 * Her 3B yüzey yaması için Phong aydınlatma, Fresnel kenar ışığı (rim light),
 * sualtı güneş kostikleri, sırt-karın zıt renklenmesi (countershading) ve
 * ıslak deri speküler parlamasını birleştiren pürüzsüz yarı-saydam 3B gölgelendirici.
 * Siluet kenarlarında (facing -> 0) opaklık yumuşakça sıfıra inerek basamaklı blok oluşumunu önler.
 */
function shade3DPatchColor(patch: WhaleSurfacePatch, isDark: boolean, baseAlpha = 0.44): string {
  const pts = patch.points;
  const facing = pts.reduce((acc, p) => acc + (p.visibility ?? 0.25), 0) / (pts.length || 1);
  const edgeFade = smoothStep(-0.04, 0.32, facing);
  if (edgeFade <= 0.01) return "rgba(0,0,0,0)";

  const L = clamp(patch.light);
  const V = clamp(patch.ventral);
  const S = clamp(patch.specular ?? 0);
  const R = clamp(patch.rim ?? 0);
  const C = clamp(patch.caustic ?? 0);

  let r: number, g: number, b: number;
  if (!isDark) {
    const shadowR = 20, shadowG = 44, shadowB = 62;
    const midR = 56, midG = 96, midB = 120;
    const litR = 134, litG = 176, litB = 196;
    if (L < 0.5) {
      const u = L * 2;
      r = mix(shadowR, midR, u);
      g = mix(shadowG, midG, u);
      b = mix(shadowB, midB, u);
    } else {
      const u = (L - 0.5) * 2;
      r = mix(midR, litR, u);
      g = mix(midG, litG, u);
      b = mix(midB, litB, u);
    }
    if (V > 0.01) {
      const bellyR = mix(148, 240, L);
      const bellyG = mix(172, 246, L);
      const bellyB = mix(184, 249, L);
      const vBlend = smoothStep(0, 1, V) * 0.85;
      r = mix(r, bellyR, vBlend);
      g = mix(g, bellyG, vBlend);
      b = mix(b, bellyB, vBlend);
    }
    if (C > 0.01) {
      r = mix(r, 220, C * 0.38);
      g = mix(g, 240, C * 0.44);
      b = mix(b, 248, C * 0.48);
    }
    if (R > 0.02) {
      const warmEdge = clamp(1 - V * 1.3);
      r = mix(r, mix(168, 230, warmEdge), R * 0.42);
      g = mix(g, mix(210, 198, warmEdge), R * 0.42);
      b = mix(b, mix(226, 148, warmEdge), R * 0.42);
    }
    if (S > 0.01) {
      r = mix(r, 248, S * 0.65);
      g = mix(g, 252, S * 0.70);
      b = mix(b, 255, S * 0.75);
    }
  } else {
    const shadowR = 9, shadowG = 24, shadowB = 38;
    const midR = 34, midG = 80, midB = 108;
    const litR = 104, litG = 172, litB = 204;
    if (L < 0.5) {
      const u = L * 2;
      r = mix(shadowR, midR, u);
      g = mix(shadowG, midG, u);
      b = mix(shadowB, midB, u);
    } else {
      const u = (L - 0.5) * 2;
      r = mix(midR, litR, u);
      g = mix(midG, litG, u);
      b = mix(midB, litB, u);
    }
    if (V > 0.01) {
      const bellyR = mix(74, 202, L);
      const bellyG = mix(118, 230, L);
      const bellyB = mix(138, 240, L);
      const vBlend = smoothStep(0, 1, V) * 0.84;
      r = mix(r, bellyR, vBlend);
      g = mix(g, bellyG, vBlend);
      b = mix(b, bellyB, vBlend);
    }
    if (C > 0.01) {
      r = mix(r, 160, C * 0.42);
      g = mix(g, 234, C * 0.52);
      b = mix(b, 252, C * 0.58);
    }
    if (R > 0.02) {
      const warmEdge = clamp(1 - V * 1.25);
      r = mix(r, mix(112, 236, warmEdge * 0.6), R * 0.50);
      g = mix(g, mix(216, 202, warmEdge * 0.6), R * 0.50);
      b = mix(b, mix(246, 140, warmEdge * 0.6), R * 0.50);
    }
    if (S > 0.01) {
      r = mix(r, 218, S * 0.70);
      g = mix(g, 248, S * 0.76);
      b = mix(b, 255, S * 0.82);
    }
  }

  const alpha = clamp(edgeFade * (baseAlpha + S * 0.28 + V * 0.16 + C * 0.14), 0, 0.82);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha.toFixed(3)})`;
}

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
    ctx.bezierCurveTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y
    );
  }
  if (closed) ctx.closePath();
}

/** Arka yüz çizgileri öne sızmaz; görünür parçalar kesintisiz spline olarak çizilir. */
function surfaceLine(
  ctx: CanvasRenderingContext2D,
  points: ProjectedPoint[],
  color: string,
  weight: number,
  closed = false,
  minVis = 0.04
) {
  const path = closed ? [...points, points[0]] : points;
  let segment: ProjectedPoint[] = [];
  const flush = () => {
    if (segment.length < 2) {
      segment = [];
      return;
    }
    const depth = segment.reduce((a, p) => a + p.alpha, 0) / segment.length;
    const visAvg = segment.reduce((a, p) => a + clamp(((p.visibility ?? 0.2) - minVis) * 3.2, 0.15, 1), 0) / segment.length;
    ctx.save();
    ctx.globalAlpha *= depth * visAvg;
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    smoothPath(ctx, segment);
    ctx.stroke();
    ctx.restore();
    segment = [];
  };
  for (const p of path) {
    if ((p.visibility ?? 1) > minVis) segment.push(p);
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

/** 3B dörtgen yüzey yamalarını (quad mesh) yumuşak geçişli hacimle boyar. */
function render3DSurfacePatches(
  ctx: CanvasRenderingContext2D,
  patches: WhaleSurfacePatch[],
  isDark: boolean,
  baseAlpha = 0.34
) {
  for (const patch of patches) {
    const pts = patch.points;
    if (pts.length < 3) continue;
    const color = shade3DPatchColor(patch, isDark, baseAlpha);
    if (color === "rgba(0,0,0,0)") continue;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function fin(ctx: CanvasRenderingContext2D, flipper: WhaleFlipper, palette: WhaleThemePalette, near: boolean, isDark: boolean) {
  ctx.save();
  ctx.globalAlpha *= near ? 1 : 0.56;
  const outline = [...flipper.leadingEdge, ...flipper.trailingEdge.slice().reverse()];
  if (near) {
    // Yakın yüzgecin altında kalan gövde çizgilerini gerçek bir 3B örtüşmeyle keser.
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    smoothPath(ctx, outline, true);
    ctx.fill();
    ctx.restore();
  }

  const root = flipper.leadingEdge[0], tip = flipper.leadingEdge.at(-1)!;
  const baseGrad = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
  baseGrad.addColorStop(0, palette.skinShadow);
  baseGrad.addColorStop(0.26, palette.skinLight);
  baseGrad.addColorStop(0.66, palette.flipperWhiteUnderside);
  baseGrad.addColorStop(1, palette.belly);

  smoothPath(ctx, outline, true);
  ctx.fillStyle = baseGrad;
  ctx.fill();

  ctx.save();
  smoothPath(ctx, outline, true);
  ctx.clip();
  if (flipper.surface.length > 0) {
    render3DSurfacePatches(ctx, flipper.surface, isDark, 0.34);
  }
  ctx.restore();

  // Blueprint falanks iskelet ışınları ve hidrofil kesit halkaları
  ctx.save();
  ctx.globalAlpha *= near ? 0.65 : 0.38;
  for (const spar of flipper.internalSpars) stroke(ctx, spar, palette.secondaryLine, 0.75);
  for (let i = 0; i < flipper.sections.length; i += 2) {
    stroke(ctx, flipper.sections[i], palette.secondaryLine, 0.52);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.38;
  for (const line of flipper.etching) stroke(ctx, line, palette.primaryLine, 0.45);
  ctx.restore();

  // Dış kontur ve ön kenar 3B vurgu çizgisi
  stroke(ctx, outline, palette.primaryLine, near ? 1.2 : 0.85, true);
  stroke(ctx, flipper.leadingEdge, palette.accentLine, near ? 1.45 : 0.95);

  // Ön kenar 3B tüberkül kubbeleri (Leading-edge tubercles)
  for (const p of flipper.tubercles) {
    const r = Math.max(0.9, 1.55 * p.scale);
    ctx.fillStyle = palette.skinShadow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.flipperWhiteUnderside;
    ctx.beginPath();
    ctx.arc(p.x - r * 0.2, p.y - r * 0.2, r * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.accentLine;
    ctx.beginPath();
    ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function body(ctx: CanvasRenderingContext2D, mesh: WhaleMesh, p: WhaleThemePalette, small: boolean, isDark: boolean) {
  const chestRib = mesh.ribs[Math.round(mesh.ribs.length * 0.28)];
  const ringLen = chestRib.points.length;
  // theta = pi/2 (sırt omurgası) ve theta = 3pi/2 (karın olukları) arasındaki gerçek 3B anatomik vektör:
  const dorsalPt = chestRib.points[Math.floor(ringLen * 0.25)];
  const ventralPt = chestRib.points[Math.floor(ringLen * 0.75)];
  const dx = ventralPt.x - dorsalPt.x, dy = ventralPt.y - dorsalPt.y;
  const dist = Math.hypot(dx, dy) || 24;
  const ux = dx / dist, uy = dy / dist;
  // Çok duraklı 3B sırt-karın (countershading) silindirik ana gövde gradyanı
  const shade = ctx.createLinearGradient(
    dorsalPt.x - ux * dist * 0.15,
    dorsalPt.y - uy * dist * 0.15,
    ventralPt.x + ux * dist * 0.15,
    ventralPt.y + uy * dist * 0.15
  );
  shade.addColorStop(0, p.skinShadow);
  shade.addColorStop(0.24, p.skinLight);
  shade.addColorStop(0.55, isDark ? "#5d9ab8" : "#7fa8bd");
  shade.addColorStop(0.82, isDark ? "#9ecbd9" : "#c7dce3");
  shade.addColorStop(1, p.belly);

  smoothPath(ctx, mesh.silhouettePolygon, true);
  ctx.fillStyle = shade;
  ctx.fill();

  ctx.save();
  smoothPath(ctx, mesh.silhouettePolygon, true);
  ctx.clip();

  // 1. Gerçek 3B Phong + Fresnel + Kostik aydınlatmalı dikişsiz yüzey yamaları
  render3DSurfacePatches(ctx, mesh.surface, isDark, 0.38);

  // 2. Doğal deri pigment adaları ve alacalı yan desenler
  for (const mark of mesh.skinMarks) {
    if ((mark.points[0].visibility ?? 0) < 0.14) continue;
    ctx.save();
    ctx.globalAlpha *= mark.opacity;
    smoothPath(ctx, mark.points, true);
    ctx.fillStyle = mark.light ? p.belly : p.skinShadow;
    ctx.fill();
    ctx.restore();
  }

  // 3. 3B Jeodezik Blueprint Kesit Halkaları (Cross-Sectional Station Ribs) & Boyuna Akış Çizgileri
  ctx.save();
  for (let i = 2; i < mesh.ribs.length - 2; i += small ? 4 : 3) {
    const rib = mesh.ribs[i];
    const isMajor = i % 6 === 0 || rib.isThoracic;
    ctx.save();
    ctx.globalAlpha *= isMajor ? 0.24 : 0.12;
    stroke(ctx, rib.points, p.backfaceLine, 0.5, true);
    ctx.restore();
    surfaceLine(
      ctx,
      rib.points,
      isMajor ? p.accentLine : p.secondaryLine,
      isMajor ? 0.72 : 0.48,
      true,
      0.10
    );
  }
  for (let j = 0; j < mesh.streamlines.length; j += small ? 6 : 4) {
    const isFlankCrest = j % 12 === 0;
    surfaceLine(
      ctx,
      mesh.streamlines[j],
      isFlankCrest ? p.primaryLine : p.secondaryLine,
      isFlankCrest ? 0.62 : 0.42,
      false,
      0.12
    );
  }
  ctx.restore();

  // 4. İnce 3B yüzey gravür taramaları
  for (const mark of mesh.etching) {
    ctx.save();
    ctx.globalAlpha *= mark.opacity * 0.72;
    surfaceLine(ctx, mark.points, p.primaryLine, 0.45, false, 0.10);
    ctx.restore();
  }

  // 5. 3B Kabartmalı Karın Olukları (Ventral Throat Pleats) — Gölge Çukuru ve Sırt Işığı
  mesh.ventralPleats.forEach((line, i) => {
    if (small && i % 2) return;
    surfaceLine(ctx, line, p.skinShadow, 1.35, false, 0.06);
    surfaceLine(ctx, line, p.primaryLine, 0.85, false, 0.06);
    surfaceLine(ctx, mesh.pleatHighlights[i], p.belly, 0.72, false, 0.08);
  });

  ctx.restore();

  // 6. 3B Fresnel Siluet Kenar Işığı (Rim Glow) ve Ana Kontur
  ctx.save();
  ctx.globalAlpha *= isDark ? 0.34 : 0.24;
  stroke(ctx, mesh.silhouettePolygon, p.accentLine, 3.6, true);
  ctx.restore();
  stroke(ctx, mesh.silhouettePolygon, p.primaryLine, small ? 1.05 : 1.35, true);

  // 7. Baş, Kavisli Alt Çene, Hava Deliği (Blowhole) ve Göz Çukuru Kıvrımları
  for (const feature of mesh.featureLines) {
    const major = feature.kind === "jaw" || feature.kind === "eye" || feature.kind === "blowhole";
    if (feature.kind === "jaw") {
      surfaceLine(ctx, feature.points, p.skinShadow, 2.0, false, 0.06);
      surfaceLine(ctx, feature.points, p.highlightLine, 1.15, false, 0.06);
    } else {
      surfaceLine(
        ctx,
        feature.points,
        major ? p.highlightLine : p.primaryLine,
        major ? 1.05 : 0.60,
        false,
        0.08
      );
    }
  }

  // 8. Gerçekçi 3B Göz Küresi, Orbital Gölge ve Kornea Yansıması
  for (const eye of mesh.eyes) {
    if ((eye.visibility ?? 0) < 0.08) continue;
    const r = Math.max(1.5, 2.7 * eye.scale);
    ctx.fillStyle = p.skinShadow;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, r * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.accentLine;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, r * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.arc(eye.x - eye.scale * 0.6, eye.y - eye.scale * 0.6, Math.max(0.65, 0.9 * eye.scale), 0, Math.PI * 2);
    ctx.fill();
  }

  // 9. 3B Kubbeli Baş Tüberkülleri (Sensory Dermal Nodules) ve Mikro-Doku
  ctx.save();
  for (const nodule of mesh.nodules) {
    if ((nodule.center.visibility ?? 0) < 0.08) continue;
    smoothPath(ctx, nodule.outline, true);
    ctx.fillStyle = p.skinShadow;
    ctx.fill();
    stroke(ctx, nodule.outline, p.primaryLine, 0.75, true);
    smoothPath(ctx, nodule.crown, false);
    ctx.fillStyle = p.flipperWhiteUnderside;
    ctx.fill();
    stroke(ctx, nodule.crown, p.highlightLine, 0.75);
  }
  ctx.globalAlpha *= 0.42;
  ctx.fillStyle = p.primaryLine;
  mesh.stipples.forEach((pt, i) => {
    if ((pt.visibility ?? 0) < 0.15) return;
    const size = (0.38 + (Math.sin(i * 3.7) + 1) * 0.25) * pt.scale;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(0.28, size), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawDorsalFin(ctx: CanvasRenderingContext2D, mesh: WhaleMesh, palette: WhaleThemePalette, isDark: boolean) {
  ctx.save();
  const basePt = mesh.dorsalFin.outline[0], tipPt = mesh.dorsalFin.outline[3];
  const dorsalGrad = ctx.createLinearGradient(basePt.x, basePt.y, tipPt.x, tipPt.y);
  dorsalGrad.addColorStop(0, palette.skinLight);
  dorsalGrad.addColorStop(0.55, palette.skinShadow);
  dorsalGrad.addColorStop(1, isDark ? "#78b8d4" : "#305870");
  smoothPath(ctx, mesh.dorsalFin.outline, true);
  ctx.fillStyle = dorsalGrad;
  ctx.fill();
  ctx.save();
  smoothPath(ctx, mesh.dorsalFin.outline, true);
  ctx.clip();
  if (mesh.dorsalFin.surface.length > 0) {
    render3DSurfacePatches(ctx, mesh.dorsalFin.surface, isDark, 0.26);
  }
  ctx.restore();
  stroke(ctx, mesh.dorsalFin.outline, palette.primaryLine, 1.15, true);
  stroke(ctx, mesh.dorsalFin.outline.slice(0, 4), palette.accentLine, 1.0, false);
  ctx.restore();
}

function drawTailFlukes(ctx: CanvasRenderingContext2D, mesh: WhaleMesh, palette: WhaleThemePalette, isDark: boolean) {
  ctx.save();
  const [tipA, tipB] = mesh.flukes.tips;
  const flukeGrad = ctx.createLinearGradient(tipA.x, tipA.y, tipB.x, tipB.y);
  flukeGrad.addColorStop(0, palette.belly);
  flukeGrad.addColorStop(0.22, palette.skinLight);
  flukeGrad.addColorStop(0.50, palette.skinShadow);
  flukeGrad.addColorStop(0.78, palette.skinLight);
  flukeGrad.addColorStop(1, palette.belly);
  smoothPath(ctx, mesh.flukes.outline, true);
  ctx.fillStyle = flukeGrad;
  ctx.fill();

  ctx.save();
  smoothPath(ctx, mesh.flukes.outline, true);
  ctx.clip();
  if (mesh.flukes.surface.length > 0) {
    render3DSurfacePatches(ctx, mesh.flukes.surface, isDark, 0.28);
  }
  ctx.restore();

  // Kuyruk kolajen lif ışınları ve 3B kamburluk konturları
  ctx.save();
  ctx.globalAlpha *= 0.65;
  mesh.flukes.ribLines.forEach(line => stroke(ctx, line, palette.secondaryLine, 0.65));
  mesh.flukes.contours.forEach((line, idx) =>
    stroke(ctx, line, idx === 3 ? palette.flipperWhiteUnderside : palette.secondaryLine, idx === 3 ? 0.85 : 0.48)
  );
  ctx.restore();

  stroke(ctx, mesh.flukes.outline, palette.primaryLine, 1.25, true);
  // Merkez V-çentiği (fluke notch) 3B vurgu noktası
  ctx.fillStyle = palette.accentLine;
  ctx.beginPath();
  ctx.arc(mesh.flukes.notch.x, mesh.flukes.notch.y, Math.max(1.2, 1.8 * mesh.flukes.notch.scale), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWakeAndMarkers(ctx: CanvasRenderingContext2D, mesh: WhaleMesh, palette: WhaleThemePalette, small: boolean) {
  // 1. Yüzgeç ve kuyruk uçlarından süzülen 3B hidrodinamik akış izleri
  if (mesh.wakeLines && mesh.wakeLines.length > 0) {
    ctx.save();
    for (const wake of mesh.wakeLines) {
      if (wake.points.length < 2) continue;
      ctx.save();
      ctx.globalAlpha *= wake.opacity;
      ctx.setLineDash([4, 4]);
      stroke(ctx, wake.points, palette.accentLine, 0.75, false);
      ctx.restore();
    }
    ctx.restore();
  }

  // 2. Mimari Blueprint İstasyon İşaretçileri (yalnız tam detayda ve yakın planda zarifçe görünür)
  if (!small && mesh.technicalMarkers.length > 0) {
    ctx.save();
    ctx.font = "600 8.5px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.fillStyle = palette.markerColor;
    ctx.strokeStyle = palette.markerColor;
    ctx.lineWidth = 0.7;
    const baseAlpha = ctx.globalAlpha;

    for (const m of mesh.technicalMarkers) {
      const { x, y, alpha, scale } = m.pos;
      if (scale < 0.72) continue;
      ctx.globalAlpha = baseAlpha * clamp((alpha - 0.45) * 1.4, 0, 0.72);
      if (ctx.globalAlpha < 0.08) continue;

      if (m.type === "cross") {
        const arm = 4.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x - arm, y);
        ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm);
        ctx.lineTo(x, y + arm);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 2.4 * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillText(m.label, x + 7 * scale, y - 4 * scale);
    }
    ctx.restore();
  }
}

export function renderWhaleFrame(
  ctx: CanvasRenderingContext2D,
  mesh: WhaleMesh,
  palette: WhaleThemePalette,
  width: number,
  height: number,
  globalOpacity = 1
) {
  if (globalOpacity <= 0 || width <= 0 || height <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, globalOpacity));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const small = width < 1024;
  const isDark = palette === DARK_WHALE_PALETTE || palette.skinShadow === DARK_WHALE_PALETTE.skinShadow;

  // 1. Uzaktaki kanat önce çizilir
  const fins = [mesh.leftFlipper, mesh.rightFlipper].sort((a, b) => b.depth - a.depth);
  for (const f of fins) if (f.depth > mesh.depth) fin(ctx, f, palette, false, isDark);

  // 2. Kuyruk gövdeden uzaktaysa önce çizilir
  if (mesh.flukes.depth > mesh.depth) drawTailFlukes(ctx, mesh, palette, isDark);

  // 3. Gövde silueti arka yüzgeçleri gerçek 3B derinlikle örter
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-out";
  smoothPath(ctx, mesh.silhouettePolygon, true);
  ctx.fill();
  ctx.restore();

  // 4. 3B Hacimli Gövde ve Anatomik Detaylar
  body(ctx, mesh, palette, small, isDark);

  // 5. 3B Kambur Sırt Yüzgeci
  drawDorsalFin(ctx, mesh, palette, isDark);

  // 6. Kuyruk gövdeden yakındaysa gövde üstüne çizilir
  if (mesh.flukes.depth <= mesh.depth) drawTailFlukes(ctx, mesh, palette, isDark);

  // 7. Yakındaki pektoral kanat en üst katmanda 3B derinlikle çizilir
  for (const f of fins) if (f.depth <= mesh.depth) fin(ctx, f, palette, true, isDark);

  // 8. 3B Hidrodinamik Akış İzleri ve Blueprint İstasyon Etiketleri
  drawWakeAndMarkers(ctx, mesh, palette, small);

  ctx.restore();
}
