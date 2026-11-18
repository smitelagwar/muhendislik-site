import type { StructuralProject, Value } from "./project-schema";
import type { Foundation } from "./structural-system";

export type FoundationRole = "footing" | "strip_footing" | "raft";
export type FoundationLimitBasis = "qt_design_resistance" | "allowable_stress" | "unknown";
export type FoundationCombination = { id: string; seismic: boolean; limitState: "ultimate" | "service" };
export type FoundationEffectiveSettings = {
  role: FoundationRole;
  interaction: boolean;
  soilMethod: "winkler";
  ksKnm3: number | null;
  limitBasis: FoundationLimitBasis;
  bearingLimitKpa: number | null;
  criterion: "average" | "maximum";
  combinationIncluded: boolean;
  connection: "straight" | "enlarged";
  enlargementRatio: number | null;
  thicknessFactor: number | null;
  contact: "compression_only";
  effective: string[];
  ignored: string[];
  blockers: string[];
  reviewRequired: string[];
  criterionApplicability: "unknown";
};

const read = (settings: StructuralProject["settings"], key: keyof StructuralProject["settings"]) => settings[key] as Value;
const numberValue = (settings: StructuralProject["settings"], key: keyof StructuralProject["settings"]): number | null => {
  const value = read(settings, key).value;
  return typeof value === "number" ? value : null;
};
const stringValue = (settings: StructuralProject["settings"], key: keyof StructuralProject["settings"]): string | null => {
  const value = read(settings, key).value;
  return typeof value === "string" ? value : null;
};

/** Selects the role-specific controls and explicitly identifies controls with no implementation. */
export function resolveFoundationSettings(project: StructuralProject, role: FoundationRole, combination: FoundationCombination,
  selectedLimitBasis: FoundationLimitBasis = "unknown"): FoundationEffectiveSettings {
  const s = project.settings;
  const isRaft = role === "raft";
  const criterionRecord = read(s, isRaft ? "raftCriterion" : "foundationCriterion");
  const criterion = (stringValue(s, isRaft ? "raftCriterion" : "foundationCriterion") ?? "maximum") as "average" | "maximum";
  const seismicChoice = stringValue(s, isRaft ? "raftEarthquake" : "foundationEarthquake");
  const qt = numberValue(s, "qt"), allowable = numberValue(s, "allowablePressure");
  const basis: FoundationLimitBasis = qt !== null && allowable !== null ? selectedLimitBasis
    : qt !== null ? "qt_design_resistance" : allowable !== null ? "allowable_stress" : "unknown";
  const limit = basis === "qt_design_resistance" ? numberValue(s, "qt") : basis === "allowable_stress" ? numberValue(s, "allowablePressure") : null;
  const interactionRecord = read(s, "interaction");
  const interaction = stringValue(s, "interaction") === "enabled";
  const method = stringValue(s, "soilMethod");
  const coupledRequested = method === "coupled_winkler";
  const effective = ["role-specific bearing criterion", "signed compression-only contact", "selected seismic-combination policy"];
  const ignored: string[] = [];
  const blockers: string[] = [], reviewRequired: string[] = [];
  if (criterionRecord.value === null) reviewRequired.push("Temel basınç kriteri (ortalama/maksimum) bilinmiyor; taşıma karşılaştırması kapalı.");
  if (criterionRecord.value === "average") reviewRequired.push("Ortalama kriterinin seçilen geoteknik limit durumu için normatif uygulanabilirliği doğrulanmadı.");
  if (interactionRecord.value === null) blockers.push("Temel-üst yapı etkileşimi seçimi bilinmiyor.");
  if (stringValue(s, "connection") === null) blockers.push("Düz/büyütülmüş temel bağlantı tercihi bilinmiyor.");
  if (numberValue(s, "thicknessFactor") === null) blockers.push("Temel kalınlık çarpanı bilinmiyor; sıfır veya varsayılan kabul edilmez.");
  if (seismicChoice === null) blockers.push("Temel deprem kombinasyonu tercihi bilinmiyor.");
  if (seismicChoice === "exclude" && combination.seismic) ignored.push(`combination ${combination.id}: explicitly excluded by ${isRaft ? "raftEarthquake" : "foundationEarthquake"}`);
  if (seismicChoice === "include" && !combination.seismic) ignored.push(`combination ${combination.id}: nonseismic combination is not filtered by seismic inclusion`);
  if (coupledRequested) blockers.push("Çoklu Eşlenik Winkler etkinleştirilmemiştir; bu yöntemle analiz reddedilir.");
  if (basis === "unknown") reviewRequired.push("qt tasarım dayanımı veya izin verilebilir gerilme açıkça seçilmelidir; taşıma karşılaştırması kapalı.");
  if (basis === "qt_design_resistance" && combination.limitState !== "ultimate") reviewRequired.push("qt tasarım dayanımı için limit durum eşlemesi bu kaynak setinde doğrulanmadı.");
  if (basis === "allowable_stress" && combination.limitState !== "service") reviewRequired.push("İzin verilebilir gerilme için limit durum eşlemesi bu kaynak setinde doğrulanmadı.");
  if (read(s, isRaft ? "raftNegativeContact" : "foundationNegativeContact").value !== "check") reviewRequired.push("Negatif temas kontrolü kullanıcı ayarlarında bilinmiyor; eksik temas değerlendirmesi PASS olamaz.");
  if (numberValue(s, "subgrade") === null) blockers.push("Winkler zemin teması için ks değeri gereklidir; üst yapı etkileşimi kapalı olsa da zemin yayları kalır.");
  if (read(s, "connection").value === "enlarged") effective.push("enlarged column/wall load footprint (must be applied by foundation mesh adapter)");
  if (numberValue(s, "thicknessFactor") !== null) effective.push("foundation local thickness factor (must be applied by mesh adapter)");
  return {
    role, interaction, soilMethod: "winkler", ksKnm3: numberValue(s, "subgrade"), limitBasis: basis,
    bearingLimitKpa: limit, criterion, combinationIncluded: !(seismicChoice === "exclude" && combination.seismic),
    connection: (stringValue(s, "connection") ?? "straight") as "straight" | "enlarged",
    enlargementRatio: numberValue(s, "enlargementRatio"), thicknessFactor: numberValue(s, "thicknessFactor"),
    contact: "compression_only", effective, ignored, blockers, reviewRequired, criterionApplicability: "unknown",
  };
}

export type SignedFootingDemand = {
  /** Compression is positive; tension/uplift is negative. Never pass abs(N). */
  compressionKn: number;
  /** Signed moment resultants about footing centroid, kN·m. */
  momentXKnm: number;
  momentYKnm: number;
};
export type RectangularFoundation = { id: string; role: "footing" | "strip_footing"; widthM: number; lengthM: number; centerX: number; centerY: number };

export function evaluateRigidRectangularBearing(input: {
  footing: RectangularFoundation;
  demand: SignedFootingDemand;
  selfWeightKn: number;
  selfWeightSource: string;
  overburdenKn: number;
  overburdenSource: string;
  limitKpa: number | null;
  limitBasis: FoundationLimitBasis;
  criterion: "average" | "maximum";
  criterionApplicability: "unknown" | "applicable" | "not_applicable";
}): {
  areaM2: number; qminKpa: number; qaverageKpa: number; qmaxKpa: number;
  checkedKpa: number | null; limitKpa: number | null; ratio: number | null;
  controllingPointM: [number, number] | null; status: "ok" | "uplift" | "bearing_exceeded" | "unknown_limit";
  assumptions: string[];
} {
  const { footing, demand } = input;
  if (![footing.widthM, footing.lengthM, footing.centerX, footing.centerY, demand.compressionKn, demand.momentXKnm, demand.momentYKnm,
    input.selfWeightKn, input.overburdenKn].every(Number.isFinite) || footing.widthM <= 0 || footing.lengthM <= 0
    || !input.selfWeightSource.trim() || !input.overburdenSource.trim()) throw new Error("Temel boyutları ve imzalı tesirler sonlu, pozitif boyutlu olmalı; öz ağırlık ve örtü yükü açıkça kaynaklanmalıdır.");
  if (input.limitKpa !== null && (!Number.isFinite(input.limitKpa) || input.limitKpa <= 0)) throw new Error("Taşıma limiti pozitif ve sonlu olmalıdır.");
  const area = footing.widthM * footing.lengthM;
  const total = demand.compressionKn + input.selfWeightKn + input.overburdenKn;
  const qavg = total / area;
  // q = N/A ± Mx/(B L²/6) ± My/(L B²/6); signed values retain uplift.
  const dx = 6 * demand.momentYKnm / (footing.lengthM * footing.widthM ** 2);
  const dy = 6 * demand.momentXKnm / (footing.widthM * footing.lengthM ** 2);
  const extreme = [qavg - dx - dy, qavg - dx + dy, qavg + dx - dy, qavg + dx + dy];
  const qmin = Math.min(...extreme), qmax = Math.max(...extreme);
  const corners: [number, number][] = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const maxIndex = extreme.indexOf(qmax);
  const checked = input.criterion === "average" ? qavg : qmax;
  const ratio = input.limitKpa !== null && input.limitKpa > 0 ? checked / input.limitKpa : null;
  const status = qmin < -1e-9 ? "uplift" : input.limitKpa === null || input.limitBasis === "unknown" || input.criterionApplicability !== "applicable" ? "unknown_limit"
    : ratio! > 1 ? "bearing_exceeded" : "ok";
  return { areaM2: area, qminKpa: qmin, qaverageKpa: qavg, qmaxKpa: qmax, checkedKpa: checked,
    limitKpa: input.limitKpa, ratio, controllingPointM: [footing.centerX + corners[maxIndex][0] * footing.widthM / 2,
      footing.centerY + corners[maxIndex][1] * footing.lengthM / 2], status,
    assumptions: ["Rigid rectangular linear pressure distribution only.", "Pressure values include signed column resultant plus explicitly supplied foundation self-weight and overburden.",
      "No soil capacity factor or seismic multiplier is inferred.", "Uplift remains visible; this function does not solve partial contact.",
      `Self-weight source: ${input.selfWeightSource}`, `Overburden source: ${input.overburdenSource}`] };
}

export function winklerFoundation(input: { shellIds: readonly string[]; settings: FoundationEffectiveSettings; maxIterations?: number }): Foundation | null {
  if (input.settings.blockers.some(b => b.includes("Çoklu Eşlenik Winkler"))) throw new Error("coupled_winkler is not implemented and cannot be enabled.");
  if (!input.shellIds.length || !input.settings.ksKnm3 || input.settings.ksKnm3 <= 0) throw new Error("Etkileşimli temel için mevcut radye kabukları ve pozitif ks gereklidir.");
  return { shellIds: [...input.shellIds], ks: input.settings.ksKnm3, compressionSign: -1, mode: "compression_only", maxIterations: input.maxIterations ?? 64 };
}
