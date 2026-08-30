// Pratik Kalıp Metrajı ve İskele/Aksesuar Hesap Motoru

export type FormworkSystemType = "plywood" | "timber_boards" | "steel_panel";
export type FormworkStructuralType = "frame_slab" | "flat_slab" | "tunnel_formwork" | "industrial_hall";

export interface FormworkStructuralData {
  name: string;
  defaultRatio: number;
  horizontalRatioPct: number;
  verticalRatioPct: number;
  description: string;
}

export const FORMWORK_STRUCTURAL_TYPES: Record<FormworkStructuralType, FormworkStructuralData> = {
  frame_slab: {
    name: "Geleneksel Kirişli Plak Sistem",
    defaultRatio: 2.8,
    horizontalRatioPct: 45,
    verticalRatioPct: 55,
    description: "Kiriş kanatları ve kolon yüzeyleri nedeniyle düşey kalıp oranı yüksektir.",
  },
  flat_slab: {
    name: "Kirişsiz / Mantar / Kaset Döşeme",
    defaultRatio: 2.3,
    horizontalRatioPct: 60,
    verticalRatioPct: 40,
    description: "Düz döşeme alt yüzeyi sayesinde yatay kalıp baskındır.",
  },
  tunnel_formwork: {
    name: "Tünel Kalıp / Yoğun Perdeli Sistem",
    defaultRatio: 3.2,
    horizontalRatioPct: 35,
    verticalRatioPct: 65,
    description: "Tüm iç ve dış perdelerin kalıbı nedeniyle çok yüksek kalıp metrajı çıkar.",
  },
  industrial_hall: {
    name: "Endüstriyel Yapı / Prefabrik Karkas",
    defaultRatio: 1.6,
    horizontalRatioPct: 30,
    verticalRatioPct: 70,
    description: "Yalnızca temel soketleri ve bağ kirişleri için yerinde döküm kalıp kullanılır.",
  },
};

export interface FormworkQuantityInput {
  storyFloorAreaM2: number;
  storyCount: number;
  floorHeightM: number;
  structuralType?: FormworkStructuralType;
  customRatio?: number; // m2 kalıp / m2 inşaat alanı
  formworkToFloorRatio?: number; // alias
  systemType?: FormworkSystemType;
}

export interface FormworkQuantityResult {
  structuralTypeName: string;
  formworkToFloorRatio: number;
  singleStoryFormworkAreaM2: number;
  totalBuildingFormworkAreaM2: number;
  horizontalFormworkM2: number;
  verticalFormworkM2: number;
  scaffoldingVolumeM3: number;
  telescopicPropsCount: number; // Teleskopik dikme adedi (~1.2 adet / m2)
  plywoodSheetsCount: number; // 250x125 cm (3.125 m2/plaka)
  moldOilLiters: number; // Kalıp yağı (~1 L / 25 m2)
  h20BeamsMeters: number; // H20 ahşap kiriş (~2.5 m / m2)
  notes: string[];
}

export function calculateFormworkQuantity(input: FormworkQuantityInput): FormworkQuantityResult | null {
  const {
    storyFloorAreaM2: floorArea,
    storyCount: stories,
    floorHeightM: height,
    structuralType = "frame_slab",
    customRatio,
    formworkToFloorRatio: inputRatio,
    systemType = "plywood",
  } = input;

  if (floorArea <= 0 || stories <= 0 || height <= 0 || !FORMWORK_STRUCTURAL_TYPES[structuralType]) {
    return null;
  }

  const sData = FORMWORK_STRUCTURAL_TYPES[structuralType];
  const chosenRatio = inputRatio ?? customRatio;
  const formworkToFloorRatio = chosenRatio && chosenRatio > 0 ? chosenRatio : sData.defaultRatio;

  const singleStoryFormworkAreaM2 = floorArea * formworkToFloorRatio;
  const totalBuildingFormworkAreaM2 = singleStoryFormworkAreaM2 * stories;

  const horizontalFormworkM2 = singleStoryFormworkAreaM2 * (sData.horizontalRatioPct / 100);
  const verticalFormworkM2 = singleStoryFormworkAreaM2 * (sData.verticalRatioPct / 100);

  // İskele hacmi (tek kat döşeme altı çalışma hacmi)
  const scaffoldingVolumeM3 = floorArea * height;

  // Teleskopik dikme adedi (döşeme tabanına ~1.2 adet/m2)
  const telescopicPropsCount = Math.ceil(floorArea * 1.2);

  // Plywood plaka ihtiyacı (tek takım kalıp için, 2.50x1.25m = 3.125 m2/adet)
  const plywoodSheetsCount = Math.ceil(singleStoryFormworkAreaM2 / 3.125);

  // Kalıp ayırıcı yağ: 1 L / ~25 m2
  const moldOilLiters = totalBuildingFormworkAreaM2 / 25.0;

  // H20 ahşap kiriş metrajı: tek takım için ~2.5 m / m2 kalıp
  const h20BeamsMeters = singleStoryFormworkAreaM2 * 2.5;

  const notes = [
    `Taşıyıcı Sistem: ${sData.name} (Katsayı: ${formworkToFloorRatio.toFixed(2)} m² kalıp / m² inşaat alanı).`,
    `Kat Başına Kalıp: ${singleStoryFormworkAreaM2.toFixed(1)} m² (Yatay: ${horizontalFormworkM2.toFixed(1)} m², Düşey: ${verticalFormworkM2.toFixed(1)} m²).`,
    `Tüm Bina Toplam Kalıp Yüzeyi: ${totalBuildingFormworkAreaM2.toFixed(1)} m² (${stories} kat toplamı).`,
    `Tek Takım Kalıp Malzemesi: ~${plywoodSheetsCount} plaka plywood (250x125 cm), ~${h20BeamsMeters.toFixed(0)} m H20 kiriş, ~${telescopicPropsCount} adet teleskopik dikme.`,
    `Sarfiyat: Toplam ~${moldOilLiters.toFixed(1)} L kalıp yağı gereklidir.`,
  ];

  return {
    structuralTypeName: sData.name,
    formworkToFloorRatio: Number(formworkToFloorRatio.toFixed(2)),
    singleStoryFormworkAreaM2: Number(singleStoryFormworkAreaM2.toFixed(1)),
    totalBuildingFormworkAreaM2: Number(totalBuildingFormworkAreaM2.toFixed(1)),
    horizontalFormworkM2: Number(horizontalFormworkM2.toFixed(1)),
    verticalFormworkM2: Number(verticalFormworkM2.toFixed(1)),
    scaffoldingVolumeM3: Number(scaffoldingVolumeM3.toFixed(1)),
    telescopicPropsCount,
    plywoodSheetsCount,
    moldOilLiters: Number(moldOilLiters.toFixed(1)),
    h20BeamsMeters: Number(h20BeamsMeters.toFixed(0)),
    notes,
  };
}
