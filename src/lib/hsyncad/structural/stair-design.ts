import { control } from "./global-control-types";
import { barArea, beamCapacity, beamMaterial, type BeamBar, type BeamMaterial, type BeamSection } from "./rc-beam-section";
import { anchorageLength } from "./beam-detailing";
import { crackedBeamSection, type ServiceEnvironment } from "./beam-service";
import { stairGeometry, type StairGeometryInput } from "./stair-geometry";

export type StairLoadCase = { id: string; use: "ultimate"; deadFactor: number; liveFactor: number; source: string };
export type StairReinforcement = { diameterMm: number; spacingMm: number; anchorageLeftMm: number; anchorageRightMm: number };
export type StairDesignInput = {
  geometry: StairGeometryInput;
  loads: Record<string, { finishKnM2: number; finishBasis: "projected" | "inclined"; otherDeadKnM2: number;
    liveKnM2: number; liveBasis: "projected" | "inclined"; source: string }>;
  material: BeamMaterial;
  coverMm: number;
  mainBottom: StairReinforcement;
  mainTop: StairReinforcement;
  distribution: { diameterMm: number; spacingMm: number };
  ultimateCases: readonly StairLoadCase[];
  service: { duration: "3months" | "6months" | "12months" | "5years"; environment: ServiceEnvironment;
    partition: "none_floor" | "none_roof" | "sensitive" | "insensitive"; sustainedLiveFactor: number; source: string };
  globalAnalysisSnapshot: null | { modelRevision: string; stiffnessSet: string; analysisStamp: string; geometryRevision: string; geometryFingerprint: string };
  globalAnalysisStamp: string;
};

type LinearLoad = { x0: number; x1: number; q0: number; q1: number; kind: "uniform" | "step" };
type SpanAction = { reactionsKn: [number, number]; samples: { xM: number; Mknm: number; Vkn: number }[]; maxAbsMomentKnm: number; criticalXM: number; totalKn: number };
const positive = (n: number, label: string) => { if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} pozitif ve sonlu olmalı.`); };
const qAt = (load: LinearLoad, x: number) => load.q0 + (load.q1 - load.q0) * ((x - load.x0) / (load.x1 - load.x0));
function integrateSegment(load: LinearLoad, a = load.x0, b = load.x1) {
  const qa = qAt(load, a), qb = qAt(load, b), dx = b - a;
  const force = (qa + qb) * dx / 2;
  const firstMoment = a * force + dx * dx * (qa + 2 * qb) / 6;
  return { force, firstMoment };
}
function analyzeSpan(loads: readonly LinearLoad[], lengthM: number): SpanAction {
  const total = loads.reduce((sum, l) => { const i = integrateSegment(l); return { force: sum.force + i.force, first: sum.first + i.firstMoment }; }, { force: 0, first: 0 });
  const right = total.first / lengthM, left = total.force - right;
  const bounds = [...new Set([0, lengthM, ...loads.flatMap(l => [l.x0, l.x1])])].sort((a, b) => a - b);
  const points = [...bounds, ...Array.from({ length: 201 }, (_, i) => lengthM * i / 200)];
  // Within each interval q(x) is linear, hence V(x) is quadratic. Add every exact V=0 root
  // so the reported maximum moment is not limited by the display/sample grid.
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i], b = bounds[i + 1], mid = (a + b) / 2;
    const active = loads.filter(l => mid > l.x0 && mid < l.x1);
    const q0 = active.reduce((sum, l) => sum + qAt(l, a), 0);
    const slope = active.reduce((sum, l) => sum + (l.q1 - l.q0) / (l.x1 - l.x0), 0);
    const before = loads.reduce((sum, l) => sum + (a <= l.x0 ? 0 : integrateSegment(l, l.x0, Math.min(a, l.x1)).force), 0);
    const v0 = left - before;
    const roots = Math.abs(slope) < 1e-14 ? (Math.abs(q0) < 1e-14 ? [] : [-v0 / q0])
      : [(-q0 + Math.sqrt(Math.max(0, q0 * q0 + 2 * slope * v0))) / slope,
        (-q0 - Math.sqrt(Math.max(0, q0 * q0 + 2 * slope * v0))) / slope];
    for (const root of roots) if (root > 1e-10 && root < b - a - 1e-10) points.push(a + root);
  }
  const uniquePoints = [...new Set(points)].sort((a, b) => a - b);
  const samples = uniquePoints.map(x => {
    const partial = loads.reduce((sum, load) => {
      if (x <= load.x0) return sum;
      const i = integrateSegment(load, load.x0, Math.min(x, load.x1));
      return { force: sum.force + i.force, first: sum.first + i.firstMoment };
    }, { force: 0, first: 0 });
    return { xM: x, Mknm: left * x - (x * partial.force - partial.first), Vkn: left - partial.force };
  });
  const critical = samples.reduce((a, b) => Math.abs(a.Mknm) >= Math.abs(b.Mknm) ? a : b);
  return { reactionsKn: [left, right], samples, maxAbsMomentKnm: Math.abs(critical.Mknm), criticalXM: critical.xM, totalKn: total.force };
}
function barsAcrossWidth(width: number, depth: number, cover: number, diameter: number, spacing: number, face: "top" | "bottom", id: string): BeamBar[] {
  positive(diameter, "donatı çapı"); positive(spacing, "donatı aralığı");
  const clearWidth = width - 2 * (cover + diameter / 2);
  if (clearWidth < 0) throw new Error("Donatı örtüsü ve çapı enine kesite sığmıyor.");
  const count = Math.max(2, Math.ceil(clearWidth / spacing) + 1), actualSpacing = clearWidth / (count - 1);
  return Array.from({ length: count }, (_, i) => ({ id: `${id}:${i + 1}`, x: -clearWidth / 2 + i * actualSpacing,
    y: face === "bottom" ? depth - cover - diameter / 2 : cover + diameter / 2, diameter, face }));
}
function requiredFlexuralArea(section: BeamSection, material: BeamMaterial, momentKnm: number, d: number) {
  const m = beamMaterial(material), b = section.bw, slabMinimumMm2 = .002 * b * section.h;
  const capacity = (area: number) => { const force = area * m.fyd, a = force / (.85 * m.fcd * b); return force * (d - a / 2) / 1e6; };
  if (momentKnm <= 1e-12) return { status: "known_zero_demand" as const, requiredAreaMm2: slabMinimumMm2, slabMinimumMm2 };
  let low = slabMinimumMm2, high = Math.min(.04 * b * d, .02 * b * section.h);
  if (capacity(high) < momentKnm) return { status: "insufficient_section" as const, requiredAreaMm2: null, slabMinimumMm2 };
  if (capacity(low) >= momentKnm) return { status: "solved" as const, requiredAreaMm2: low, slabMinimumMm2 };
  for (let i = 0; i < 70; i++) { const mid = (low + high) / 2; if (capacity(mid) < momentKnm) low = mid; else high = mid; }
  return { status: "solved" as const, requiredAreaMm2: high, slabMinimumMm2 };
}
function effectiveInertia(M: number, section: BeamSection, bars: readonly BeamBar[], material: BeamMaterial) {
  const cracked = crackedBeamSection(section, bars, material, 1);
  const ratio = M === 0 ? 1 : Math.min(1, cracked.McrKnm / Math.abs(M)) ** 3;
  return Math.min(cracked.Ig, ratio * cracked.Ig + (1 - ratio) * cracked.Icr);
}
function serviceResponse(loads: readonly LinearLoad[], runM: number, lengthMm: number, section: BeamSection, bars: readonly BeamBar[], material: BeamMaterial,
  duration: StairDesignInput["service"]["duration"], environment: ServiceEnvironment) {
  const m = beamMaterial(material), action = analyzeSpan(loads, runM), stationCount = Math.min(20000, Math.max(200, Math.ceil(lengthMm / 10)));
  const xs = Array.from({ length: stationCount + 1 }, (_, i) => runM * i / stationCount);
  const moments = xs.map(x => analyzeSpanAt(loads, runM, x));
  const curvature = moments.map(M => M * 1e6 / (m.Ec * effectiveInertia(M, section, bars, material)));
  const h = lengthMm / stationCount, slopes = [0], deflections = [0];
  for (let i = 1; i < xs.length; i++) { slopes[i] = slopes[i - 1] + (curvature[i - 1] + curvature[i]) * h / 2; deflections[i] = deflections[i - 1] + (slopes[i - 1] + slopes[i]) * h / 2; }
  const end = deflections.at(-1)!;
  const relative = deflections.map((v, i) => v - end * i / stationCount);
  const max = Math.max(...relative.map(Math.abs));
  const gamma = { "3months": 1, "6months": 1.2, "12months": 1.4, "5years": 2 }[duration];
  const compressionBars = bars.filter(b => b.face === "top").reduce((sum, b) => sum + barArea(b.diameter), 0);
  const d = Math.max(...bars.filter(b => b.face === "bottom").map(b => b.y));
  const rhoPrime = compressionBars / (section.bw * d), lambda = gamma / (1 + 50 * rhoPrime);
  const crackLimit = { indoor_normal: .4, indoor_humid_or_outdoor_normal: .3, outdoor_humid: .2, aggressive: .1 }[environment];
  const cracked = crackedBeamSection(section, bars, material, 1), n = cracked.n, a = section.h - cracked.d;
  const maxDiameter = Math.max(...cracked.ts.map(b => b.diameter)), equivalentBars = cracked.At / barArea(maxDiameter);
  const effectiveConcreteArea = 2 * a * section.bw / equivalentBars;
  const crackWidths = moments.map((M, i) => {
    const stress = Math.abs(M) <= cracked.McrKnm ? 0 : Math.abs(M) * 1e6 / cracked.Icr * n * Math.max(0, cracked.d - cracked.neutralAxisMm);
    const c = Math.min(...cracked.ts.map(b => section.h - b.y));
    const width = stress === 0 ? 0 : 1.3 * Math.cbrt(effectiveConcreteArea * c) * stress * 1e-5;
    return { xMm: xs[i] * 1000, momentKnm: M, stressMPa: stress, widthMm: width, passed: width <= crackLimit && stress <= m.fyk };
  });
  const liveDemand = Math.max(...moments.map(Math.abs));
  return { method: "piecewise-linear actual gravity load; cracked-section numerical curvature integration", action,
    maximumDeflectionMm: max, discretization: { stations: stationCount + 1, maxStepMm: lengthMm / stationCount },
    cracks: { maximumWidthMm: Math.max(...crackWidths.map(c => c.widthMm)), limitMm: crackLimit, passed: crackWidths.every(c => c.passed), stations: crackWidths },
    gamma, lambda, rhoPrime, liveActionMaxMomentKnm: liveDemand, sourceClauses: ["TS500/2000 13.1–13.5"] };
}
function analyzeSpanAt(loads: readonly LinearLoad[], lengthM: number, x: number) {
  const total = loads.reduce((s, l) => { const v = integrateSegment(l); return { force: s.force + v.force, first: s.first + v.firstMoment }; }, { force: 0, first: 0 });
  const left = total.force - total.first / lengthM;
  const partial = loads.reduce((s, l) => { if (x <= l.x0) return s; const v = integrateSegment(l, l.x0, Math.min(x, l.x1)); return { force: s.force + v.force, first: s.first + v.firstMoment }; }, { force: 0, first: 0 });
  return left * x - (x * partial.force - partial.first);
}
function shearAt(loads: readonly LinearLoad[], lengthM: number, x: number) {
  const total = loads.reduce((s, l) => { const v = integrateSegment(l); return { force: s.force + v.force, first: s.first + v.firstMoment }; }, { force: 0, first: 0 });
  const left = total.force - total.first / lengthM;
  const applied = loads.reduce((sum, l) => sum + (x <= l.x0 ? 0 : integrateSegment(l, l.x0, Math.min(x, l.x1)).force), 0);
  return left - applied;
}

/** Parametric, simply-supported one-way stair strip. This is not a global building or shell solver. */
export function designStair(input: StairDesignInput) {
  const geometry = stairGeometry(input.geometry), byId = new Map(geometry.components.map(c => [c.id, c]));
  if (!input.globalAnalysisStamp?.trim() || !input.service.source?.trim() || !input.ultimateCases.length || input.ultimateCases.length > 128
    || new Set(input.ultimateCases.map(c => c.id)).size !== input.ultimateCases.length || Object.keys(input.loads).length !== byId.size
    || [...byId.keys()].some(id => !input.loads[id])) throw new Error("Yük/analiz/kombinasyon kapsamı eksik veya yinelenmiş.");
  if (!Number.isFinite(input.coverMm) || input.coverMm < 15) throw new Error("TS500/2000 tek doğrultulu döşeme net örtüsü en az 15 mm olmalı.");
  if (!Number.isFinite(input.service.sustainedLiveFactor) || input.service.sustainedLiveFactor < 0 || input.service.sustainedLiveFactor > 1) throw new Error("Sürekli hareketli yük katılımı 0–1 aralığında açıkça girilmelidir.");
  const material = beamMaterial(input.material), checks: ReturnType<typeof control>[] = [], outputs = [];
  for (const [id, geo] of byId) {
    const source = input.loads[id];
    if (!source.source?.trim() || ![source.finishKnM2, source.otherDeadKnM2, source.liveKnM2].every(Number.isFinite)
      || source.finishKnM2 < 0 || source.otherDeadKnM2 < 0 || source.liveKnM2 < 0
      || !["projected", "inclined"].includes(source.finishBasis) || !["projected", "inclined"].includes(source.liveBasis)) throw new Error(`${id}: G/Q yükleri ve yük alanı temeli açık olmalı.`);
    const widthM = geo.widthMm / 1000, spanM = geo.spanMm / 1000, projectionM = geo.horizontalProjectionMm / 1000, cos = projectionM / spanM;
    const finishProjected = source.finishBasis === "projected" ? source.finishKnM2 : source.finishKnM2 / cos;
    const liveProjected = source.liveBasis === "projected" ? source.liveKnM2 : source.liveKnM2 / cos;
    const waistLineKnM = (geo.waistSelfWeightKn + geo.landingSelfWeightKn) / projectionM;
    const gUniformLineKnM = waistLineKnM + (finishProjected + source.otherDeadKnM2) * widthM;
    const qUniformLineKnM = liveProjected * widthM;
    const baseLoads = (deadFactor: number, liveFactor: number): LinearLoad[] => {
      const list: LinearLoad[] = [{ x0: 0, x1: projectionM, q0: deadFactor * gUniformLineKnM + liveFactor * qUniformLineKnM,
        q1: deadFactor * gUniformLineKnM + liveFactor * qUniformLineKnM, kind: "uniform" }];
      if (geo.kind === "flight" && geo.stepVolumeM3 > 0) {
        const flight = input.geometry.components.find(c => c.id === id);
        if (!flight || flight.kind !== "flight") throw new Error("Uçuş geometrisi eksik.");
        const peak = flight.concreteUnitWeightKnM3 * widthM * flight.riserMm / 1000 * deadFactor;
        for (let i = 0; i < flight.treadCount; i++) list.push({ x0: i * flight.treadMm / 1000, x1: (i + 1) * flight.treadMm / 1000, q0: peak, q1: 0, kind: "step" });
      }
      return list;
    };
    const section: BeamSection = { bw: 1000, h: geo.thicknessMm, bf: 1000, hf: 0 };
    const bottomBars = barsAcrossWidth(1000, geo.thicknessMm, input.coverMm, input.mainBottom.diameterMm, input.mainBottom.spacingMm, "bottom", `${id}:bottom`);
    const topBars = barsAcrossWidth(1000, geo.thicknessMm, input.coverMm, input.mainTop.diameterMm, input.mainTop.spacingMm, "top", `${id}:top`);
    const bars = [...bottomBars, ...topBars], bottomAreaPerM = bottomBars.reduce((s, b) => s + barArea(b.diameter), 0);
    const topAreaPerM = topBars.reduce((s, b) => s + barArea(b.diameter), 0), dBottom = Math.max(...bottomBars.map(b => b.y));
    const thicknessMinimumMm = Math.max(80, geo.horizontalProjectionMm / 25), mainSpacingLimit = Math.min(1.5 * geo.thicknessMm, 200);
    const mainMinArea = .002 * 1000 * geo.thicknessMm;
    const distributionAreaPerM = barArea(input.distribution.diameterMm) * 1000 / input.distribution.spacingMm;
    const distributionRequiredPerM = Math.max(mainMinArea / 5, Math.max(bottomAreaPerM, topAreaPerM) / 5);
    const addCheck = (key: string, clause: string, pass: boolean, observed: unknown, limit: unknown, explanation: string, evidence: string[]) =>
      checks.push(control(`${id}:${key}`, clause, pass ? "pass" : "fail", observed, limit, explanation, evidence));
    addCheck("thickness", "TS500/2000 11.2.2", geo.thicknessMm >= thicknessMinimumMm, geo.thicknessMm, { minimumMm: thicknessMinimumMm },
      "Basit mesnetli tek doğrultulu plak kalınlığı; uçuşta yatay izdüşüm açıklığı kullanıldı.", [geo.source]);
    addCheck("cover", "TS500/2000 11.2.2", input.coverMm >= 15, input.coverMm, { minimumMm: 15 }, "Tek doğrultulu plak net örtüsü.", [geo.source]);
    addCheck("main-spacing", "TS500/2000 11.2.3", input.mainBottom.spacingMm <= mainSpacingLimit && input.mainTop.spacingMm <= mainSpacingLimit,
      { bottomMm: input.mainBottom.spacingMm, topMm: input.mainTop.spacingMm }, { maximumMm: mainSpacingLimit }, "Asal donatı aralığı min(1.5h, 200 mm).", [geo.source]);
    addCheck("main-minimum", "TS500/2000 11.2.3", bottomAreaPerM >= mainMinArea && topAreaPerM >= mainMinArea,
      { bottomMm2PerM: bottomAreaPerM, topMm2PerM: topAreaPerM }, { minimumMm2PerM: mainMinArea, ratio: .002 }, "S420/S500 tek doğrultulu plak asal donatısı minimumu.", [geo.source]);
    addCheck("distribution", "TS500/2000 11.2.3", input.distribution.spacingMm <= 300 && distributionAreaPerM >= distributionRequiredPerM,
      { areaMm2PerM: distributionAreaPerM, spacingMm: input.distribution.spacingMm }, { minimumMm2PerM: distributionRequiredPerM, maximumSpacingMm: 300 },
      "Dağıtma donatısı asal alanın en az beşte biri; aralık en çok 300 mm.", [geo.source]);
    const anchors = ([['bottom-left', input.mainBottom.anchorageLeftMm], ['bottom-right', input.mainBottom.anchorageRightMm],
      ['top-left', input.mainTop.anchorageLeftMm], ['top-right', input.mainTop.anchorageRightMm]] as const).map(([end, availableMm]) => {
      const isTop = end.startsWith("top"), layout = isTop ? input.mainTop : input.mainBottom, lb = anchorageLength(layout.diameterMm, input.material, "II", input.coverMm,
        Math.max(0, layout.spacingMm - layout.diameterMm)).lb, requiredMm = Math.max(150, lb);
      return { end, availableMm, requiredMm, passed: Number.isFinite(availableMm) && availableMm >= requiredMm, sourceClause: "TS500/2000 9.1.2 + 11.2.1" };
    });
    addCheck("anchorage", "TS500/2000 9.1.2/11.2.1", anchors.every(a => a.passed), anchors, { minimumProjectionFromSupportFaceMm: 150 },
      "Her iki yöndeki asal çubukların mesnet yüzünden sonraki gerçek kenetlenme izdüşümü.", [geo.source]);

    const ultimate = input.ultimateCases.map(c => {
      if (![c.deadFactor, c.liveFactor].every(Number.isFinite) || c.deadFactor < 0 || c.liveFactor < 0 || !c.source.trim()) throw new Error(`${id}: yük birleşimi katsayısı/kaynağı geçersiz.`);
      const loads = baseLoads(c.deadFactor, c.liveFactor), response = analyzeSpan(loads, projectionM);
      return { id: c.id, source: c.source, deadFactor: c.deadFactor, liveFactor: c.liveFactor, response, loads };
    });
    const controlling = ultimate.reduce((a, b) => a.response.maxAbsMomentKnm >= b.response.maxAbsMomentKnm ? a : b);
    const demandKnmPerM = controlling.response.maxAbsMomentKnm / widthM;
    const required = requiredFlexuralArea(section, input.material, demandKnmPerM, dBottom);
    const interactionChecks = ultimate.flatMap(u => u.response.samples.map(sample => {
      const MknmPerM = sample.Mknm / widthM, NcompressionKnPerM = sample.Vkn * Math.sin(geo.slopeRad) / widthM;
      const sign = MknmPerM < 0 ? -1 as const : 1 as const;
      const capacity = beamCapacity(section, bars, input.material, sign, NcompressionKnPerM);
      return { combinationId: u.id, xM: sample.xM, MknmPerM, NcompressionKnPerM,
        capacityKnmPerM: capacity.status === "solved" ? capacity.capacityKnm : null, capacityStatus: capacity.status,
        materialAndSectionLimitsPassed: capacity.status === "solved" && capacity.strainLimitSatisfied && capacity.maximumSatisfied,
        passed: capacity.status === "solved" && capacity.capacityKnm >= Math.abs(MknmPerM) && capacity.strainLimitSatisfied && capacity.maximumSatisfied };
    }));
    const worstStation = interactionChecks.reduce((worst, item) => !worst || !item.passed || item.MknmPerM > worst.MknmPerM ? item : worst,
      null as typeof interactionChecks[number] | null);
    const axialEnvelope = { maxCompressionKnPerM: Math.max(0, ...interactionChecks.map(c => c.NcompressionKnPerM)),
      maxTensionKnPerM: Math.max(0, ...interactionChecks.map(c => -c.NcompressionKnPerM)) };
    const flexurePassed = interactionChecks.every(c => c.passed) && bottomAreaPerM >= (required.requiredAreaMm2 ?? Infinity);
    addCheck("flexure", "TS500/2000 7.1/11.2.3", flexurePassed,
      { demandKnmPerM, totalComponentMomentKnm: controlling.response.maxAbsMomentKnm, worstStation,
        requiredMainSteelMm2PerM: required.requiredAreaMm2, selectedMainSteelMm2PerM: bottomAreaPerM,
        combinationIds: ultimate.map(c => c.id), checkedAxialMomentStations: interactionChecks.length, axialEnvelope },
      { method: "actual gravity load diagram and signed incline N-M at all response stations, one-way 1m strip" },
      "All supplied ULS combinations and action stations include signed inclination axial force and section limits; tread wedges are triangular.", [geo.source, ...input.ultimateCases.map(c => c.source)]);

    const supportInputs = input.geometry.components.find(c => c.id === id)!.supports;
    const shearStations = ultimate.flatMap(u => supportInputs.map((support, index) => {
      const bearingFaceDistanceMm = support.bearingWidthMm / 2;
      const xM = index === 0 ? (bearingFaceDistanceMm + dBottom * cos) / 1000
        : projectionM - (bearingFaceDistanceMm + dBottom * cos) / 1000;
      if (!(xM > 0 && xM < projectionM)) throw new Error(`${id}: mesnet yüzünden d uzaklıktaki kesit açıklık dışında.`);
      const verticalShearKnPerM = shearAt(u.loads, projectionM, xM) / widthM;
      const NcompressionKnPerM = verticalShearKnPerM * Math.sin(geo.slopeRad);
      const normalShearKnPerM = Math.abs(verticalShearKnPerM * Math.cos(geo.slopeRad));
      const gamma = NcompressionKnPerM >= 0 ? .07 : -.3;
      const axialFactor = 1 + gamma * Math.abs(NcompressionKnPerM) * 1000 / (1000 * geo.thicknessMm);
      const fctd = material.fctk / 1.5;
      const VcrKnPerM = .65 * fctd * 1000 * dBottom * axialFactor / 1000;
      const VcKnPerM = .8 * VcrKnPerM;
      return { combinationId: u.id, supportId: support.id, xMmAlongProjection: xM * 1000, normalShearKnPerM,
        NcompressionKnPerM, VcrKnPerM, VcKnPerM, passed: axialFactor > 0 && normalShearKnPerM <= VcKnPerM };
    }));
    addCheck("one-way-shear", "TS500/2000 8.1.2–8.1.4", shearStations.every(s => s.passed), shearStations,
      { section: "support face + d", resistance: "Vc=0.8Vcr; no transverse shear reinforcement credited" },
      "All ULS cases at both supports use actual inclined load reactions, local shear and axial force; slabs exceeding concrete-only resistance are not auto-designed.", [geo.source, ...input.ultimateCases.map(c => c.source)]);
    const perMetre = (loads: LinearLoad[]) => loads.map(l => ({ ...l, q0: l.q0 / widthM, q1: l.q1 / widthM }));
    const totalLoads = perMetre(baseLoads(1, 1)), sustainedLoads = perMetre(baseLoads(1, input.service.sustainedLiveFactor)), liveLoads = perMetre(baseLoads(0, 1));
    const service = serviceResponse(totalLoads, projectionM, geo.spanMm, section, bars, input.material, input.service.duration, input.service.environment);
    const sustained = serviceResponse(sustainedLoads, projectionM, geo.spanMm, section, bars, input.material, input.service.duration, input.service.environment);
    const live = serviceResponse(liveLoads, projectionM, geo.spanMm, section, bars, input.material, input.service.duration, input.service.environment);
    const gamma = { "3months": 1, "6months": 1.2, "12months": 1.4, "5years": 2 }[input.service.duration];
    const topArea = topBars.reduce((s, b) => s + barArea(b.diameter), 0), rhoPrime = topArea / (1000 * dBottom), lambda = gamma / (1 + 50 * rhoPrime);
    const longTermDeflectionMm = service.maximumDeflectionMm + lambda * sustained.maximumDeflectionMm;
    const demandDeflectionMm = input.service.partition.startsWith("none") ? live.maximumDeflectionMm : longTermDeflectionMm;
    const deflectionLimitMm = geo.spanMm / { none_floor: 360, none_roof: 180, sensitive: 480, insensitive: 240 }[input.service.partition];
    const serviceability = { method: service.method, instantTotalMm: service.maximumDeflectionMm, sustainedMm: sustained.maximumDeflectionMm,
      liveMm: live.maximumDeflectionMm, lambda, rhoPrime, longTermDeflectionMm,
      deflection: { demandMm: demandDeflectionMm, limitMm: deflectionLimitMm, passed: demandDeflectionMm <= deflectionLimitMm },
      cracks: service.cracks, sourceClauses: service.sourceClauses };
    const servicePassed = serviceability.deflection.passed && serviceability.cracks.passed;
    addCheck("serviceability", "TS500/2000 13.1–13.5", servicePassed, { total: service, sustained, live },
      { method: "cracked-section curvature integration from exact load diagram", relativeToSupportChord: true }, "Sehim ve çatlak genişliği; parçalı doğrusal gerçek G/Q dağılımıyla, basit mesnetli şerit.", [input.service.source]);
    checks.push(control(`${id}:service-axial`, "TS500/2000 13.1", Math.abs(geo.slopeRad) < 1e-12 ? "pass" : "requires_engineering",
      { slopeDeg: geo.slopeDeg, axialEffect: Math.abs(geo.slopeRad) < 1e-12 ? "zero" : "not included in cracked-section service analysis" },
      { inclinedFlight: "requires engineering review" }, "Eğimli uçuşta servis rijitliği/ikinci mertebe hesabı eksenel etkiyi içermiyor; mühendis incelemesi gerekir.", [input.service.source]));

    const deadAction = analyzeSpan(baseLoads(1, 0), projectionM), liveAction = analyzeSpan(baseLoads(0, 1), projectionM);
    const reactions = geo.supportIds.map((supportId, i) => ({ supportId, floorId: geo.supportFloors[i], deadKn: deadAction.reactionsKn[i], liveKn: liveAction.reactionsKn[i],
      totalServiceKn: deadAction.reactionsKn[i] + liveAction.reactionsKn[i], ultimateKnByCombination: ultimate.map(u => ({ id: u.id,
        reactionKn: analyzeSpan(u.loads, projectionM).reactionsKn[i] })) }));
    outputs.push({ id, kind: geo.kind, floorId: geo.floorId, startFloorId: geo.startFloorId, endFloorId: geo.endFloorId, supportIds: geo.supportIds,
      dimensions: { widthMm: geo.widthMm, waistMm: geo.thicknessMm, spanMm: geo.spanMm, horizontalProjectionMm: geo.horizontalProjectionMm, slopeDeg: geo.slopeDeg },
      loads: { waistSelfWeightKn: geo.waistSelfWeightKn, stepSelfWeightKn: geo.stepSelfWeightKn, landingSelfWeightKn: geo.landingSelfWeightKn,
        finishProjectedKnM2: finishProjected, otherDeadKnM2: source.otherDeadKnM2, liveProjectedKnM2: liveProjected,
        lineLoadModels: { waistFinishOtherDead: "uniform per horizontal projection", stepConcrete: "piecewise linear triangular wedge per tread", live: "uniform per declared area basis" } },
      design: { controllingCombination: controlling.id, demandKnmPerM,
        requiredMainSteelMm2PerM: required.requiredAreaMm2, selectedBottomSteelMm2PerM: bottomAreaPerM, selectedTopSteelMm2PerM: topAreaPerM,
        distributionSteelMm2PerM: distributionAreaPerM, axialMomentStationsChecked: interactionChecks.length, anchors,
        service: { total: serviceability, sustainedMaximumDeflectionMm: sustained.maximumDeflectionMm, liveMaximumDeflectionMm: live.maximumDeflectionMm }, sourceClauses: ["TS500/2000 7.1", "9.1.2", "11.2.1–11.2.3", "13.1–13.5"] }, reactions });
  }
  const snapshot = input.globalAnalysisSnapshot, globalAnalysis = snapshot && snapshot.modelRevision === geometry.modelRevision && snapshot.stiffnessSet === geometry.stiffnessSet
    && snapshot.geometryRevision === geometry.geometryRevision && snapshot.geometryFingerprint === geometry.geometryFingerprint
    && snapshot.analysisStamp === input.globalAnalysisStamp
    ? { status: "current" as const, invalidated: false } : { status: "rebuild_required" as const, invalidated: true };
  const supportTotals = new Map<string, { supportId: string; floorId: string; deadKn: number; liveKn: number; serviceKn: number; ultimateKnByCombination: Record<string, number> }>();
  for (const component of outputs) for (const r of component.reactions) {
    const value = supportTotals.get(r.supportId) ?? { supportId: r.supportId, floorId: r.floorId, deadKn: 0, liveKn: 0, serviceKn: 0, ultimateKnByCombination: Object.create(null) };
    if (value.floorId !== r.floorId) throw new Error(`Mesnet ${r.supportId} birden çok kata eşlenmiş.`);
    value.deadKn += r.deadKn; value.liveKn += r.liveKn; value.serviceKn += r.totalServiceKn;
    for (const u of r.ultimateKnByCombination) value.ultimateKnByCombination[u.id] = (value.ultimateKnByCombination[u.id] ?? 0) + u.reactionKn;
    supportTotals.set(r.supportId, value);
  }
  const allIds = input.ultimateCases.map(c => c.id);
  if ([...supportTotals.values()].some(r => Object.keys(r.ultimateKnByCombination).length !== allIds.length)) throw new Error("Mesnet reaksiyonunda bir veya daha fazla birleşim eksik.");
  const forceTotal = [...supportTotals.values()].reduce((sum, r) => sum + r.serviceKn, 0);
  const appliedTotal = outputs.reduce((sum, o) => sum + o.loads.waistSelfWeightKn + o.loads.stepSelfWeightKn + o.loads.landingSelfWeightKn
    + (o.loads.finishProjectedKnM2 + o.loads.otherDeadKnM2 + o.loads.liveProjectedKnM2) * (byId.get(o.id)!.widthMm / 1000) * (byId.get(o.id)!.horizontalProjectionMm / 1000), 0);
  const equilibriumResidualKn = forceTotal - appliedTotal;
  if (Math.abs(equilibriumResidualKn) > 1e-7 * Math.max(1, appliedTotal)) throw new Error("Merdiven ailesi yük/mesnet düşey dengesi sağlanmıyor.");
  const passed = checks.every(c => c.status === "pass");
  return { schemaVersion: 1 as const, physicalFamilyId: geometry.physicalFamilyId, modelRevision: geometry.modelRevision, stiffnessSet: geometry.stiffnessSet,
    geometryRevision: geometry.geometryRevision, analysisStamp: input.globalAnalysisStamp, globalAnalysis,
    status: passed && globalAnalysis.status === "current" ? "local_review_ready" as const : globalAnalysis.status === "rebuild_required" ? "rebuild_required" as const : "requires_review" as const,
    engineeringAcceptance: false as const, analysisApproved: false as const, components: outputs, physicalComponentCount: outputs.length,
    nativeRepresentationIds: geometry.nativeRepresentationIds, nativeRecordCount: geometry.nativeRecordCount, supportReactions: [...supportTotals.values()],
    equilibrium: { appliedKn: appliedTotal, supportVerticalKn: forceTotal, residualKn: equilibriumResidualKn }, checks,
    scope: { method: "simply supported one-way 1m stair/landing strips", globalSolverCoupled: false,
      unsupported: ["continuous flight/landing frame action and monolithic joint stiffness", "two-way plate/shell load sharing", "TBDY seismic stair interaction", "global analysis integration", "temperature/shrinkage restraint", "fabrication cut list"] } };
}
