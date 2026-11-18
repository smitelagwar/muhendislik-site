/**
 * P15 Explicit Reinforcement Schedule Arithmetic & Traceability Foundation.
 *
 * Implements deterministic physical bar centerline geometry measurement,
 * mass calculation from canonical physical formulas, stable element/floor ownership,
 * deduplication vs conflicting duplicate rejection, expected coverage registry,
 * and single raw-list subtotals with exact mathematical conservation.
 *
 * No guessed factors, no global 1.3, no default steel density, no As-area substitution.
 */

export type Point3D = readonly [number, number, number];

export interface StraightSegment {
  readonly kind: "straight";
  readonly start: Point3D;
  readonly end: Point3D;
  readonly lengthM: number;
}

export interface ArcSegment {
  readonly kind: "arc";
  readonly start: Point3D;
  readonly end: Point3D;
  readonly bendRadiusM: number;
  readonly bendAngleRad: number;
  readonly arcLengthM: number;
}

export type CenterlineSegment = StraightSegment | ArcSegment;

export interface AnchorageDetail {
  readonly startHookM?: number;
  readonly endHookM?: number;
  readonly lapLengthM?: number;
  readonly description?: string;
}

export interface CenterlineGeometry {
  readonly kind: "centerline";
  readonly segments: readonly CenterlineSegment[];
  readonly anchorage?: AnchorageDetail;
  readonly totalLengthM: number;
}

export interface DeclaredFabricationGeometry {
  readonly kind: "declared_fabrication";
  readonly declaredLengthM: number;
  readonly provenance: "user_declared" | "native_declared";
  readonly inabilityToVerifyPathReason: string;
}

export type BarGeometry = CenterlineGeometry | DeclaredFabricationGeometry;

export type ElementType = "beam" | "column" | "wall" | "slab" | "foundation" | "stair";

export type BarRole =
  | "main_bottom"
  | "main_top"
  | "stirrup"
  | "crosstie"
  | "longitudinal"
  | "additional"
  | "chair"
  | "distribution";

export type ScheduleMode = "verification" | "redesign";

export interface BarInput {
  readonly id: string;
  readonly elementId: string;
  readonly floorId: string;
  readonly elementType: ElementType;
  readonly role: BarRole;
  readonly materialId: string;
  readonly diameterMm: number;
  readonly count: number;
  readonly steelDensityKgPerM3: number;
  readonly geometry: BarGeometry;
  readonly mode: ScheduleMode;
  readonly layoutRevisionId: string;
}

export interface ComputedBar extends BarInput {
  readonly unitLengthM: number;
  readonly totalLengthM: number;
  readonly unitMassKg: number;
  readonly totalMassKg: number;
}

export interface ExpectedElement {
  readonly elementId: string;
  readonly floorId: string;
  readonly elementType: ElementType;
  readonly requiredRoles?: readonly BarRole[];
}

export interface GroupCoverageScope {
  readonly requireRoleCompleteness?: boolean;
  readonly sourceGroupMappingStatus?: "verified" | "unknown" | "unspecified";
}

export interface ExplicitZeroElement {
  readonly elementId: string;
  readonly floorId: string;
  readonly reason: string;
  readonly provenance: "verification_verified_zero" | "redesign_unreinforced";
}

export interface ClassificationProfile {
  readonly profileName: string;
  readonly thickThresholdMm: number;
}

export interface SubtotalEntry {
  readonly key: string;
  readonly totalLengthM: number;
  readonly totalMassKg: number;
  readonly barCount: number;
}

export interface DiameterSubtotal {
  readonly diameterMm: number;
  readonly totalLengthM: number;
  readonly totalMassKg: number;
  readonly barCount: number;
}

export interface FloorSubtotal {
  readonly floorId: string;
  readonly totalLengthM: number;
  readonly totalMassKg: number;
  readonly barCount: number;
  readonly elementIds: readonly string[];
}

export interface ElementTypeSubtotal {
  readonly elementType: ElementType;
  readonly totalLengthM: number;
  readonly totalMassKg: number;
  readonly barCount: number;
}

export interface MaterialSubtotal {
  readonly materialId: string;
  readonly totalLengthM: number;
  readonly totalMassKg: number;
  readonly barCount: number;
}

export interface ReinforcementScheduleResult {
  readonly projectRevisionId: string;
  readonly mode: ScheduleMode | "mixed";
  readonly uniqueBars: readonly ComputedBar[];
  readonly deduplicatedCount: number;
  readonly knownMassKg: number;
  readonly totalMassKg: number | null;
  readonly knownLengthM: number;
  readonly totalLengthM: number | null;
  readonly isComplete: boolean;
  readonly unresolvedElementIds: readonly string[];
  readonly explicitZeroElementIds: readonly string[];
  readonly subtotalsByFloor: readonly FloorSubtotal[];
  readonly subtotalsByElementType: readonly ElementTypeSubtotal[];
  readonly subtotalsByDiameter: readonly DiameterSubtotal[];
  readonly subtotalsByMaterial: readonly MaterialSubtotal[];
  readonly classification: {
    readonly profileName: string;
    readonly thickThresholdMm: number;
    readonly thinMassKg: number;
    readonly thickMassKg: number;
    readonly thinLengthM: number;
    readonly thickLengthM: number;
  };
}

export interface ScheduleDisplaySummary {
  readonly knownMassFormattedKg: string;
  readonly totalMassFormattedKg: string | null;
  readonly knownMassFormattedTon: string;
  readonly totalMassFormattedTon: string | null;
  readonly isComplete: boolean;
  readonly thinMassFormattedKg: string;
  readonly thickMassFormattedKg: string;
  readonly byDiameter: readonly {
    readonly diameterMm: number;
    readonly totalLengthFormattedM: string;
    readonly totalMassFormattedKg: string;
  }[];
  readonly byFloor: readonly {
    readonly floorId: string;
    readonly totalMassFormattedKg: string;
  }[];
  readonly byElementType: readonly {
    readonly elementType: ElementType;
    readonly totalMassFormattedKg: string;
  }[];
}

export const DEFAULT_CLASSIFICATION_PROFILE: ClassificationProfile = {
  profileName: "ts500-12mm-threshold",
  thickThresholdMm: 12
};

function validateFinitePoint3D(p: Point3D, context: string): void {
  if (!Array.isArray(p) || p.length !== 3 || p.some(x => !Number.isFinite(x))) {
    throw new Error(`${context}: Point3D must have 3 finite numeric coordinates.`);
  }
}

export function createStraightSegment(start: Point3D, end: Point3D): StraightSegment {
  validateFinitePoint3D(start, "createStraightSegment start");
  validateFinitePoint3D(end, "createStraightSegment end");
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  if (!Number.isFinite(dx * dx + dy * dy + dz * dz) || !Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dz)) {
    throw new Error("createStraightSegment: segment length must be finite.");
  }
  const lengthM = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(lengthM)) {
    throw new Error("createStraightSegment: segment length must be finite.");
  }
  if (lengthM <= 1e-9) {
    throw new Error("createStraightSegment: segment length must be positive.");
  }
  return { kind: "straight", start, end, lengthM };
}

export function createArcSegment(
  start: Point3D,
  end: Point3D,
  bendRadiusM: number,
  bendAngleRad: number
): ArcSegment {
  validateFinitePoint3D(start, "createArcSegment start");
  validateFinitePoint3D(end, "createArcSegment end");
  if (!Number.isFinite(bendRadiusM) || bendRadiusM <= 0) {
    throw new Error("createArcSegment: bendRadiusM must be a finite positive number.");
  }
  if (!Number.isFinite(bendAngleRad) || bendAngleRad <= 0 || bendAngleRad > 2 * Math.PI) {
    throw new Error("createArcSegment: bendAngleRad must be a finite positive number <= 2*pi.");
  }
  const arcLengthM = bendRadiusM * bendAngleRad;
  return { kind: "arc", start, end, bendRadiusM, bendAngleRad, arcLengthM };
}

export function createCenterlineGeometry(
  segments: readonly CenterlineSegment[],
  anchorage?: AnchorageDetail
): CenterlineGeometry {
  if (!segments || segments.length === 0) {
    throw new Error("createCenterlineGeometry: requires at least one segment.");
  }
  let sumSegs = 0;
  for (const seg of segments) {
    if (seg.kind === "straight") {
      sumSegs += seg.lengthM;
    } else if (seg.kind === "arc") {
      sumSegs += seg.arcLengthM;
    } else {
      throw new Error("createCenterlineGeometry: unrecognized segment kind.");
    }
  }
  let extraAnchorage = 0;
  if (anchorage) {
    if (anchorage.startHookM !== undefined) {
      if (!Number.isFinite(anchorage.startHookM) || anchorage.startHookM < 0) {
        throw new Error("createCenterlineGeometry: startHookM must be finite nonnegative.");
      }
      extraAnchorage += anchorage.startHookM;
    }
    if (anchorage.endHookM !== undefined) {
      if (!Number.isFinite(anchorage.endHookM) || anchorage.endHookM < 0) {
        throw new Error("createCenterlineGeometry: endHookM must be finite nonnegative.");
      }
      extraAnchorage += anchorage.endHookM;
    }
    if (anchorage.lapLengthM !== undefined) {
      if (!Number.isFinite(anchorage.lapLengthM) || anchorage.lapLengthM < 0) {
        throw new Error("createCenterlineGeometry: lapLengthM must be finite nonnegative.");
      }
      extraAnchorage += anchorage.lapLengthM;
    }
  }
  const totalLengthM = sumSegs + extraAnchorage;
  return { kind: "centerline", segments, anchorage, totalLengthM };
}

export function createDeclaredFabricationGeometry(
  declaredLengthM: number,
  provenance: "user_declared" | "native_declared",
  inabilityToVerifyPathReason: string
): DeclaredFabricationGeometry {
  if (!Number.isFinite(declaredLengthM) || declaredLengthM <= 0) {
    throw new Error("createDeclaredFabricationGeometry: declaredLengthM must be a finite positive number.");
  }
  if (!inabilityToVerifyPathReason || !inabilityToVerifyPathReason.trim()) {
    throw new Error(
      "createDeclaredFabricationGeometry: inabilityToVerifyPathReason must be provided to explain why 3D path cannot be verified."
    );
  }
  return {
    kind: "declared_fabrication",
    declaredLengthM,
    provenance,
    inabilityToVerifyPathReason: inabilityToVerifyPathReason.trim()
  };
}

export function computeBarMetrics(input: BarInput): ComputedBar {
  if (!input.id || !input.id.trim()) {
    throw new Error("Bar id must be a non-empty string.");
  }
  if (!input.elementId || !input.elementId.trim()) {
    throw new Error("Bar elementId must be a non-empty string.");
  }
  if (!input.floorId || !input.floorId.trim()) {
    throw new Error("Bar floorId must be a non-empty string.");
  }
  if (!input.materialId || !input.materialId.trim()) {
    throw new Error("Bar materialId must be a non-empty string.");
  }
  if (!input.layoutRevisionId || !input.layoutRevisionId.trim()) {
    throw new Error("Bar layoutRevisionId must be a non-empty string.");
  }
  if (!["beam", "column", "wall", "slab", "foundation", "stair"].includes(input.elementType)) {
    throw new Error(`Unsupported elementType '${input.elementType}'.`);
  }
  if (!["verification", "redesign"].includes(input.mode)) {
    throw new Error(`Unsupported mode '${input.mode}'.`);
  }
  if (!Number.isFinite(input.diameterMm) || input.diameterMm <= 0) {
    throw new Error(`Bar '${input.id}': diameterMm must be a finite positive number.`);
  }
  if (!Number.isSafeInteger(input.count) || input.count <= 0) {
    throw new Error(`Bar '${input.id}': count must be a positive integer.`);
  }
  if (!Number.isFinite(input.steelDensityKgPerM3) || input.steelDensityKgPerM3 <= 0) {
    throw new Error(
      `Bar '${input.id}': steelDensityKgPerM3 must be an explicit finite positive physical value (no default invisible density permitted).`
    );
  }

  let unitLengthM = 0;
  if (input.geometry.kind === "centerline") {
    unitLengthM = input.geometry.totalLengthM;
  } else if (input.geometry.kind === "declared_fabrication") {
    unitLengthM = input.geometry.declaredLengthM;
  } else {
    throw new Error(`Bar '${input.id}': unrecognized geometry kind.`);
  }

  if (!Number.isFinite(unitLengthM) || unitLengthM <= 0) {
    throw new Error(`Bar '${input.id}': physical unitLengthM must be a finite positive number.`);
  }

  const dMeters = input.diameterMm / 1000;
  const crossSectionAreaM2 = (Math.PI * dMeters * dMeters) / 4;
  const unitMassKg = crossSectionAreaM2 * input.steelDensityKgPerM3 * unitLengthM;
  const totalLengthM = unitLengthM * input.count;
  const totalMassKg = unitMassKg * input.count;

  return {
    ...input,
    unitLengthM,
    totalLengthM,
    unitMassKg,
    totalMassKg
  };
}

export function computeReinforcementSchedule(input: {
  readonly bars: readonly BarInput[];
  readonly projectRevisionId: string;
  readonly expectedElements?: readonly ExpectedElement[];
  readonly explicitZeroElements?: readonly ExplicitZeroElement[];
  readonly classificationProfile?: ClassificationProfile;
  readonly groupCoverageScope?: GroupCoverageScope;
}): ReinforcementScheduleResult {
  const { projectRevisionId, expectedElements = [], explicitZeroElements = [], groupCoverageScope } = input;
  const profile = input.classificationProfile ?? DEFAULT_CLASSIFICATION_PROFILE;

  if (!projectRevisionId || !projectRevisionId.trim()) {
    throw new Error("computeReinforcementSchedule: projectRevisionId is required.");
  }
  if (!Number.isFinite(profile.thickThresholdMm) || profile.thickThresholdMm <= 0) {
    throw new Error("computeReinforcementSchedule: thickThresholdMm must be a positive number.");
  }

  const uniqueBars: ComputedBar[] = [];
  const barMap = new Map<string, ComputedBar>();
  let deduplicatedCount = 0;

  for (const rawBar of input.bars) {
    if (rawBar.layoutRevisionId !== projectRevisionId) {
      throw new Error(
        `Stale layout revision '${rawBar.layoutRevisionId}' on bar '${rawBar.id}', expected current project revision '${projectRevisionId}'.`
      );
    }

    const computed = computeBarMetrics(rawBar);
    const key = `${computed.floorId}::${computed.elementId}::${computed.id}`;

    if (!barMap.has(key)) {
      barMap.set(key, computed);
      uniqueBars.push(computed);
    } else {
      const existing = barMap.get(key)!;
      const isExactDuplicate =
        existing.diameterMm === computed.diameterMm &&
        existing.count === computed.count &&
        existing.steelDensityKgPerM3 === computed.steelDensityKgPerM3 &&
        existing.materialId === computed.materialId &&
        existing.mode === computed.mode &&
        existing.role === computed.role &&
        existing.elementType === computed.elementType &&
        Math.abs(existing.unitLengthM - computed.unitLengthM) <= 1e-9;

      if (isExactDuplicate) {
        deduplicatedCount++;
      } else {
        throw new Error(
          `Conflicting duplicate bar definition for ID '${computed.id}' on element '${computed.elementId}' (floor '${computed.floorId}'). Properties conflict with previously registered bar.`
        );
      }
    }
  }

  // Determine overall mode
  let overallMode: ScheduleMode | "mixed" = "verification";
  if (uniqueBars.length > 0) {
    const hasVerification = uniqueBars.some(b => b.mode === "verification");
    const hasRedesign = uniqueBars.some(b => b.mode === "redesign");
    if (hasVerification && hasRedesign) {
      overallMode = "mixed";
    } else if (hasRedesign) {
      overallMode = "redesign";
    } else {
      overallMode = "verification";
    }
  }

  // Coverage checking with composite floorId::elementId qualification
  const coveredKeys = new Set<string>();
  const elementRoleMap = new Map<string, Set<BarRole>>();
  for (const bar of uniqueBars) {
    const key = `${bar.floorId}::${bar.elementId}`;
    coveredKeys.add(key);
    if (!elementRoleMap.has(key)) {
      elementRoleMap.set(key, new Set());
    }
    elementRoleMap.get(key)!.add(bar.role);
  }

  const zeroKeys = new Set<string>(
    explicitZeroElements.map(e => `${e.floorId}::${e.elementId}`)
  );
  const zeroElementIds = new Set<string>(explicitZeroElements.map(e => e.elementId));
  const unresolvedElementIds: string[] = [];

  for (const exp of expectedElements) {
    const key = `${exp.floorId}::${exp.elementId}`;
    if (zeroKeys.has(key)) {
      continue;
    }
    if (coveredKeys.has(key)) {
      if (exp.requiredRoles && exp.requiredRoles.length > 0) {
        const presentRoles = elementRoleMap.get(key)!;
        const missingRole = exp.requiredRoles.some(r => !presentRoles.has(r));
        if (missingRole) {
          unresolvedElementIds.push(exp.elementId);
          continue;
        }
      }
      continue;
    }
    unresolvedElementIds.push(exp.elementId);
  }

  const isMappingUnknown = groupCoverageScope?.sourceGroupMappingStatus === "unknown";
  const isComplete = unresolvedElementIds.length === 0 && !isMappingUnknown;

  let knownMassKg = 0;
  let knownLengthM = 0;
  for (const bar of uniqueBars) {
    knownMassKg += bar.totalMassKg;
    knownLengthM += bar.totalLengthM;
  }

  const totalMassKg = isComplete ? knownMassKg : null;
  const totalLengthM = isComplete ? knownLengthM : null;

  // Subtotals by Floor
  const floorMap = new Map<string, { totalLengthM: number; totalMassKg: number; barCount: number; elements: Set<string> }>();
  for (const bar of uniqueBars) {
    if (!floorMap.has(bar.floorId)) {
      floorMap.set(bar.floorId, { totalLengthM: 0, totalMassKg: 0, barCount: 0, elements: new Set() });
    }
    const entry = floorMap.get(bar.floorId)!;
    entry.totalLengthM += bar.totalLengthM;
    entry.totalMassKg += bar.totalMassKg;
    entry.barCount += bar.count;
    entry.elements.add(bar.elementId);
  }
  const subtotalsByFloor: FloorSubtotal[] = [...floorMap.entries()]
    .map(([floorId, data]) => ({
      floorId,
      totalLengthM: data.totalLengthM,
      totalMassKg: data.totalMassKg,
      barCount: data.barCount,
      elementIds: [...data.elements].sort()
    }))
    .sort((a, b) => a.floorId.localeCompare(b.floorId));

  // Subtotals by Element Type
  const elementMap = new Map<ElementType, { totalLengthM: number; totalMassKg: number; barCount: number }>();
  for (const bar of uniqueBars) {
    if (!elementMap.has(bar.elementType)) {
      elementMap.set(bar.elementType, { totalLengthM: 0, totalMassKg: 0, barCount: 0 });
    }
    const entry = elementMap.get(bar.elementType)!;
    entry.totalLengthM += bar.totalLengthM;
    entry.totalMassKg += bar.totalMassKg;
    entry.barCount += bar.count;
  }
  const subtotalsByElementType: ElementTypeSubtotal[] = [...elementMap.entries()]
    .map(([elementType, data]) => ({
      elementType,
      totalLengthM: data.totalLengthM,
      totalMassKg: data.totalMassKg,
      barCount: data.barCount
    }))
    .sort((a, b) => a.elementType.localeCompare(b.elementType));

  // Subtotals by Diameter
  const diameterMap = new Map<number, { totalLengthM: number; totalMassKg: number; barCount: number }>();
  for (const bar of uniqueBars) {
    if (!diameterMap.has(bar.diameterMm)) {
      diameterMap.set(bar.diameterMm, { totalLengthM: 0, totalMassKg: 0, barCount: 0 });
    }
    const entry = diameterMap.get(bar.diameterMm)!;
    entry.totalLengthM += bar.totalLengthM;
    entry.totalMassKg += bar.totalMassKg;
    entry.barCount += bar.count;
  }
  const subtotalsByDiameter: DiameterSubtotal[] = [...diameterMap.entries()]
    .map(([diameterMm, data]) => ({
      diameterMm,
      totalLengthM: data.totalLengthM,
      totalMassKg: data.totalMassKg,
      barCount: data.barCount
    }))
    .sort((a, b) => a.diameterMm - b.diameterMm);

  // Subtotals by Material
  const materialMap = new Map<string, { totalLengthM: number; totalMassKg: number; barCount: number }>();
  for (const bar of uniqueBars) {
    if (!materialMap.has(bar.materialId)) {
      materialMap.set(bar.materialId, { totalLengthM: 0, totalMassKg: 0, barCount: 0 });
    }
    const entry = materialMap.get(bar.materialId)!;
    entry.totalLengthM += bar.totalLengthM;
    entry.totalMassKg += bar.totalMassKg;
    entry.barCount += bar.count;
  }
  const subtotalsByMaterial: MaterialSubtotal[] = [...materialMap.entries()]
    .map(([materialId, data]) => ({
      materialId,
      totalLengthM: data.totalLengthM,
      totalMassKg: data.totalMassKg,
      barCount: data.barCount
    }))
    .sort((a, b) => a.materialId.localeCompare(b.materialId));

  // Thin vs Thick Classification
  let thinMassKg = 0;
  let thickMassKg = 0;
  let thinLengthM = 0;
  let thickLengthM = 0;

  for (const bar of uniqueBars) {
    if (bar.diameterMm <= profile.thickThresholdMm) {
      thinMassKg += bar.totalMassKg;
      thinLengthM += bar.totalLengthM;
    } else {
      thickMassKg += bar.totalMassKg;
      thickLengthM += bar.totalLengthM;
    }
  }

  return {
    projectRevisionId,
    mode: overallMode,
    uniqueBars,
    deduplicatedCount,
    knownMassKg,
    totalMassKg,
    knownLengthM,
    totalLengthM,
    isComplete,
    unresolvedElementIds: [...new Set(unresolvedElementIds)].sort(),
    explicitZeroElementIds: [...zeroElementIds].sort(),
    subtotalsByFloor,
    subtotalsByElementType,
    subtotalsByDiameter,
    subtotalsByMaterial,
    classification: {
      profileName: profile.profileName,
      thickThresholdMm: profile.thickThresholdMm,
      thinMassKg,
      thickMassKg,
      thinLengthM,
      thickLengthM
    }
  };
}

export function formatScheduleSummary(
  schedule: ReinforcementScheduleResult,
  massDecimals: number = 2,
  lengthDecimals: number = 2
): ScheduleDisplaySummary {
  return {
    knownMassFormattedKg: schedule.knownMassKg.toFixed(massDecimals),
    totalMassFormattedKg: schedule.totalMassKg !== null ? schedule.totalMassKg.toFixed(massDecimals) : null,
    knownMassFormattedTon: (schedule.knownMassKg / 1000).toFixed(massDecimals + 1),
    totalMassFormattedTon: schedule.totalMassKg !== null ? (schedule.totalMassKg / 1000).toFixed(massDecimals + 1) : null,
    isComplete: schedule.isComplete,
    thinMassFormattedKg: schedule.classification.thinMassKg.toFixed(massDecimals),
    thickMassFormattedKg: schedule.classification.thickMassKg.toFixed(massDecimals),
    byDiameter: schedule.subtotalsByDiameter.map(d => ({
      diameterMm: d.diameterMm,
      totalLengthFormattedM: d.totalLengthM.toFixed(lengthDecimals),
      totalMassFormattedKg: d.totalMassKg.toFixed(massDecimals)
    })),
    byFloor: schedule.subtotalsByFloor.map(f => ({
      floorId: f.floorId,
      totalMassFormattedKg: f.totalMassKg.toFixed(massDecimals)
    })),
    byElementType: schedule.subtotalsByElementType.map(e => ({
      elementType: e.elementType,
      totalMassFormattedKg: e.totalMassKg.toFixed(massDecimals)
    }))
  };
}
