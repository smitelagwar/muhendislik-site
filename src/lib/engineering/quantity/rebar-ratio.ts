// Pratik Donatı Metrajı ve İstatistiksel Pursantaj Hesap Motoru

export type BuildingTypology =
  | "residential_standard"
  | "residential_highrise"
  | "commercial_office"
  | "shear_wall_heavy"
  | "industrial_hall";

export type RebarEstimationMethod = "area_based" | "concrete_volume_based";

export interface RebarRatioData {
  name: string;
  defaultKgPerM2: number;
  minKgPerM2: number;
  maxKgPerM2: number;
  defaultKgPerM3: number;
  minKgPerM3: number;
  maxKgPerM3: number;
  description: string;
}

export const BUILDING_TYPOLOGIES: Record<BuildingTypology, RebarRatioData> = {
  residential_standard: {
    name: "Standart Konut (1-6 Kat)",
    defaultKgPerM2: 32.0,
    minKgPerM2: 28.0,
    maxKgPerM2: 36.0,
    defaultKgPerM3: 100.0,
    minKgPerM3: 85.0,
    maxKgPerM3: 115.0,
    description: "Geleneksel çerçeveli betonarme konut yapıları.",
  },
  residential_highrise: {
    name: "Yüksek Katlı Konut (7+ Kat)",
    defaultKgPerM2: 40.0,
    minKgPerM2: 35.0,
    maxKgPerM2: 46.0,
    defaultKgPerM3: 125.0,
    minKgPerM3: 110.0,
    maxKgPerM3: 140.0,
    description: "Deprem perdeleri yoğun yüksek katlı konut binaları.",
  },
  commercial_office: {
    name: "Ticari / Ofis / Alışveriş Merkezi",
    defaultKgPerM2: 38.0,
    minKgPerM2: 33.0,
    maxKgPerM2: 45.0,
    defaultKgPerM3: 120.0,
    minKgPerM3: 105.0,
    maxKgPerM3: 135.0,
    description: "Geniş açıklıklı döşeme ve ağır kullanım yükü olan yapılar.",
  },
  shear_wall_heavy: {
    name: "Tünel Kalıp / Yoğun Perdeli Sistem",
    defaultKgPerM2: 48.0,
    minKgPerM2: 42.0,
    maxKgPerM2: 55.0,
    defaultKgPerM3: 115.0,
    minKgPerM3: 100.0,
    maxKgPerM3: 130.0,
    description: "Tüm taşıyıcı sistemi perdelerden oluşan rijit yapılar.",
  },
  industrial_hall: {
    name: "Endüstriyel Yapı / Depo",
    defaultKgPerM2: 24.0,
    minKgPerM2: 18.0,
    maxKgPerM2: 30.0,
    defaultKgPerM3: 80.0,
    minKgPerM3: 65.0,
    maxKgPerM3: 95.0,
    description: "Prefabrik veya geniş kolon aralıklı tek katlı yapılar.",
  },
};

export interface RebarQuantityInput {
  estimationMethod?: RebarEstimationMethod;
  totalConstructionAreaM2?: number; // Metod area_based ise
  totalConcreteVolumeM3?: number; // Metod concrete_volume_based ise
  typology: BuildingTypology;
  customUnitRate?: number; // kg/m2 veya kg/m3
  wastePercentage?: number; // Fire payı (varsayılan %5)
}

export interface RebarQuantityResult {
  estimationMethod: RebarEstimationMethod;
  typologyName: string;
  unitWeightKg: number;
  unitLabel: string;
  netWeightTon: number;
  wasteWeightTon: number;
  grossWeightTon: number;
  minEstimatedTon: number;
  maxEstimatedTon: number;
  thinRebarTon: number; // Ø8 - Ø12 (%30)
  mediumRebarTon: number; // Ø14 - Ø18 (%45)
  thickRebarTon: number; // Ø20 - Ø26 (%25)
  bindingWireKg: number; // Bağ teli (ton başına 12 kg)
  notes: string[];
}

export function calculateRebarQuantity(input: RebarQuantityInput): RebarQuantityResult | null {
  const {
    estimationMethod = "area_based",
    totalConstructionAreaM2,
    totalConcreteVolumeM3,
    typology,
    customUnitRate,
    wastePercentage = 5.0,
  } = input;

  if (!BUILDING_TYPOLOGIES[typology]) return null;
  const data = BUILDING_TYPOLOGIES[typology];

  let quantity = 0;
  let defaultRate = 0;
  let minRate = 0;
  let maxRate = 0;
  let unitLabel = "";

  if (estimationMethod === "area_based") {
    if (!totalConstructionAreaM2 || totalConstructionAreaM2 <= 0) return null;
    quantity = totalConstructionAreaM2;
    defaultRate = data.defaultKgPerM2;
    minRate = data.minKgPerM2;
    maxRate = data.maxKgPerM2;
    unitLabel = "kg/m² inşaat alanı";
  } else {
    if (!totalConcreteVolumeM3 || totalConcreteVolumeM3 <= 0) return null;
    quantity = totalConcreteVolumeM3;
    defaultRate = data.defaultKgPerM3;
    minRate = data.minKgPerM3;
    maxRate = data.maxKgPerM3;
    unitLabel = "kg/m³ beton hacmi";
  }

  const unitWeightKg = customUnitRate && customUnitRate > 0 ? customUnitRate : defaultRate;
  const netWeightKg = quantity * unitWeightKg;
  const netWeightTon = netWeightKg / 1000;

  const wasteRate = Math.max(0, wastePercentage) / 100;
  const wasteWeightTon = netWeightTon * wasteRate;
  const grossWeightTon = netWeightTon + wasteWeightTon;

  const minEstimatedTon = ((quantity * minRate) / 1000) * (1 + wasteRate);
  const maxEstimatedTon = ((quantity * maxRate) / 1000) * (1 + wasteRate);

  // Çap Dağılım Tahmini (Deneyimsel Oranlar)
  const thinRebarTon = grossWeightTon * 0.30;
  const mediumRebarTon = grossWeightTon * 0.45;
  const thickRebarTon = grossWeightTon * 0.25;

  // Bağ teli: ton başına ~12 kg
  const bindingWireKg = grossWeightTon * 12.0;

  const notes: string[] = [
    `Hesap Yöntemi: ${estimationMethod === "area_based" ? "Toplam İnşaat Alanına Göre" : "Beton Hacmine Göre"} Pratik Pursantaj.`,
    `Birim Donatı Oranı: ${unitWeightKg.toFixed(1)} ${unitLabel}.`,
    `İstatistiki Aralık: ${minEstimatedTon.toFixed(1)} ton – ${maxEstimatedTon.toFixed(1)} ton (%${wastePercentage} fire dahil).`,
    "BİLGİLENDİRME: Bu hesaplama şantiye istatistiki pursantajlarına dayanan bir yaklaşık ön metrajdır; statik projedeki kesin metrajın yerini tutmaz.",
  ];

  return {
    estimationMethod,
    typologyName: data.name,
    unitWeightKg,
    unitLabel,
    netWeightTon: Number(netWeightTon.toFixed(2)),
    wasteWeightTon: Number(wasteWeightTon.toFixed(2)),
    grossWeightTon: Number(grossWeightTon.toFixed(2)),
    minEstimatedTon: Number(minEstimatedTon.toFixed(2)),
    maxEstimatedTon: Number(maxEstimatedTon.toFixed(2)),
    thinRebarTon: Number(thinRebarTon.toFixed(2)),
    mediumRebarTon: Number(mediumRebarTon.toFixed(2)),
    thickRebarTon: Number(thickRebarTon.toFixed(2)),
    bindingWireKg: Number(bindingWireKg.toFixed(1)),
    notes,
  };
}
