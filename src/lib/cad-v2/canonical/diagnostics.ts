// ============================================================================
// DWG/DXF MOTOR V2 — CANONICAL DIAGNOSTICS & PROVENANCE ACCOUNTING (P01)
// ============================================================================
// Bu modül CAD kaynak ayrıştırma ve sahne derleme sürecindeki gerçek kalite
// durumunu, en erken kayıp noktalarını ve diagnostik muhasebesini yönetir.
// Sabit "exact" ve 0 diagnostik bildirimini engeller.

import type { CadCanonicalDocument, CadDiagnostic, CadEntity } from "./types";

export const CadDiagnosticCode = {
  // Kaynak / Dekoder Uyarıları
  DECODER_WARNING_68: "DECODER_WARNING_68",
  DECODER_UNKNOWN_SCOPE: "DECODER_UNKNOWN_SCOPE",
  UNIT_MAPPING_MISMATCH: "UNIT_MAPPING_MISMATCH",

  // Model & Semantik Dönüşüm Kusurları
  EMPTY_HATCH_LOOPS: "EMPTY_HATCH_LOOPS",
  DIMENSION_CONVERTED_TO_INSERT: "DIMENSION_CONVERTED_TO_INSERT",
  DIMENSION_SYNTHESIZED_FROM_DEFINITION: "DIMENSION_SYNTHESIZED_FROM_DEFINITION",
  LEADER_FEATURE_DEGRADED: "LEADER_FEATURE_DEGRADED",
  DROPPED_TEXT_IN_BLOCK: "DROPPED_TEXT_IN_BLOCK",
  INVISIBLE_BLOCK_CHILDREN: "INVISIBLE_BLOCK_CHILDREN",
  NON_DEFAULT_EXTRUSION_OCS: "NON_DEFAULT_EXTRUSION_OCS",

  // Yapısal Hatalar
  MISSING_BLOCK_DEFINITION: "MISSING_BLOCK_DEFINITION",
  UNRESOLVED_XREF: "UNRESOLVED_XREF",
  UNSUPPORTED_ENTITY_TYPE: "UNSUPPORTED_ENTITY_TYPE",
  EXPANSION_BUDGET_EXCEEDED: "EXPANSION_BUDGET_EXCEEDED",
  CURVE_REFINEMENT_LIMIT_REACHED: "CURVE_REFINEMENT_LIMIT_REACHED",
  CURVE_GEOMETRY_INVALID: "CURVE_GEOMETRY_INVALID",
  CHUNK_QUANTIZATION_LIMIT_REACHED: "CHUNK_QUANTIZATION_LIMIT_REACHED",
  CURVE_ENCODED_PRECISION_LIMIT_REACHED: "CURVE_ENCODED_PRECISION_LIMIT_REACHED",
  CURVE_SIDECAR_PRECISION_LIMIT_REACHED: "CURVE_SIDECAR_PRECISION_LIMIT_REACHED",
  PATH_DISTANCE_PRECISION_LIMIT_REACHED: "PATH_DISTANCE_PRECISION_LIMIT_REACHED",
  HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED: "HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED",
  HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED: "HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED",
  CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED: "CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED",
  ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED: "ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED",
  SPLINE_CURVE_TESSELLATION_LIMIT_REACHED: "SPLINE_CURVE_TESSELLATION_LIMIT_REACHED",
  BULGE_CURVE_TESSELLATION_LIMIT_REACHED: "BULGE_CURVE_TESSELLATION_LIMIT_REACHED",

  // Yazı Tipi & Font Kusurları
  FONT_SUBSTITUTE_APPLIED: "FONT_SUBSTITUTE_APPLIED",
  FONT_MISSING: "FONT_MISSING",
  FONT_GLYPH_MISSING: "FONT_GLYPH_MISSING",
} as const;

export type CadDiagnosticCodeType = (typeof CadDiagnosticCode)[keyof typeof CadDiagnosticCode];

export interface CadProvenanceSummary {
  rawSupportedCount: number;
  rawUnsupportedCount: number;
  rawInvalidCount: number;
  canonicalTopCount: number;
  canonicalInstanceVisits: number;
  emptyHatchCount: number;
  convertedDimensionCount: number;
  droppedBlockTextCount: number;
  invisibleBlockChildrenCount: number;
  nonDefaultExtrusionsCount: number;
  missingBlockCount: number;
  unsupportedTypeCount: number;
  qualityStatus: "exact" | "degraded";
  diagnosticCodes: string[];
}

export interface QualityEvaluationResult {
  qualityStatus: "exact" | "degraded";
  diagnosticCodes: string[];
  provenance: CadProvenanceSummary;
}

/**
 * Bir canonical belgenin doğruluğunu, eksikliklerini ve semantik kayıplarını
 * denetleyerek dürüst bir kalite değerlendirmesi ve tanı özeti üretir.
 */
export function evaluateDocumentQuality(
  doc: CadCanonicalDocument,
  rawStats?: {
    rawHeaderInsunits?: number;
    rawEntitiesCount?: number;
    decoderWarningCounts?: Record<string, number>;
  }
): QualityEvaluationResult {
  const diagnosticCodes = new Set<string>();

  let emptyHatchCount = 0;
  let convertedDimensionCount = 0;
  let droppedBlockTextCount = 0;
  let invisibleBlockChildrenCount = 0;
  let nonDefaultExtrusionsCount = 0;
  let missingBlockCount = 0;
  let unresolvedXrefCount = 0;
  let unsupportedTypeCount = 0;

  // 1. Üst seviye model alanı varlıklarını denetle
  const topEntities = doc.modelSpaceEntities || [];
  for (const ent of topEntities) {
    if (ent.type === "HATCH") {
      if (!ent.loops || ent.loops.length === 0) {
        emptyHatchCount++;
      }
    } else if (ent.type === "INSERT") {
      // Anonim DIMENSION bloğu mu?
      if (ent.blockName && ent.blockName.startsWith("*D")) {
        convertedDimensionCount++;
      }
    }
  }

  // 2. Blok tanımları içerisindeki semantik kayıp ve görünmezlik durumlarını denetle
  const blocks = doc.blocks || {};

  for (const bDef of Object.values(blocks)) {
    if (!bDef || !Array.isArray(bDef.entities)) continue;

    for (const child of bDef.entities) {
      if (child.visible === false) {
        invisibleBlockChildrenCount++;
      }
      if (child.type === "TEXT" || child.type === "MTEXT") {
        // Blok içindeki metinler mevcut derleyicide atlanmaktadır (P06'ya kadar)
        droppedBlockTextCount++;
      }
      if (child.type === "HATCH") {
        if (!child.loops || child.loops.length === 0) {
          emptyHatchCount++;
        }
      }
    }
  }

  // Follow only reachable INSERTs so unused block definitions do not degrade
  // the scene, while nested unresolved XREFs remain visible in quality status.
  const pendingBlocks = topEntities.filter((ent) => ent.type === "INSERT").map((ent) => ent.blockName);
  const visitedBlocks = new Set<string>();
  while (pendingBlocks.length > 0) {
    const blockName = pendingBlocks.pop()!;
    if (visitedBlocks.has(blockName)) continue;
    visitedBlocks.add(blockName);
    const block = blocks[blockName];
    if (!block) {
      missingBlockCount++;
      continue;
    }
    if (block.isXref && (!Array.isArray(block.entities) || block.entities.length === 0)) {
      missingBlockCount++;
      unresolvedXrefCount++;
      continue;
    }
    for (const child of block.entities || []) {
      if (child.type === "INSERT") pendingBlocks.push(child.blockName);
    }
  }

  // 3. Kod kusurlarını diagnostik kodlarına dönüştür
  if (emptyHatchCount > 0) {
    diagnosticCodes.add(CadDiagnosticCode.EMPTY_HATCH_LOOPS);
  }
  if (missingBlockCount > 0) {
    diagnosticCodes.add(CadDiagnosticCode.MISSING_BLOCK_DEFINITION);
  }
  if (unresolvedXrefCount > 0) {
    diagnosticCodes.add(CadDiagnosticCode.UNRESOLVED_XREF);
  }
  if (droppedBlockTextCount > 0) {
    diagnosticCodes.add(CadDiagnosticCode.DROPPED_TEXT_IN_BLOCK);
  }
  if (invisibleBlockChildrenCount > 0) {
    diagnosticCodes.add(CadDiagnosticCode.INVISIBLE_BLOCK_CHILDREN);
  }
  if (convertedDimensionCount > 0) {
    diagnosticCodes.add(CadDiagnosticCode.DIMENSION_CONVERTED_TO_INSERT);
  }

  // Belgedeki mevcut diagnostics kayıtlarını ekle
  if (Array.isArray(doc.diagnostics)) {
    for (const d of doc.diagnostics) {
      if (d.code) {
        diagnosticCodes.add(d.code);
      }
    }
  }

  // Ham istatistik kontrolleri
  if (rawStats?.rawHeaderInsunits != null && doc.units !== rawStats.rawHeaderInsunits) {
    diagnosticCodes.add(CadDiagnosticCode.UNIT_MAPPING_MISMATCH);
  }

  // 4. Kalite Durumu Tayini:
  // Boş HATCH, eksik blok, blok içi metin kaybı veya görünmez çocuk gibi
  // bilinen somut kayıplar varsa kalite 'exact' OLAMAZ; 'degraded' olmalıdır.
  const isDegraded =
    emptyHatchCount > 0 ||
    missingBlockCount > 0 ||
    droppedBlockTextCount > 0 ||
    diagnosticCodes.size > 0;

  const qualityStatus: "exact" | "degraded" = isDegraded ? "degraded" : "exact";

  const provenance: CadProvenanceSummary = {
    rawSupportedCount: topEntities.length,
    rawUnsupportedCount: unsupportedTypeCount,
    rawInvalidCount: 0,
    canonicalTopCount: topEntities.length,
    canonicalInstanceVisits: topEntities.length, // baseline
    emptyHatchCount,
    convertedDimensionCount,
    droppedBlockTextCount,
    invisibleBlockChildrenCount,
    nonDefaultExtrusionsCount,
    missingBlockCount,
    unsupportedTypeCount,
    qualityStatus,
    diagnosticCodes: Array.from(diagnosticCodes),
  };

  return {
    qualityStatus,
    diagnosticCodes: Array.from(diagnosticCodes),
    provenance,
  };
}
