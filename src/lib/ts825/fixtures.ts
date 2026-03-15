import { calculateExternalWallInsulation } from "@/lib/ts825/calculator";

interface InsulationFixture {
  id: string;
  provinceId: string;
  districtId?: string;
  wallPresetId: string;
  materialId: "eps" | "xps" | "rockwool";
  note: string;
}

export const INSULATION_CALCULATOR_FIXTURES: InsulationFixture[] = [
  {
    id: "yozgat-default",
    provinceId: "66",
    wallPresetId: "brick-infill",
    materialId: "eps",
    note: "Yozgat açılışta geçerli sonuç üretmelidir.",
  },
  {
    id: "adana-pozanti",
    provinceId: "01",
    districtId: "pozanti",
    wallPresetId: "brick-infill",
    materialId: "xps",
    note: "Bölgesi ayrışan il seçildiğinde ilçe override sonucu değiştirmelidir.",
  },
  {
    id: "antalya-gazbeton",
    provinceId: "07",
    districtId: "varsayilan",
    wallPresetId: "aac-wall",
    materialId: "eps",
    note: "Ilıman bölgede güçlü duvar kurgusu ilave yalıtımsız yeterli senaryoyu temsil eder.",
  },
] as const;

export const INSULATION_CALCULATOR_FIXTURE_SNAPSHOTS = INSULATION_CALCULATOR_FIXTURES.map((fixture) => ({
  ...fixture,
  result: calculateExternalWallInsulation(
    fixture.provinceId,
    fixture.wallPresetId,
    fixture.materialId,
    fixture.districtId,
  ),
}));
