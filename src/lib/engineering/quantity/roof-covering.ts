export type RoofCoveringType =
  | "marsilya_tile"
  | "concrete_tile"
  | "sandwich_panel"
  | "shingle";

export interface RoofCoveringData {
  name: string;
  unitCoverageRate: number; // adet/m2 veya paket/m2
  unitLabel: string;
}

export const ROOF_COVERINGS: Record<RoofCoveringType, RoofCoveringData> = {
  marsilya_tile: { name: "Marsilya Kiremit", unitCoverageRate: 15.0, unitLabel: "Adet Kiremit" },
  concrete_tile: { name: "Beton Kiremit", unitCoverageRate: 10.0, unitLabel: "Adet Kiremit" },
  sandwich_panel: { name: "Sandviç Panel", unitCoverageRate: 1.0, unitLabel: "m² Panel" },
  shingle: { name: "Asfalt Shingle", unitCoverageRate: 0.334, unitLabel: "Paket (3 m²/paket)" },
};

export interface RoofCoveringInput {
  horizontalAreaM2: number;
  slopePercentage: number; // Çatı eğimi (örn: %33)
  coveringType: RoofCoveringType;
  ridgeLengthM?: number; // Mahya boyu (mtül)
  wastePercentage?: number; // Varsayılan %7
}

export interface RoofCoveringResult {
  horizontalAreaM2: number;
  slopeAngleDeg: number;
  slopedRoofAreaM2: number;
  materialName: string;
  totalMaterialUnitsCount: number;
  unitLabel: string;
  membraneRollsCount: number; // Su yalıtım örtüsü (10m x 1m = 10m2/rulo)
  ridgeTilesCount?: number; // Mahya kiremidi (3 adet / mtül)
  notes: string[];
}

export function calculateRoofCovering(input: RoofCoveringInput): RoofCoveringResult | null {
  const {
    horizontalAreaM2: Aplan,
    slopePercentage: slopePct,
    coveringType,
    ridgeLengthM = 0,
    wastePercentage = 7.0,
  } = input;

  if (Aplan <= 0 || slopePct <= 0 || !ROOF_COVERINGS[coveringType]) return null;

  const slopeRad = Math.atan(slopePct / 100);
  const slopeAngleDeg = (slopeRad * 180) / Math.PI;

  // Eğimli Gerçek Yüzey Alanı: Aslope = Aplan / cos(slopeRad)
  const slopedRoofAreaM2 = Aplan / Math.cos(slopeRad);

  const mat = ROOF_COVERINGS[coveringType];
  const wasteFactor = 1 + Math.max(0, wastePercentage) / 100;

  const totalMaterialUnitsCount = Math.ceil(slopedRoofAreaM2 * mat.unitCoverageRate * wasteFactor);

  // Buhar dengeleyici / su yalıtım membranı (1 rulo = 10 m2)
  const membraneRollsCount = Math.ceil((slopedRoofAreaM2 * 1.1) / 10.0);

  // Mahya kiremidi (3 adet/mtül)
  const ridgeTilesCount = ridgeLengthM > 0 ? Math.ceil(ridgeLengthM * 3.0 * 1.05) : undefined;

  const notes = [
    `Yatay İzdüşüm Alanı: ${Aplan} m², Eğim: %${slopePct} (${slopeAngleDeg.toFixed(1)}°).`,
    `Gerçek Eğimli Çatı Yüzey Alanı: ${slopedRoofAreaM2.toFixed(1)} m² (+%${((slopedRoofAreaM2 / Aplan - 1) * 100).toFixed(1)} eğim farkı).`,
    `Kaplama Miktarı (${mat.name}): ${totalMaterialUnitsCount} ${mat.unitLabel} (%${wastePercentage} fire dahil).`,
    `Su Yalıtım Örtüsü: ~${membraneRollsCount} rulo (10 m²/rulo, bindirme dahil).`,
    ridgeTilesCount ? `Mahya Kiremidi (${ridgeLengthM} m mahya): ${ridgeTilesCount} adet.` : "",
  ].filter(Boolean);

  return {
    horizontalAreaM2: Aplan,
    slopeAngleDeg,
    slopedRoofAreaM2,
    materialName: mat.name,
    totalMaterialUnitsCount,
    unitLabel: mat.unitLabel,
    membraneRollsCount,
    ridgeTilesCount,
    notes,
  };
}
