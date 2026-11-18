import type { StairDesignInput } from "../../src/lib/hsyncad/structural/stair-design";
import { stairGeometry, type StairGeometryInput } from "../../src/lib/hsyncad/structural/stair-geometry";

export const stairBenchmarkMaterial = {
  fck: 25, fctk: 1.8, reinforcementClass: "B420C" as const, fyk: 420, fywk: 420, Ec: 30000,
  tensileBasis: "table_3_2" as const, elasticBasis: "table_3_2" as const, testEvidence: null,
  source: "synthetic benchmark declaration; TS500/2000 Table 3.2 C25 and S420 values",
};

export function oneFlightGeometry(): StairGeometryInput {
  return { schemaVersion: 1, physicalFamilyId: "stairs-single", modelRevision: "model-r1", stiffnessSet: "stiffness-r1", geometryRevision: "stairs-geom-r1",
    floorLevelsMm: { L0: 0, L1: 1500 }, nativeRepresentationIds: ["native-stair-1"],
    disjointSolids: { checked: true, source: "synthetic fixture: no overlap between component solids" },
    components: [{ id: "flight-1", kind: "flight", floorId: "L0", startFloorId: "L0", endFloorId: "L1", widthMm: 1200,
      thicknessMm: 200, concreteUnitWeightKnM3: 25, riserCount: 10, treadCount: 10, riserMm: 150, treadMm: 280,
      supports: [{ id: "support-lower", floorId: "L0", kind: "beam", bearingWidthMm: 300, source: "synthetic support geometry" },
        { id: "support-upper", floorId: "L1", kind: "beam", bearingWidthMm: 300, source: "synthetic support geometry" }], source: "synthetic parameter declaration" }] };
}

export function doubleFlightWithLandingGeometry(): StairGeometryInput {
  return { schemaVersion: 1, physicalFamilyId: "stairs-double", modelRevision: "model-r1", stiffnessSet: "stiffness-r1", geometryRevision: "stairs-geom-r1",
    floorLevelsMm: { L0: 0, Lmid: 1500, L2: 3000 }, nativeRepresentationIds: ["native-stair-a", "native-stair-b", "native-landing-mid"],
    disjointSolids: { checked: true, source: "synthetic assembly: flight wedges and separate landing prism do not overlap" },
    components: [
      { id: "flight-lower", kind: "flight", floorId: "L0", startFloorId: "L0", endFloorId: "Lmid", widthMm: 1200, thicknessMm: 200,
        concreteUnitWeightKnM3: 25, riserCount: 10, treadCount: 10, riserMm: 150, treadMm: 280,
        supports: [{ id: "support-lower", floorId: "L0", kind: "beam", bearingWidthMm: 300, source: "synthetic" }, { id: "landing-left", floorId: "Lmid", kind: "beam", bearingWidthMm: 300, source: "synthetic" }], source: "synthetic lower flight" },
      { id: "landing-mid", kind: "landing", floorId: "Lmid", widthMm: 1200, thicknessMm: 160, concreteUnitWeightKnM3: 25, spanMm: 1200,
        supports: [{ id: "landing-left", floorId: "Lmid", kind: "beam", bearingWidthMm: 300, source: "synthetic" }, { id: "landing-right", floorId: "Lmid", kind: "beam", bearingWidthMm: 300, source: "synthetic" }], source: "synthetic intermediate landing" },
      { id: "flight-upper", kind: "flight", floorId: "Lmid", startFloorId: "Lmid", endFloorId: "L2", widthMm: 1200, thicknessMm: 200,
        concreteUnitWeightKnM3: 25, riserCount: 10, treadCount: 10, riserMm: 150, treadMm: 280,
        supports: [{ id: "landing-right", floorId: "Lmid", kind: "beam", bearingWidthMm: 300, source: "synthetic" }, { id: "support-upper", floorId: "L2", kind: "beam", bearingWidthMm: 300, source: "synthetic" }], source: "synthetic upper flight" },
    ] };
}

export function landingBenchmarkGeometry(): StairGeometryInput {
  return { schemaVersion: 1, physicalFamilyId: "stairs-landing-volume", modelRevision: "model-r1", stiffnessSet: "stiffness-r1", geometryRevision: "landing-geom-r1",
    floorLevelsMm: { L1: 0 }, nativeRepresentationIds: [], disjointSolids: { checked: true, source: "single isolated landing prism" },
    components: [{ id: "landing-only", kind: "landing", floorId: "L1", widthMm: 2000, spanMm: 2000, thicknessMm: 300, concreteUnitWeightKnM3: 25,
      supports: [{ id: "landing-support-left", floorId: "L1", kind: "beam", bearingWidthMm: 300, source: "synthetic" }, { id: "landing-support-right", floorId: "L1", kind: "beam", bearingWidthMm: 300, source: "synthetic" }], source: "synthetic landing dimensions" }] };
}

export function stairDesignInput(geometry: StairGeometryInput): StairDesignInput {
  const loads = Object.fromEntries(geometry.components.map(c => [c.id, { finishKnM2: c.kind === "landing" ? .75 : .5, finishBasis: "projected" as const,
    otherDeadKnM2: 0, liveKnM2: c.kind === "landing" ? 3 : 4, liveBasis: "projected" as const, source: "synthetic benchmark load declaration" }]));
  return { geometry, loads, material: stairBenchmarkMaterial, coverMm: 25,
    mainBottom: { diameterMm: 12, spacingMm: 150, anchorageLeftMm: 650, anchorageRightMm: 650 },
    mainTop: { diameterMm: 12, spacingMm: 150, anchorageLeftMm: 650, anchorageRightMm: 650 },
    distribution: { diameterMm: 8, spacingMm: 250 },
    ultimateCases: [{ id: "ULS-GQ", use: "ultimate", deadFactor: 1.2, liveFactor: 1.6, source: "synthetic oracle combination; factors are test inputs" }],
    service: { duration: "12months", environment: "indoor_normal", partition: "insensitive", sustainedLiveFactor: .3, source: "synthetic service declaration" },
    globalAnalysisSnapshot: { modelRevision: geometry.modelRevision, stiffnessSet: geometry.stiffnessSet, analysisStamp: "analysis-r1", geometryRevision: geometry.geometryRevision,
      geometryFingerprint: stairGeometry(geometry).geometryFingerprint },
    globalAnalysisStamp: "analysis-r1" };
}
