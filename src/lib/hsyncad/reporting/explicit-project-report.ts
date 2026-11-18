/**
 * Hsyncad Structural Reporting - Explicit Project Report Coordinator (P16 Engine Bridge)
 *
 * Orchestrates authentic TS 500 / TBDY 2018 structural calculations via validated P09/P06
 * modules (rc-beam-section, beam-detailing, beam-design), enforces physical reinforcement
 * schedule reconciliation (P15), validates project fact metadata (zero silent defaults),
 * and generates deterministic single-PDF reports.
 */

import {
  beamMaterial,
  beamCapacity,
  barArea,
  type BeamMaterial,
  type BeamSection,
  type BeamBar
} from "../structural/rc-beam-section";
import {
  beamShearTorsion,
  capacityShear,
  type BeamLayout
} from "../structural/beam-detailing";
import {
  designBeam,
  type BeamDesignInput
} from "../structural/beam-design";
import {
  computeReinforcementSchedule,
  type BarInput,
  type ExpectedElement,
  type ExplicitZeroElement,
  type ReinforcementScheduleResult
} from "../structural/reinforcement-schedule";
import {
  buildReportDocument,
  type BeamCalculationSummary,
  type ProjectReadinessData
} from "./section-registry";
import {
  renderReportDocumentToPdf,
  type RenderResult
} from "./pdf-renderer";
import type {
  ReportDocument,
  ReportMetadata,
  ReportProvenance,
  CheckItem,
  CheckStatus,
  ReviewStatus
} from "./report-document";

export interface BeamDesignDefinition {
  id: string;
  floorId: string;
  spanM: number;
  bwMm: number;
  hMm: number;
  coverMm: number;
  fck: number;
  fyk: number;
  stirrupDiameterMm: number;
  stirrupSpacingMm: number;
  stirrupLegs: number;
  designMoments: {
    mEdSpanKnm: number;
    mEdLeftSupportKnm: number;
    mEdRightSupportKnm: number;
  };
  designShearVEdKn: number;
  axialNEdKn?: number;
  crossSectionBars: BeamBar[];
  unsupportedStatus?: CheckStatus;
  demandSource?: "tbdy2018_capacity_design" | "p06_linear_solve" | "user_declared_bounded_case";
  p09Input?: BeamDesignInput;
  seismicCapacityData?: {
    gravityLeftKn: number;
    gravityRightKn: number;
    amplifiedLeftKn: number;
    amplifiedRightKn: number;
  };
}

export interface ExplicitProjectReportInput {
  projectName: string;
  revisionId: string;
  engineerName: string;
  organization?: string;
  date?: string;
  buildingType?: string;
  structuralSystem?: string;
  soilClass?: string;
  earthquakeDts?: string;
  beams: BeamDesignDefinition[];
  rebarInputs: BarInput[];
  expectedElements?: ExpectedElement[];
  explicitZeroElements?: ExplicitZeroElement[];
  unsupportedFeatures?: string[];
  customScopeNotes?: string[];
}

export interface ExplicitReportExecutionResult {
  document: ReportDocument;
  renderResult: RenderResult;
  reinforcementSchedule: ReinforcementScheduleResult;
  beamSummaries: BeamCalculationSummary[];
}

/**
 * Standard material factory for Turkish codes.
 * Strictly validates against TS 500 Table 3.2 without silent fallbacks.
 */
function getMaterial(fck: number, fyk: number): BeamMaterial {
  const fctMap: Record<number, number> = {
    16: 1.4,
    18: 1.5,
    20: 1.6,
    25: 1.8,
    30: 1.9,
    35: 2.1,
    40: 2.2,
    45: 2.3,
    50: 2.5
  };
  const ecMap: Record<number, number> = {
    16: 27000,
    18: 27500,
    20: 28000,
    25: 30000,
    30: 32000,
    35: 33000,
    40: 34000,
    45: 36000,
    50: 37000
  };

  const fctk = fctMap[fck];
  const Ec = ecMap[fck];
  if (fctk === undefined || Ec === undefined) {
    throw new Error(
      `Desteklenmeyen beton sınıfı: C${fck}. TS 500 Çizelge 3.2 uyarınca izin verilen sınıflar: C16, C18, C20, C25, C30, C35, C40, C45, C50.`
    );
  }

  if (fyk !== 420 && fyk !== 500) {
    throw new Error(
      `Desteklenmeyen donatı çeliği sınıfı/akma dayanımı: fyk=${fyk} MPa. Yalnızca B420C (420 MPa) veya B500C (500 MPa) desteklenmektedir.`
    );
  }
  const rebarClass = fyk === 500 ? "B500C" : "B420C";

  return {
    fck,
    fctk,
    reinforcementClass: rebarClass,
    fyk,
    fywk: fyk,
    Ec,
    tensileBasis: "table_3_2",
    elasticBasis: "table_3_2",
    testEvidence: null,
    source: "TS500-2000 / TBDY-2018"
  };
}

export interface ReconciliationResult {
  passed: boolean;
  check: CheckItem;
}

/**
 * Reconciles cross-section capacity steel placement with P15 physical schedule bars.
 * Enforces exact count, diameter, and role alignment without fabricated equivalence.
 */
export function reconcileBeamBars(
  beam: BeamDesignDefinition,
  scheduleBars: readonly BarInput[]
): ReconciliationResult {
  const matching = scheduleBars.filter(
    (b) => b.elementId === beam.id && b.floorId === beam.floorId
  );

  if (matching.length === 0) {
    return {
      passed: false,
      check: {
        id: `${beam.id}-rebar-reconcile`,
        clause: "METRAJ-KAPASİTE UYUMU",
        description: `${beam.id} Kesit Kapasite Donatısı ile Metraj Çubukları Uyum Tahkiki`,
        observed: "Metraj çubuğu bulunamadı (0 poz)",
        limit: "Tanımlı kesit donatılarıyla tam eşleşme",
        utilization: null,
        status: "fail",
        note: `Bu eleman (${beam.id}, Kat: ${beam.floorId}) için metraj listesinde (rebarInputs) hiçbir çubuk tanımlanmamıştır.`
      }
    };
  }

  // Count bottom bars in crossSectionBars vs matching
  const csBot = beam.crossSectionBars.filter((b) => b.face === "bottom");
  const csTop = beam.crossSectionBars.filter((b) => b.face === "top");

  const csBotCount = csBot.length;
  const csBotDia = csBot[0]?.diameter ?? 0;
  const csTopCount = csTop.length;
  const csTopDia = csTop[0]?.diameter ?? 0;

  // Schedule bars
  const schedBot = matching.filter(
    (b) => b.role === "main_bottom" || b.role === "longitudinal"
  );
  const schedTop = matching.filter(
    (b) => b.role === "main_top"
  );
  const schedStirrup = matching.filter((b) => b.role === "stirrup");

  const schedBotCount = schedBot.reduce((sum, b) => sum + b.count, 0);
  const schedBotDia = schedBot[0]?.diameterMm ?? 0;
  const schedTopCount = schedTop.reduce((sum, b) => sum + b.count, 0);
  const schedTopDia = schedTop[0]?.diameterMm ?? 0;

  const errors: string[] = [];
  if (csBotCount > 0 && (csBotCount !== schedBotCount || csBotDia !== schedBotDia)) {
    errors.push(
      `Alt donatı uyumsuz: Kesit ${csBotCount}Ø${csBotDia} vs Metraj ${schedBotCount}Ø${schedBotDia}`
    );
  }
  if (csTopCount > 0 && (csTopCount !== schedTopCount || csTopDia !== schedTopDia)) {
    errors.push(
      `Üst donatı uyumsuz: Kesit ${csTopCount}Ø${csTopDia} vs Metraj ${schedTopCount}Ø${schedTopDia}`
    );
  }
  if (schedStirrup.length > 0 && schedStirrup[0].diameterMm !== beam.stirrupDiameterMm) {
    errors.push(
      `Etriye çapı uyumsuz: Kesit Ø${beam.stirrupDiameterMm} vs Metraj Ø${schedStirrup[0].diameterMm}`
    );
  }

  if (errors.length > 0) {
    return {
      passed: false,
      check: {
        id: `${beam.id}-rebar-reconcile`,
        clause: "METRAJ-KAPASİTE UYUMU",
        description: `${beam.id} Kesit Kapasite Donatısı ile Metraj Çubukları Uyum Tahkiki`,
        observed: errors.join("; "),
        limit: "Birebir Çap, Adet ve Rol Eşleşmesi",
        utilization: null,
        status: "fail",
        note: "Kapasite hesabında kullanılan donatı düzeni ile fiziksel metraj donatısı uyuşmuyor; kütle eşdeğerliği reddedilmiştir."
      }
    };
  }

  return {
    passed: true,
    check: {
      id: `${beam.id}-rebar-reconcile`,
      clause: "METRAJ-KAPASİTE UYUMU",
      description: `${beam.id} Kesit Kapasite Donatısı ile Metraj Çubukları Uyum Tahkiki`,
      observed: `Uyumlu (${csBotCount}Ø${csBotDia} Alt + ${csTopCount}Ø${csTopDia} Üst + Ø${beam.stirrupDiameterMm} Etriye)`,
      limit: "Birebir Çap, Adet ve Rol Eşleşmesi",
      utilization: null,
      status: "pass",
      note: "Kesit analitik modeli ile P15 fiziksel metraj donatıları tam mutabıktır."
    }
  };
}

/**
 * Performs authentic beam calculations consuming validated P09/P06 modules.
 * Eliminates duplicate simplified shear/spacing approximations.
 */
export function evaluateBeam(
  beam: BeamDesignDefinition,
  scheduleBars: readonly BarInput[] = []
): BeamCalculationSummary {
  if (beam.unsupportedStatus && beam.unsupportedStatus !== "pass") {
    // Explicit unsupported or needs review element
    const checkItem: CheckItem = {
      id: `${beam.id}-support`,
      clause: "KAPSAM",
      description: "Desteklenmeyen kesit veya sınır koşulu",
      observed: "Desteklenmiyor",
      limit: "Standard Profil",
      utilization: null,
      status: beam.unsupportedStatus,
      note: "Bu eleman için analitik çözüm kapsam dışı bırakılmıştır."
    };

    return {
      elementId: beam.id,
      floorId: beam.floorId,
      spanM: beam.spanM,
      bwMm: beam.bwMm,
      hMm: beam.hMm,
      concreteGrade: `C${beam.fck}`,
      rebarGrade: `B${beam.fyk}C`,
      designMoments: beam.designMoments,
      capacities: {
        mRdSpanKnm: 0,
        mRdLeftSupportKnm: 0,
        mRdRightSupportKnm: 0,
        vRdKn: 0
      },
      designShearVEdKn: beam.designShearVEdKn,
      axialNEdKn: beam.axialNEdKn ?? 0,
      utilization: {
        spanFlexure: 1.0,
        supportFlexure: 1.0,
        shear: 1.0
      },
      checks: [checkItem],
      status: beam.unsupportedStatus
    };
  }

  // Branch A: Authentic P09 full design beam input provided
  if (beam.p09Input) {
    const p09Res = designBeam(beam.p09Input);
    const checks: CheckItem[] = [];

    if ("checks" in p09Res && Array.isArray(p09Res.checks)) {
      for (const c of p09Res.checks) {
        let status: CheckStatus = "needs_review";
        if (c.status === "pass") status = "pass";
        else if (c.status === "fail") status = "fail";
        else if (c.status === "unsupported") status = "unsupported";

        checks.push({
          id: c.id,
          clause: c.clause,
          description: c.reason,
          observed:
            typeof c.observed === "number"
              ? c.observed.toFixed(2)
              : typeof c.observed === "object"
              ? JSON.stringify(c.observed)
              : String(c.observed ?? "-"),
          limit:
            typeof c.limit === "number"
              ? c.limit.toFixed(2)
              : typeof c.limit === "object"
              ? JSON.stringify(c.limit)
              : String(c.limit ?? "-"),
          utilization: null,
          status,
          note: c.sources?.join(", ")
        });
      }
    }

    if (scheduleBars.length > 0) {
      const rec = reconcileBeamBars(beam, scheduleBars);
      checks.push(rec.check);
    }

    const sel = "selected" in p09Res && p09Res.selected ? p09Res.selected : null;
    const posCapKnm = sel && "capacities" in sel ? sel.capacities.positive.capacityKnm : 0;
    const negCapKnm = sel && "capacities" in sel ? sel.capacities.negative.capacityKnm : 0;
    const vRdKn =
      sel && "shear" in sel && sel.shear ? (sel.shear.end.endVrKn ?? sel.shear.middle.middleVrKn ?? 0) : 0;

    const allPassed =
      checks.length > 0 &&
      checks.every((c) => c.status === "pass") &&
      p09Res.status === "design_ready";

    return {
      elementId: beam.id,
      floorId: beam.floorId,
      spanM: beam.spanM,
      bwMm: beam.bwMm,
      hMm: beam.hMm,
      concreteGrade: `C${beam.fck}`,
      rebarGrade: `B${beam.fyk}C`,
      designMoments: beam.designMoments,
      capacities: {
        mRdSpanKnm: posCapKnm,
        mRdLeftSupportKnm: negCapKnm,
        mRdRightSupportKnm: negCapKnm,
        vRdKn
      },
      designShearVEdKn: beam.designShearVEdKn,
      axialNEdKn: beam.axialNEdKn ?? 0,
      utilization: {
        spanFlexure: posCapKnm > 0 ? beam.designMoments.mEdSpanKnm / posCapKnm : 1.0,
        supportFlexure:
          negCapKnm > 0
            ? Math.max(
                Math.abs(beam.designMoments.mEdLeftSupportKnm),
                Math.abs(beam.designMoments.mEdRightSupportKnm)
              ) / negCapKnm
            : 1.0,
        shear: vRdKn > 0 ? beam.designShearVEdKn / vRdKn : 1.0
      },
      checks,
      status: allPassed ? "pass" : "fail"
    };
  }

  // Branch B: Evaluated via authentic structural modules (rc-beam-section + beam-detailing beamShearTorsion)
  const mat = getMaterial(beam.fck, beam.fyk);
  const validatedMat = beamMaterial(mat);

  const section: BeamSection = {
    bw: beam.bwMm,
    h: beam.hMm,
    bf: beam.bwMm,
    hf: 0
  };

  const axialN = beam.axialNEdKn ?? 0;

  // 1. Authentic Moment Capacities via non-linear fiber equilibrium (TS 500-7.1)
  const posCap = beamCapacity(section, beam.crossSectionBars, mat, 1, axialN);
  const negCap = beamCapacity(section, beam.crossSectionBars, mat, -1, axialN);

  const mRdSpan = posCap.status === "solved" ? posCap.capacityKnm : 0;
  const mRdSupport = negCap.status === "solved" ? negCap.capacityKnm : 0;

  // 2. Authentic Shear & Torsion Evaluation via validated P09 beam-detailing module
  const d = beam.hMm - beam.coverMm;
  const topBars = beam.crossSectionBars.filter((b) => b.face === "top");
  const botBars = beam.crossSectionBars.filter((b) => b.face === "bottom");

  const layout: BeamLayout = {
    top: { diameter: topBars[0]?.diameter || 12, count: topBars.length || 2, rows: 1 },
    bottom: { diameter: botBars[0]?.diameter || 16, count: botBars.length || 2, rows: 1 },
    stirrupDiameter: beam.stirrupDiameterMm,
    legs: beam.stirrupLegs,
    spacingEnd: beam.stirrupSpacingMm,
    spacingMiddle: beam.stirrupSpacingMm,
    sideDiameter: 12,
    sideEach: 0
  };

  const shearP09 = beamShearTorsion({
    section,
    material: validatedMat,
    d,
    NcompressionKn: axialN,
    Vkn: beam.designShearVEdKn,
    Tknm: 0,
    layout,
    cover: beam.coverMm,
    zeroConcrete: false,
    highDuctility: true
  });

  const finalVRdKn = shearP09.middleVrKn;

  // Utilizations
  const maxSupportMEd = Math.max(
    Math.abs(beam.designMoments.mEdLeftSupportKnm),
    Math.abs(beam.designMoments.mEdRightSupportKnm)
  );
  const utilSpan = mRdSpan > 0 ? beam.designMoments.mEdSpanKnm / mRdSpan : 1.0;
  const utilSupport = mRdSupport > 0 ? maxSupportMEd / mRdSupport : 1.0;
  const utilShear = finalVRdKn > 0 ? beam.designShearVEdKn / finalVRdKn : 1.0;

  const checks: CheckItem[] = [];

  // Check 1: Span Flexure (TS 500-7.1)
  const spanPass = posCap.status === "solved" && mRdSpan >= beam.designMoments.mEdSpanKnm;
  checks.push({
    id: `${beam.id}-flex-span`,
    clause: "TS500-7.1",
    description: `${beam.id} Açıklık Eğilme Kapasitesi Tahkiki (Md ≤ Mr)`,
    observed: `${beam.designMoments.mEdSpanKnm.toFixed(1)} kNm`,
    limit: `${mRdSpan.toFixed(1)} kNm`,
    utilization: utilSpan,
    status: spanPass ? "pass" : "fail"
  });

  // Check 2: Support Flexure (TS 500-7.1)
  const supPass = negCap.status === "solved" && mRdSupport >= maxSupportMEd;
  checks.push({
    id: `${beam.id}-flex-sup`,
    clause: "TS500-7.1",
    description: `${beam.id} Mesnet Eğilme Kapasitesi Tahkiki (Md ≤ Mr)`,
    observed: `${maxSupportMEd.toFixed(1)} kNm`,
    limit: `${mRdSupport.toFixed(1)} kNm`,
    utilization: utilSupport,
    status: supPass ? "pass" : "fail"
  });

  // Check 3: Authentic P09 Beam Shear & Torsion (TS 500-8 & TBDY 7.4.4 / 7.4.5)
  // Replaces duplicate simplified formula; validates stress limit (0.22*fcd), ductility upper limit, spacing, required steel
  checks.push({
    id: `${beam.id}-shear-p09`,
    clause: "TS500-8/TBDY7.4.4",
    description: `${beam.id} Kesme Dayanımı ve Donatı Tahkiki (Vd ≤ Vr, Vc=${shearP09.VcKn.toFixed(1)}kN)`,
    observed: `${beam.designShearVEdKn.toFixed(1)} kN (s=${beam.stirrupSpacingMm}mm)`,
    limit: `${finalVRdKn.toFixed(1)} kN (s_max=${shearP09.spacingLimit.toFixed(0)}mm, s_sarilma=${shearP09.endLimit.toFixed(0)}mm)`,
    utilization: utilShear,
    status: shearP09.passed ? "pass" : "fail",
    note: "P09 beamShearTorsion modülü ile doğrulanmıştır."
  });

  // Check 4: Capacity Design Shear (TBDY 2018 7.4.5)
  // Strict requirement: User-declared free Vd without capacity design derivation MUST NOT claim PASS
  if (beam.seismicCapacityData) {
    const capShearResult = capacityShear({
      gravityLeftKn: beam.seismicCapacityData.gravityLeftKn,
      gravityRightKn: beam.seismicCapacityData.gravityRightKn,
      leftTopCapacity: negCap.status === "solved" ? negCap.capacityKnm : 0,
      leftBottomCapacity: posCap.status === "solved" ? posCap.capacityKnm : 0,
      rightTopCapacity: negCap.status === "solved" ? negCap.capacityKnm : 0,
      rightBottomCapacity: posCap.status === "solved" ? posCap.capacityKnm : 0,
      clearSpanMm: beam.spanM * 1000,
      amplifiedLeftKn: beam.seismicCapacityData.amplifiedLeftKn,
      amplifiedRightKn: beam.seismicCapacityData.amplifiedRightKn
    });

    const governingVe = Math.max(capShearResult.leftKn, capShearResult.rightKn);
    const capPass = governingVe <= finalVRdKn;
    checks.push({
      id: `${beam.id}-capacity-shear`,
      clause: "TBDY-7.4.5",
      description: `${beam.id} Kapasite Kesmesi Tahkiki (Ve = Vdy ± 1.4*(Mpi+Mpj)/Ln ≤ Vr)`,
      observed: `Ve=${governingVe.toFixed(1)} kN`,
      limit: `Vr=${finalVRdKn.toFixed(1)} kN`,
      utilization: finalVRdKn > 0 ? governingVe / finalVRdKn : 1.0,
      status: capPass ? "pass" : "fail",
      note: "TBDY 2018 Madde 7.4.5 kapasite tasarımı formülasyonu."
    });
  } else {
    // Capacity design shear not derived -> MUST be marked unsupported, NEVER fake PASS!
    checks.push({
      id: `${beam.id}-capacity-shear`,
      clause: "TBDY-7.4.5",
      description: `${beam.id} Kapasite Kesmesi ve Süneklik Koşulları (Ve)`,
      observed: `Harici Beyanlı Vd=${beam.designShearVEdKn.toFixed(1)} kN`,
      limit: "TBDY 2018 Denklem 7.9 (Ve = Vdy ± 1.4*(Mpi+Mpj)/Ln)",
      utilization: null,
      status: "unsupported",
      note: "Bu eleman için kapasite kesmesi çözülmemiştir; serbest düşük Vd ile deprem kesme güvenliği (PASS) kabul edilemez."
    });
  }

  // Check 5: Rebar placement & physical schedule reconciliation
  if (scheduleBars.length > 0) {
    const rec = reconcileBeamBars(beam, scheduleBars);
    checks.push(rec.check);
  }

  const allPassed = checks.every((c) => c.status === "pass");

  return {
    elementId: beam.id,
    floorId: beam.floorId,
    spanM: beam.spanM,
    bwMm: beam.bwMm,
    hMm: beam.hMm,
    concreteGrade: `C${beam.fck}`,
    rebarGrade: `B${beam.fyk}C`,
    designMoments: beam.designMoments,
    capacities: {
      mRdSpanKnm: mRdSpan,
      mRdLeftSupportKnm: mRdSupport,
      mRdRightSupportKnm: mRdSupport,
      vRdKn: finalVRdKn
    },
    designShearVEdKn: beam.designShearVEdKn,
    axialNEdKn: axialN,
    utilization: {
      spanFlexure: utilSpan,
      supportFlexure: utilSupport,
      shear: utilShear
    },
    checks,
    status: allPassed ? "pass" : checks.some((c) => c.status === "fail") ? "fail" : "unsupported"
  };
}

/**
 * Executes the full end-to-end report generation pipeline:
 * Input -> P09/P06 Validated Calculations -> Rebar Schedule Reconciliation -> Document Assembly -> PDF Render.
 */
export function generateExplicitProjectReport(
  input: ExplicitProjectReportInput
): ExplicitReportExecutionResult {
  if (!input) {
    throw new Error("ExplicitProjectReportInput cannot be null.");
  }
  if (!input.projectName?.trim()) {
    throw new Error("Project name is required.");
  }
  if (!input.revisionId?.trim()) {
    throw new Error("Revision ID is required.");
  }

  // 1. Revision alignment check across rebar inputs
  for (const bar of input.rebarInputs) {
    if (bar.layoutRevisionId !== input.revisionId) {
      throw new Error(
        `Revision mismatch: Bar '${bar.id}' has layoutRevisionId '${bar.layoutRevisionId}', ` +
        `which does not match project revisionId '${input.revisionId}'`
      );
    }
  }

  // 2. Compute structural beam summaries with bar reconciliation
  const beamSummaries = input.beams.map((b) => evaluateBeam(b, input.rebarInputs));

  // 3. Compute reinforcement schedule (P15)
  const schedule = computeReinforcementSchedule({
    bars: input.rebarInputs,
    projectRevisionId: input.revisionId,
    expectedElements: input.expectedElements,
    explicitZeroElements: input.explicitZeroElements,
    classificationProfile: {
      profileName: "TS500_STANDARD",
      thickThresholdMm: 12
    },
    groupCoverageScope: {
      sourceGroupMappingStatus: "verified"
    }
  });

  // Check reconciliation status across all beams
  const anyReconciliationFailed = beamSummaries.some((b) =>
    b.checks.some((c) => c.id.endsWith("-rebar-reconcile") && c.status !== "pass")
  );

  let effectiveSchedule = schedule;
  if (anyReconciliationFailed) {
    // If reconciliation failed, invalidate total mass
    effectiveSchedule = {
      ...schedule,
      isComplete: false,
      totalMassKg: null
    };
  }

  // 4. Project Fact Metadata Validation (no silent default assumptions)
  const missingMetadataFacts: string[] = [];
  const bType =
    input.buildingType?.trim() ||
    (missingMetadataFacts.push("Yapı Kullanım Türü"), "BİLİNMİYOR (Tanımsız)");
  const sSystem =
    input.structuralSystem?.trim() ||
    (missingMetadataFacts.push("Taşıyıcı Sistem Tipi"), "BİLİNMİYOR (Tanımsız)");
  const sClass =
    input.soilClass?.trim() ||
    (missingMetadataFacts.push("Zemin Sınıfı"), "BİLİNMİYOR (Tanımsız)");
  const eqDts =
    input.earthquakeDts?.trim() ||
    (missingMetadataFacts.push("Deprem Tasarım Sınıfı (DTS)"), "BİLİNMİYOR (Tanımsız)");

  // 5. Project Readiness
  const allBeamsPassed = beamSummaries.every((b) => b.status === "pass");
  const allMetadataComplete = missingMetadataFacts.length === 0;

  const unsupportedFeaturesList = [...(input.unsupportedFeatures || [])];
  if (missingMetadataFacts.length > 0) {
    unsupportedFeaturesList.push(`Eksik Proje Künye Verileri: ${missingMetadataFacts.join(", ")}`);
  }
  if (anyReconciliationFailed) {
    unsupportedFeaturesList.push("Kesit donatısı ile metraj donatısı arasında çap/adet uyumsuzluğu tespit edildi.");
  }
  if (
    beamSummaries.some((b) =>
      b.checks.some((c) => c.id.endsWith("-capacity-shear") && c.status === "unsupported")
    )
  ) {
    unsupportedFeaturesList.push(
      "TBDY 7.4.5 kapasite kesmesi (Ve) türetilmemiş serbest Vd girişli elemanlar mevcuttur; deprem kesme güvenliği onaylanamaz."
    );
  }

  const readinessData: ProjectReadinessData = {
    totalElementsCount: input.expectedElements ? input.expectedElements.length : input.beams.length,
    computedElementsCount: beamSummaries.filter((b) => b.status === "pass" || b.status === "fail").length,
    unresolvedElementsCount:
      effectiveSchedule.unresolvedElementIds.length + (anyReconciliationFailed ? 1 : 0),
    allChecksPassed:
      allBeamsPassed && effectiveSchedule.isComplete && allMetadataComplete && !anyReconciliationFailed,
    unsupportedFeatures: unsupportedFeaturesList,
    notes: [
      "Kiriş tahkikleri P09/P06 doğrulanmış motorları (rc-beam-section, beam-detailing) ile sınırlandırılmış kesit kapasitesi kontrollerini kapsar; tüm bina 3B sonlu elemanlar modal analizi değildir.",
      `Donatı metrajı ${effectiveSchedule.uniqueBars.length} benzersiz poz üzerinden fiziksel eksen boyuyla hesaplanmış ve kesit donatılarıyla birebir mutabakatı denetlenmiştir.`
    ]
  };

  // 6. Metadata & Provenance
  const reviewStatus: ReviewStatus =
    allBeamsPassed && effectiveSchedule.isComplete && allMetadataComplete && !anyReconciliationFailed
      ? "onayli"
      : allBeamsPassed && effectiveSchedule.isComplete
      ? "taslak_muhendis_incelemesi_gerekli"
      : "reddedildi";

  const metadata: ReportMetadata = {
    projectName: input.projectName,
    documentTitle: "BETONARME STATİK HESAP VE DONATI METRAJ RAPORU",
    documentSubtitle: "Sınırlandırılmış Kiriş Tahkikleri (Tüm Bina FE Çözücüsü Değildir)",
    engineerName: input.engineerName,
    organization: input.organization || "Hsyncad Mühendislik Çözümleri",
    date: input.date || new Date().toISOString().slice(0, 10),
    softwareName: "Hsyncad Luna v4",
    softwareVersion: "4.0.0-p16",
    standards: [
      "TS 500:2000 (Betonarme Yapıların Tasarım ve Yapım Kuralları)",
      "TBDY:2018 (Türkiye Bina Deprem Yönetmeliği)"
    ],
    disclaimer:
      "Bu rapor Hsyncad Luna v4 bağımsız mühendislik motoru tarafından derlenmiştir. " +
      "Kiriş hesapları sınırlandırılmış kesit modeli üzerinden yürütülmüş olup tüm bina analizi değildir. " +
      "Tüm sonuçlar yetkili inşaat mühendisi tarafından kontrol edilmelidir.",
    revisionId: input.revisionId,
    reviewStatus,
    buildingDescription: {
      buildingType: bType,
      structuralSystem: sSystem,
      concreteGrade: beamSummaries[0]?.concreteGrade || "BİLİNMİYOR (Tanımsız)",
      rebarGrade: beamSummaries[0]?.rebarGrade || "BİLİNMİYOR (Tanımsız)",
      soilClass: sClass,
      earthquakeDts: eqDts
    }
  };

  const provenance: ReportProvenance = {
    generatedAt: new Date().toISOString(),
    layoutRevisionId: input.revisionId,
    calculationEngine: "Hsyncad Validated Structural Section Engine (P09/P06 & P15 Bridge)"
  };

  // 7. Build ReportDocument
  const document = buildReportDocument({
    metadata,
    provenance,
    beamCalculations: beamSummaries,
    reinforcementSchedule: effectiveSchedule,
    readiness: readinessData,
    customScopeNotes: input.customScopeNotes
  });

  // 8. Render to single PDF
  const renderResult = renderReportDocumentToPdf(document);

  return {
    document,
    renderResult,
    reinforcementSchedule: effectiveSchedule,
    beamSummaries
  };
}
