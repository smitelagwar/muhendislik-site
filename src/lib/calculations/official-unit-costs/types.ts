export type OfficialCostYear = 2026;
export type OfficialCostGroupCode = "I" | "II" | "III" | "IV" | "V";
export type OfficialCostClassCode = "A" | "B" | "C" | "D" | "E";

export interface OfficialCostSelection {
  yil: OfficialCostYear;
  grup: OfficialCostGroupCode;
  sinif: OfficialCostClassCode;
}

export interface OfficialCostRow {
  yil: OfficialCostYear;
  anaGrupKodu: OfficialCostGroupCode;
  anaGrupAdi: string;
  altGrupKodu: OfficialCostClassCode;
  altGrupAdi: string;
  sinifKodu: `${OfficialCostGroupCode}-${OfficialCostClassCode}`;
  sinifAdi: string;
  m2BirimMaliyet: number;
  ornekYapilar: string[];
  kaynakPdf: string;
  kaynakUrl: string;
  kaynakSayfaVeyaBolum: string;
  not: string;
}

export interface OfficialCostResultSnapshot {
  selection: OfficialCostSelection;
  row: OfficialCostRow;
  toplamInsaatAlani: number;
  resmiToplamMaliyet: number;
  formula: string;
}
