import {
  buildOceanQuadPatch,
  clamp,
  oAdd,
  oCross,
  oDot,
  OCEAN_SUN_DIR,
  oceanSpline,
  oNormalize,
  oScale,
  oSub,
  oVec3,
  projectOceanPoint,
  seeded,
  smoothStep,
  TAU,
} from "./ocean-math";
import type {
  ArticulatedFishMesh,
  FishSpecies,
  JellyfishMesh,
  MantaRayMesh,
  OceanBubble,
  OceanLightShaft,
  OceanProjectedPoint,
  OceanQuadPatch,
  OceanVec3,
  SeaTurtleMesh,
} from "./ocean-types";

function oLerpVec(a: OceanVec3, b: OceanVec3, t: number): OceanVec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Tek bir 3B eklemli balığın (sardalya, fusilier, istavrit, Zanclus mercan balığı veya pelajik yüzücü)
 * omurga dalgalanmasını, 3B yüzey yamalarını, yan çizgisini (linea lateralis), solungaç kapağını ve yüzgeçlerini üretir.
 */
function buildArticulated3DFish(
  species: FishSpecies,
  worldPos: OceanVec3,
  velocity: OceanVec3,
  bodyLength: number,
  phase: number,
  width: number,
  height: number,
  includePatches: boolean,
  label?: string
): ArticulatedFishMesh {
  // Balıkların dikey duvar tırmanır gibi dikleşmesini önlemek için doğal pelajik Yunuslama (pitch) sınırı (±24°)
  const minHoriz = Math.max(Math.abs(velocity.x), 18);
  const signX = velocity.x >= 0 ? 1 : -1;
  const stabilizedVel: OceanVec3 = {
    x: signX * minHoriz,
    y: clamp(velocity.y, -minHoriz * 0.44, minHoriz * 0.44),
    z: clamp(velocity.z, -minHoriz * 0.40, minHoriz * 0.40),
  };
  const forward = oNormalize(stabilizedVel);
  const camDir = oNormalize(oSub(oVec3(0, 0, -1), oScale(forward, -forward.z)));
  const upRef = oVec3(0, -1, 0);
  const inPlaneRaw = oSub(
    upRef,
    oAdd(oScale(forward, oDot(upRef, forward)), oScale(camDir, oDot(upRef, camDir)))
  );
  const dorsalUp = oNormalize(
    oAdd(oScale(oNormalize(inPlaneRaw), 0.90), oScale(camDir, 0.42))
  );
  const lateralSide = oNormalize(oCross(forward, dorsalUp));

  const isMoorish = species === "moorish-idol";
  const isCruiser = species === "pelagic-cruiser";
  const heightRatio = isMoorish ? 0.38 : isCruiser ? 0.145 : species === "fusilier" ? 0.165 : 0.128;
  const widthRatio = isMoorish ? 0.08 : 0.085;
  const stations = isMoorish || isCruiser ? 10 : 7;

  const spineWorld: OceanVec3[] = [];
  const topWorld: OceanVec3[] = [];
  const midFlankWorld: OceanVec3[] = [];
  const botWorld: OceanVec3[] = [];

  const topProj: OceanProjectedPoint[] = [];
  const midFlankProj: OceanProjectedPoint[] = [];
  const botProj: OceanProjectedPoint[] = [];

  for (let i = 0; i <= stations; i++) {
    const s = i / stations;
    const envelope = smoothStep(0.15, 1.0, s);
    const wave = Math.sin(phase - s * 4.1) * bodyLength * (isMoorish ? 0.042 : 0.075) * envelope;

    let profileH: number;
    if (isMoorish) {
      // Zanclus cornutus: İnce boru burun (s < 0.15), yüksek disk gövde (s ~ 0.42), zarif kuyruk bileği
      const snoutTaper = s < 0.16 ? Math.pow(s / 0.16, 1.45) * 0.42 : 0.42 + 0.58 * Math.sin(((s - 0.16) / 0.84) * Math.PI);
      profileH = snoutTaper * bodyLength * heightRatio;
    } else {
      profileH = Math.sin(Math.pow(s, 0.58) * Math.PI) * (1 - 0.55 * s * s) * bodyLength * heightRatio;
    }
    if (s > 0.76) {
      profileH = Math.max(bodyLength * 0.022, profileH * (1 - smoothStep(0.76, 0.95, s) * 0.64));
    }
    const profileW = profileH * (widthRatio / heightRatio);

    const center = oAdd(
      worldPos,
      oAdd(
        oScale(forward, (0.42 - s) * bodyLength),
        oScale(lateralSide, wave)
      )
    );
    const wTop = oAdd(center, oScale(dorsalUp, profileH));
    const wBot = oAdd(center, oScale(dorsalUp, -profileH * (isMoorish ? 0.88 : 0.84)));
    const wMid = oAdd(center, oScale(lateralSide, -profileW));

    spineWorld.push(center);
    topWorld.push(wTop);
    botWorld.push(wBot);
    midFlankWorld.push(wMid);

    topProj.push(projectOceanPoint(wTop, width, height));
    botProj.push(projectOceanPoint(wBot, width, height));
    midFlankProj.push(projectOceanPoint(wMid, width, height));
  }

  const bodyOutline = [...topProj, ...botProj.slice().reverse()];

  // Çatallı kuyruk yüzgeci (Caudal fin)
  const tailBase = spineWorld[stations];
  const tailSwing = Math.sin(phase - 4.1) * bodyLength * 0.13;
  const tailSpan = bodyLength * (isMoorish ? 0.24 : isCruiser ? 0.30 : 0.22);
  const tailLen = bodyLength * (isCruiser ? 0.22 : 0.19);
  const tailUpperTip = projectOceanPoint(
    oAdd(
      tailBase,
      oAdd(
        oScale(forward, -tailLen),
        oAdd(oScale(dorsalUp, tailSpan), oScale(lateralSide, tailSwing))
      )
    ),
    width,
    height
  );
  const tailNotch = projectOceanPoint(
    oAdd(
      tailBase,
      oAdd(oScale(forward, -tailLen * 0.48), oScale(lateralSide, tailSwing * 0.55))
    ),
    width,
    height
  );
  const tailLowerTip = projectOceanPoint(
    oAdd(
      tailBase,
      oAdd(
        oScale(forward, -tailLen * 0.96),
        oAdd(oScale(dorsalUp, -tailSpan * 0.92), oScale(lateralSide, tailSwing))
      )
    ),
    width,
    height
  );
  const caudalFin = [
    topProj[stations],
    tailUpperTip,
    tailNotch,
    tailLowerTip,
    botProj[stations],
  ];

  // Sırt yüzgeci (Dorsal fin) ve Zanclus uzun beyaz flama uzantısı (dorsalStreamer)
  const dStartIdx = Math.floor(stations * 0.30);
  const dMidIdx = Math.floor(stations * 0.46);
  const dEndIdx = Math.floor(stations * 0.74);
  const dorsalHeight = bodyLength * (isMoorish ? 0.42 : isCruiser ? 0.21 : 0.12);
  const dorsalApexWorld = oAdd(
    topWorld[dMidIdx],
    oAdd(oScale(dorsalUp, dorsalHeight), oScale(forward, -bodyLength * 0.08))
  );
  const dorsalFin = [
    topProj[dStartIdx],
    projectOceanPoint(dorsalApexWorld, width, height),
    topProj[dEndIdx],
  ];

  let dorsalStreamer: OceanProjectedPoint[] | undefined;
  if (isMoorish) {
    dorsalStreamer = [];
    const streamerSteps = 10;
    for (let k = 0; k <= streamerSteps; k++) {
      const u = k / streamerSteps;
      const whip = Math.sin(phase * 1.15 - u * 4.2) * bodyLength * 0.14 * u;
      const lift = Math.sin(u * Math.PI) * dorsalHeight * 0.18;
      const sw = oAdd(
        dorsalApexWorld,
        oAdd(
          oScale(forward, -bodyLength * 0.85 * u),
          oAdd(oScale(dorsalUp, lift + whip * 0.45), oScale(lateralSide, whip))
        )
      );
      dorsalStreamer.push(projectOceanPoint(sw, width, height));
    }
  }

  // Pektoral ve pelvik yüzgeçler
  const shoulderWorld = midFlankWorld[Math.floor(stations * 0.26)];
  const pecStroke = Math.sin(phase * 1.2 + 0.6) * bodyLength * 0.055;
  const pecLen = bodyLength * (isCruiser ? 0.24 : isMoorish ? 0.18 : 0.14);
  const pectoralFinNear = [
    projectOceanPoint(shoulderWorld, width, height),
    projectOceanPoint(
      oAdd(
        shoulderWorld,
        oAdd(
          oScale(forward, -pecLen * 0.75),
          oAdd(oScale(dorsalUp, -pecLen * 0.65 + pecStroke), oScale(lateralSide, -pecLen * 0.45))
        )
      ),
      width,
      height
    ),
    projectOceanPoint(
      oAdd(shoulderWorld, oAdd(oScale(forward, -pecLen * 0.28), oScale(dorsalUp, -pecLen * 0.22))),
      width,
      height
    ),
  ];

  const pectoralFinFar = [
    botProj[Math.floor(stations * 0.25)],
    projectOceanPoint(
      oAdd(
        botWorld[Math.floor(stations * 0.28)],
        oAdd(oScale(forward, -pecLen * 0.6), oScale(dorsalUp, -pecLen * 0.48))
      ),
      width,
      height
    ),
    botProj[Math.floor(stations * 0.36)],
  ];

  const ventralFin = [
    botProj[Math.floor(stations * 0.50)],
    projectOceanPoint(
      oAdd(
        botWorld[Math.floor(stations * 0.56)],
        oAdd(oScale(forward, -bodyLength * 0.09), oScale(dorsalUp, -bodyLength * (isMoorish ? 0.18 : 0.07)))
      ),
      width,
      height
    ),
    botProj[Math.floor(stations * 0.68)],
  ];

  // Solungaç kapağı (Operculum) ve Göz
  const gillIdx = Math.max(1, Math.floor(stations * 0.24));
  const operculum = [
    projectOceanPoint(oLerpVec(topWorld[gillIdx], midFlankWorld[gillIdx], 0.38), width, height),
    projectOceanPoint(oAdd(midFlankWorld[gillIdx], oScale(forward, -bodyLength * 0.025)), width, height),
    projectOceanPoint(oLerpVec(botWorld[gillIdx], midFlankWorld[gillIdx], 0.35), width, height),
  ];

  const eyeIdx = isMoorish ? 2 : 1;
  const eyeWorld = oAdd(
    spineWorld[eyeIdx],
    oAdd(oScale(dorsalUp, bodyLength * heightRatio * 0.26), oScale(lateralSide, -bodyLength * widthRatio * 0.85))
  );
  const eye = projectOceanPoint(eyeWorld, width, height);

  const stripes: OceanProjectedPoint[][] = [];
  const ribs: OceanProjectedPoint[][] = [];
  if (isMoorish) {
    for (const sIdx of [3, 6]) {
      stripes.push([topProj[sIdx], midFlankProj[sIdx], botProj[sIdx]]);
    }
  }
  if (isCruiser || isMoorish) {
    for (let i = 2; i < stations - 1; i += 2) {
      ribs.push([topProj[i], midFlankProj[i], botProj[i]]);
    }
  }

  const patches: OceanQuadPatch[] = [];
  const tint: OceanQuadPatch["tint"] =
    species === "fusilier" || species === "moorish-idol" ? "fish-reef" : "fish-silver";

  if (includePatches) {
    for (let i = 0; i < stations; i++) {
      const bandAccent = isMoorish
        ? i >= 3 && i <= 5
          ? 0.92
          : i >= 7 && i <= 8
            ? 0.82
            : 0.08
        : species === "fusilier"
          ? 0.78
          : 0;
      patches.push(
        buildOceanQuadPatch(
          topWorld[i],
          topWorld[i + 1],
          midFlankWorld[i + 1],
          midFlankWorld[i],
          topProj[i],
          topProj[i + 1],
          midFlankProj[i + 1],
          midFlankProj[i],
          tint,
          width,
          height,
          bandAccent
        ),
        buildOceanQuadPatch(
          midFlankWorld[i],
          midFlankWorld[i + 1],
          botWorld[i + 1],
          botWorld[i],
          midFlankProj[i],
          midFlankProj[i + 1],
          botProj[i + 1],
          botProj[i],
          tint,
          width,
          height,
          0
        )
      );
    }
  }

  const flankNormal = oNormalize(oAdd(oScale(lateralSide, -0.82), oScale(dorsalUp, 0.52)));
  const sunAlign = Math.max(0, oDot(flankNormal, OCEAN_SUN_DIR));
  const waveFlash = Math.max(0, Math.sin(phase * 0.85));
  const flashIntensity = clamp(Math.pow(sunAlign, 4) * 0.75 + waveFlash * 0.25);

  const nose = topProj[0];
  const tailTip = tailNotch;
  const hDx = nose.x - tailTip.x;
  const hDy = nose.y - tailTip.y;
  const hLen = Math.hypot(hDx, hDy) || 1;

  return {
    species,
    bodyOutline,
    dorsalFin,
    caudalFin,
    pectoralFinNear,
    pectoralFinFar,
    ventralFin,
    dorsalStreamer,
    lateralLine: midFlankProj,
    operculum,
    stripes,
    ribs,
    eye,
    nose,
    tailTip,
    patches,
    flashIntensity,
    heading2D: { x: hDx / hLen, y: hDy / hLen },
    depth: worldPos.z,
    scale: midFlankProj[Math.floor(stations * 0.4)].scale,
    label,
  };
}

/**
 * 4 Bağımsız 3B Balık Sürüsü (Boids Pelagic Schooling Formations) + Solo Türler:
 * 1) Sol-Üst Pelajik Gümüş Sardalya Sürüsü (Sardina pilchardus — 22 balık)
 * 2) Sağ-Orta Altın-Sırtlı Fusilier Sürüsü (Caesio xanthonota — 18 balık)
 * 3) Üst Açık Su İstavrit Sürüsü (Trachurus — 16 balık)
 * 4) Alt-Sağ Resif Mercan Sürüsü (Anthias / Fusilier — 14 balık)
 */
export function generateFishSchoolsAndSoloSpecies(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number,
  small: boolean
): { schoolFishes: ArticulatedFishMesh[]; soloFishes: ArticulatedFishMesh[] } {
  const leftX = Math.max(85, leftCorridor * 0.65);
  const rightX = Math.min(width - 85, rightCorridor + (width - rightCorridor) * 0.38);
  const margin = 320;

  // Sürü 1: Sol-üst koridordan yatay-diyagonal akışla giren Gümüş Sardalya Sürüsü
  const school1Waypoints: OceanVec3[] = [
    oVec3(-margin, height * 0.28, 120),
    oVec3(leftX * 0.85, height * 0.22, -45),
    oVec3(width * 0.36, height * 0.16, 40),
    oVec3(width * 0.68, height * 0.20, 140),
    oVec3(rightX * 1.02, height * 0.28, -30),
    oVec3(width + margin, height * 0.24, 120),
  ];

  // Sürü 2: Sağ koridordan sola doğru süzülen Altın-Sırtlı Fusilier Sürüsü
  const school2Waypoints: OceanVec3[] = [
    oVec3(width + margin, height * 0.42, 95),
    oVec3(rightX * 1.04, height * 0.35, -55),
    oVec3(width * 0.72, height * 0.26, 80),
    oVec3(width * 0.34, height * 0.22, 160),
    oVec3(leftX * 0.90, height * 0.32, -40),
    oVec3(-margin, height * 0.38, 110),
  ];

  // Sürü 3: Üst-orta derin su katmanında süzülen İstavrit Sürüsü
  const school3Waypoints: OceanVec3[] = [
    oVec3(-margin, height * 0.15, 280),
    oVec3(width * 0.28, height * 0.13, 210),
    oVec3(width * 0.56, height * 0.15, 190),
    oVec3(width * 0.82, height * 0.18, 230),
    oVec3(width + margin, height * 0.16, 290),
  ];

  // Sürü 4: Alt-sağ resif ve kelp çayırı üzerinde yüzen Mercan Balığı Sürüsü
  const school4Waypoints: OceanVec3[] = [
    oVec3(width + margin, height * 0.76, 80),
    oVec3(rightX * 0.96, height * 0.72, -65),
    oVec3(width * 0.68, height * 0.78, -35),
    oVec3(width * 0.36, height * 0.84, 150),
    oVec3(leftX * 0.82, height * 0.74, -40),
    oVec3(-margin, height * 0.70, 90),
  ];

  const schools: {
    species: FishSpecies;
    waypoints: OceanVec3[];
    period: number;
    phaseOffset: number;
    count: number;
    baseLen: number;
    spreadX: number;
    spreadY: number;
    spreadZ: number;
  }[] = [
    {
      species: "sardine",
      waypoints: school1Waypoints,
      period: 56,
      phaseOffset: 0.22,
      count: small ? 12 : 22,
      baseLen: 35,
      spreadX: 112,
      spreadY: 42,
      spreadZ: 85,
    },
    {
      species: "fusilier",
      waypoints: school2Waypoints,
      period: 62,
      phaseOffset: 0.21,
      count: small ? 10 : 18,
      baseLen: 40,
      spreadX: 98,
      spreadY: 38,
      spreadZ: 80,
    },
    {
      species: "scad",
      waypoints: school3Waypoints,
      period: 68,
      phaseOffset: 0.48,
      count: small ? 8 : 16,
      baseLen: 33,
      spreadX: 118,
      spreadY: 34,
      spreadZ: 95,
    },
    {
      species: "anthias",
      waypoints: school4Waypoints,
      period: 58,
      phaseOffset: 0.28,
      count: small ? 8 : 14,
      baseLen: 34,
      spreadX: 92,
      spreadY: 36,
      spreadZ: 75,
    },
  ];

  const schoolFishes: ArticulatedFishMesh[] = [];

  schools.forEach((sc, sIdx) => {
    const uCenter = ((timeSec / sc.period + sc.phaseOffset) % 1 + 1) % 1;
    for (let i = 0; i < sc.count; i++) {
      const seedBase = sIdx * 200 + i * 17;
      const streamLag = ((i / sc.count) - 0.5) * 0.08 + (seeded(seedBase + 1) - 0.5) * 0.022;
      const uFish = clamp(uCenter + streamLag, 0.004, 0.996);
      const centerPos = oceanSpline(sc.waypoints, uFish);
      const aheadPos = oceanSpline(sc.waypoints, clamp(uFish + 0.008, 0, 1));
      const behindPos = oceanSpline(sc.waypoints, clamp(uFish - 0.008, 0, 1));
      const vel = oSub(aheadPos, behindPos);

      const breathe = 0.84 + 0.20 * Math.sin(timeSec * 0.9 + sIdx * 2 + i * 0.35);
      const radialAngle = i * 2.399963 + Math.sin(timeSec * 0.45 + i) * 0.25;
      const radialDist = Math.sqrt((i + 0.5) / sc.count) * breathe;

      const offset: OceanVec3 = {
        x: Math.cos(radialAngle) * sc.spreadX * radialDist + Math.sin(timeSec * 1.4 + i) * 5,
        y: Math.sin(radialAngle) * sc.spreadY * radialDist + Math.cos(timeSec * 1.1 + i * 0.7) * 4,
        z: (seeded(seedBase + 3) - 0.5) * sc.spreadZ,
      };

      const fishWorld = oAdd(centerPos, offset);
      const individualLen = sc.baseLen * (0.85 + seeded(seedBase + 5) * 0.32);
      const swimPhase = timeSec * 8.2 + i * 0.85 + sIdx * 3.1;

      schoolFishes.push(
        buildArticulated3DFish(
          sc.species,
          fishWorld,
          vel,
          individualLen,
          swimPhase,
          width,
          height,
          i % 2 === 0
        )
      );
    }
  });

  // ─── Solo / Çift Özel Balık Türleri ───
  const soloFishes: ArticulatedFishMesh[] = [];

  // 1. Çift Zanclus cornutus (Moorish Idol — Uzun Beyaz Flamalı Mercan Balığı Çifti)
  const moorishWaypoints: OceanVec3[] = [
    oVec3(-220, height * 0.62, 40),
    oVec3(leftX * 0.72, height * 0.56, -75),
    oVec3(width * 0.34, height * 0.50, 95),
    oVec3(width * 0.72, height * 0.58, -50),
    oVec3(rightX * 1.02, height * 0.52, -65),
    oVec3(width + 220, height * 0.48, 50),
  ];
  for (let pairIdx = 0; pairIdx < (small ? 1 : 2); pairIdx++) {
    const uM = ((timeSec / 68 + 0.22 - pairIdx * 0.028) % 1 + 1) % 1;
    const posM = oAdd(
      oceanSpline(moorishWaypoints, uM),
      oVec3(-pairIdx * 34, pairIdx * 26, pairIdx * 30)
    );
    const velM = oSub(
      oceanSpline(moorishWaypoints, clamp(uM + 0.008, 0, 1)),
      oceanSpline(moorishWaypoints, clamp(uM - 0.008, 0, 1))
    );
    soloFishes.push(
      buildArticulated3DFish(
        "moorish-idol",
        posM,
        velM,
        pairIdx === 0 ? 58 : 48,
        timeSec * 5.6 + pairIdx * 1.7,
        width,
        height,
        true,
        pairIdx === 0 ? "ZANCLUS CORNUTUS" : undefined
      )
    );
  }

  // 2. Pelajik Hızlı Yüzücü (Thunnus / Açık Deniz Kruvazörü)
  const cruiserWaypoints: OceanVec3[] = [
    oVec3(width + 260, height * 0.22, 70),
    oVec3(rightX * 0.92, height * 0.19, -55),
    oVec3(width * 0.54, height * 0.16, 35),
    oVec3(leftX * 0.95, height * 0.20, -40),
    oVec3(-260, height * 0.24, 80),
  ];
  const uC = ((timeSec / 52 + 0.24) % 1 + 1) % 1;
  const posC = oceanSpline(cruiserWaypoints, uC);
  const velC = oSub(
    oceanSpline(cruiserWaypoints, clamp(uC + 0.008, 0, 1)),
    oceanSpline(cruiserWaypoints, clamp(uC - 0.008, 0, 1))
  );
  soloFishes.push(
    buildArticulated3DFish(
      "pelagic-cruiser",
      posC,
      velC,
      104,
      timeSec * 7.2,
      width,
      height,
      true,
      "THUNNUS PELAGICUS"
    )
  );

  return { schoolFishes, soloFishes };
}

/**
 * 3B Dev Okyanus Manta Vatozu (Mobula birostris):
 * Kavisli kartal/manta kanat profili, rajiform kanat çırpma dalgası, sefalik boynuz lobları,
 * solungaç yarıkları, sırt şevron desenleri ve uzun kamçı kuyruk.
 */
export function generateMantaRays(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number
): MantaRayMesh[] {
  const leftX = Math.max(95, leftCorridor * 0.72);
  const rightX = Math.min(width - 95, rightCorridor + (width - rightCorridor) * 0.28);

  const waypoints: OceanVec3[] = [
    oVec3(width + 300, height * 0.64, 120),
    oVec3(rightX * 0.96, height * 0.58, -75),
    oVec3(width * 0.66, height * 0.68, -45),
    oVec3(width * 0.34, height * 0.62, 110),
    oVec3(leftX, height * 0.52, -55),
    oVec3(-300, height * 0.46, 130),
  ];

  const u = ((timeSec / 78 + 0.24) % 1 + 1) % 1;
  const centerWorld = oceanSpline(waypoints, u);
  const ahead = oceanSpline(waypoints, clamp(u + 0.008, 0, 1));
  const behind = oceanSpline(waypoints, clamp(u - 0.008, 0, 1));
  const rawVel = oSub(ahead, behind);
  const minHoriz = Math.max(Math.abs(rawVel.x), 18);
  const forward = oNormalize({
    x: (rawVel.x >= 0 ? 1 : -1) * minHoriz,
    y: clamp(rawVel.y, -minHoriz * 0.35, minHoriz * 0.35),
    z: clamp(rawVel.z, -minHoriz * 0.35, minHoriz * 0.35),
  });

  const camDir = oNormalize(oSub(oVec3(0, 0, -1), oScale(forward, -forward.z)));
  const upRef = oVec3(0, -0.75, -0.66);
  const normal = oNormalize(
    oAdd(
      oScale(oNormalize(oSub(upRef, oScale(forward, oDot(upRef, forward)))), 0.64),
      oScale(camDir, 0.77)
    )
  );
  const binormal = oNormalize(oCross(forward, normal));

  const bodyLen = 118;
  const halfSpan = 108;
  const phase = timeSec * 2.35;

  const wingPoint3D = (sideSign: number, spanU: number, chordV: number): OceanVec3 => {
    // Kavisli Manta kanat geometrisi: ön kenar geriye süpürülür, arka kenar içbükey (concave) hilal oluşturur
    const leadX = (0.44 - 0.62 * Math.pow(spanU, 0.92)) * bodyLen;
    const trailX = (-0.46 + 0.28 * Math.sin(Math.pow(spanU, 0.75) * Math.PI)) * (1 - spanU) * bodyLen + leadX * spanU;
    const axial = leadX * (1 - chordV) + trailX * chordV;
    const lateral = sideSign * spanU * halfSpan;

    const flap =
      Math.sin(phase - spanU * 1.95 - chordV * 0.42) *
      halfSpan *
      0.30 *
      Math.pow(spanU, 1.35);
    const camber = Math.sin(chordV * Math.PI) * (1 - spanU * 0.75) * 8 + (1 - spanU * spanU) * (1 - chordV) * 5;

    return oAdd(
      centerWorld,
      oAdd(
        oScale(forward, axial),
        oAdd(oScale(binormal, lateral), oScale(normal, flap + camber))
      )
    );
  };

  const spanSteps = 10;
  const chordSteps = 5;
  const patches: OceanQuadPatch[] = [];
  const wingRibs: OceanProjectedPoint[][] = [];

  for (const sideSign of [-1, 1]) {
    const gridW: OceanVec3[][] = [];
    const gridP: OceanProjectedPoint[][] = [];
    for (let iu = 0; iu <= spanSteps; iu++) {
      const su = iu / spanSteps;
      const rowW: OceanVec3[] = [];
      const rowP: OceanProjectedPoint[] = [];
      for (let iv = 0; iv <= chordSteps; iv++) {
        const cv = iv / chordSteps;
        const w = wingPoint3D(sideSign, su, cv);
        rowW.push(w);
        rowP.push(projectOceanPoint(w, width, height));
      }
      gridW.push(rowW);
      gridP.push(rowP);
      if (iu > 0 && iu < spanSteps && iu % 2 === 0) {
        wingRibs.push(rowP);
      }
    }

    for (let iu = 0; iu < spanSteps; iu++) {
      const suMid = (iu + 0.5) / spanSteps;
      for (let iv = 0; iv < chordSteps; iv++) {
        const cvMid = (iv + 0.5) / chordSteps;
        const isShoulderPatch = suMid > 0.14 && suMid < 0.48 && cvMid > 0.18 && cvMid < 0.55 ? 0.85 : 0;
        patches.push(
          buildOceanQuadPatch(
            gridW[iu][iv],
            gridW[iu + 1][iv],
            gridW[iu + 1][iv + 1],
            gridW[iu][iv + 1],
            gridP[iu][iv],
            gridP[iu + 1][iv],
            gridP[iu + 1][iv + 1],
            gridP[iu][iv + 1],
            "manta",
            width,
            height,
            isShoulderPatch
          )
        );
      }
    }
  }
  patches.sort((a, b) => b.depth - a.depth);

  const outline: OceanProjectedPoint[] = [];
  for (let iu = 0; iu <= spanSteps; iu++) {
    outline.push(projectOceanPoint(wingPoint3D(1, iu / spanSteps, 0), width, height));
  }
  for (let iu = spanSteps - 1; iu >= 0; iu--) {
    outline.push(projectOceanPoint(wingPoint3D(1, iu / spanSteps, 1), width, height));
  }
  for (let iu = 1; iu <= spanSteps; iu++) {
    outline.push(projectOceanPoint(wingPoint3D(-1, iu / spanSteps, 1), width, height));
  }
  for (let iu = spanSteps - 1; iu >= 0; iu--) {
    outline.push(projectOceanPoint(wingPoint3D(-1, iu / spanSteps, 0), width, height));
  }

  const buildCephalic = (sideSign: number) => {
    const base = wingPoint3D(sideSign, 0.16, 0);
    const tip = oAdd(
      base,
      oAdd(
        oScale(forward, bodyLen * 0.24),
        oAdd(oScale(binormal, sideSign * halfSpan * 0.04), oScale(normal, 4))
      )
    );
    const inner = wingPoint3D(sideSign, 0.06, 0.04);
    return [
      projectOceanPoint(base, width, height),
      projectOceanPoint(tip, width, height),
      projectOceanPoint(inner, width, height),
    ];
  };

  const tailWhip: OceanProjectedPoint[] = [];
  for (let i = 0; i <= 10; i++) {
    const tu = i / 10;
    const wave = Math.sin(phase - 1.4 - tu * 3.2) * 14 * tu;
    const tw = oAdd(
      wingPoint3D(0, 0, 1),
      oAdd(oScale(forward, -bodyLen * 0.92 * tu), oAdd(oScale(binormal, wave), oScale(normal, -tu * 6)))
    );
    tailWhip.push(projectOceanPoint(tw, width, height));
  }

  const gillSlits: OceanProjectedPoint[][] = [];
  for (const sideSign of [-1, 1]) {
    for (let g = 0; g < 5; g++) {
      const cv = 0.16 + g * 0.085;
      gillSlits.push([
        projectOceanPoint(wingPoint3D(sideSign, 0.08, cv), width, height),
        projectOceanPoint(wingPoint3D(sideSign, 0.24, cv + 0.02), width, height),
      ]);
    }
  }

  const chevronMarks: OceanProjectedPoint[][] = [-1, 1].map(sideSign => [
    projectOceanPoint(wingPoint3D(sideSign, 0.12, 0.22), width, height),
    projectOceanPoint(wingPoint3D(sideSign, 0.36, 0.30), width, height),
    projectOceanPoint(wingPoint3D(sideSign, 0.28, 0.52), width, height),
  ]);

  const wakeTrails: OceanProjectedPoint[][] = [-1, 1].map(sideSign => {
    const tipW = wingPoint3D(sideSign, 1, 0.3);
    return Array.from({ length: 8 }, (_, k) => {
      const uWake = k / 7;
      return projectOceanPoint(
        oAdd(
          tipW,
          oAdd(
            oScale(forward, -bodyLen * 0.45 * uWake),
            oScale(normal, Math.sin(phase - uWake * 3.5) * 9 * uWake)
          )
        ),
        width,
        height
      );
    });
  });

  return [
    {
      outline,
      cephalicLeft: buildCephalic(-1),
      cephalicRight: buildCephalic(1),
      tailWhip,
      dorsalFin: [
        projectOceanPoint(wingPoint3D(0, 0, 0.78), width, height),
        projectOceanPoint(oAdd(wingPoint3D(0, 0, 0.86), oScale(normal, 10)), width, height),
        projectOceanPoint(wingPoint3D(0, 0, 0.96), width, height),
      ],
      wingRibs,
      gillSlits,
      chevronMarks,
      eyes: [
        projectOceanPoint(wingPoint3D(-1, 0.17, 0.04), width, height),
        projectOceanPoint(wingPoint3D(1, 0.17, 0.04), width, height),
      ],
      patches,
      wakeTrails,
      center: projectOceanPoint(centerWorld, width, height),
      depth: centerWorld.z,
      label: "MOBULA BIROSTRIS",
    },
  ];
}

/**
 * 3B Biyolüminesan Pelajik Denizanaları (Chrysaora / Aurelia)
 */
export function generateJellyfishes(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number,
  small: boolean
): JellyfishMesh[] {
  const leftX = Math.max(64, leftCorridor * 0.46);
  const rightX = Math.min(width - 64, rightCorridor + (width - rightCorridor) * 0.56);

  const specs: {
    baseX: number;
    baseY: number;
    z: number;
    radius: number;
    tilt: number;
    speed: number;
    phaseOffset: number;
    variant: "compass" | "moon";
    label?: string;
  }[] = [
    {
      baseX: leftX * 0.68,
      baseY: height * 0.16,
      z: -35,
      radius: 40,
      tilt: 0.20,
      speed: 1.85,
      phaseOffset: 0.4,
      variant: "compass",
      label: "CHRYSAORA NOCTILUCA",
    },
    {
      baseX: rightX + (width - rightX) * 0.28,
      baseY: height * 0.22,
      z: 35,
      radius: 38,
      tilt: -0.22,
      speed: 2.05,
      phaseOffset: 2.3,
      variant: "compass",
    },
  ];

  if (!small) {
    specs.push({
      baseX: rightX - 45,
      baseY: height * 0.48,
      z: 185,
      radius: 28,
      tilt: -0.14,
      speed: 2.2,
      phaseOffset: 4.1,
      variant: "moon",
    });
  }

  return specs.map((sp, jIdx) => {
    const cycle = timeSec * sp.speed + sp.phaseOffset;
    const rawSin = Math.sin(cycle);
    const pulse = rawSin > 0 ? Math.pow(rawSin, 0.7) : -Math.pow(-rawSin, 1.4) * 0.65;
    const bellR = sp.radius * (1 - pulse * 0.18);
    const bellH = sp.radius * 0.76 * (1 + pulse * 0.22);

    const driftY = ((sp.baseY - timeSec * 12 * (0.8 + jIdx * 0.15)) % (height + 240) + (height + 240)) % (height + 240) - 120;
    const driftX = sp.baseX + Math.sin(timeSec * 0.45 + sp.phaseOffset) * 24;
    const apexWorld = oVec3(driftX, driftY, sp.z);

    const upVec = oNormalize(oVec3(Math.sin(sp.tilt), -Math.cos(sp.tilt), -0.12));
    const rightVec = oNormalize(oVec3(Math.cos(sp.tilt), Math.sin(sp.tilt), 0));
    const frontVec = oNormalize(oCross(rightVec, upVec));

    const latSteps = 5;
    const lonSteps = 14;
    const gridW: OceanVec3[][] = [];
    const gridP: OceanProjectedPoint[][] = [];

    for (let il = 0; il <= latSteps; il++) {
      const phi = (il / latSteps) * (Math.PI * 0.56);
      const rRing = Math.sin(phi) * bellR * (il === latSteps ? 1 + 0.06 * Math.sin(cycle - 0.6) : 1);
      const yRing = (1 - Math.cos(phi)) * bellH;
      const rowW: OceanVec3[] = [];
      const rowP: OceanProjectedPoint[] = [];

      for (let j = 0; j < lonSteps; j++) {
        const theta = (j / lonSteps) * TAU;
        const lappet = il === latSteps ? Math.sin(theta * 8) * 2.2 : 0;
        const w = oAdd(
          apexWorld,
          oAdd(
            oScale(upVec, -(yRing + lappet)),
            oAdd(
              oScale(rightVec, Math.cos(theta) * rRing),
              oScale(frontVec, Math.sin(theta) * rRing)
            )
          )
        );
        rowW.push(w);
        rowP.push(projectOceanPoint(w, width, height));
      }
      gridW.push(rowW);
      gridP.push(rowP);
    }

    const patches: OceanQuadPatch[] = [];
    for (let il = 0; il < latSteps; il++) {
      for (let j = 0; j < lonSteps; j++) {
        const k = (j + 1) % lonSteps;
        patches.push(
          buildOceanQuadPatch(
            gridW[il][j],
            gridW[il + 1][j],
            gridW[il + 1][k],
            gridW[il][k],
            gridP[il][j],
            gridP[il + 1][j],
            gridP[il + 1][k],
            gridP[il][k],
            "jelly",
            width,
            height,
            il / latSteps
          )
        );
      }
    }
    patches.sort((a, b) => b.depth - a.depth);

    const radialRibs: OceanProjectedPoint[][] = [];
    for (let j = 0; j < lonSteps; j++) {
      radialRibs.push(gridP.map(row => row[j]));
    }

    const leftProfile = Array.from({ length: latSteps + 1 }, (_, il) => gridP[il][Math.floor(lonSteps * 0.5)]);
    const rightProfile = Array.from({ length: latSteps + 1 }, (_, il) => gridP[il][0]).reverse();
    const bellOutline = [...leftProfile, ...rightProfile];

    const oralArms: OceanProjectedPoint[][] = [];
    for (let a = 0; a < 4; a++) {
      const armAngle = (a / 4) * TAU + 0.4;
      const pts: OceanProjectedPoint[] = [];
      const armLen = sp.radius * 1.85;
      for (let s = 0; s <= 10; s++) {
        const u = s / 10;
        const wave = Math.sin(cycle - u * 3.4 + a * 1.3) * 10 * u + Math.cos(timeSec * 2.4 + s) * 3.2 * u;
        const w = oAdd(
          apexWorld,
          oAdd(
            oScale(upVec, -(bellH * 0.72 + u * armLen)),
            oAdd(
              oScale(rightVec, Math.cos(armAngle) * sp.radius * 0.24 * (1 - u * 0.4) + wave),
              oScale(frontVec, Math.sin(armAngle) * sp.radius * 0.24)
            )
          )
        );
        pts.push(projectOceanPoint(w, width, height));
      }
      oralArms.push(pts);
    }

    const tentacles: OceanProjectedPoint[][] = [];
    const tentacleCount = small ? 6 : 8;
    for (let t = 0; t < tentacleCount; t++) {
      const tAngle = (t / tentacleCount) * TAU;
      const rimOrigin = oAdd(
        apexWorld,
        oAdd(
          oScale(upVec, -bellH),
          oAdd(
            oScale(rightVec, Math.cos(tAngle) * bellR * 0.92),
            oScale(frontVec, Math.sin(tAngle) * bellR * 0.92)
          )
        )
      );
      const pts: OceanProjectedPoint[] = [];
      const tLen = sp.radius * (2.5 + (t % 2) * 0.65);
      for (let s = 0; s <= 11; s++) {
        const u = s / 11;
        const lagWave = Math.sin(cycle - u * 4.2 + t * 0.7) * 14 * Math.pow(u, 1.25);
        const w = oAdd(
          rimOrigin,
          oAdd(
            oScale(upVec, -u * tLen),
            oAdd(oScale(rightVec, lagWave), oScale(frontVec, Math.cos(cycle - u * 3.5 + t) * 7 * u))
          )
        );
        pts.push(projectOceanPoint(w, width, height));
      }
      tentacles.push(pts);
    }

    return {
      bellOutline,
      lappetRim: gridP[latSteps],
      radialRibs,
      innerGonadRing: gridP[Math.max(1, Math.floor(latSteps * 0.5))],
      oralArms,
      tentacles,
      patches,
      apex: projectOceanPoint(apexWorld, width, height),
      depth: sp.z,
      pulseFactor: (pulse + 1) * 0.5,
      variant: sp.variant,
      label: sp.label,
    };
  });
}

/**
 * 3B Yeşil Deniz Kaplumbağası (Chelonia mydas)
 */
export function generateSeaTurtles(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number
): SeaTurtleMesh[] {
  const leftX = Math.max(82, leftCorridor * 0.45);
  const rightX = Math.min(width - 82, rightCorridor + (width - rightCorridor) * 0.38);

  const waypoints: OceanVec3[] = [
    oVec3(-240, height * 0.42, 110),
    oVec3(leftX, height * 0.36, -55),
    oVec3(width * 0.32, height * 0.28, 70),
    oVec3(width * 0.72, height * 0.34, 85),
    oVec3(rightX, height * 0.44, -65),
    oVec3(width + 240, height * 0.38, 120),
  ];

  const u = ((timeSec / 76 + 0.19) % 1 + 1) % 1;
  const centerWorld = oceanSpline(waypoints, u);
  const ahead = oceanSpline(waypoints, clamp(u + 0.008, 0, 1));
  const behind = oceanSpline(waypoints, clamp(u - 0.008, 0, 1));
  const rawVel = oSub(ahead, behind);
  const minHoriz = Math.max(Math.abs(rawVel.x), 18);
  const forward = oNormalize({
    x: (rawVel.x >= 0 ? 1 : -1) * minHoriz,
    y: clamp(rawVel.y, -minHoriz * 0.32, minHoriz * 0.32),
    z: clamp(rawVel.z, -minHoriz * 0.32, minHoriz * 0.32),
  });

  const camDir = oNormalize(oSub(oVec3(0, 0, -1), oScale(forward, -forward.z)));
  const upRef = oVec3(0, -0.76, -0.65);
  const normal = oNormalize(
    oAdd(
      oScale(oNormalize(oSub(upRef, oScale(forward, oDot(upRef, forward)))), 0.70),
      oScale(camDir, 0.71)
    )
  );
  const binormal = oNormalize(oCross(forward, normal));

  const shellLen = 78;
  const shellW = 58;
  const shellH = 24;
  const phase = timeSec * 2.8;

  const shellPoint3D = (axialS: number, latT: number): OceanVec3 => {
    const r2 = Math.min(1, axialS * axialS + latT * latT);
    const dome = Math.sqrt(Math.max(0, 1 - r2)) * shellH;
    const widthTaper = 1 - 0.22 * Math.max(0, -axialS);
    return oAdd(
      centerWorld,
      oAdd(
        oScale(forward, axialS * shellLen * 0.5),
        oAdd(
          oScale(binormal, latT * shellW * 0.5 * widthTaper),
          oScale(normal, dome)
        )
      )
    );
  };

  const carapaceOutline: OceanProjectedPoint[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    carapaceOutline.push(
      projectOceanPoint(shellPoint3D(Math.cos(a), Math.sin(a)), width, height)
    );
  }

  const scutePolygons: SeaTurtleMesh["scutePolygons"] = [];
  const axialBands = [-0.88, -0.52, -0.16, 0.20, 0.56, 0.88];
  const latBands = [-0.92, -0.34, 0.34, 0.92];

  for (let ia = 0; ia < axialBands.length - 1; ia++) {
    const a0 = axialBands[ia], a1 = axialBands[ia + 1];
    for (let il = 0; il < latBands.length - 1; il++) {
      const l0 = latBands[il], l1 = latBands[il + 1];
      const w00 = shellPoint3D(a0, l0);
      const w10 = shellPoint3D(a1, l0);
      const w11 = shellPoint3D(a1, l1);
      const w01 = shellPoint3D(a0, l1);
      const p00 = projectOceanPoint(w00, width, height);
      const p10 = projectOceanPoint(w10, width, height);
      const p11 = projectOceanPoint(w11, width, height);
      const p01 = projectOceanPoint(w01, width, height);

      const patch = buildOceanQuadPatch(
        w00, w10, w11, w01,
        p00, p10, p11, p01,
        "turtle-shell",
        width,
        height
      );
      scutePolygons.push({
        points: [p00, p10, p11, p01],
        light: patch.light,
        specular: patch.specular,
        rim: patch.rim,
        isVertebral: il === 1,
      });
    }
  }

  const headBase = shellPoint3D(0.95, 0);
  const headTip = oAdd(headBase, oAdd(oScale(forward, 26), oScale(normal, 4)));
  const headOutline = [
    projectOceanPoint(shellPoint3D(0.92, -0.22), width, height),
    projectOceanPoint(oAdd(headBase, oAdd(oScale(forward, 16), oScale(binormal, -10))), width, height),
    projectOceanPoint(headTip, width, height),
    projectOceanPoint(oAdd(headBase, oAdd(oScale(forward, 16), oScale(binormal, 10))), width, height),
    projectOceanPoint(shellPoint3D(0.92, 0.22), width, height),
  ];
  const eye = projectOceanPoint(
    oAdd(headBase, oAdd(oScale(forward, 17), oAdd(oScale(binormal, -8), oScale(normal, 5)))),
    width,
    height
  );

  const buildFrontFlipper = (sideSign: number) => {
    const shoulder = shellPoint3D(0.62, sideSign * 0.88);
    const strokeSweep = Math.sin(phase) * 18;
    const strokeLift = Math.cos(phase) * 22;
    const tip = oAdd(
      shoulder,
      oAdd(
        oScale(forward, 12 + strokeSweep),
        oAdd(oScale(binormal, sideSign * 56), oScale(normal, strokeLift - 8))
      )
    );
    const midLead = oAdd(
      shoulder,
      oAdd(
        oScale(forward, 18 + strokeSweep * 0.6),
        oAdd(oScale(binormal, sideSign * 30), oScale(normal, strokeLift * 0.5))
      )
    );
    const midTrail = oAdd(
      shoulder,
      oAdd(
        oScale(forward, -12 + strokeSweep * 0.4),
        oAdd(oScale(binormal, sideSign * 32), oScale(normal, strokeLift * 0.5 - 4))
      )
    );
    const rootBack = shellPoint3D(0.36, sideSign * 0.94);
    return [
      projectOceanPoint(shoulder, width, height),
      projectOceanPoint(midLead, width, height),
      projectOceanPoint(tip, width, height),
      projectOceanPoint(midTrail, width, height),
      projectOceanPoint(rootBack, width, height),
    ];
  };

  const buildHindFlipper = (sideSign: number) => {
    const hip = shellPoint3D(-0.74, sideSign * 0.68);
    const tip = oAdd(
      hip,
      oAdd(oScale(forward, -24), oAdd(oScale(binormal, sideSign * 22), oScale(normal, -4)))
    );
    const inner = shellPoint3D(-0.88, sideSign * 0.36);
    return [
      projectOceanPoint(hip, width, height),
      projectOceanPoint(tip, width, height),
      projectOceanPoint(inner, width, height),
    ];
  };

  return [
    {
      carapaceOutline,
      scutePolygons,
      headOutline,
      eye,
      frontFlipperNear: buildFrontFlipper(-1),
      frontFlipperFar: buildFrontFlipper(1),
      hindFlipperNear: buildHindFlipper(-1),
      hindFlipperFar: buildHindFlipper(1),
      flipperScales: [],
      center: projectOceanPoint(centerWorld, width, height),
      depth: centerWorld.z,
      label: "CHELONIA MYDAS",
    },
  ];
}

/**
 * Sualtı Mikro-Hava Kabarcıkları ve Güneş Kostik Hüzmeleri (God-Rays)
 */
export function generateAmbientBubblesAndRays(
  timeSec: number,
  width: number,
  height: number,
  leftCorridor: number,
  rightCorridor: number,
  small: boolean
): { bubbles: OceanBubble[]; lightShafts: OceanLightShaft[] } {
  const bubbleCount = small ? 24 : 44;
  const bubbles: OceanBubble[] = [];

  for (let i = 0; i < bubbleCount; i++) {
    const isLeft = i % 2 === 0;
    const corridorSpan = isLeft
      ? Math.max(90, leftCorridor * 1.15)
      : Math.max(90, (width - rightCorridor) * 1.15);
    const baseX = isLeft
      ? seeded(i * 19 + 3) * corridorSpan + 16
      : width - (seeded(i * 19 + 3) * corridorSpan + 16);
    const z = (seeded(i * 31 + 7) - 0.25) * 420;
    const speed = 18 + seeded(i * 43) * 26;
    const rawY = height + 40 - ((timeSec * speed + seeded(i * 71) * height) % (height + 80));
    const wobbleX = Math.sin(timeSec * 2.1 + i * 1.7) * (4 + seeded(i * 11) * 5);

    const pos = projectOceanPoint(oVec3(baseX + wobbleX, rawY, z), width, height);
    bubbles.push({
      pos,
      radius: (1.2 + seeded(i * 59) * 2.8) * pos.scale,
      shimmer: 0.45 + 0.55 * Math.sin(timeSec * 3.2 + i),
    });
  }

  const sway = Math.sin(timeSec * 0.35) * 28;
  const lightShafts: OceanLightShaft[] = [
    {
      topX: Math.max(60, leftCorridor * 0.45) + sway,
      bottomX: Math.max(110, leftCorridor * 0.95) + sway * 1.6,
      topWidth: 68,
      bottomWidth: 165,
      opacity: 0.055 + 0.02 * Math.sin(timeSec * 0.7),
    },
    {
      topX: Math.max(130, leftCorridor * 0.85) + sway * 0.7,
      bottomX: Math.max(190, leftCorridor * 1.25) + sway * 1.2,
      topWidth: 42,
      bottomWidth: 110,
      opacity: 0.038 + 0.015 * Math.cos(timeSec * 0.55),
    },
    {
      topX: Math.min(width - 90, rightCorridor + (width - rightCorridor) * 0.35) - sway,
      bottomX: Math.min(width - 40, rightCorridor + (width - rightCorridor) * 0.82) - sway * 1.5,
      topWidth: 74,
      bottomWidth: 175,
      opacity: 0.05 + 0.02 * Math.cos(timeSec * 0.6 + 1.2),
    },
    {
      topX: Math.min(width - 150, rightCorridor + (width - rightCorridor) * 0.12) - sway * 0.6,
      bottomX: Math.min(width - 95, rightCorridor + (width - rightCorridor) * 0.48) - sway * 1.1,
      topWidth: 46,
      bottomWidth: 118,
      opacity: 0.036 + 0.014 * Math.sin(timeSec * 0.5 + 0.8),
    },
  ];

  return { bubbles, lightShafts };
}
