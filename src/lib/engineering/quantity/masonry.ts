export type MasonryMaterialType =
  | "brick_13_5"
  | "brick_8_5"
  | "bims_15"
  | "bims_20"
  | "ytong_15"
  | "ytong_20";

export interface MasonryMaterialData {
  name: string;
  piecesPerM2: number;
  thicknessCm: number;
  mortarPerM2M3: number; // Harç hacmi m3/m2
  adhesiveBagPerM2?: number; // Gazbeton yapıştırıcı torba/m2
}

export const MASONRY_MATERIALS: Record<MasonryMaterialType, MasonryMaterialData> = {
  brick_13_5: {
    name: "Tuğla (19x19x13.5 cm)",
    piecesPerM2: 25.0,
    thicknessCm: 13.5,
    mortarPerM2M3: 0.025,
  },
  brick_8_5: {
    name: "Tuğla (19x19x8.5 cm)",
    piecesPerM2: 25.0,
    thicknessCm: 8.5,
    mortarPerM2M3: 0.018,
  },
  bims_15: {
    name: "Bims Blok (39x19x15 cm)",
    piecesPerM2: 13.0,
    thicknessCm: 15.0,
    mortarPerM2M3: 0.020,
  },
  bims_20: {
    name: "Bims Blok (39x19x20 cm)",
    piecesPerM2: 13.0,
    thicknessCm: 20.0,
    mortarPerM2M3: 0.028,
  },
  ytong_15: {
    name: "Gazbeton (60x25x15 cm)",
    piecesPerM2: 6.7,
    thicknessCm: 15.0,
    mortarPerM2M3: 0.003,
    adhesiveBagPerM2: 0.20, // 25kg torba / 5 m2
  },
  ytong_20: {
    name: "Gazbeton (60x25x20 cm)",
    piecesPerM2: 6.7,
    thicknessCm: 20.0,
    mortarPerM2M3: 0.004,
    adhesiveBagPerM2: 0.25,
  },
};

export interface MasonryQuantityInput {
  wallLengthM: number;
  wallHeightM: number;
  openingsCount?: number;
  openingWidthM?: number;
  openingHeightM?: number;
  materialType: MasonryMaterialType;
  wastePercentage?: number; // Fire payı (varsayılan %5)
}

export interface MasonryQuantityResult {
  grossAreaM2: number;
  openingsAreaM2: number;
  netAreaM2: number;
  materialName: string;
  totalPiecesCount: number;
  mortarVolumeM3: number;
  adhesiveBagsCount?: number;
  notes: string[];
}

export function calculateMasonryQuantity(input: MasonryQuantityInput): MasonryQuantityResult | null {
  const {
    wallLengthM: L,
    wallHeightM: H,
    openingsCount = 0,
    openingWidthM = 0,
    openingHeightM = 0,
    materialType,
    wastePercentage = 5.0,
  } = input;

  if (L <= 0 || H <= 0 || !MASONRY_MATERIALS[materialType]) return null;

  const mat = MASONRY_MATERIALS[materialType];
  const grossAreaM2 = L * H;
  const openingsAreaM2 = openingsCount * openingWidthM * openingHeightM;
  const netAreaM2 = Math.max(0, grossAreaM2 - openingsAreaM2);

  const wasteFactor = 1 + Math.max(0, wastePercentage) / 100;
  const totalPiecesCount = Math.ceil(netAreaM2 * mat.piecesPerM2 * wasteFactor);

  const mortarVolumeM3 = netAreaM2 * mat.mortarPerM2M3 * wasteFactor;
  const adhesiveBagsCount = mat.adhesiveBagPerM2
    ? Math.ceil(netAreaM2 * mat.adhesiveBagPerM2 * wasteFactor)
    : undefined;

  const notes = [
    `Duvar Alanı: ${grossAreaM2.toFixed(1)} m² brüt - ${openingsAreaM2.toFixed(1)} m² boşluk = ${netAreaM2.toFixed(1)} m² net.`,
    `Malzeme: ${mat.name} (${mat.piecesPerM2} adet/m²).`,
    `Gereken Blok/Tuğla Miktarı: ${totalPiecesCount} adet (%${wastePercentage} fire dahil).`,
    mat.adhesiveBagPerM2 && adhesiveBagsCount
      ? `Gazbeton Yapıştırıcısı: ~${adhesiveBagsCount} torba (25 kg/torba).`
      : `Duvar Harcı Hacmi: ~${mortarVolumeM3.toFixed(2)} m³ çimento-kum harcı.`,
  ];

  return {
    grossAreaM2,
    openingsAreaM2,
    netAreaM2,
    materialName: mat.name,
    totalPiecesCount,
    mortarVolumeM3,
    adhesiveBagsCount,
    notes,
  };
}
