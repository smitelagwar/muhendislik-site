export type FormworkSystemType = "plywood" | "timber_boards" | "steel_panel";

export interface FormworkQuantityInput {
  storyFloorAreaM2: number;
  storyCount: number;
  floorHeightM: number;
  formworkToFloorRatio?: number; // Varsayılan 2.5 m2 kalıp / m2 kat alanı
  systemType?: FormworkSystemType;
}

export interface FormworkQuantityResult {
  singleStoryFormworkAreaM2: number;
  totalBuildingFormworkAreaM2: number;
  scaffoldingVolumeM3: number;
  telescopicPropsCount: number; // Teleskopik dikme adedi (~1.2 adet / m2)
  plywoodSheetsCount: number; // 250x125 cm (3.125 m2/plaka)
  notes: string[];
}

export function calculateFormworkQuantity(input: FormworkQuantityInput): FormworkQuantityResult | null {
  const {
    storyFloorAreaM2: floorArea,
    storyCount: stories,
    floorHeightM: height,
    formworkToFloorRatio = 2.5,
    systemType = "plywood",
  } = input;

  if (floorArea <= 0 || stories <= 0 || height <= 0) return null;

  const singleStoryFormworkAreaM2 = floorArea * formworkToFloorRatio;
  const totalBuildingFormworkAreaM2 = singleStoryFormworkAreaM2 * stories;

  // İskele hacmi (tek kat döşeme altı çalışma alanı)
  const scaffoldingVolumeM3 = floorArea * height;

  // Teleskopik dikme (döşeme altı ortalama 1.2 adet/m2)
  const telescopicPropsCount = Math.ceil(floorArea * 1.2);

  // Plywood plaka ihtiyacı (tek takım kalıp için, 2.50x1.25m = 3.125 m2/adet)
  const plywoodSheetsCount = Math.ceil(singleStoryFormworkAreaM2 / 3.125);

  const notes = [
    `Kat Başına Kalıp Alanı: ${singleStoryFormworkAreaM2.toFixed(1)} m² (Katsayı: ${formworkToFloorRatio} m² kalıp / m² taban alanı).`,
    `Tüm Bina Toplam Kalıp Yüzeyi: ${totalBuildingFormworkAreaM2.toFixed(1)} m² (${stories} kat toplamı).`,
    `Tek Takım Kalıp İçin Plywood İhtiyacı: ~${plywoodSheetsCount} plaka (18-21 mm, 250x125 cm).`,
    `Döşeme Altı İskele & Dikme: ${scaffoldingVolumeM3.toFixed(1)} m³ iskele hacmi, ~${telescopicPropsCount} adet teleskopik dikme.`,
  ];

  return {
    singleStoryFormworkAreaM2,
    totalBuildingFormworkAreaM2,
    scaffoldingVolumeM3,
    telescopicPropsCount,
    plywoodSheetsCount,
    notes,
  };
}
