/**
 * Analytical Bridge Types for P17 Bounded Core Pipeline.
 *
 * Enforces explicit provenance, complete provable material properties,
 * analytical frame node definitions, load combinations, support/anchorage geometry,
 * and verified transverse detailing (hooks/bends) without silent defaults.
 *
 * Browser-safe: zero node:crypto dependencies.
 */

import type { Fact } from "./global-control-types";
import type { Anchorage } from "./beam-detailing";
import type { ServiceEnvironment } from "./beam-service";
import type { BarInput, ExpectedElement, ReinforcementScheduleResult } from "./reinforcement-schedule";
import type { BeamCase } from "./beam-forces";
import type { ExplicitReportExecutionResult } from "../reporting/explicit-project-report";
import type { designBeam } from "./beam-design";

export interface ExplicitProvableMaterial {
  readonly fck: number;
  readonly fctk: number;
  readonly reinforcementClass: "B420C" | "B500C";
  readonly fyk: number;
  readonly fywk: number;
  readonly Ec: number; // in MPa
  readonly densityKgM3: number; // e.g. 2500 for concrete, 7850 for steel
  readonly tensileBasis: "table_3_2";
  readonly elasticBasis: "table_3_2";
  readonly testEvidence: string | null;
  readonly source: string;
}

export interface AnalyticalNodeDefinition {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly prescribed: readonly [
    number | null,
    number | null,
    number | null,
    number | null,
    number | null,
    number | null
  ];
  readonly springs: readonly [number, number, number, number, number, number];
}

export interface AnalyticalLoadCaseInput {
  readonly id: string;
  readonly kind: "G" | "Q" | "seismic" | "service";
  readonly uniformKnM: readonly [number, number, number];
  readonly source: string;
}

export interface AnalyticalLoadCombinationInput {
  readonly id: string;
  readonly terms: readonly {
    readonly factor: number;
    readonly loadCaseId: string;
  }[];
}

export interface VerifiedHookBendDefinition {
  readonly hookAngleDeg: 135 | 90;
  readonly hookExtensionMm: number; // e.g. Math.max(6 * stirrupDiameter, 80)
  readonly bendRadiusMm: number;
  readonly source: string;
}

export interface ExplicitTransverseDetailing {
  readonly hookBendDefinition: VerifiedHookBendDefinition | null;
  readonly verifiedCutLengthMm?: number | null;
}

export interface ExplicitAnchorageDefinition {
  readonly left: Anchorage;
  readonly right: Anchorage;
}

export interface ExplicitBeamGeometry {
  readonly spanMm: number;
  readonly bwMm: number;
  readonly hMm: number;
  readonly slabThicknessMm: number;
  readonly columnWidthMm: number;
  readonly coverMm: number;
  readonly aggregateMm: number;
  readonly kind: "simple" | "edge" | "interior" | "cantilever";
  readonly outside: boolean;
  readonly flange: null | {
    readonly hf: number;
    readonly leftClear: number;
    readonly rightClear: number;
    readonly symmetric: boolean;
  };
  readonly leftJoint: string;
  readonly rightJoint: string;
  readonly source: string;
}

export interface ExplicitBeamSupport {
  readonly left: "direct" | "indirect";
  readonly right: "direct" | "indirect";
  readonly hangerLeftKn: number;
  readonly hangerRightKn: number;
  readonly source: string;
}

export interface ExplicitBeamContinuity {
  readonly leftBeamId: string | null;
  readonly rightBeamId: string | null;
  readonly source: string;
}

export interface ExplicitDesignCatalog {
  readonly diameters: readonly number[];
  readonly stirrupDiameters: readonly number[];
  readonly spacings: readonly number[];
  readonly maxCount: number;
  readonly maxRows: number;
  readonly maxCandidates: number;
  readonly stockLengthMm: number;
}

export interface ExplicitSeismicInput {
  readonly D: number;
  readonly analysisStamp: string;
  readonly source: string;
  readonly pairs: readonly {
    readonly gravityCaseId: string;
    readonly earthquakeCaseId: string;
  }[];
}

export interface ExplicitServiceInput {
  readonly totalCaseId: string;
  readonly sustainedCaseId: string;
  readonly liveCaseId: string;
  readonly duration: "3months" | "6months" | "12months" | "5years";
  readonly environment: ServiceEnvironment;
  readonly partition: "none_floor" | "none_roof" | "sensitive" | "insensitive";
  readonly source: string;
}

export interface IndependentReviewFacts {
  readonly engineerName: string;
  readonly reviewDate: string;
  readonly notes: readonly string[];
}

export interface ExplicitBeamAnalyticalInput {
  readonly id: string;
  readonly floorId: string;
  readonly modelRevision: string;
  readonly analysisStamp: string;
  readonly role: "beam" | "band_beam" | "coupling_beam";
  readonly source: string;
  readonly geometry: ExplicitBeamGeometry;
  readonly material: ExplicitProvableMaterial;
  readonly nodes: readonly [AnalyticalNodeDefinition, AnalyticalNodeDefinition];
  readonly loadCases: readonly AnalyticalLoadCaseInput[];
  readonly combinations: readonly AnalyticalLoadCombinationInput[];
  readonly seismic: ExplicitSeismicInput | null;
  readonly service: ExplicitServiceInput | null;
  readonly anchors: ExplicitAnchorageDefinition;
  readonly support: ExplicitBeamSupport;
  readonly continuity: ExplicitBeamContinuity;
  readonly catalog: ExplicitDesignCatalog;
  readonly transverse: ExplicitTransverseDetailing;
  readonly qualityReviewed: Fact<boolean>;
  readonly loadCoverage: Fact<"all_required_combinations_reviewed">;
  readonly independentReview: IndependentReviewFacts | null;
  readonly expectedElements?: readonly ExpectedElement[];
  readonly projectName?: string;
  readonly organization?: string;
}

export interface MissingAnalyticalFact {
  readonly field: string;
  readonly severity: "blocking" | "downgrades_to_draft";
  readonly reason: string;
}

export interface AnalyticalPipelineExecutionResult {
  readonly success: boolean;
  readonly status: "design_ready" | "incomplete" | "failed" | "unsupported";
  readonly reviewStatus: "taslak_muhendis_incelemesi_gerekli" | "onayli" | "reddedildi";
  readonly beamId: string;
  readonly modelRevision: string;
  readonly missingFacts: readonly MissingAnalyticalFact[];
  readonly p06Forces: {
    readonly memberEndForces: Record<string, readonly number[]>;
    readonly reactions: readonly { id: string; fixed: readonly number[] }[];
  } | null;
  readonly beamCases: Record<string, BeamCase>;
  readonly p09Design: ReturnType<typeof designBeam> | null;
  readonly rebarInputs: readonly BarInput[];
  readonly p15Schedule: ReinforcementScheduleResult | null;
  readonly p16Report: ExplicitReportExecutionResult | null;
  readonly diagnostics: readonly string[];
}
