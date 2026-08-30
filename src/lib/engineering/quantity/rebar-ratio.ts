export type BuildingTypology =
  | "residential_standard"
  | "residential_highrise"
  | "commercial_office"
  | "shear_wall_heavy"
  | "industrial_hall";

export interface RebarRatioData {
  name: string;
  defaultKgPerM2: number;
  minKgPerM2: number;
  maxKgPerM2: number;
  description: string;
}

export const BUILDING_TYPOLOGIES: Record<BuildingTypology, RebarRatioData> = {
  residential_standard: {
    name: "Standart Konut (1-6 Kat)",
    defaultKgPerM2: 32.0,
    minKgPerM2: 28.0,
    maxKgPerM2: 36.0,
    description: "Geleneksel çerçeveli betonarme konut yapıları.",
  },
  residential_highrise: {
    name: "Yüksek Katlı Konut (7+ Kat)",
    defaultKgPerM2: 40.0,
    minKgPerM2: 35.0,
    maxKgPerM2: 46.0,
    description: "Deprem perdeleri yoğun yüksek katlı konut binaları.",
  },
  commercial_office: {
    name: "Ticari / Ofis / Alışveriş Merkezi",
    defaultKgPerM2: 38.0,
    minKgPerM2: 33.0,
    maxKgPerM2: 45.0,
    description: "Geniş açıklıklı döşeme ve ağır kullanım yükü olan yapılar.",
  },
  shear_wall_heavy: {
    name: "Tünel Kalıp / Yoğun Perdeli Sistem",
    defaultKgPerM2: 48.0,
    minKgPerM2: 42.0,
    maxKgPerM2: 55.0,
    description: "Tüm taşıyıcı sistemi perdelerden oluşan rijit yapılar.",
  },
  industrial_hall: {
    name: "Endüstriyel Yapı / Depo",
    defaultKgPerM2: 24.0,
    minKgPerM2: 18.0,
    maxKgPerM2: 30.0,
    description: "Prefabrik veya geniş kolon aralıklı tek katlı yapılar.",
  },
};

export interface RebarQuantityInput {
  totalConstructionAreaM2: number;
  typology: BuildingTypology;
  customKgPerM2?: number;
  wastePercentage?: number; // Fire payı (varsayılan %5)
}

export interface RebarQuantityResult {
  typologyName: string;
  unitWeightKgPerM2: number;
  netWeightTon: number;
  wasteWeightTon: number;
  grossWeightTon: number;
  thinRebarTon: number; // Ø8 - Ø12 (%30)
  mediumRebarTon: number; // Ø14 - Ø18 (%45)
  thickRebarTon: number; // Ø20 - Ø26 (%25)
  bindingWireKg: number; // Bağ teli (ton başına 12 kg)
  notes: string[];
}

export function calculateRebarQuantity(input: RebarQuantityInput): RebarQuantityResult | null {
  const {
    totalConstructionAreaM2: areaM2,
    typology,
    customKgPerM2,
    wastePercentage = 5.0,
  } = input;

  if (areaM2 <= 0 || !BUILDING_TYPOLOGIES[typology]) return null;

  const data = BUILDING_TYPOLOGIES[typology];
  const unitWeightKgPerM2 = customKgPerM2 && customKgPerM2 > 0 ? customKgPerM2 : data.defaultKgPerM2;

  const netWeightKg = areaM2 * unitWeightKgPerM2;
  const netWeightTon = netWeightKg / 1000;

  const wasteRate = Math.max(0, wastePercentage) / 100;
  const wasteWeightTon = netWeightTon * wasteRate;
  const grossWeightTon = netWeightTon + wasteWeightTon;

  // Çap Dağılım Tahmini (Deneyimsel Oranlar)
  const thinRebarTon = grossWeightTon * 0.30; // Etriye, çiroz, döşeme hasırları
  const mediumRebarTon = grossWeightTon * 0.45; // Kolon/kiriş boyuna donatıları
  const thickRebarTon = grossWeightTon * 0.25; // Radye ve perde gövde donatıları

  // Bağ teli: ton başına ~12 kg
  const bindingWireKg = grossWeightTon * 12.0;

  const notes = [
    `Toplam İnşaat Alanı: ${areaM2} m², Birim Donatı Yoğunluğu: ${unitWeightKgPerM2} kg/m².`,
    `Net İnşaat Demiri: ${netWeightTon.toFixed(2)} Ton (%${wastePercentage} fire ile Brüt: ${grossWeightTon.toFixed(2)} Ton).`,
    `Yaklaşık Çap Dağılımı: İnce (Ø8-Ø12): ${thinRebarTon.toFixed(1)} Ton | Orta (Ø14-Ø18): ${mediumRebarTon.toFixed(1)} Ton | Kalın (Ø20+): ${thickRebarTon.toFixed(1)} Ton.`,
    `Tahmini Bağ Teli İhtiyacı: ~${bindingWireKg.toFixed(0)} kg.`,
  ];

  return {
    typologyName: data.name,
    unitWeightKgPerM2,
    netWeightTon,
    wasteWeightTon,
    grossWeightTon,
    thinRebarTon,
    mediumRebarTon,
    thickRebarTon,
    bindingWireKg,
    notes,
  };
}
