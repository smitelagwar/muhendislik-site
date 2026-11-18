import { STANDARD_GRAVITY } from "./load-ledger";

export type StairSupport = { id: string; floorId: string; kind: "beam" | "wall"; bearingWidthMm: number; source: string };
export type StairCommon = {
  id: string;
  floorId: string;
  widthMm: number;
  thicknessMm: number;
  concreteUnitWeightKnM3: number;
  supports: readonly [StairSupport, StairSupport];
  source: string;
};
export type StairFlight = StairCommon & {
  kind: "flight";
  riserCount: number;
  treadCount: number;
  riserMm: number;
  treadMm: number;
  startFloorId: string;
  endFloorId: string;
};
export type StairLanding = StairCommon & { kind: "landing"; spanMm: number };
export type StairComponent = StairFlight | StairLanding;
export type StairGeometryInput = {
  schemaVersion: 1;
  physicalFamilyId: string;
  modelRevision: string;
  stiffnessSet: string;
  geometryRevision: string;
  floorLevelsMm: Readonly<Record<string, number>>;
  nativeRepresentationIds: readonly string[];
  disjointSolids: { checked: true; source: string };
  components: readonly StairComponent[];
};

const finitePositive = (v: number, label: string) => {
  if (!Number.isFinite(v) || v <= 0) throw new Error(`${label} pozitif ve sonlu olmalı.`);
};

/** Collision-free content identity for the bounded JSON geometry snapshot. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
}

/** Exact closed parametric volumes. Native meshes are references and are never added to these quantities. */
export function stairGeometry(input: StairGeometryInput) {
  if (input.schemaVersion !== 1 || !input.physicalFamilyId?.trim() || !input.modelRevision?.trim()
    || !input.stiffnessSet?.trim() || !input.geometryRevision?.trim() || !input.components.length
    || input.components.length > 32 || input.disjointSolids?.checked !== true || !input.disjointSolids.source?.trim()) throw new Error("Merdiven ailesi/revizyon/geometri/çakışmasız katı kontrolü eksik veya bütçe dışında.");
  if (!Object.keys(input.floorLevelsMm).length || Object.values(input.floorLevelsMm).some(z => !Number.isFinite(z))) throw new Error("Başlangıç/bitiş/ara kat kot kayıtları gerekli.");
  if (new Set(input.components.map(c => c.id)).size !== input.components.length
    || new Set(input.nativeRepresentationIds).size !== input.nativeRepresentationIds.length
    || input.nativeRepresentationIds.some(id => !id.trim())) throw new Error("Merdiven bileşeni/native temsil kimliği yinelenmiş veya boş.");
  const rows = input.components.map(component => {
    for (const [value, label] of [[component.widthMm, "genişlik"], [component.thicknessMm, "kalınlık"],
      [component.concreteUnitWeightKnM3, "beton birim ağırlığı"]] as const) finitePositive(value, label);
    if (!component.id.trim() || !component.floorId.trim() || !component.source.trim()
      || component.supports.length !== 2 || component.supports[0].id === component.supports[1].id
      || component.supports.some(s => !s.id.trim() || !s.floorId.trim() || !s.source.trim() || !["beam", "wall"].includes(s.kind)
        || !Number.isFinite(s.bearingWidthMm) || s.bearingWidthMm <= 0)) {
      throw new Error("Gerçek bileşen katı, iki farklı gerçek mesnedi ve kaynakları gerekli.");
    }
    const widthM = component.widthMm / 1000, thicknessM = component.thicknessMm / 1000;
    let spanMm: number, horizontalProjectionMm: number, riseMm = 0, waistVolumeM3: number, stepVolumeM3 = 0, landingVolumeM3 = 0;
    let stepCentroidXmm: number | null = null;
    if (component.kind === "flight") {
      if (![component.riserCount, component.treadCount].every(Number.isSafeInteger) || component.riserCount < 1
        || component.treadCount < 1 || component.riserCount !== component.treadCount
        || !component.startFloorId.trim() || !component.endFloorId.trim() || component.startFloorId === component.endFloorId) {
        throw new Error("Desteklenen uçuş profili eşit sayıda rıht/basamak ve farklı başlangıç/bitiş katı ister.");
      }
      finitePositive(component.riserMm, "rıht yüksekliği"); finitePositive(component.treadMm, "basamak derinliği");
      riseMm = component.riserCount * component.riserMm;
      const startZ = input.floorLevelsMm[component.startFloorId], endZ = input.floorLevelsMm[component.endFloorId];
      if (!Number.isFinite(startZ) || !Number.isFinite(endZ) || endZ <= startZ || Math.abs((endZ - startZ) - riseMm) > 1e-6) {
        throw new Error("Uçuş rıht toplamı başlangıç/bitiş kat kot farkıyla uyuşmuyor.");
      }
      horizontalProjectionMm = component.treadCount * component.treadMm;
      spanMm = Math.hypot(horizontalProjectionMm, riseMm);
      waistVolumeM3 = widthM * (spanMm / 1000) * thicknessM;
      // The step wedges are the exact area between the stair profile and the inclined waist top.
      stepVolumeM3 = widthM * component.riserCount * (component.riserMm / 1000) * (component.treadMm / 1000) / 2;
      // Each tread wedge is triangular with its deep end at the riser; centroid x is exact.
      stepCentroidXmm = component.treadMm * (3 * component.treadCount - 1) / 6;
      if (component.supports[0].floorId !== component.startFloorId || component.supports[1].floorId !== component.endFloorId) {
        throw new Error("Uçuş uç mesnet katları başlangıç/bitiş katlarıyla uyuşmuyor.");
      }
    } else {
      finitePositive(component.spanMm, "sahanlık açıklığı");
      if (!Number.isFinite(input.floorLevelsMm[component.floorId]) || component.supports.some(s => s.floorId !== component.floorId)) {
        throw new Error("Sahanlık katı/kot ve iki mesnet kotu eşleşmeli.");
      }
      spanMm = component.spanMm; horizontalProjectionMm = spanMm;
      landingVolumeM3 = widthM * (spanMm / 1000) * thicknessM;
      waistVolumeM3 = 0;
    }
    const grossVolumeM3 = waistVolumeM3 + stepVolumeM3 + landingVolumeM3;
    const selfWeightKn = grossVolumeM3 * component.concreteUnitWeightKnM3;
    if (![spanMm, horizontalProjectionMm, grossVolumeM3, selfWeightKn].every(Number.isFinite) || grossVolumeM3 <= 0) throw new Error("Merdiven geometri hesabı taşmış/geçersiz.");
    const slopeRad = Math.atan2(riseMm, horizontalProjectionMm);
    const waistSelfWeightKn = waistVolumeM3 * component.concreteUnitWeightKnM3;
    const stepSelfWeightKn = stepVolumeM3 * component.concreteUnitWeightKnM3;
    const landingSelfWeightKn = landingVolumeM3 * component.concreteUnitWeightKnM3;
    return { id: component.id, kind: component.kind, floorId: component.floorId, startFloorId: component.kind === "flight" ? component.startFloorId : null,
      endFloorId: component.kind === "flight" ? component.endFloorId : null, supportIds: component.supports.map(s => s.id),
      supportFloors: component.supports.map(s => s.floorId), widthMm: component.widthMm, thicknessMm: component.thicknessMm,
      spanMm, horizontalProjectionMm, riseMm, slopeRad, slopeDeg: slopeRad * 180 / Math.PI,
      waistVolumeM3, stepVolumeM3, landingVolumeM3, grossVolumeM3, selfWeightKn,
      waistSelfWeightKn, stepSelfWeightKn, landingSelfWeightKn, stepCentroidXmm,
      selfWeightPerProjectedAreaKnM2: selfWeightKn / (widthM * horizontalProjectionMm / 1000),
      selfWeightPerInclinedAreaKnM2: selfWeightKn / (widthM * spanMm / 1000),
      densitySource: "explicit component geometry × declared concrete unit weight", source: component.source };
  });
  const supportFloorById = new Map<string, string>(), supportKindById = new Map<string, string>();
  for (const support of input.components.flatMap(c => c.supports)) {
    if (!Number.isFinite(input.floorLevelsMm[support.floorId])) throw new Error(`Mesnet ${support.id} bilinmeyen kat kotuna bağlanmış.`);
    const prior = supportFloorById.get(support.id);
    if (prior && prior !== support.floorId) throw new Error(`Mesnet ${support.id} farklı katlara bağlanmış.`);
    supportFloorById.set(support.id, support.floorId);
    const priorKind = supportKindById.get(support.id);
    if (priorKind && priorKind !== support.kind) throw new Error(`Mesnet ${support.id} tür kimliği tutarsız.`);
    supportKindById.set(support.id, support.kind);
  }
  const supportReactions = new Map<string, { supportId: string; floorId: string; verticalKn: number; componentIds: string[] }>();
  for (const row of rows) for (const supportId of row.supportIds) {
    const support = input.components.flatMap(c => c.supports).find(s => s.id === supportId)!;
    const item = supportReactions.get(supportId) ?? { supportId, floorId: support.floorId, verticalKn: 0, componentIds: [] };
    const isLeft = row.supportIds[0] === supportId;
    const runMm = row.horizontalProjectionMm;
    const waist = row.waistSelfWeightKn / 2;
    const landing = row.landingSelfWeightKn / 2;
    const stepRight = row.stepSelfWeightKn * (row.stepCentroidXmm ?? runMm / 2) / runMm;
    const stepLeft = row.stepSelfWeightKn - stepRight;
    item.verticalKn += waist + landing + (isLeft ? stepLeft : stepRight);
    item.componentIds.push(row.id); supportReactions.set(supportId, item);
  }
  const totalSelfWeightKn = rows.reduce((sum, row) => sum + row.selfWeightKn, 0);
  const allSupportReactionKn = [...supportReactions.values()].reduce((sum, row) => sum + row.verticalKn, 0);
  if (Math.abs(totalSelfWeightKn - allSupportReactionKn) > 1e-9 * Math.max(1, totalSelfWeightKn)) throw new Error("Öz ağırlık mesnet aktarımı düşey dengeyi sağlamıyor.");
  // Gravity is retained in kN; STANDARD_GRAVITY is exported to document the ledger unit convention.
  return { schemaVersion: 1 as const, physicalFamilyId: input.physicalFamilyId, modelRevision: input.modelRevision,
    stiffnessSet: input.stiffnessSet, geometryRevision: input.geometryRevision,
    geometryFingerprint: canonicalJson(input),
    nativeRepresentationIds: [...input.nativeRepresentationIds], physicalComponentCount: rows.length, disjointSolids: structuredClone(input.disjointSolids),
    nativeRecordCount: input.nativeRepresentationIds.length, components: rows, supportReactions: [...supportReactions.values()],
    totalSelfWeightKn, equilibriumResidualKn: totalSelfWeightKn - allSupportReactionKn,
    gravityConversionConstant: STANDARD_GRAVITY, duplicatePolicy: "one parametric physical family owns quantities; native representation ids are references" as const,
    };
}

/** Prevent native/parametric duplicate families when a floor registry is assembled. */
export function validateStairFamilyRegistry(families: readonly StairGeometryInput[]) {
  const physical = new Set<string>(), nativeOwners = new Map<string, string>();
  for (const family of families) {
    if (physical.has(family.physicalFamilyId)) throw new Error(`Fiziksel merdiven ailesi yinelenmiş: ${family.physicalFamilyId}`);
    physical.add(family.physicalFamilyId);
    for (const nativeId of family.nativeRepresentationIds) {
      const owner = nativeOwners.get(nativeId);
      if (owner && owner !== family.physicalFamilyId) throw new Error(`Native merdiven kaydı iki fiziksel aileye bağlanmış: ${nativeId}`);
      nativeOwners.set(nativeId, family.physicalFamilyId);
    }
  }
  return { physicalFamilyCount: physical.size, nativeReferenceCount: nativeOwners.size, analysisApproved: false as const };
}
