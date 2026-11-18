import type { CadModel } from "../model";
import {emptyEngineeringReviews,validateEngineeringReviews,type EngineeringReviews} from "./global-control-types";

export type Source = "unknown" | "user_input" | "native_decoded" | "reference_document_input" | "computed" | "derived";
export type Value = { value: number | string | boolean | null; source: Source; evidence: string | null };
export const numericFields = {
  sds: ["SDS", "g", 0, null], sd1: ["SD1", "g", 0, null],
  r: ["Girilen R", "boyutsuz", 0, null], importance: ["Önem katsayısı I", "boyutsuz", 0, null],
  liveLoadParticipation: ["Kütleye hareketli yük katılımı", "oran", 0, 1], driftLimit: ["Öteleme kontrol limiti (kullanıcı)", "oran", 0, 1],
  dryUnitWeight: ["Kuru zemin birim ağırlığı", "kN/m³", 0, null], saturatedUnitWeight: ["Doygun zemin birim ağırlığı", "kN/m³", 0, null],
  subgrade: ["Yatak katsayısı ks", "kN/m³", 0, null], qt: ["Taşıma gücü tasarım dayanımı qt", "kPa", 0, null],
  allowablePressure: ["İzin verilebilir gerilme (qt değildir)", "kPa", 0, null],
  enlargementRatio: ["Bağlantı bölgesi büyütme oranı", "h", 0, null], thicknessFactor: ["Kolon/perde altı kalınlık çarpanı", "boyutsuz", 0, null],
} as const;
export const choices = {
  concreteGrade: ["C25", "C30", "C35", "C40"], rebarGrade: ["B420C", "B500C"],
  soilClass: ["ZA", "ZB", "ZC", "ZD", "ZE", "ZF"], soilBehavior: ["cohesive", "cohesionless"],
  foundationCriterion: ["average", "maximum"], raftCriterion: ["average", "maximum"],
  foundationEarthquake: ["include", "exclude"], raftEarthquake: ["include", "exclude"],
  foundationNegativeContact: ["check", "unknown"], raftNegativeContact: ["check", "unknown"],
  interaction: ["enabled", "disabled"], connection: ["straight", "enlarged"],
  soilMethod: ["winkler", "coupled_winkler"], designMode: ["existing_reinforcement", "redesign"],
  solverMethod: ["verified_3d_required"],
} as const;
export type SettingKey = keyof typeof numericFields | keyof typeof choices;
export type PhysicalRole = "unknown" | "column" | "structural_wall" | "infill_wall" | "beam" | "coupling_beam" | "band_beam" | "slab" | "raft" | "footing" | "stair_flight" | "landing" | "excluded";
type XYZ = { x: number; y: number; z: number };
type Six<T> = [T, T, T, T, T, T];
export type StructuralConnections = { startJointId: string | null; endJointId: string | null;
  startReleases: Six<boolean> | null; endReleases: Six<boolean> | null; eccentricityM: XYZ | null };
export type StructuralSupport = { jointId: string; restrained: Six<boolean>; stiffness: Six<number | null> | null };
export type ReinforcementLayout = { mode: "existing" | "designed"; source: Source;
  bars: { id: string; diameterMm: number; quantity: number; steelMaterialId: string;
    centerLineM: XYZ[]; hookStart: string | null; hookEnd: string | null }[] };
export type DesignConstraints = { minBarDiameterMm: number | null; maxBarDiameterMm: number | null;
  maxSpacingM: number | null; lockedReinforcement: boolean | null };
export type PhysicalObject = {
  elementId: string; nativeId: string | null; floorId: string; role: PhysicalRole; source: Source;
  materialId: string | null; diaphragmId: string | null;
  localAxis: number | null; coverM: number | null;
  openingsM: XYZ[][] | null; sectionPolygonM: XYZ[] | null;
  connections: StructuralConnections | null; supports: StructuralSupport[] | null;
  reinforcement: ReinforcementLayout | null; designConstraints: DesignConstraints | null;
};
export type StructuralMaterial = {
  materialId: string; source: Source;
  properties: null | { fckMPa: number | null; elasticModulusMPa: number | null; fykMPa: number | null;
    densityKgM3: number | null; poisson: number | null };
};
export type StructuralLoad = {
  id: string; kind: "dead" | "live" | "wind" | "snow" | "seismic" | "temperature";
  source: Source; evidence: string | null; elementIds: string[];
  coordinateSystem: "global" | "local";
  distribution: "point" | "line" | "area" | "body";
  unit: "kN" | "kN/m" | "kN/m2" | "kN/m3" | "C";
  components: [number, number, number];
  selfWeightIncluded: boolean | null; massParticipation: number | null;
  applicationRegion: { start: number; end: number } | null;
};
export type StructuralProject = {
  schemaVersion: 1; projectId: string; revision: number;
  settings: Record<SettingKey, Value>;
  coefficients: { r: { entered: number | null; recommended: number | null; used: number | null; reason: string | null } };
  objects: PhysicalObject[];
  // These records remain unknown until physical/native semantics are established.
  materials: StructuralMaterial[];
  loads: StructuralLoad[] | null;
  floorRoles: { floorId: string; role: "unknown" | "basement" | "superstructure" | "foundation" | "roof"; diaphragmId: string | null; source: Source }[] | null;
  importCoverage: null | { mappedIds: string[]; referenceIds: string[]; unsupportedRequiredFields: string[] };
  legacyArchive: unknown;
  engineeringReviews?: EngineeringReviews;
};
const keys = [...Object.keys(numericFields), ...Object.keys(choices)] as SettingKey[];
export function emptySettings(): StructuralProject["settings"] {
  return Object.fromEntries(keys.map(k => [k, { value: null, source: "unknown", evidence: null }])) as StructuralProject["settings"];
}
export function createStructuralProject(model: CadModel, projectId: string): StructuralProject {
  if (!projectId.trim()) throw new Error("Proje kimliği gereklidir.");
  return { schemaVersion: 1, projectId, revision: 0, settings: emptySettings(),
    coefficients: { r: { entered: null, recommended: null, used: null, reason: null } },
    objects: model.elements.map(e => ({ elementId: e.id, nativeId: null, floorId: e.floorId,
      role: e.type === "axis" || e.type === "slabEdge" ? "excluded" : "unknown", source: "unknown",
      materialId: null, diaphragmId: null, localAxis: null, coverM: null,
      openingsM: null, sectionPolygonM: null,
      connections: null, supports: null, reinforcement: null, designConstraints: null })),
    materials: model.materials.map(m => ({ materialId: m.id, properties: null, source: "unknown" })),
    loads: null, floorRoles: null, importCoverage: null, legacyArchive: null, engineeringReviews:emptyEngineeringReviews() };
}
export function validateSettings(settings: StructuralProject["settings"]): void {
  for (const k of keys) {
    const record = settings[k];
    if (!record || !["unknown", "user_input", "native_decoded", "reference_document_input", "computed", "derived"].includes(record.source)
      || !(record.evidence === null || typeof record.evidence === "string")) throw new Error(`${k}: kaynak kaydı geçersiz.`);
    const v = record.value;
    if (v === null) { if (record.source !== "unknown") throw new Error(`${k}: boş girdinin kaynağı unknown olmalıdır.`); continue; }
    if (record.source === "unknown") throw new Error(`${k}: değer için kaynak gerekir.`);
    if (k in numericFields) {
      const [, , min, max] = numericFields[k as keyof typeof numericFields];
      if (typeof v !== "number" || !Number.isFinite(v) || v < min || (max !== null && v > max)
        || (["r", "importance", "driftLimit", "qt", "subgrade", "thicknessFactor"].includes(k) && v === 0)) throw new Error(`${k}: geçersiz sayısal değer.`);
    } else if (typeof v !== "string" || !(choices[k as keyof typeof choices] as readonly string[]).includes(v)) throw new Error(`${k}: geçersiz seçenek.`);
  }
  const number = (key: SettingKey) => settings[key].value as number | null;
  const dry = number("dryUnitWeight"), wet = number("saturatedUnitWeight");
  if (dry !== null && wet !== null && wet < dry) throw new Error("saturatedUnitWeight: doygun ağırlık kuru ağırlıktan küçük olamaz.");
  if (settings.connection.value === "enlarged" && number("enlargementRatio") === null) throw new Error("enlargementRatio: büyütülmüş bağlantı oranı gerekir.");
}

/** JSON boundary rejects nonfinite values before JSON.stringify can silently turn them into null. */
function assertJson(value: unknown, depth = 0): void {
  if (depth > 80) throw new Error("Yapısal verinin iç içe derinliği fazla.");
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Yapısal veri sonlu olmayan sayı içeriyor.");
  if (value === undefined || typeof value === "function" || typeof value === "bigint") throw new Error("Yapısal veri JSON olmalıdır.");
  if (value && typeof value === "object") for (const v of Object.values(value)) assertJson(v, depth + 1);
}
export function readStructuralProject(value: unknown): StructuralProject {
  assertJson(value);
  const p = structuredClone(value) as StructuralProject;
  if (!p || p.schemaVersion !== 1 || typeof p.projectId !== "string" || !p.projectId.trim()
    || !Number.isSafeInteger(p.revision) || p.revision < 0 || !p.settings || !Array.isArray(p.objects)
    || !Array.isArray(p.materials) || !p.coefficients?.r) throw new Error("Desteklenmeyen veya eksik yapısal proje sürümü.");
  validateSettings(p.settings);
  p.engineeringReviews ??= emptyEngineeringReviews();
  validateEngineeringReviews(p.engineeringReviews);
  const roles: PhysicalRole[] = ["unknown", "column", "structural_wall", "infill_wall", "beam", "coupling_beam", "band_beam", "slab", "raft", "footing", "stair_flight", "landing", "excluded"];
  if (new Set(p.objects.map(o => o.elementId)).size !== p.objects.length || p.objects.some(o => typeof o.elementId !== "string" || typeof o.floorId !== "string" || !roles.includes(o.role))) throw new Error("Yapısal nesne kimliği/rolü geçersiz.");
  const sources = ["unknown", "user_input", "native_decoded", "reference_document_input", "computed", "derived"];
  const optionalString = (v: unknown) => v === null || typeof v === "string";
  const xyz = (v: XYZ) => v && [v.x, v.y, v.z].every(n => typeof n === "number" && Number.isFinite(n));
  const sixBool = (v: unknown) => Array.isArray(v) && v.length === 6 && v.every(b => typeof b === "boolean");
  for (const o of p.objects) {
    // Additive fields in structural v1: absence means unknown, never a solid section.
    o.openingsM ??= null; o.sectionPolygonM ??= null;
    if (!sources.includes(o.source) || !optionalString(o.nativeId) || !optionalString(o.materialId) || !optionalString(o.diaphragmId)
      || !(o.localAxis === null || typeof o.localAxis === "number") || !(o.coverM === null || typeof o.coverM === "number" && o.coverM >= 0)) throw new Error("Fiziksel eleman veri sözleşmesi geçersiz.");
    if (!(o.sectionPolygonM === null || Array.isArray(o.sectionPolygonM) && o.sectionPolygonM.length >= 3 && o.sectionPolygonM.every(xyz))
      || !(o.openingsM === null || Array.isArray(o.openingsM) && o.openingsM.every(points => Array.isArray(points) && points.length >= 3 && points.every(xyz)))) throw new Error("Kesit/boşluk koordinat sözleşmesi geçersiz.");
    if (o.connections !== null) {
      const c = o.connections;
      if (!c || !optionalString(c.startJointId) || !optionalString(c.endJointId)
        || !(c.startReleases === null || sixBool(c.startReleases)) || !(c.endReleases === null || sixBool(c.endReleases))
        || !(c.eccentricityM === null || xyz(c.eccentricityM))) throw new Error("Analitik bağlantı sözleşmesi geçersiz; çizim yakalaması mekanik bağlantı değildir.");
    }
    if (o.supports !== null && (!Array.isArray(o.supports) || o.supports.some(s => typeof s.jointId !== "string" || !sixBool(s.restrained)
      || !(s.stiffness === null || Array.isArray(s.stiffness) && s.stiffness.length === 6 && s.stiffness.every(n => n === null || typeof n === "number" && n >= 0))))) throw new Error("Mesnet/yay sözleşmesi geçersiz (öteleme kN/m, dönme kNm/rad).");
    if (o.reinforcement !== null) {
      const r = o.reinforcement;
      if (!r || !["existing", "designed"].includes(r.mode) || !sources.includes(r.source) || !Array.isArray(r.bars)
        || new Set(r.bars.map(b => b.id)).size !== r.bars.length || r.bars.some(b => typeof b.id !== "string"
          || typeof b.steelMaterialId !== "string" || typeof b.diameterMm !== "number" || b.diameterMm <= 0
          || !Number.isSafeInteger(b.quantity) || b.quantity <= 0 || !Array.isArray(b.centerLineM) || b.centerLineM.length < 2
          || b.centerLineM.some(p => !xyz(p)) || !optionalString(b.hookStart) || !optionalString(b.hookEnd))) throw new Error("Donatı yerleşimi sözleşmesi geçersiz; kesim boyu veya miktar varsayılmaz.");
    }
    if (o.designConstraints !== null) {
      const c = o.designConstraints;
      if (!c || [c.minBarDiameterMm, c.maxBarDiameterMm, c.maxSpacingM].some(n => n !== null && (typeof n !== "number" || n <= 0))
        || !(c.lockedReinforcement === null || typeof c.lockedReinforcement === "boolean")
        || c.minBarDiameterMm !== null && c.maxBarDiameterMm !== null && c.maxBarDiameterMm < c.minBarDiameterMm) throw new Error("Kullanıcı tasarım kısıtları geçersiz.");
    }
  }
  if (new Set(p.materials.map(m => m.materialId)).size !== p.materials.length) throw new Error("Yinelenen yapısal malzeme kimliği.");
  for (const m of p.materials) {
    if (typeof m.materialId !== "string" || !sources.includes(m.source)) throw new Error("Yapısal malzeme kaydı geçersiz.");
    if (m.properties !== null) {
      for (const field of ["fckMPa", "elasticModulusMPa", "fykMPa", "densityKgM3", "poisson"] as const) {
        const n = m.properties?.[field];
        if (n !== null && (typeof n !== "number" || !Number.isFinite(n) || n <= 0 || field === "poisson" && n >= .5)) throw new Error(`Malzeme ${field}: geçersiz değer.`);
      }
    }
  }
  if (p.loads !== null) {
    if (!Array.isArray(p.loads) || new Set(p.loads.map(l => l.id)).size !== p.loads.length) throw new Error("Yük listesi/kimliği geçersiz.");
    for (const l of p.loads) {
      const requiredUnit = { point: "kN", line: "kN/m", area: "kN/m2", body: "kN/m3" }[l.distribution];
      if (typeof l.id !== "string" || !sources.includes(l.source) || !optionalString(l.evidence)
        || !["dead", "live", "wind", "snow", "seismic", "temperature"].includes(l.kind)
        || !["global", "local"].includes(l.coordinateSystem) || !requiredUnit
        || l.unit !== (l.kind === "temperature" ? "C" : requiredUnit)
        || !Array.isArray(l.elementIds) || !l.elementIds.length || l.elementIds.some(id => !p.objects.some(o => o.elementId === id))
        || !Array.isArray(l.components) || l.components.length !== 3 || l.components.some(n => typeof n !== "number" || !Number.isFinite(n))
        || !(l.selfWeightIncluded === null || typeof l.selfWeightIncluded === "boolean")
        || !(l.massParticipation === null || typeof l.massParticipation === "number" && l.massParticipation >= 0 && l.massParticipation <= 1)
        || !(l.applicationRegion === null || l.applicationRegion.start >= 0 && l.applicationRegion.end > l.applicationRegion.start && l.applicationRegion.end <= 1)) throw new Error("Yükün birim/etki/kaynak sözleşmesi geçersiz.");
    }
  }
  if (p.floorRoles !== null && (!Array.isArray(p.floorRoles) || p.floorRoles.some(f => typeof f.floorId !== "string" || !sources.includes(f.source) || !optionalString(f.diaphragmId) || !["unknown", "basement", "superstructure", "foundation", "roof"].includes(f.role)))) throw new Error("Kat rolü sözleşmesi geçersiz.");
  if (p.importCoverage !== null && (!p.importCoverage || [p.importCoverage.mappedIds, p.importCoverage.referenceIds, p.importCoverage.unsupportedRequiredFields].some(ids => !Array.isArray(ids) || ids.some(id => typeof id !== "string")))) throw new Error("İçe aktarma kapsamı geçersiz.");
  for (const n of [p.coefficients.r.entered, p.coefficients.r.used, p.coefficients.r.recommended]) if (n !== null && (typeof n !== "number" || !Number.isFinite(n) || n <= 0)) throw new Error("R katsayısı kaydı geçersiz.");
  if (p.coefficients.r.entered !== p.settings.r.value) throw new Error("Girilen R ile katsayı kaydı eşleşmiyor.");
  return p;
}
export function updateProjectSettings(project: StructuralProject, settings: StructuralProject["settings"], reviews:EngineeringReviews=project.engineeringReviews??emptyEngineeringReviews()): StructuralProject {
  validateSettings(settings);
  validateEngineeringReviews(reviews);
  const next = structuredClone(project);
  next.engineeringReviews=structuredClone(reviews);
  next.settings = structuredClone(settings); next.revision++;
  next.coefficients.r.entered = settings.r.value as number | null;
  // Saving user input is not a validated system-selection computation.
  next.coefficients.r.used = null;
  next.coefficients.r.recommended = null;
  next.coefficients.r.reason = null;
  return readStructuralProject(next);
}
