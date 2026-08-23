import { convertDwgToDxf } from "./converter";
import { normalizeDiagnostics, notificationMessage } from "./diagnostics";
import { loadAcadTsEngine } from "./engine";
import { createCadStructuralSnapshot } from "./snapshot";
import type {
  DwgConversionOptions,
  DwgConversionResult,
  DwgDiagnostic,
  DwgFidelityIssue,
  DwgFidelityValidation,
  DwgStructuralSnapshot,
} from "./types";

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function addMismatch(
  issues: DwgFidelityIssue[],
  code: string,
  message: string,
  sourceValue: unknown,
  outputValue: unknown,
  severity: DwgFidelityIssue["severity"] = "blocking"
): void {
  if (stableJson(sourceValue) === stableJson(outputValue)) return;
  issues.push({ code, severity, message, sourceValue, outputValue });
}

function coordinateMatches(source: number, output: number): boolean {
  const tolerance = Math.max(1e-7, Math.abs(source) * 1e-9, Math.abs(output) * 1e-9);
  return Math.abs(source - output) <= tolerance;
}

function extentsMatch(source: DwgStructuralSnapshot["extents"], output: DwgStructuralSnapshot["extents"]): boolean {
  if (source === null || output === null) return source === output;
  for (let index = 0; index < 3; index += 1) {
    if (!coordinateMatches(source.min[index], output.min[index])) return false;
    if (!coordinateMatches(source.max[index], output.max[index])) return false;
  }
  return true;
}

function diagnosticSeverity(diagnostic: DwgDiagnostic): DwgFidelityIssue["severity"] {
  if (
    diagnostic.category === "unsupported-feature" ||
    diagnostic.category === "unknown-object" ||
    diagnostic.category === "missing-reference"
  ) {
    return "blocking";
  }
  return "warning";
}

function addDiagnosticIssues(
  issues: DwgFidelityIssue[],
  prefix: "SOURCE" | "OUTPUT",
  diagnostics: DwgDiagnostic[]
): void {
  for (const diagnostic of diagnostics) {
    issues.push({
      code: `${prefix}_${diagnostic.code}`,
      severity: diagnosticSeverity(diagnostic),
      message: `${prefix === "SOURCE" ? "DWG okuma/yazma" : "DXF yeniden okuma"} uyarısı: ${diagnostic.message}`,
      sourceValue: diagnostic.occurrences,
    });
  }
}

function compareSnapshots(
  source: DwgStructuralSnapshot,
  output: DwgStructuralSnapshot,
  sourceDiagnostics: DwgDiagnostic[],
  outputDiagnostics: DwgDiagnostic[]
): DwgFidelityIssue[] {
  const issues: DwgFidelityIssue[] = [];

  addMismatch(issues, "ENTITY_COUNT_MISMATCH", "Toplam entity sayısı dönüşümde değişti.", source.entityCount, output.entityCount);
  addMismatch(issues, "MODELSPACE_COUNT_MISMATCH", "Model space entity sayısı dönüşümde değişti.", source.modelSpaceEntityCount, output.modelSpaceEntityCount);
  addMismatch(issues, "PAPERSPACE_COUNT_MISMATCH", "Paper space entity sayısı dönüşümde değişti.", source.paperSpaceEntityCount, output.paperSpaceEntityCount);
  addMismatch(issues, "BLOCK_ENTITY_COUNT_MISMATCH", "Block içi entity sayısı dönüşümde değişti.", source.blockEntityCount, output.blockEntityCount);
  addMismatch(issues, "ENTITY_TYPES_MISMATCH", "Entity tür/sayı dağılımı dönüşümde değişti.", source.entityTypes, output.entityTypes);
  addMismatch(issues, "LAYER_NAMES_MISMATCH", "Layer kümesi dönüşümde değişti.", source.layerNames, output.layerNames);
  addMismatch(issues, "BLOCK_NAMES_MISMATCH", "Block tanımları dönüşümde değişti.", source.blockNames, output.blockNames);
  addMismatch(issues, "LINE_TYPE_MISMATCH", "Linetype semantiği dönüşümde değişti.", source.lineTypes, output.lineTypes);
  addMismatch(issues, "LINE_WEIGHT_MISMATCH", "Lineweight semantiği dönüşümde değişti.", source.lineWeights, output.lineWeights);
  addMismatch(issues, "COLOR_SEMANTICS_MISMATCH", "ACI/TrueColor/BYLAYER/BYBLOCK renk semantiği dönüşümde değişti.", source.colors, output.colors);
  addMismatch(issues, "XDATA_COUNT_MISMATCH", "XData taşıyan entity sayısı dönüşümde değişti.", source.xDataEntityCount, output.xDataEntityCount);
  addMismatch(issues, "XREF_COUNT_MISMATCH", "XREF block sayısı dönüşümde değişti.", source.xrefBlockCount, output.xrefBlockCount);

  if (!extentsMatch(source.extents, output.extents)) {
    issues.push({
      code: "EXTENTS_MISMATCH",
      severity: "blocking",
      message: "Model space geometrik extents dönüşümde tolerans dışı değişti.",
      sourceValue: source.extents,
      outputValue: output.extents,
    });
  }

  if (source.xrefBlockCount > 0) {
    issues.push({
      code: "SOURCE_HAS_XREF",
      severity: "warning",
      message: `${source.xrefBlockCount} XREF block bulundu; harici referans içeriği ayrıca doğrulanmalıdır.`,
      sourceValue: source.xrefBlockCount,
    });
  }

  if (source.proxyGeometryEntityCount > 0 || output.proxyGeometryEntityCount > 0) {
    issues.push({
      code: "PROXY_GEOMETRY_PRESENT",
      severity: "warning",
      message: "Proxy/custom geometry bulundu; native AutoCAD nesnesi sadakati yalnız bu hızlı dönüştürücüyle garanti edilemez.",
      sourceValue: source.proxyGeometryEntityCount,
      outputValue: output.proxyGeometryEntityCount,
    });
  }

  if (source.boundingBoxUnavailableCount > 0 || output.boundingBoxUnavailableCount > 0) {
    issues.push({
      code: "PARTIAL_BOUNDING_BOX_COVERAGE",
      severity: "warning",
      message: "Bazı model-space entity'lerinde bounding box üretilemedi; extents denetimi kısmi kapsamdadır.",
      sourceValue: source.boundingBoxUnavailableCount,
      outputValue: output.boundingBoxUnavailableCount,
    });
  }

  addDiagnosticIssues(issues, "SOURCE", sourceDiagnostics);
  addDiagnosticIssues(issues, "OUTPUT", outputDiagnostics);
  return issues;
}

export async function validateDwgToDxfConversion(
  conversion: DwgConversionResult
): Promise<DwgFidelityValidation> {
  const acad = await loadAcadTsEngine();
  const outputReadMessages: string[] = [];

  try {
    const outputDocument = acad.DxfReader.readFromStream(
      conversion.dxfBytes,
      (_sender, event) => outputReadMessages.push(notificationMessage(event))
    );
    const outputSnapshot = createCadStructuralSnapshot(outputDocument);
    const outputDiagnostics = normalizeDiagnostics(outputReadMessages, []);
    const issues = compareSnapshots(
      conversion.sourceSnapshot,
      outputSnapshot,
      conversion.diagnostics,
      outputDiagnostics
    );
    const decision = issues.some((issue) => issue.severity === "blocking")
      ? "REJECT"
      : issues.length > 0
        ? "WARN"
        : "PASS";

    return {
      decision,
      source: conversion.sourceSnapshot,
      output: outputSnapshot,
      issues,
      outputDiagnostics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      decision: "REJECT",
      source: conversion.sourceSnapshot,
      output: null,
      issues: [{
        code: "DXF_REPARSE_FAILED",
        severity: "blocking",
        message: `Üretilen DXF yeniden okunamadı: ${message}`,
      }],
      outputDiagnostics: normalizeDiagnostics(outputReadMessages, []),
    };
  }
}

export async function convertAndValidateDwgToDxf(
  input: Uint8Array | ArrayBuffer,
  options: DwgConversionOptions = {}
): Promise<{ conversion: DwgConversionResult; validation: DwgFidelityValidation }> {
  const conversion = await convertDwgToDxf(input, options);
  const validation = await validateDwgToDxfConversion(conversion);
  return { conversion, validation };
}