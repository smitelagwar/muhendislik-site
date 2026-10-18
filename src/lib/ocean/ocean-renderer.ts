import { clamp, mix } from "./ocean-math";
import {
  generateAmbientBubblesAndRays,
  generateFishSchoolsAndSoloSpecies,
  generateJellyfishes,
  generateMantaRays,
  generateSeaTurtles,
} from "./ocean-creatures";
import {
  generateCoralFans,
  generateKelpPlants,
  generateSeagrassMeadow,
  generateTubeSponges,
} from "./ocean-flora";
import type {
  ArticulatedFishMesh,
  CoralFan,
  JellyfishMesh,
  KelpPlant,
  MantaRayMesh,
  OceanBubble,
  OceanProjectedPoint,
  OceanQuadPatch,
  OceanSceneState,
  OceanThemePalette,
  SeagrassBlade,
  SeaTurtleMesh,
  TubeSpongeCluster,
} from "./ocean-types";

export const LIGHT_OCEAN_PALETTE: OceanThemePalette = {
  primaryLine: "rgba(20, 56, 74, 0.64)",
  secondaryLine: "rgba(38, 88, 112, 0.24)",
  faintLine: "rgba(46, 98, 122, 0.12)",
  accentLine: "rgba(182, 118, 28, 0.68)",
  biolumLine: "rgba(24, 132, 164, 0.58)",
  markerText: "rgba(28, 68, 88, 0.56)",
  kelpDark: "#1b4349",
  kelpMid: "#2e6f73",
  kelpLit: "#6ba89e",
  coralBase: "rgba(164, 92, 58, 0.54)",
  coralHighlight: "rgba(218, 142, 68, 0.78)",
  fishShadow: "#1b3b4f",
  fishMid: "#5b8fa8",
  fishBelly: "#e6f0f3",
  fishFlash: "rgba(250, 253, 255, 0.88)",
  mantaDark: "#173244",
  mantaBelly: "#dce9ee",
  turtleShellDark: "#2b4c43",
  turtleShellLit: "#7ca17e",
  jellyGlow: "rgba(68, 158, 188, 0.24)",
  jellyRim: "rgba(28, 114, 148, 0.68)",
};

export const DARK_OCEAN_PALETTE: OceanThemePalette = {
  primaryLine: "rgba(132, 222, 244, 0.58)",
  secondaryLine: "rgba(82, 184, 216, 0.24)",
  faintLine: "rgba(64, 154, 186, 0.12)",
  accentLine: "rgba(240, 186, 92, 0.72)",
  biolumLine: "rgba(104, 238, 255, 0.72)",
  markerText: "rgba(144, 208, 226, 0.58)",
  kelpDark: "#0c2b33",
  kelpMid: "#1e5e68",
  kelpLit: "#4cb4b0",
  coralBase: "rgba(208, 126, 78, 0.52)",
  coralHighlight: "rgba(250, 192, 108, 0.82)",
  fishShadow: "#0e2638",
  fishMid: "#4686a8",
  fishBelly: "#cce6f0",
  fishFlash: "rgba(220, 250, 255, 0.92)",
  mantaDark: "#0b2030",
  mantaBelly: "#b8dce8",
  turtleShellDark: "#153532",
  turtleShellLit: "#5ba492",
  jellyGlow: "rgba(76, 212, 245, 0.26)",
  jellyRim: "rgba(156, 242, 255, 0.78)",
};

function smoothOceanCurve(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  closed = false
) {
  const n = points.length;
  if (n < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
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

function shadeOceanQuad(patch: OceanQuadPatch, isDark: boolean, baseAlpha = 0.42): string {
  const L = clamp(patch.light);
  const S = clamp(patch.specular);
  const R = clamp(patch.rim);
  const Sub = clamp(patch.subsurface);
  const A = clamp(patch.accent ?? 0);

  let r = 40, g = 90, b = 110;

  switch (patch.tint) {
    case "kelp": {
      r = mix(isDark ? 14 : 26, isDark ? 82 : 108, L) + Sub * 36;
      g = mix(isDark ? 48 : 68, isDark ? 176 : 168, L) + Sub * 54;
      b = mix(isDark ? 56 : 70, isDark ? 168 : 152, L) + Sub * 32;
      break;
    }
    case "sponge": {
      r = mix(isDark ? 42 : 84, isDark ? 168 : 192, L);
      g = mix(isDark ? 52 : 76, isDark ? 138 : 146, L);
      b = mix(isDark ? 72 : 88, isDark ? 142 : 122, L);
      break;
    }
    case "manta": {
      r = mix(isDark ? 11 : 22, isDark ? 86 : 112, L);
      g = mix(isDark ? 30 : 48, isDark ? 148 : 154, L);
      b = mix(isDark ? 46 : 66, isDark ? 182 : 178, L);
      if (A > 0.1) {
        r = mix(r, isDark ? 186 : 228, A * 0.65);
        g = mix(g, isDark ? 224 : 238, A * 0.68);
        b = mix(b, isDark ? 238 : 244, A * 0.72);
      }
      break;
    }
    case "turtle-shell": {
      r = mix(isDark ? 22 : 42, isDark ? 118 : 138, L);
      g = mix(isDark ? 52 : 76, isDark ? 168 : 162, L);
      b = mix(isDark ? 48 : 62, isDark ? 142 : 124, L);
      break;
    }
    case "jelly": {
      r = mix(isDark ? 38 : 64, isDark ? 148 : 164, L) + R * 58;
      g = mix(isDark ? 112 : 138, isDark ? 228 : 216, L) + R * 42;
      b = mix(isDark ? 148 : 168, isDark ? 252 : 238, L) + R * 28;
      break;
    }
    case "fish-reef": {
      r = mix(isDark ? 24 : 38, isDark ? 116 : 138, L);
      g = mix(isDark ? 68 : 88, isDark ? 178 : 182, L);
      b = mix(isDark ? 96 : 112, isDark ? 212 : 204, L);
      if (A > 0.1) {
        r = mix(r, isDark ? 242 : 226, A * 0.72);
        g = mix(g, isDark ? 192 : 162, A * 0.68);
        b = mix(b, isDark ? 88 : 54, A * 0.62);
      }
      break;
    }
    default: {
      // fish-silver
      r = mix(isDark ? 18 : 32, isDark ? 132 : 158, L);
      g = mix(isDark ? 52 : 74, isDark ? 192 : 196, L);
      b = mix(isDark ? 76 : 96, isDark ? 224 : 216, L);
      break;
    }
  }

  if (S > 0.02) {
    r = mix(r, 246, S * 0.68);
    g = mix(g, 252, S * 0.72);
    b = mix(b, 255, S * 0.78);
  }
  if (R > 0.03) {
    r = mix(r, isDark ? 138 : 214, R * 0.38);
    g = mix(g, isDark ? 232 : 204, R * 0.38);
    b = mix(b, isDark ? 250 : 164, R * 0.38);
  }

  const alpha = clamp(baseAlpha + S * 0.24 + R * 0.18 + Sub * 0.12, 0.08, 0.84);
  return `rgba(${Math.round(clamp(r, 0, 255))}, ${Math.round(clamp(g, 0, 255))}, ${Math.round(clamp(b, 0, 255))}, ${alpha.toFixed(3)})`;
}

function renderQuadList(
  ctx: CanvasRenderingContext2D,
  patches: OceanQuadPatch[],
  isDark: boolean,
  baseAlpha = 0.42
) {
  for (const patch of patches) {
    const pts = patch.points;
    ctx.fillStyle = shadeOceanQuad(patch, isDark, baseAlpha);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.lineTo(pts[3].x, pts[3].y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBlueprintLabel(
  ctx: CanvasRenderingContext2D,
  pos: OceanProjectedPoint,
  label: string,
  palette: OceanThemePalette,
  offsetX = 16,
  offsetY = -20
) {
  if (pos.scale < 0.72) return;
  ctx.save();
  ctx.globalAlpha *= clamp(pos.alpha * 0.72, 0.14, 0.72);
  ctx.strokeStyle = palette.markerText;
  ctx.fillStyle = palette.markerText;
  ctx.lineWidth = 0.65;
  const s = pos.scale;
  const r = 2.1 * s;
  const elbowX = pos.x + offsetX * s;
  const elbowY = pos.y + offsetY * s;
  const dir = offsetX >= 0 ? 1 : -1;
  const endX = elbowX + dir * 11 * s;

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
  ctx.moveTo(pos.x + (offsetX >= 0 ? r : -r) * 0.7, pos.y - r * 0.7);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(endX, elbowY);
  ctx.stroke();

  ctx.font = "600 8px 'IBM Plex Mono', ui-monospace, monospace";
  ctx.textAlign = dir > 0 ? "left" : "right";
  ctx.fillText(label, endX + dir * 4 * s, elbowY + 2.5 * s);
  ctx.restore();
}

function renderKelpPlant(
  ctx: CanvasRenderingContext2D,
  plant: KelpPlant,
  palette: OceanThemePalette,
  isDark: boolean
) {
  const depthAlpha = plant.stipe[0]?.alpha ?? 0.8;
  ctx.save();
  ctx.globalAlpha *= depthAlpha * 0.92;

  // 1. Yaprak ayaları (Blades)
  for (const blade of plant.blades) {
    const outline = [...blade.upperEdge, ...blade.lowerEdge.slice().reverse()];
    const root = blade.pneumatocyst;
    const tip = blade.spine.at(-1)!;
    const grad = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
    grad.addColorStop(0, palette.kelpDark);
    grad.addColorStop(0.45, palette.kelpMid);
    grad.addColorStop(1, palette.kelpLit);

    smoothOceanCurve(ctx, outline, true);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.save();
    smoothOceanCurve(ctx, outline, true);
    ctx.clip();
    renderQuadList(ctx, blade.patches, isDark, 0.36);
    ctx.restore();

    // Damar ve kontur çizgileri
    ctx.strokeStyle = palette.secondaryLine;
    ctx.lineWidth = 0.55;
    for (const vein of blade.veinLines) {
      smoothOceanCurve(ctx, vein, false);
      ctx.stroke();
    }
    ctx.strokeStyle = palette.primaryLine;
    ctx.lineWidth = 0.75;
    smoothOceanCurve(ctx, outline, true);
    ctx.stroke();

    // 3B Hava kesesi (Pneumatocyst küresi)
    const br = Math.max(1.6, 3.2 * root.scale);
    ctx.fillStyle = palette.kelpMid;
    ctx.beginPath();
    ctx.arc(root.x, root.y, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.kelpLit;
    ctx.beginPath();
    ctx.arc(root.x - br * 0.28, root.y - br * 0.28, br * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Kök tutunma saçakları (Holdfast)
  const basePt = plant.stipe[0];
  ctx.strokeStyle = palette.kelpDark;
  ctx.lineWidth = 1.6;
  for (const hPt of plant.holdfast) {
    ctx.beginPath();
    ctx.moveTo(basePt.x, basePt.y);
    ctx.quadraticCurveTo((basePt.x + hPt.x) * 0.5, basePt.y - 4, hPt.x, hPt.y);
    ctx.stroke();
  }

  // 3. Ana gövde sapı (Stipe)
  ctx.strokeStyle = palette.kelpDark;
  ctx.lineWidth = 2.6 * (basePt?.scale ?? 1);
  smoothOceanCurve(ctx, plant.stipe, false);
  ctx.stroke();

  ctx.strokeStyle = palette.kelpLit;
  ctx.lineWidth = 0.95 * (basePt?.scale ?? 1);
  smoothOceanCurve(ctx, plant.stipe, false);
  ctx.stroke();

  ctx.restore();
}

function renderCoralFan(ctx: CanvasRenderingContext2D, fan: CoralFan, palette: OceanThemePalette) {
  ctx.save();
  ctx.globalAlpha *= fan.base.alpha * 0.88;

  // Gorgonia ince ağ dokusu
  if (fan.crossLinks.length > 0) {
    ctx.strokeStyle = palette.accentLine;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (const [a, b] of fan.crossLinks) {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }

  // Ana mercan dalları
  const isAntler = fan.variant === "antler";
  for (const branch of fan.branches) {
    ctx.strokeStyle = isAntler ? palette.kelpMid : palette.coralBase;
    ctx.lineWidth = branch.thickness * (isAntler ? 1.85 : 1.5);
    smoothOceanCurve(ctx, branch.points, false);
    ctx.stroke();

    ctx.strokeStyle = isAntler ? palette.kelpLit : palette.coralHighlight;
    ctx.lineWidth = branch.thickness * 0.72;
    smoothOceanCurve(ctx, branch.points, false);
    ctx.stroke();

    // Biyolüminesan polip tomurcukları
    ctx.fillStyle = palette.coralHighlight;
    for (const p of branch.polyps) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.95, 1.5 * p.scale), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderTubeSponges(
  ctx: CanvasRenderingContext2D,
  cluster: TubeSpongeCluster,
  palette: OceanThemePalette,
  isDark: boolean
) {
  ctx.save();
  for (const tube of cluster.tubes) {
    smoothOceanCurve(ctx, tube.outline, true);
    ctx.fillStyle = palette.kelpDark;
    ctx.fill();

    ctx.save();
    smoothOceanCurve(ctx, tube.outline, true);
    ctx.clip();
    renderQuadList(ctx, tube.patches, isDark, 0.48);
    ctx.restore();

    ctx.strokeStyle = palette.secondaryLine;
    ctx.lineWidth = 0.55;
    for (const rib of tube.ribs) {
      smoothOceanCurve(ctx, rib, true);
      ctx.stroke();
    }

    ctx.strokeStyle = palette.primaryLine;
    ctx.lineWidth = 0.9;
    smoothOceanCurve(ctx, tube.outline, true);
    ctx.stroke();

    // Tüp ağzı (Osculum) iç gölgesi ve kenar halkası
    smoothOceanCurve(ctx, tube.rimEllipse, true);
    ctx.fillStyle = palette.fishShadow;
    ctx.fill();
    ctx.strokeStyle = palette.accentLine;
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }
  ctx.restore();
}

function renderSeagrassBlade(
  ctx: CanvasRenderingContext2D,
  blade: SeagrassBlade,
  palette: OceanThemePalette
) {
  const base = blade.midrib[0];
  const tip = blade.midrib.at(-1)!;
  ctx.save();
  ctx.globalAlpha *= base.alpha * (0.55 + blade.light * 0.38);

  const grad = ctx.createLinearGradient(base.x, base.y, tip.x, tip.y);
  grad.addColorStop(0, palette.kelpDark);
  grad.addColorStop(0.55, palette.kelpMid);
  grad.addColorStop(1, palette.kelpLit);

  smoothOceanCurve(ctx, blade.outline, true);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = palette.secondaryLine;
  ctx.lineWidth = 0.5;
  smoothOceanCurve(ctx, blade.midrib, false);
  ctx.stroke();
  ctx.restore();
}

function renderArticulatedFish(
  ctx: CanvasRenderingContext2D,
  fish: ArticulatedFishMesh,
  palette: OceanThemePalette,
  isDark: boolean
) {
  ctx.save();
  ctx.globalAlpha *= clamp(fish.nose.alpha * 0.94, 0.24, 0.94);

  // Türlere özel biyo-optik renk tonları
  const isFusilier = fish.species === "fusilier";
  const isAnthias = fish.species === "anthias";
  const isMoorish = fish.species === "moorish-idol";
  const isCruiser = fish.species === "pelagic-cruiser";

  const finFill = isFusilier
    ? (isDark ? "rgba(235, 180, 72, 0.52)" : "rgba(214, 154, 48, 0.54)")
    : isAnthias
      ? (isDark ? "rgba(228, 134, 84, 0.48)" : "rgba(204, 108, 62, 0.50)")
      : isMoorish
        ? (isDark ? "rgba(225, 240, 250, 0.45)" : "rgba(244, 238, 224, 0.65)")
        : palette.secondaryLine;

  // 1. Arka pektoral, sırt, karın ve çatal kuyruk yüzgeçleri
  ctx.fillStyle = finFill;
  ctx.strokeStyle = isFusilier || isAnthias ? palette.accentLine : palette.primaryLine;
  ctx.lineWidth = 0.65 * fish.scale;

  for (const finPoly of [fish.pectoralFinFar, fish.dorsalFin, fish.ventralFin, fish.caudalFin]) {
    smoothOceanCurve(ctx, finPoly, true);
    ctx.fill();
    ctx.stroke();
  }

  // Zanclus cornutus uzun beyaz sırt flaması
  if (fish.dorsalStreamer && fish.dorsalStreamer.length > 2) {
    ctx.save();
    ctx.strokeStyle = isDark ? "#e2f3fc" : "#fcfaf2";
    ctx.lineWidth = 1.85 * fish.scale;
    smoothOceanCurve(ctx, fish.dorsalStreamer, false);
    ctx.stroke();
    ctx.strokeStyle = palette.accentLine;
    ctx.lineWidth = 0.65 * fish.scale;
    ctx.stroke();
    ctx.restore();
  }

  // 2. 3B Gövde Silueti ve Tür Bazlı Sırt-Karın (Countershading) Gradyanı
  const perpX = -fish.heading2D.y * 12 * fish.scale;
  const perpY = fish.heading2D.x * 12 * fish.scale;
  const bodyGrad = ctx.createLinearGradient(
    fish.nose.x + perpX,
    fish.nose.y + perpY,
    fish.nose.x - perpX,
    fish.nose.y - perpY
  );
  if (isFusilier) {
    bodyGrad.addColorStop(0, isDark ? "#d9a53d" : "#c48d29");
    bodyGrad.addColorStop(0.32, isDark ? "#2a8fb8" : "#2d82a8");
    bodyGrad.addColorStop(0.75, isDark ? "#5fc4e8" : "#6abbd9");
    bodyGrad.addColorStop(1, palette.fishBelly);
  } else if (isAnthias) {
    bodyGrad.addColorStop(0, isDark ? "#b85a44" : "#a34936");
    bodyGrad.addColorStop(0.48, isDark ? "#e08e52" : "#cc7a40");
    bodyGrad.addColorStop(1, isDark ? "#f5d7b8" : "#f2d8be");
  } else if (isMoorish) {
    bodyGrad.addColorStop(0, isDark ? "#dfba5b" : "#cfa442");
    bodyGrad.addColorStop(0.38, isDark ? "#d9eef8" : "#f5f1e6");
    bodyGrad.addColorStop(1, palette.fishBelly);
  } else if (isCruiser) {
    bodyGrad.addColorStop(0, isDark ? "#102e47" : "#1b3f5c");
    bodyGrad.addColorStop(0.48, isDark ? "#467d9e" : "#5685a3");
    bodyGrad.addColorStop(1, palette.fishBelly);
  } else {
    bodyGrad.addColorStop(0, palette.fishShadow);
    bodyGrad.addColorStop(0.45, palette.fishMid);
    bodyGrad.addColorStop(1, palette.fishBelly);
  }

  smoothOceanCurve(ctx, fish.bodyOutline, true);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // 3. 3B Phong Yüzey Yamaları ve Tür Bantları
  if (fish.patches.length > 0) {
    ctx.save();
    smoothOceanCurve(ctx, fish.bodyOutline, true);
    ctx.clip();
    renderQuadList(ctx, fish.patches, isDark, isMoorish || isAnthias ? 0.26 : 0.40);

    // Zanclus karakteristik dikey koyu bantları gövde içine clip'li çizilir
    if (fish.stripes.length > 0) {
      ctx.strokeStyle = isDark ? "#091520" : "#182b3a";
      ctx.lineWidth = 3.4 * fish.scale;
      for (const st of fish.stripes) {
        smoothOceanCurve(ctx, st, false);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Yanal gümüş pul parlaması (Silver-flank specular flash)
  if (fish.flashIntensity > 0.25) {
    ctx.save();
    ctx.globalAlpha *= (fish.flashIntensity - 0.25) * 0.65;
    ctx.strokeStyle = palette.fishFlash;
    ctx.lineWidth = 1.9 * fish.scale;
    smoothOceanCurve(ctx, fish.lateralLine.slice(1, -1), false);
    ctx.stroke();
    ctx.restore();
  }

  if (fish.ribs.length > 0) {
    ctx.strokeStyle = palette.secondaryLine;
    ctx.lineWidth = 0.55 * fish.scale;
    for (const r of fish.ribs) {
      smoothOceanCurve(ctx, r, false);
      ctx.stroke();
    }
  }

  // 4. Yanal çizgi (Linea lateralis), solungaç kapağı (Operculum) ve dış kontur
  ctx.strokeStyle = isFusilier || isAnthias ? palette.accentLine : palette.biolumLine;
  ctx.lineWidth = 0.65 * fish.scale;
  smoothOceanCurve(ctx, fish.lateralLine, false);
  ctx.stroke();

  ctx.strokeStyle = palette.primaryLine;
  ctx.lineWidth = 0.85 * fish.scale;
  smoothOceanCurve(ctx, fish.operculum, false);
  ctx.stroke();

  smoothOceanCurve(ctx, fish.bodyOutline, true);
  ctx.stroke();

  // 5. Yakın pektoral yüzgeç ve 3B Göz
  smoothOceanCurve(ctx, fish.pectoralFinNear, true);
  ctx.fillStyle = isAnthias ? finFill : palette.fishBelly;
  ctx.fill();
  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 0.7 * fish.scale;
  ctx.stroke();

  const eyeR = Math.max(0.85, 1.65 * fish.scale);
  ctx.fillStyle = palette.fishShadow;
  ctx.beginPath();
  ctx.arc(fish.eye.x, fish.eye.y, eyeR * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.fishBelly;
  ctx.beginPath();
  ctx.arc(fish.eye.x - eyeR * 0.25, fish.eye.y - eyeR * 0.25, eyeR * 0.48, 0, Math.PI * 2);
  ctx.fill();

  if (fish.label) {
    const dorsalAnchor = fish.dorsalFin[1] ?? fish.nose;
    drawBlueprintLabel(ctx, dorsalAnchor, fish.label, palette, 14, -14);
  }

  ctx.restore();
}

function renderMantaRay(
  ctx: CanvasRenderingContext2D,
  manta: MantaRayMesh,
  palette: OceanThemePalette,
  isDark: boolean
) {
  ctx.save();
  ctx.globalAlpha *= clamp(manta.center.alpha * 0.92, 0.28, 0.92);

  // 1. Kamçı kuyruk ve kanat ucu girdap izleri
  ctx.strokeStyle = palette.primaryLine;
  ctx.lineWidth = 1.35 * manta.center.scale;
  smoothOceanCurve(ctx, manta.tailWhip, false);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha *= 0.35;
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 0.7;
  for (const wake of manta.wakeTrails) {
    smoothOceanCurve(ctx, wake, false);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Sefalik boynuz lobları
  for (const lobe of [manta.cephalicLeft, manta.cephalicRight]) {
    smoothOceanCurve(ctx, lobe, true);
    ctx.fillStyle = palette.mantaBelly;
    ctx.fill();
    ctx.strokeStyle = palette.primaryLine;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }

  // 3. Ana kanat/gövde silueti ve 3B yüzey yamaları
  smoothOceanCurve(ctx, manta.outline, true);
  ctx.fillStyle = palette.mantaDark;
  ctx.fill();

  ctx.save();
  smoothOceanCurve(ctx, manta.outline, true);
  ctx.clip();
  renderQuadList(ctx, manta.patches, isDark, 0.46);

  // Blueprint kanat kesit eğrileri ve solungaç yarıkları
  ctx.strokeStyle = palette.secondaryLine;
  ctx.lineWidth = 0.58;
  for (const rib of manta.wingRibs) {
    smoothOceanCurve(ctx, rib, false);
    ctx.stroke();
  }
  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 0.72;
  for (const gill of manta.gillSlits) {
    smoothOceanCurve(ctx, gill, false);
    ctx.stroke();
  }
  ctx.strokeStyle = palette.biolumLine;
  ctx.lineWidth = 0.9;
  for (const chev of manta.chevronMarks) {
    smoothOceanCurve(ctx, chev, false);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Dış kontur, sırt yüzgeci ve gözler
  ctx.strokeStyle = palette.primaryLine;
  ctx.lineWidth = 1.2;
  smoothOceanCurve(ctx, manta.outline, true);
  ctx.stroke();

  smoothOceanCurve(ctx, manta.dorsalFin, true);
  ctx.fillStyle = palette.mantaDark;
  ctx.fill();
  ctx.stroke();

  for (const eye of manta.eyes) {
    ctx.fillStyle = palette.mantaBelly;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, Math.max(1.1, 1.8 * eye.scale), 0, Math.PI * 2);
    ctx.fill();
  }

  drawBlueprintLabel(ctx, manta.center, manta.label, palette, 22, -26);
  ctx.restore();
}

function renderJellyfish(
  ctx: CanvasRenderingContext2D,
  jelly: JellyfishMesh,
  palette: OceanThemePalette,
  isDark: boolean
) {
  ctx.save();
  ctx.globalAlpha *= clamp(jelly.apex.alpha * 0.90, 0.25, 0.90);

  // 1. Akışkan gecikmeli uzun sarmal dokunaçlar (Tentacles)
  ctx.strokeStyle = palette.biolumLine;
  ctx.lineWidth = 0.65 * jelly.apex.scale;
  for (const tent of jelly.tentacles) {
    smoothOceanCurve(ctx, tent, false);
    ctx.stroke();
  }

  // 2. 4 Fırfırlı Oral Kol (Oral arms)
  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 1.35 * jelly.apex.scale;
  for (const arm of jelly.oralArms) {
    smoothOceanCurve(ctx, arm, false);
    ctx.stroke();
  }

  // 3. Yarı-saydam 3B Çan (Bell) Kubbesi
  smoothOceanCurve(ctx, jelly.bellOutline, true);
  ctx.fillStyle = palette.jellyGlow;
  ctx.fill();

  ctx.save();
  smoothOceanCurve(ctx, jelly.bellOutline, true);
  ctx.clip();
  renderQuadList(ctx, jelly.patches, isDark, 0.28);
  ctx.restore();

  // 16 Radyal Şemsiye Kaburgası ve İç Gonad Halkası
  ctx.strokeStyle = palette.secondaryLine;
  ctx.lineWidth = 0.55;
  for (const rib of jelly.radialRibs) {
    smoothOceanCurve(ctx, rib, false);
    ctx.stroke();
  }

  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 0.85;
  smoothOceanCurve(ctx, jelly.innerGonadRing, true);
  ctx.stroke();

  // 4. Dilimli Lappet Eteği ve 3B Fresnel Çan Konturu
  ctx.strokeStyle = palette.jellyRim;
  ctx.lineWidth = 1.25;
  smoothOceanCurve(ctx, jelly.lappetRim, true);
  ctx.stroke();
  smoothOceanCurve(ctx, jelly.bellOutline, true);
  ctx.stroke();

  if (jelly.label) {
    drawBlueprintLabel(ctx, jelly.apex, jelly.label, palette, 16, -12);
  }
  ctx.restore();
}

function renderSeaTurtle(
  ctx: CanvasRenderingContext2D,
  turtle: SeaTurtleMesh,
  palette: OceanThemePalette,
  isDark: boolean
) {
  ctx.save();
  ctx.globalAlpha *= clamp(turtle.center.alpha * 0.92, 0.28, 0.92);

  // 1. Uzak yüzgeçler ve baş
  ctx.fillStyle = palette.turtleShellDark;
  ctx.strokeStyle = palette.primaryLine;
  ctx.lineWidth = 0.95;
  for (const poly of [turtle.frontFlipperFar, turtle.hindFlipperFar, turtle.hindFlipperNear, turtle.headOutline]) {
    smoothOceanCurve(ctx, poly, true);
    ctx.fill();
    ctx.stroke();
  }

  // Göz
  ctx.fillStyle = palette.fishBelly;
  ctx.beginPath();
  ctx.arc(turtle.eye.x, turtle.eye.y, Math.max(1.0, 1.5 * turtle.eye.scale), 0, Math.PI * 2);
  ctx.fill();

  // 2. 3B Kubbeli Sırt Kabuğu (Carapace) ve Plaka (Scute) Aydınlatması
  smoothOceanCurve(ctx, turtle.carapaceOutline, true);
  ctx.fillStyle = palette.turtleShellDark;
  ctx.fill();

  ctx.save();
  smoothOceanCurve(ctx, turtle.carapaceOutline, true);
  ctx.clip();
  for (const scute of turtle.scutePolygons) {
    const L = clamp(scute.light);
    const S = clamp(scute.specular);
    const r = Math.round(mix(isDark ? 20 : 38, isDark ? 124 : 148, L) + S * 48);
    const g = Math.round(mix(isDark ? 56 : 74, isDark ? 174 : 168, L) + S * 52);
    const b = Math.round(mix(isDark ? 48 : 58, isDark ? 138 : 118, L) + S * 42);
    ctx.fillStyle = `rgba(${clamp(r, 0, 255)}, ${clamp(g, 0, 255)}, ${clamp(b, 0, 255)}, 0.82)`;
    ctx.strokeStyle = scute.isVertebral ? palette.accentLine : palette.primaryLine;
    ctx.lineWidth = scute.isVertebral ? 0.85 : 0.65;
    ctx.beginPath();
    ctx.moveTo(scute.points[0].x, scute.points[0].y);
    for (let i = 1; i < scute.points.length; i++) {
      ctx.lineTo(scute.points[i].x, scute.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = palette.primaryLine;
  ctx.lineWidth = 1.25;
  smoothOceanCurve(ctx, turtle.carapaceOutline, true);
  ctx.stroke();

  // 3. Yakın ön kanat yüzgeç (Power-stroke fore-flipper)
  smoothOceanCurve(ctx, turtle.frontFlipperNear, true);
  ctx.fillStyle = palette.turtleShellLit;
  ctx.fill();
  ctx.strokeStyle = palette.accentLine;
  ctx.lineWidth = 1.05;
  ctx.stroke();

  drawBlueprintLabel(ctx, turtle.center, turtle.label, palette, 22, -24);
  ctx.restore();
}

function renderOceanBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: OceanBubble[],
  palette: OceanThemePalette
) {
  ctx.save();
  for (const b of bubbles) {
    ctx.save();
    ctx.globalAlpha *= clamp(b.pos.alpha * b.shimmer * 0.68, 0.08, 0.68);
    ctx.strokeStyle = palette.biolumLine;
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = palette.fishFlash;
    ctx.beginPath();
    ctx.arc(b.pos.x - b.radius * 0.32, b.pos.y - b.radius * 0.32, Math.max(0.5, b.radius * 0.28), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function generateOceanSceneState(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number
): OceanSceneState {
  const small = width < 1024;
  const { bubbles, lightShafts } = generateAmbientBubblesAndRays(
    timeSec,
    width,
    height,
    leftCorridor,
    rightCorridor,
    small
  );
  const kelpPlants = generateKelpPlants(timeSec, width, height, leftCorridor, rightCorridor, small);
  const coralFans = generateCoralFans(timeSec, width, height, leftCorridor, rightCorridor, small);
  const seagrassBlades = generateSeagrassMeadow(timeSec, width, height, small);
  const spongeClusters = generateTubeSponges(timeSec, width, height, leftCorridor, rightCorridor, small);
  const { schoolFishes, soloFishes } = generateFishSchoolsAndSoloSpecies(
    timeSec,
    width,
    height,
    leftCorridor,
    rightCorridor,
    small
  );
  const mantaRays = generateMantaRays(timeSec, width, height, leftCorridor, rightCorridor);
  const jellyfishes = generateJellyfishes(timeSec, width, height, leftCorridor, rightCorridor, small);
  const seaTurtles = generateSeaTurtles(timeSec, width, height, leftCorridor, rightCorridor);

  return {
    lightShafts,
    kelpPlants,
    coralFans,
    seagrassBlades,
    spongeClusters,
    schoolFishes,
    soloFishes,
    mantaRays,
    jellyfishes,
    seaTurtles,
    bubbles,
  };
}

export function renderOceanEcosystemFrame(
  ctx: CanvasRenderingContext2D,
  scene: OceanSceneState,
  palette: OceanThemePalette,
  width: number,
  height: number,
  globalOpacity = 1
) {
  if (globalOpacity <= 0 || width <= 0 || height <= 0) return;
  const isDark = palette === DARK_OCEAN_PALETTE || palette.fishShadow === DARK_OCEAN_PALETTE.fishShadow;

  ctx.save();
  ctx.globalAlpha = clamp(globalOpacity);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // 1. Sualtı Güneş Hüzmeleri (Volumetric God-Rays)
  for (const shaft of scene.lightShafts) {
    ctx.save();
    const grad = ctx.createLinearGradient(shaft.topX, 0, shaft.bottomX, height * 0.85);
    grad.addColorStop(0, isDark ? `rgba(110, 224, 250, ${shaft.opacity})` : `rgba(56, 142, 178, ${shaft.opacity})`);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(shaft.topX - shaft.topWidth * 0.5, 0);
    ctx.lineTo(shaft.topX + shaft.topWidth * 0.5, 0);
    ctx.lineTo(shaft.bottomX + shaft.bottomWidth * 0.5, height * 0.88);
    ctx.lineTo(shaft.bottomX - shaft.bottomWidth * 0.5, height * 0.88);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 2. Tüm 3B Okyanus Varlıklarını Derinliğe (Painter's Algorithm: Uzaktan Yakına) Göre Sırala
  type RenderableItem = { depth: number; draw: () => void };
  const items: RenderableItem[] = [];

  for (const blade of scene.seagrassBlades) {
    items.push({ depth: blade.depth, draw: () => renderSeagrassBlade(ctx, blade, palette) });
  }
  for (const fan of scene.coralFans) {
    items.push({ depth: fan.depth, draw: () => renderCoralFan(ctx, fan, palette) });
  }
  for (const sponge of scene.spongeClusters) {
    items.push({ depth: sponge.depth, draw: () => renderTubeSponges(ctx, sponge, palette, isDark) });
  }
  for (const kelp of scene.kelpPlants) {
    items.push({ depth: kelp.depth, draw: () => renderKelpPlant(ctx, kelp, palette, isDark) });
  }
  for (const fish of scene.schoolFishes) {
    items.push({ depth: fish.depth, draw: () => renderArticulatedFish(ctx, fish, palette, isDark) });
  }
  for (const solo of scene.soloFishes) {
    items.push({ depth: solo.depth, draw: () => renderArticulatedFish(ctx, solo, palette, isDark) });
  }
  for (const manta of scene.mantaRays) {
    items.push({ depth: manta.depth, draw: () => renderMantaRay(ctx, manta, palette, isDark) });
  }
  for (const jelly of scene.jellyfishes) {
    items.push({ depth: jelly.depth, draw: () => renderJellyfish(ctx, jelly, palette, isDark) });
  }
  for (const turtle of scene.seaTurtles) {
    items.push({ depth: turtle.depth, draw: () => renderSeaTurtle(ctx, turtle, palette, isDark) });
  }

  items.sort((a, b) => b.depth - a.depth);
  for (const item of items) {
    item.draw();
  }

  // 3. Yükselen 3B Mikro-Hava Kabarcıkları
  renderOceanBubbles(ctx, scene.bubbles, palette);

  ctx.restore();
}
