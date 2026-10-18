import {
  buildOceanQuadPatch,
  clamp,
  oAdd,
  oScale,
  oVec3,
  projectOceanPoint,
  seeded,
  TAU,
} from "./ocean-math";
import type {
  CoralBranch,
  CoralFan,
  KelpBlade,
  KelpPlant,
  OceanProjectedPoint,
  OceanQuadPatch,
  OceanVec3,
  SeagrassBlade,
  TubeSpongeCluster,
} from "./ocean-types";

/**
 * Dev Okyanus Kelpi (Macrocystis pyrifera) ve Laminaria Deniz Bitkileri:
 * Ekranın alt deniz tabanında (seabed) kök tutunma saçakları (holdfast),
 * akıntıyla salınan esnek gövde (stipe), hava kesecikleri (pneumatocyst)
 * ve 3B kıvrımlı/damarlı yaprak ayaları (blades) üretir.
 */
export function generateKelpPlants(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number,
  small: boolean
): KelpPlant[] {
  const leftSpan = Math.max(95, leftCorridor);
  const rightStart = Math.min(width - 95, rightCorridor);
  const rightSpan = Math.max(95, width - rightStart);

  const anchors: { x: number; z: number; h: number; blades: number; phase: number }[] = [
    { x: leftSpan * 0.16, z: -40, h: height * 0.27, blades: small ? 5 : 8, phase: 0.2 },
    { x: leftSpan * 0.42, z: 75, h: height * 0.23, blades: small ? 5 : 7, phase: 1.5 },
    { x: leftSpan * 0.72, z: 165, h: height * 0.19, blades: small ? 4 : 6, phase: 2.8 },
    { x: leftSpan * 0.96, z: 240, h: height * 0.15, blades: small ? 4 : 5, phase: 3.9 },
    { x: rightStart + rightSpan * 0.84, z: -35, h: height * 0.28, blades: small ? 5 : 8, phase: 0.9 },
    { x: rightStart + rightSpan * 0.56, z: 85, h: height * 0.23, blades: small ? 5 : 7, phase: 2.2 },
    { x: rightStart + rightSpan * 0.26, z: 175, h: height * 0.18, blades: small ? 4 : 6, phase: 3.6 },
    { x: rightStart + rightSpan * 0.04, z: 245, h: height * 0.15, blades: small ? 4 : 5, phase: 4.8 },
  ];

  if (!small) {
    anchors.push(
      { x: width * 0.34, z: 290, h: height * 0.13, blades: 5, phase: 1.9 },
      { x: width * 0.52, z: 310, h: height * 0.12, blades: 5, phase: 3.1 },
      { x: width * 0.68, z: 270, h: height * 0.14, blades: 5, phase: 4.4 }
    );
  }

  return anchors.map((cfg, idx) => {
    const baseY = height + 14;
    const stipeSteps = small ? 12 : 18;
    const stipeWorld: OceanVec3[] = [];
    const stipeProj: OceanProjectedPoint[] = [];

    for (let i = 0; i <= stipeSteps; i++) {
      const s = i / stipeSteps;
      const flex = Math.pow(s, 1.3);
      const surgeX =
        (Math.sin(timeSec * 0.82 + cfg.phase - s * 2.2) * 20 +
          Math.sin(timeSec * 1.55 + cfg.phase * 1.7 - s * 3.6) * 8) *
        flex;
      const surgeZ = Math.cos(timeSec * 0.68 + cfg.phase - s * 1.8) * 16 * flex;
      const liftY = baseY - s * cfg.h + Math.abs(surgeX) * 0.06 * s;
      const w = oVec3(cfg.x + surgeX, liftY, cfg.z + surgeZ);
      stipeWorld.push(w);
      stipeProj.push(projectOceanPoint(w, width, height));
    }

    // Kök tutunma pençesi (Holdfast)
    const holdfast: OceanProjectedPoint[] = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 6 - 0.5) * 2.4;
      const hw = oVec3(
        cfg.x + Math.sin(a) * 18,
        height + 4 - Math.cos(a * 2) * 5,
        cfg.z + Math.cos(a) * 12
      );
      holdfast.push(projectOceanPoint(hw, width, height));
    }

    const blades: KelpBlade[] = [];
    for (let b = 0; b < cfg.blades; b++) {
      const sAttach = 0.15 + (b / Math.max(1, cfg.blades - 1)) * 0.80;
      const stipeIdx = Math.min(stipeSteps - 1, Math.floor(sAttach * stipeSteps));
      const localT = sAttach * stipeSteps - stipeIdx;
      const origin = oAdd(
        oScale(stipeWorld[stipeIdx], 1 - localT),
        oScale(stipeWorld[stipeIdx + 1], localT)
      );

      const side = b % 2 === 0 ? 1 : -1;
      const isLeftSide = cfg.x < width * 0.5;
      const currentBias = isLeftSide ? 0.30 : -0.30;
      const dirSign = side * 0.78 + currentBias;
      const bladeLen = (36 + Math.sin(sAttach * Math.PI) * 32) * (1 - sAttach * 0.20);
      const bladeWidth = 8.5 + Math.sin(sAttach * Math.PI) * 6.5;

      // Hava kesesi (Pneumatocyst)
      const bulbWorld = oVec3(origin.x + dirSign * 5, origin.y - 2, origin.z - 3);
      const pneumatocyst = projectOceanPoint(bulbWorld, width, height);

      const uSteps = small ? 6 : 9;
      const upperRowWorld: OceanVec3[] = [];
      const midRowWorld: OceanVec3[] = [];
      const lowerRowWorld: OceanVec3[] = [];
      const upperEdge: OceanProjectedPoint[] = [];
      const spine: OceanProjectedPoint[] = [];
      const lowerEdge: OceanProjectedPoint[] = [];

      for (let iu = 0; iu <= uSteps; iu++) {
        const u = iu / uSteps;
        const widthProfile = Math.sin(Math.pow(u, 0.72) * Math.PI) * bladeWidth;
        const wave =
          Math.sin(timeSec * 1.65 - u * 3.4 + b * 0.9 + cfg.phase) * 9 * u +
          Math.cos(timeSec * 0.95 + u * 2.2 + idx) * 4.5 * u;
        const ruffle = Math.sin(u * Math.PI * 5 + timeSec * 2.1 + b) * 2.4 * Math.sin(u * Math.PI);
        const zCurl = Math.cos(u * Math.PI * 1.6 + timeSec * 1.2 + b) * 10 * u;

        const mx = bulbWorld.x + dirSign * bladeLen * u + wave * 0.35;
        const my = bulbWorld.y - bladeLen * 0.32 * u + wave * 0.72;
        const mz = bulbWorld.z + zCurl;

        const nx = -0.32 * dirSign;
        const ny = 0.92;
        const nz = 0.22 * Math.sin(u * Math.PI * 2 + b);

        const mw = oVec3(mx, my, mz);
        const uw = oVec3(
          mx + nx * widthProfile,
          my - ny * widthProfile + ruffle,
          mz + nz * widthProfile - 3
        );
        const lw = oVec3(
          mx - nx * widthProfile,
          my + ny * widthProfile - ruffle,
          mz - nz * widthProfile + 3
        );

        midRowWorld.push(mw);
        upperRowWorld.push(uw);
        lowerRowWorld.push(lw);

        spine.push(projectOceanPoint(mw, width, height));
        upperEdge.push(projectOceanPoint(uw, width, height));
        lowerEdge.push(projectOceanPoint(lw, width, height));
      }

      const patches: OceanQuadPatch[] = [];
      for (let iu = 0; iu < uSteps; iu++) {
        patches.push(
          buildOceanQuadPatch(
            upperRowWorld[iu],
            upperRowWorld[iu + 1],
            midRowWorld[iu + 1],
            midRowWorld[iu],
            upperEdge[iu],
            upperEdge[iu + 1],
            spine[iu + 1],
            spine[iu],
            "kelp",
            width,
            height,
            iu / uSteps
          ),
          buildOceanQuadPatch(
            midRowWorld[iu],
            midRowWorld[iu + 1],
            lowerRowWorld[iu + 1],
            lowerRowWorld[iu],
            spine[iu],
            spine[iu + 1],
            lowerEdge[iu + 1],
            lowerEdge[iu],
            "kelp",
            width,
            height,
            iu / uSteps
          )
        );
      }

      const veinLines: OceanProjectedPoint[][] = [spine];
      for (let iv = 2; iv < uSteps - 1; iv += 2) {
        veinLines.push([spine[iv], upperEdge[iv + 1]], [spine[iv], lowerEdge[iv + 1]]);
      }

      blades.push({
        spine,
        upperEdge,
        lowerEdge,
        pneumatocyst,
        patches,
        veinLines,
        depth: origin.z,
      });
    }

    return {
      holdfast,
      stipe: stipeProj,
      blades,
      depth: cfg.z,
    };
  });
}

/**
 * 3B Yelpaze Mercanı (Gorgonia ventalina) ve Çatal Mercan kolonileri:
 * Deniz tabanının sol/sağ/orta resif eşiklerinde akıntıyla esneyen kafes dallar ve polip düğümleri.
 */
export function generateCoralFans(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number,
  small: boolean
): CoralFan[] {
  const configs: { x: number; y: number; z: number; scale: number; tilt: number; variant: "gorgonian" | "antler" }[] = [
    { x: Math.max(48, leftCorridor * 0.28), y: height + 6, z: 15, scale: 0.92, tilt: 0.16, variant: "gorgonian" },
    { x: Math.max(92, leftCorridor * 0.64), y: height + 8, z: 135, scale: 0.78, tilt: 0.24, variant: "antler" },
    { x: Math.min(width - 48, rightCorridor + (width - rightCorridor) * 0.72), y: height + 6, z: 15, scale: 0.95, tilt: -0.16, variant: "gorgonian" },
    { x: Math.min(width - 92, rightCorridor + (width - rightCorridor) * 0.34), y: height + 8, z: 145, scale: 0.80, tilt: -0.22, variant: "antler" },
  ];

  if (!small) {
    configs.push(
      { x: width * 0.42, y: height + 10, z: 240, scale: 0.68, tilt: 0.10, variant: "gorgonian" },
      { x: width * 0.62, y: height + 10, z: 230, scale: 0.70, tilt: -0.12, variant: "antler" }
    );
  }

  return configs.map((cfg, cIdx) => {
    const baseWorld = oVec3(cfg.x, cfg.y, cfg.z);
    const base = projectOceanPoint(baseWorld, width, height);
    const branches: CoralBranch[] = [];
    const crossLinks: [OceanProjectedPoint, OceanProjectedPoint][] = [];
    const fanRibs = small ? 5 : 7;

    const ribPoints: OceanProjectedPoint[][] = [];

    for (let r = 0; r < fanRibs; r++) {
      const norm = r / (fanRibs - 1) - 0.5;
      const spreadAngle = norm * 1.15 + cfg.tilt;
      const maxLen = (74 + Math.cos(norm * 2.0) * 28) * cfg.scale;
      const steps = 10;
      const pts: OceanProjectedPoint[] = [];
      const worldPts: OceanVec3[] = [];
      const polyps: OceanProjectedPoint[] = [];

      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        // İlk %18'lik kısımda tek bir kalın resif gövdesinden (trunk) çıkar, sonra yelpaze gibi açılır
        const fanFactor = u < 0.18 ? (u / 0.18) * 0.12 : 0.12 + Math.pow((u - 0.18) / 0.82, 0.85) * 0.88;
        const sway = Math.sin(timeSec * 0.95 - u * 1.8 + cIdx + r * 0.3) * 6.5 * u * u;
        const SCurve = Math.sin(u * Math.PI * 1.4 + r * 0.7) * 0.14;
        const angle = spreadAngle * fanFactor + SCurve;
        const wx = cfg.x + Math.sin(angle) * maxLen * u + sway;
        const wy = cfg.y - Math.cos(angle * 0.65) * maxLen * u;
        const wz = cfg.z + Math.sin(norm * Math.PI) * 18 * fanFactor + Math.cos(timeSec * 0.8 + u * 2) * 4 * u;
        const wPt = oVec3(wx, wy, wz);
        const proj = projectOceanPoint(wPt, width, height);
        worldPts.push(wPt);
        pts.push(proj);
        if (i >= 3 && i % 2 === 1) {
          polyps.push(proj);
        }
      }
      ribPoints.push(pts);
      branches.push({
        points: pts,
        thickness: (1 - Math.abs(norm) * 0.38) * 2.1 * cfg.scale,
        polyps,
      });

      if (!small && r >= 0 && r < fanRibs) {
        for (const splitStep of [4, 7]) {
          const rootWorld = worldPts[splitStep];
          const rootPt = pts[splitStep];
          const sideSign = (r + splitStep) % 2 === 0 ? 1 : -1;
          const branchAngle = spreadAngle + sideSign * 0.48;
          const midTwigWorld = oVec3(
            rootWorld.x + Math.sin(branchAngle) * 11 * cfg.scale,
            rootWorld.y - Math.cos(branchAngle * 0.6) * 11 * cfg.scale,
            rootWorld.z + sideSign * 5
          );
          const tipTwigWorld = oVec3(
            rootWorld.x + Math.sin(branchAngle + sideSign * 0.18) * 21 * cfg.scale,
            rootWorld.y - Math.cos(branchAngle * 0.6) * 20 * cfg.scale,
            rootWorld.z + sideSign * 9
          );
          const midTwig = projectOceanPoint(midTwigWorld, width, height);
          const tipTwig = projectOceanPoint(tipTwigWorld, width, height);
          branches.push({
            points: [rootPt, midTwig, tipTwig],
            thickness: 1.05 * cfg.scale,
            polyps: [midTwig, tipTwig],
          });
        }
      }
    }

    if (cfg.variant === "gorgonian") {
      for (let r = 0; r < ribPoints.length - 1; r++) {
        for (let step = 3; step <= 9; step += 2) {
          crossLinks.push([ribPoints[r][step], ribPoints[r + 1][step]]);
        }
      }
    }

    return {
      base,
      branches,
      crossLinks,
      depth: cfg.z,
      variant: cfg.variant,
    };
  });
}

/**
 * Posidonia / Deniz Çayırı Kümeleri (Posidonia oceanica):
 * Ekranın en alt kenarı boyunca sık ve katmanlı 3B şerit yapraklar.
 */
export function generateSeagrassMeadow(
  timeSec: number,
  width: number,
  height: number,
  small: boolean
): SeagrassBlade[] {
  const count = small ? 36 : 68;
  const blades: SeagrassBlade[] = [];

  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    const edgeWeight = Math.abs(u - 0.5) * 2;
    const x = u * width + (seeded(i * 13) - 0.5) * 26;
    const z = (1 - edgeWeight) * 220 + seeded(i * 29) * 160 - 40;
    const bladeHeight = (44 + edgeWeight * 52 + seeded(i * 47) * 36) * (small ? 0.82 : 1);
    const bladeHalfWidth = 3.0 + edgeWeight * 2.4;
    const baseTilt = (u < 0.5 ? 0.16 : -0.16) + (seeded(i * 61) - 0.5) * 0.22;
    const phase = seeded(i * 83) * TAU;

    const steps = 7;
    const leftPts: OceanProjectedPoint[] = [];
    const rightPts: OceanProjectedPoint[] = [];
    const midrib: OceanProjectedPoint[] = [];

    for (let sIdx = 0; sIdx <= steps; sIdx++) {
      const s = sIdx / steps;
      const taper = Math.sin((1 - s * 0.82) * Math.PI * 0.5);
      const wave =
        Math.sin(timeSec * 1.25 - s * 2.6 + phase) * 14 * s * s +
        Math.cos(timeSec * 0.72 + phase) * 5 * s;
      const wx = x + Math.sin(baseTilt) * bladeHeight * s + wave;
      const wy = height + 8 - Math.cos(baseTilt) * bladeHeight * s;
      const wz = z + Math.sin(timeSec * 0.9 - s * 2 + phase) * 7 * s;

      const wMid = oVec3(wx, wy, wz);
      const wLeft = oVec3(wx - bladeHalfWidth * taper, wy, wz - 2);
      const wRight = oVec3(wx + bladeHalfWidth * taper, wy, wz + 2);

      midrib.push(projectOceanPoint(wMid, width, height));
      leftPts.push(projectOceanPoint(wLeft, width, height));
      rightPts.push(projectOceanPoint(wRight, width, height));
    }

    const light = clamp(0.32 + edgeWeight * 0.38 + Math.sin(phase + timeSec * 0.8) * 0.15);
    blades.push({
      outline: [...leftPts, ...rightPts.reverse()],
      midrib,
      light,
      depth: z,
    });
  }

  return blades.sort((a, b) => b.depth - a.depth);
}

/**
 * 3B Boğumlu Tüp Sünger Kolonileri (Aplysina archeri):
 * Alt köşelerde mimari blueprint kesit halkalarına sahip 3B silindirik resif süngerleri.
 */
export function generateTubeSponges(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number,
  small: boolean
): TubeSpongeCluster[] {
  if (small) return [];
  const clusters = [
    { x: Math.max(42, leftCorridor * 0.22), z: 35, side: 1 },
    { x: Math.max(115, leftCorridor * 0.85), z: 185, side: 1 },
    { x: Math.min(width - 42, rightCorridor + (width - rightCorridor) * 0.78), z: 40, side: -1 },
    { x: Math.min(width - 115, rightCorridor + (width - rightCorridor) * 0.18), z: 190, side: -1 },
  ];

  return clusters.map((cluster, cIdx) => {
    const tubeSpecs = [
      { dx: -15, h: 58, r: 9.0, lean: -0.14 * cluster.side },
      { dx: 0, h: 78, r: 11.0, lean: 0.08 * cluster.side },
      { dx: 16, h: 48, r: 8.0, lean: 0.22 * cluster.side },
    ];

    const tubes = tubeSpecs.map((spec, tIdx) => {
      const rings = 7;
      const ringSides = 10;
      const gridWorld: OceanVec3[][] = [];
      const gridProj: OceanProjectedPoint[][] = [];
      const ribs: OceanProjectedPoint[][] = [];

      for (let ir = 0; ir <= rings; ir++) {
        const s = ir / rings;
        const sway = Math.sin(timeSec * 0.65 + cIdx + tIdx - s) * 3.0 * s * s;
        const cx = cluster.x + spec.dx + Math.sin(spec.lean) * spec.h * s + sway;
        const cy = height + 6 - Math.cos(spec.lean) * spec.h * s;
        const cz = cluster.z + (tIdx - 1) * 12;
        const rad = spec.r * (0.85 + 0.28 * Math.sin(s * Math.PI * 0.85) + 0.06 * Math.sin(s * Math.PI * 5));

        const rowW: OceanVec3[] = [];
        const rowP: OceanProjectedPoint[] = [];
        for (let j = 0; j < ringSides; j++) {
          const theta = (j / ringSides) * TAU;
          const w = oVec3(cx + Math.cos(theta) * rad, cy + Math.sin(theta) * rad * 0.28, cz - Math.sin(theta) * rad);
          rowW.push(w);
          rowP.push(projectOceanPoint(w, width, height));
        }
        gridWorld.push(rowW);
        gridProj.push(rowP);
        if (ir % 2 === 1) {
          ribs.push(rowP);
        }
      }

      const patches: OceanQuadPatch[] = [];
      for (let ir = 0; ir < rings; ir++) {
        for (let j = 0; j < ringSides; j++) {
          const k = (j + 1) % ringSides;
          if (Math.sin(((j + 0.5) / ringSides) * TAU) < -0.15) continue;
          patches.push(
            buildOceanQuadPatch(
              gridWorld[ir][j],
              gridWorld[ir + 1][j],
              gridWorld[ir + 1][k],
              gridWorld[ir][k],
              gridProj[ir][j],
              gridProj[ir + 1][j],
              gridProj[ir + 1][k],
              gridProj[ir][k],
              "sponge",
              width,
              height
            )
          );
        }
      }

      const leftEdge = gridProj.map(r => r[Math.floor(ringSides * 0.5)]);
      const rightEdge = gridProj.map(r => r[0]).reverse();

      return {
        outline: [...leftEdge, ...rightEdge],
        rimEllipse: gridProj[rings],
        ribs,
        patches,
        depth: cluster.z + (tIdx - 1) * 12,
      };
    });

    return {
      tubes,
      depth: cluster.z,
    };
  });
}
