export type TileDimension = "30x30" | "60x60" | "60x120" | "80x80" | "20x20";

export interface TileDimensionData {
  name: string;
  widthCm: number;
  lengthCm: number;
  boxCoverageM2: number; // Kutu/paket m2'si
  groutKgPerM2: number; // 2-3mm derz için ortalama sarfiyat (kg/m2)
}

export const TILE_DIMENSIONS: Record<TileDimension, TileDimensionData> = {
  "30x30": { name: "30x30 cm", widthCm: 30, lengthCm: 30, boxCoverageM2: 1.08, groutKgPerM2: 0.60 },
  "60x60": { name: "60x60 cm", widthCm: 60, lengthCm: 60, boxCoverageM2: 1.44, groutKgPerM2: 0.35 },
  "60x120": { name: "60x120 cm", widthCm: 60, lengthCm: 120, boxCoverageM2: 1.44, groutKgPerM2: 0.25 },
  "80x80": { name: "80x80 cm", widthCm: 80, lengthCm: 80, boxCoverageM2: 1.28, groutKgPerM2: 0.28 },
  "20x20": { name: "20x20 cm", widthCm: 20, lengthCm: 20, boxCoverageM2: 1.00, groutKgPerM2: 0.80 },
};

export interface TileQuantityInput {
  floorAreaM2: number;
  wallTileAreaM2?: number;
  skirtingLengthM?: number; // Süpürgelik metrajı
  tileDimension: TileDimension;
  wastePercentage?: number; // Varsayılan %8
}

export interface TileQuantityResult {
  totalNetAreaM2: number;
  totalGrossAreaM2: number;
  tileDimensionName: string;
  tileBoxesCount: number;
  adhesiveBags25KgCount: number; // 25kg seramik yapıştırıcısı (~5 kg/m2)
  groutKg: number; // Derz dolgusu
  groutBags5KgCount: number; // 5kg derz dolgu paketi
  skirtingTilesCount?: number;
  notes: string[];
}

export function calculateTileQuantity(input: TileQuantityInput): TileQuantityResult | null {
  const {
    floorAreaM2: floor,
    wallTileAreaM2: wall = 0,
    skirtingLengthM: skirt = 0,
    tileDimension,
    wastePercentage = 8.0,
  } = input;

  if (floor <= 0 && wall <= 0) return null;
  if (!TILE_DIMENSIONS[tileDimension]) return null;

  const dim = TILE_DIMENSIONS[tileDimension];
  const totalNetAreaM2 = floor + wall;
  const wasteFactor = 1 + Math.max(0, wastePercentage) / 100;
  const totalGrossAreaM2 = totalNetAreaM2 * wasteFactor;

  // Paket Sayısı
  const tileBoxesCount = Math.ceil(Number((totalGrossAreaM2 / dim.boxCoverageM2).toFixed(4)));

  // Yapıştırıcı (ortalama 5 kg/m2, 25 kg torba)
  const totalAdhesiveKg = totalGrossAreaM2 * 5.0;
  const adhesiveBags25KgCount = Math.ceil(totalAdhesiveKg / 25.0);

  // Derz Dolgu
  const groutKg = totalNetAreaM2 * dim.groutKgPerM2 * 1.1;
  const groutBags5KgCount = Math.ceil(groutKg / 5.0);

  // Süpürgelik fayansı adedi (fayans boyuna bölünerek)
  const skirtingTilesCount =
    skirt > 0 ? Math.ceil((skirt / (dim.lengthCm / 100)) * 1.1) : undefined;

  const notes = [
    `Net Kaplanacak Yüzey: ${totalNetAreaM2.toFixed(1)} m² (Zemin: ${floor.toFixed(1)} m², Duvar: ${wall.toFixed(1)} m²).`,
    `Seramik Ebadı: ${dim.name} (${dim.boxCoverageM2} m²/kutu).`,
    `Gereken Kutu/Paket Miktarı: ${tileBoxesCount} Kutu (%${wastePercentage} fire dahil, Brüt: ${totalGrossAreaM2.toFixed(1)} m²).`,
    `Seramik Yapıştırıcısı: ~${adhesiveBags25KgCount} torba (25 kg/torba).`,
    `Derz Dolgu Malzemesi: ~${groutKg.toFixed(1)} kg (${groutBags5KgCount} paket 5 kg).`,
    skirtingTilesCount ? `Süpürgelik İhtiyacı (${skirt} mtül): ~${skirtingTilesCount} adet fayans.` : "",
  ].filter(Boolean);

  return {
    totalNetAreaM2,
    totalGrossAreaM2,
    tileDimensionName: dim.name,
    tileBoxesCount,
    adhesiveBags25KgCount,
    groutKg,
    groutBags5KgCount,
    skirtingTilesCount,
    notes,
  };
}
