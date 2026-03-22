import { calculateOfficialUnitCost, type OfficialCostSelection } from "@/lib/calculations/official-unit-costs";
import { AUTO_BENCHMARK_MAP } from "./config";
import type { BenchmarkComparison, ProjectInputsV2 } from "./types";

function getSelectionLabel(selection: OfficialCostSelection | null): string {
  if (!selection) {
    return "Resmî benchmark seçilmedi";
  }

  return `Resmî referans ${selection.grup}-${selection.sinif}`;
}

export function resolveOfficialSelection(inputs: ProjectInputsV2): OfficialCostSelection | null {
  if (inputs.reference.officialSelection) {
    return inputs.reference.officialSelection;
  }

  const baseSelection = AUTO_BENCHMARK_MAP[inputs.structureKind]?.[inputs.qualityLevel] ?? null;
  if (!baseSelection) {
    return null;
  }

  if (inputs.structureKind === "apartman" && inputs.floorCount >= 16) {
    return { yil: 2026, grup: "IV", sinif: "A" };
  }

  if (inputs.structureKind === "apartman" && inputs.floorCount >= 9) {
    return { yil: 2026, grup: "III", sinif: "C" };
  }

  if (inputs.structureKind === "ticari" && inputs.qualityLevel !== "ekonomik") {
    return inputs.floorCount >= 6
      ? { yil: 2026, grup: "IV", sinif: "B" }
      : { yil: 2026, grup: "III", sinif: "C" };
  }

  if (inputs.structureKind === "ofis" && inputs.floorCount >= 8) {
    return { yil: 2026, grup: "IV", sinif: "C" };
  }

  return baseSelection;
}

export function buildBenchmarkComparison(
  inputs: ProjectInputsV2,
  physicalArea: number,
  grandTotal: number,
  reasonCandidates: string[]
): BenchmarkComparison {
  const selection = resolveOfficialSelection(inputs);
  const officialResult =
    selection && physicalArea > 0 ? calculateOfficialUnitCost(selection, physicalArea) : null;

  if (!officialResult) {
    return {
      selection,
      label: getSelectionLabel(selection),
      officialUnitCost: 0,
      officialTotal: 0,
      delta: grandTotal,
      deltaPct: 0,
      status: "aligned",
      reasons: reasonCandidates.slice(0, 4),
      officialResult: null,
    };
  }

  const delta = grandTotal - officialResult.resmiToplamMaliyet;
  const deltaPct =
    officialResult.resmiToplamMaliyet > 0 ? delta / officialResult.resmiToplamMaliyet : 0;

  return {
    selection,
    label: `${getSelectionLabel(selection)} · ${officialResult.row.sinifAdi}`,
    officialUnitCost: officialResult.row.m2BirimMaliyet,
    officialTotal: officialResult.resmiToplamMaliyet,
    delta,
    deltaPct,
    status: deltaPct < -0.08 ? "low" : deltaPct > 0.08 ? "high" : "aligned",
    reasons: reasonCandidates.slice(0, 4),
    officialResult,
  };
}
