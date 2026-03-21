import { OFFICIAL_UNIT_COSTS_2026, OFFICIAL_UNIT_COST_SOURCE_2026 } from "./official-unit-costs-2026";
import type {
  OfficialCostClassCode,
  OfficialCostGroupCode,
  OfficialCostResultSnapshot,
  OfficialCostRow,
  OfficialCostSelection,
  OfficialCostYear,
} from "./types";

export * from "./types";
export { OFFICIAL_UNIT_COSTS_2026, OFFICIAL_UNIT_COST_SOURCE_2026 };
export * from "./guided-options";

export function getOfficialUnitCostsByYear(yil: OfficialCostYear): OfficialCostRow[] {
  if (yil === 2026) {
    return OFFICIAL_UNIT_COSTS_2026;
  }

  return [];
}

export function getOfficialCostGroups(yil: OfficialCostYear): OfficialCostGroupCode[] {
  return [...new Set(getOfficialUnitCostsByYear(yil).map((row) => row.anaGrupKodu))];
}

export function getOfficialCostClasses(
  yil: OfficialCostYear,
  grup: OfficialCostGroupCode
): OfficialCostClassCode[] {
  return [
    ...new Set(
      getOfficialUnitCostsByYear(yil)
        .filter((row) => row.anaGrupKodu === grup)
        .map((row) => row.altGrupKodu)
    ),
  ];
}

export function getOfficialCostRow(selection: OfficialCostSelection): OfficialCostRow | null {
  return (
    getOfficialUnitCostsByYear(selection.yil).find(
      (row) =>
        row.anaGrupKodu === selection.grup &&
        row.altGrupKodu === selection.sinif
    ) ?? null
  );
}

export function calculateOfficialUnitCost(
  selection: OfficialCostSelection,
  toplamInsaatAlani: number
): OfficialCostResultSnapshot | null {
  const row = getOfficialCostRow(selection);
  if (!row) {
    return null;
  }

  const safeArea = Number.isFinite(toplamInsaatAlani) && toplamInsaatAlani > 0 ? toplamInsaatAlani : 0;

  return {
    selection,
    row,
    toplamInsaatAlani: safeArea,
    resmiToplamMaliyet: safeArea * row.m2BirimMaliyet,
    formula: "Toplam insaat alani x resmi m2 birim maliyeti",
  };
}
