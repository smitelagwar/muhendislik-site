/**
 * P15 Physical Column Reinforcement Adapter.
 *
 * Converts verified P10 column design/detailing placement results into physical
 * BarInput groups compatible with the P15 Reinforcement Schedule arithmetic engine.
 *
 * CRITICAL BOUNDARY PRINCIPLES:
 * - NO implicit kg/m2 or kg/m3 heuristic estimations.
 * - NO global 1.3 multiplier or heuristic full-height/lap/hook guesses.
 * - Explicit authored centerlines, anchorage, lap lengths, and storey elevations required.
 * - Unproven lengths produce status "missing_data" and ensure full project mass is null.
 * - Strict floor/element/revision/source correspondence.
 * - Strict distinction between "verification" and "redesign" modes.
 * - No double-counting of stirrup boundaries as cross-ties.
 */

import {
  createStraightSegment,
  createArcSegment,
  createCenterlineGeometry,
  type BarInput,
  type ExpectedElement,
  type BarRole,
  type ScheduleMode,
  type Point3D,
  type CenterlineSegment,
  type AnchorageDetail
} from "./reinforcement-schedule";
import { type ColumnDesignInput } from "./column-design";
import { columnDetailing, type ColumnTie } from "./column-detailing";

export interface ColumnStoreyEndpoints {
  /** Elevation of column base in world Z (meters). */
  readonly baseZ: number;
  /** Elevation of column top in world Z (meters). */
  readonly topZ: number;
  /** Center of column cross section in world X (meters, default 0). */
  readonly originX?: number;
  /** Center of column cross section in world Y (meters, default 0). */
  readonly originY?: number;
}

export interface ColumnLongitudinalDetangling {
  /** Length of lap splice extending above top joint into upper storey (meters). */
  readonly topLapExtensionM?: number;
  /** Length of starter bar extending below base joint into foundation/lower floor (meters). */
  readonly bottomStarterExtensionM?: number;
  /** Length of top anchorage hook (meters, e.g., roof column standard 90/135 bend). */
  readonly topHookM?: number;
  /** Length of bottom anchorage hook into footing (meters). */
  readonly bottomHookM?: number;
  /** Provenance of longitudinal fabrication lengths. Must NOT be heuristic. */
  readonly provenance: "authored_cad_geometry" | "native_detailing_record" | "unproven";
}

export interface ColumnTieDetangling {
  /** Hook tail length in meters (default from P10 tie.hookTailMm / 1000). */
  readonly hookTailM?: number;
  /** Inner bend radius in meters (default from P10 tie.innerBendDiameterMm / 2000). */
  readonly innerBendRadiusM?: number;
  /** Provenance of tie/crosstie cutting geometry. Must NOT be heuristic. */
  readonly provenance: "authored_cad_geometry" | "native_detailing_record" | "unproven";
}

export interface ColumnReinforcementAdapterInput {
  /** P10 column design input specification. */
  readonly columnInput: ColumnDesignInput;
  /** Optional pre-computed detailing result; if omitted, computed via columnDetailing. */
  readonly detailingResult?: ReturnType<typeof columnDetailing>;
  /** Active project layout revision ID. Must strictly match column revision. */
  readonly projectRevisionId: string;
  /** Canonical steel density in kg/m3 (e.g. 7850). Zero/negative/missing strictly rejected. */
  readonly steelDensityKgPerM3: number;
  /** Storey 3D elevation endpoints. Required for physical 3D centerline geometry. */
  readonly storeyEndpoints?: ColumnStoreyEndpoints;
  /** Longitudinal bar 3D detailing parameters. */
  readonly longitudinalDetangling?: ColumnLongitudinalDetangling;
  /** Lateral tie/crosstie 3D detailing parameters. */
  readonly tieDetangling?: ColumnTieDetangling;
}

export type ColumnAdapterStatus =
  | "ready"         // Geometry is fully authored and proven -> physical BarInput[] emitted
  | "missing_data"  // Real geometric lengths missing or unproven -> no guessing permitted
  | "rejected"      // Revision mismatch, invalid coordinates, or unphysical inputs
  | "api_blocker";  // P10 lacks required layout parameters to form valid physical geometry

export interface ColumnReinforcementAdapterResult {
  readonly status: ColumnAdapterStatus;
  readonly elementId: string;
  readonly floorId: string;
  readonly mode: ScheduleMode;
  readonly bars: readonly BarInput[];
  readonly expectedElement: ExpectedElement;
  readonly requiredRoles: readonly BarRole[];
  readonly issues: readonly string[];
  readonly blockerExplanation?: string;
}

/**
 * Returns a formal technical description of why P10 ColumnDesignInput alone cannot
 * fabricate physical reinforcement bars without 3D geometric extensions.
 */
export function describeColumnP10ApiBlocker(columnInput: ColumnDesignInput): string {
  return [
    `[API BLOCKER] P10 Column '${columnInput.id}' on floor '${columnInput.storeyId}':`,
    "1. P10 ColumnDesignInput supplies only 2D section coordinates (u, v) and a 1D scalar clearLengthMm.",
    "2. Storey world elevations (baseZ, topZ) and world placement (originX, originY) are absent in P10.",
    "3. Longitudinal fabrication cut lengths require explicit lap splice extensions or joint anchorage bends;",
    "   TS 500 / TBDY checks ensure code compliance but do not author physical 3D bar cutting polylines.",
    "4. Lateral ties require explicit 3D corner bend radii and hook projections beyond 2D core dimensions.",
    "5. P15 strictly forbids multiplying clearLengthMm by heuristic factors (such as 1.3x) or kg/m3 rules.",
    "Therefore, without explicit authored 3D geometry and proven detailing lengths, this element cannot",
    "be converted to physical BarInputs and must remain unresolved with null full project mass."
  ].join("\n");
}

/**
 * Primary adapter converting verified P10 column data into physical BarInput records.
 */
export function buildColumnReinforcementBarInputs(
  input: ColumnReinforcementAdapterInput
): ColumnReinforcementAdapterResult {
  const { columnInput, projectRevisionId, steelDensityKgPerM3 } = input;
  const issues: string[] = [];

  const elementId = columnInput?.id ?? "unknown-column";
  const floorId = columnInput?.storeyId ?? "unknown-floor";
  const mode: ScheduleMode =
    columnInput?.mode === "existing_reinforcement" ? "verification" : "redesign";

  // Base required roles: every reinforced column requires longitudinal bars and stirrup/ties
  const hasCrossTies = (columnInput?.tie?.crossTies?.length ?? 0) > 0;
  const requiredRoles: BarRole[] = hasCrossTies
    ? ["longitudinal", "stirrup", "crosstie"]
    : ["longitudinal", "stirrup"];

  const expectedElement: ExpectedElement = {
    elementId,
    floorId,
    elementType: "column",
    requiredRoles
  };

  // 1. Density validation
  if (!Number.isFinite(steelDensityKgPerM3) || steelDensityKgPerM3 <= 0) {
    issues.push("steelDensityKgPerM3 must be an explicit finite positive physical value (e.g. 7850).");
    return {
      status: "rejected",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues
    };
  }

  // 2. Revision validation
  if (!projectRevisionId || !projectRevisionId.trim()) {
    issues.push("projectRevisionId must be a non-empty string.");
    return {
      status: "rejected",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues
    };
  }

  const modelRevision = columnInput?.loads?.[0]?.force?.modelRevision;
  if (modelRevision && modelRevision !== projectRevisionId) {
    issues.push(
      `Revision mismatch: column modelRevision '${modelRevision}' does not match projectRevisionId '${projectRevisionId}'.`
    );
    return {
      status: "rejected",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues
    };
  }

  // 3. Column input existence and bars check
  if (!columnInput || !columnInput.id || !columnInput.storeyId) {
    issues.push("columnInput must have a valid id and storeyId.");
    return {
      status: "rejected",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues
    };
  }

  if (!Array.isArray(columnInput.bars) || columnInput.bars.length === 0) {
    issues.push("columnInput.bars must be a non-empty array of ColumnBar.");
    return {
      status: "rejected",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues
    };
  }

  // 4. Missing 3D Storey Endpoints check
  const endpoints = input.storeyEndpoints;
  if (
    !endpoints ||
    !Number.isFinite(endpoints.baseZ) ||
    !Number.isFinite(endpoints.topZ) ||
    endpoints.topZ <= endpoints.baseZ
  ) {
    const blocker = describeColumnP10ApiBlocker(columnInput);
    issues.push("Missing or invalid storeyEndpoints: baseZ and topZ must be finite with topZ > baseZ.");
    return {
      status: "missing_data",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues,
      blockerExplanation: blocker
    };
  }

  // 5. Check detailing provenance - must not be unproven
  const longDet = input.longitudinalDetangling;
  if (!longDet || longDet.provenance === "unproven") {
    const blocker = describeColumnP10ApiBlocker(columnInput);
    issues.push("Longitudinal detailing lengths are unproven or missing. Heuristic guessing is forbidden.");
    return {
      status: "missing_data",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues,
      blockerExplanation: blocker
    };
  }

  const tieDet = input.tieDetangling;
  if (!tieDet || tieDet.provenance === "unproven") {
    const blocker = describeColumnP10ApiBlocker(columnInput);
    issues.push("Tie detailing parameters are unproven or missing. Heuristic guessing is forbidden.");
    return {
      status: "missing_data",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues,
      blockerExplanation: blocker
    };
  }

  // 6. Detailing computation for tie locations
  let detailing = input.detailingResult;
  if (!detailing) {
    try {
      detailing = columnDetailing({
        shape: columnInput.shape,
        bars: columnInput.bars,
        material: columnInput.material,
        tie: columnInput.tie,
        cover: columnInput.cover,
        aggregate: columnInput.aggregate,
        clearLengthMm: columnInput.clearLengthMm,
        highDuctility: !!columnInput.seismic,
        NmaxKn: 0,
        GQEmaxKn: 0,
        shortColumn: false,
        cantilever: columnInput.cantilever,
        foundationEmbedMm: columnInput.foundationEmbedMm,
        laps: columnInput.laps,
        development: columnInput.development
      });
    } catch (err) {
      issues.push(`columnDetailing evaluation failed: ${String(err)}`);
      return {
        status: "rejected",
        elementId,
        floorId,
        mode,
        bars: [],
        expectedElement,
        requiredRoles,
        issues
      };
    }
  }

  const originX = endpoints.originX ?? 0;
  const originY = endpoints.originY ?? 0;
  const angleRad =
    columnInput.shape.kind === "rectangle" ? (columnInput.shape.angleRad ?? 0) : 0;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  const topLap = Math.max(0, longDet.topLapExtensionM ?? 0);
  const bottomStarter = Math.max(0, longDet.bottomStarterExtensionM ?? 0);
  const topHook = Math.max(0, longDet.topHookM ?? 0);
  const bottomHook = Math.max(0, longDet.bottomHookM ?? 0);

  const zStart = endpoints.baseZ - bottomStarter;
  const zEnd = endpoints.topZ + topLap;

  const barInputs: BarInput[] = [];

  // 7. Physical Longitudinal Bars
  const materialClass = columnInput.material.reinforcementClass;

  for (let i = 0; i < columnInput.bars.length; i++) {
    const b = columnInput.bars[i];
    if (!Number.isFinite(b.u) || !Number.isFinite(b.v) || !Number.isFinite(b.diameter) || b.diameter <= 0) {
      issues.push(`Invalid coordinates or diameter for bar ${b.id}`);
      return {
        status: "rejected",
        elementId,
        floorId,
        mode,
        bars: [],
        expectedElement,
        requiredRoles,
        issues
      };
    }

    // Convert section coordinates (mm) to global meters
    const uM = b.u / 1000;
    const vM = b.v / 1000;
    const worldX = originX + (cosA * uM - sinA * vM);
    const worldY = originY + (sinA * uM + cosA * vM);

    const seg = createStraightSegment([worldX, worldY, zStart], [worldX, worldY, zEnd]);

    const anchorage: AnchorageDetail | undefined =
      topHook > 0 || bottomHook > 0
        ? {
            startHookM: bottomHook > 0 ? bottomHook : undefined,
            endHookM: topHook > 0 ? topHook : undefined,
            description: "Authored column longitudinal anchorage hooks"
          }
        : undefined;

    const geom = createCenterlineGeometry([seg], anchorage);

    barInputs.push({
      id: `${floorId}::${elementId}::long::${b.id}`,
      elementId,
      floorId,
      elementType: "column",
      role: "longitudinal",
      materialId: materialClass,
      diameterMm: b.diameter,
      count: 1,
      steelDensityKgPerM3,
      geometry: geom,
      mode,
      layoutRevisionId: projectRevisionId
    });
  }

  // 8. Physical Lateral Ties (Stirrups)
  const tie = columnInput.tie;
  const tiePositions = detailing.tieLocations.positionsMm;
  const numTies = tiePositions.length;

  if (numTies <= 0) {
    issues.push("detailingResult returned 0 tie locations along column height.");
    return {
      status: "rejected",
      elementId,
      floorId,
      mode,
      bars: [],
      expectedElement,
      requiredRoles,
      issues
    };
  }

  const hookTailM = tieDet.hookTailM ?? tie.hookTailMm / 1000;
  const zMid = (endpoints.baseZ + endpoints.topZ) / 2;

  if (columnInput.shape.kind === "rectangle") {
    const halfB = (tie.coreB / 2000);
    const halfH = (tie.coreH / 2000);

    // 4 straight perimeter segments forming the outer rectangular hoop
    const p1: Point3D = [originX - halfB, originY - halfH, zMid];
    const p2: Point3D = [originX + halfB, originY - halfH, zMid];
    const p3: Point3D = [originX + halfB, originY + halfH, zMid];
    const p4: Point3D = [originX - halfB, originY + halfH, zMid];

    const seg1 = createStraightSegment(p1, p2);
    const seg2 = createStraightSegment(p2, p3);
    const seg3 = createStraightSegment(p3, p4);
    const seg4 = createStraightSegment(p4, p1);

    const tieGeom = createCenterlineGeometry([seg1, seg2, seg3, seg4], {
      startHookM: hookTailM,
      endHookM: hookTailM,
      description: `Two ${tie.hookAngleDeg ?? 135}-degree seismic hooks`
    });

    barInputs.push({
      id: `${floorId}::${elementId}::stirrup::outer`,
      elementId,
      floorId,
      elementType: "column",
      role: "stirrup",
      materialId: materialClass,
      diameterMm: tie.diameter,
      count: numTies,
      steelDensityKgPerM3,
      geometry: tieGeom,
      mode,
      layoutRevisionId: projectRevisionId
    });
  } else if (columnInput.shape.kind === "circle") {
    const radiusM = (tie.coreB / 2000);
    // Approximate full circular hoop with 4 quarter-circle arcs
    const p0: Point3D = [originX + radiusM, originY, zMid];
    const p1: Point3D = [originX, originY + radiusM, zMid];
    const p2: Point3D = [originX - radiusM, originY, zMid];
    const p3: Point3D = [originX, originY - radiusM, zMid];

    const quarterAngle = Math.PI / 2;
    const arc1 = createArcSegment(p0, p1, radiusM, quarterAngle);
    const arc2 = createArcSegment(p1, p2, radiusM, quarterAngle);
    const arc3 = createArcSegment(p2, p3, radiusM, quarterAngle);
    const arc4 = createArcSegment(p3, p0, radiusM, quarterAngle);

    const hoopGeom = createCenterlineGeometry([arc1, arc2, arc3, arc4], {
      startHookM: hookTailM,
      endHookM: hookTailM,
      description: "Continuous circular hoop with seismic anchorage hooks"
    });

    barInputs.push({
      id: `${floorId}::${elementId}::stirrup::circular-hoop`,
      elementId,
      floorId,
      elementType: "column",
      role: "stirrup",
      materialId: materialClass,
      diameterMm: tie.diameter,
      count: numTies,
      steelDensityKgPerM3,
      geometry: hoopGeom,
      mode,
      layoutRevisionId: projectRevisionId
    });
  }

  // 9. Physical Cross-Ties (Çirozlar)
  if (hasCrossTies) {
    const barsMap = new Map(columnInput.bars.map((b) => [b.id, b]));
    const registeredCrossKeys = new Set<string>();

    for (const ct of tie.crossTies) {
      const barA = barsMap.get(ct.fromBarId);
      const barB = barsMap.get(ct.toBarId);

      if (!barA || !barB) {
        issues.push(`Cross-tie '${ct.id}' references non-existent bar: ${ct.fromBarId} or ${ct.toBarId}`);
        return {
          status: "rejected",
          elementId,
          floorId,
          mode,
          bars: [],
          expectedElement,
          requiredRoles,
          issues
        };
      }

      const pairKey = [ct.fromBarId, ct.toBarId].sort().join("::");
      if (registeredCrossKeys.has(pairKey)) {
        issues.push(`Duplicate cross-tie path detected between '${ct.fromBarId}' and '${ct.toBarId}'.`);
        return {
          status: "rejected",
          elementId,
          floorId,
          mode,
          bars: [],
          expectedElement,
          requiredRoles,
          issues
        };
      }
      registeredCrossKeys.add(pairKey);

      // Convert local coordinates (mm) to global meters
      const axM = originX + (cosA * (barA.u / 1000) - sinA * (barA.v / 1000));
      const ayM = originY + (sinA * (barA.u / 1000) + cosA * (barA.v / 1000));
      const bxM = originX + (cosA * (barB.u / 1000) - sinA * (barB.v / 1000));
      const byM = originY + (sinA * (barB.u / 1000) + cosA * (barB.v / 1000));

      const crossSeg = createStraightSegment([axM, ayM, zMid], [bxM, byM, zMid]);
      const crossGeom = createCenterlineGeometry([crossSeg], {
        startHookM: hookTailM,
        endHookM: hookTailM,
        description: `Seismic cross-tie connecting ${ct.fromBarId} and ${ct.toBarId}`
      });

      barInputs.push({
        id: `${floorId}::${elementId}::crosstie::${ct.id}`,
        elementId,
        floorId,
        elementType: "column",
        role: "crosstie",
        materialId: materialClass,
        diameterMm: tie.diameter,
        count: numTies,
        steelDensityKgPerM3,
        geometry: crossGeom,
        mode,
        layoutRevisionId: projectRevisionId
      });
    }
  }

  return {
    status: "ready",
    elementId,
    floorId,
    mode,
    bars: barInputs,
    expectedElement,
    requiredRoles,
    issues: []
  };
}
