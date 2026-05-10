import {
  ConstructionCostResultV3,
  ProjectInputsV3,
  MacroMaterials,
  CostCategoryV3,
  CityKeyV3,
} from "./types";

// --- Temel Birim Fiyatlar (2025 Q2) ---
// Güncel piyasa araştırmalarına göre revize edilmiştir.
const CONCRETE_PRICE_PER_M3 = 3000; // TL (Ortalama C25/C30 mikser teslim)
const IRON_PRICE_PER_TON = 33000;   // TL (Ortalama nervürlü inşaat demiri tonaj fiyatı)

const CURRENT_PRICES = {
  concretePerM3: CONCRETE_PRICE_PER_M3,
  ironPerTon: IRON_PRICE_PER_TON,
  formworkPerM2: 850,    // Kalıp işçilik + malzeme — TL/m²
  brickPerM2: 1200,      // Tuğla + harç + sıva — TL/m²
  roofPerM2: 1800,       // Çatı kaplama — TL/m²
  waterproofPerM2: 450,  // Su yalıtımı — TL/m²
};

const CITY_MULTIPLIERS: Record<CityKeyV3, { multiplier: number; label: string }> = {
  istanbul:       { multiplier: 1.18, label: "İstanbul" },
  ankara_izmir:   { multiplier: 1.07, label: "Ankara / İzmir" },
  antalya:        { multiplier: 1.10, label: "Antalya / Kıyı" },
  bursa_kocaeli:  { multiplier: 1.05, label: "Bursa / Kocaeli" },
  genel:          { multiplier: 1.00, label: "Genel (Anadolu)" },
};

// m² başına yapı malzemesi miktarları — yapı türüne göre
const BASE_METRICS = {
  apartman:    { concrete: 0.38, iron: 38, brickRatio: 0.55 },
  villa:       { concrete: 0.45, iron: 42, brickRatio: 0.65 },
  ofis:        { concrete: 0.42, iron: 40, brickRatio: 0.45 },
  endustriyel: { concrete: 0.30, iron: 30, brickRatio: 0.30 },
};

const QUALITY_MULTIPLIERS = {
  ekonomik: 0.72,
  standart: 1.00,
  luks:     1.65,
};

const SOIL_MULTIPLIERS = {
  iyi:  1.00,
  orta: 1.07,
  kotu: 1.18,
};

// Kalite seviyesine göre bodrum kat ek maliyeti katsayısı (m² başına)
const BASEMENT_EXTRA_COST_PER_M2 = 7500; // TL — kazı, istinat, su yalıtımı

const FACADE_EXTRA_PER_M2: Record<string, number> = {
  klasik:        0,
  kompozit:   2000,
  cam_giydirme: 8500,
};

// Asansör başına sabit maliyet tahmini (orta segment)
const ELEVATOR_COST = 850_000; // TL

export function calculateConstructionCostV3(inputs: ProjectInputsV3): ConstructionCostResultV3 {
  // Güvenli varsayılan değerler — undefined gelirse motor NaN üretmesin
  const totalArea     = inputs.totalArea      ?? 1000;
  const structureKind = inputs.structureKind  ?? "apartman";
  const floorCount    = Math.max(inputs.floorCount    ?? 5, 1);
  const basementFloors = Math.min(inputs.basementFloors ?? 0, floorCount);
  const qualityLevel  = inputs.qualityLevel  ?? "standart";
  const soilClass     = inputs.soilClass     ?? "orta";
  const city          = inputs.city          ?? "genel";
  const hasElevator   = inputs.hasElevator   ?? false;
  const elevatorCount = inputs.elevatorCount  ?? 1;
  const facadeType    = inputs.facadeType    ?? "klasik";
  const cityInfo = CITY_MULTIPLIERS[city] ?? CITY_MULTIPLIERS.genel;
  const cityMult = cityInfo.multiplier;
  const qMult = QUALITY_MULTIPLIERS[qualityLevel];
  const soilMult = SOIL_MULTIPLIERS[soilClass];

  const baseMetric = BASE_METRICS[structureKind] ?? BASE_METRICS.apartman;

  // Kat yüksekliği cezası: 5 kattan fazrası için her kat +%1.2
  const floorPenalty = floorCount > 5 ? 1 + (floorCount - 5) * 0.012 : 1;

  // ─── Yapısal Malzeme Miktarları ─────────────────────────────────────────
  const totalConcreteM3 = totalArea * baseMetric.concrete * floorPenalty * soilMult;
  const totalIronKg     = totalArea * baseMetric.iron     * floorPenalty * soilMult;
  const totalIronTon    = totalIronKg / 1000;

  const concreteCost = totalConcreteM3 * CURRENT_PRICES.concretePerM3;
  const ironCost     = totalIronTon    * CURRENT_PRICES.ironPerTon;

  // Kalıp: Beton hacminin yaklaşık 2.5 katı alan (iki yüz)
  const formworkM2   = totalConcreteM3 * 2.5;
  const formworkCost = formworkM2 * CURRENT_PRICES.formworkPerM2;

  // Tuğla / İç duvar
  const brickM2   = totalArea * baseMetric.brickRatio;
  const brickCost = brickM2 * CURRENT_PRICES.brickPerM2;

  // Çatı (villa ve düşük katlı için daha büyük oran)
  const roofArea = structureKind === "villa" ? totalArea * 0.35 : totalArea * 0.12;
  const roofCost = roofArea * CURRENT_PRICES.roofPerM2;

  // Su yalıtımı (bodrum + çatı)
  const basementArea      = (totalArea / floorCount) * Math.max(basementFloors, 0);
  const waterproofArea    = roofArea + basementArea;
  const waterproofCost    = waterproofArea * CURRENT_PRICES.waterproofPerM2;

  // Bodrum ek maliyeti
  const basementExtraCost = basementArea * BASEMENT_EXTRA_COST_PER_M2 * soilMult;

  // Kaba İnşaat Toplam
  const kabaTotal = (concreteCost + ironCost + formworkCost + brickCost + roofCost + waterproofCost + basementExtraCost) * cityMult;

  // ─── İnce İşler ──────────────────────────────────────────────────────────
  const inceBasePerM2 = 9500;
  const inceTotal = totalArea * inceBasePerM2 * qMult * cityMult;

  // ─── Mekanik & Elektrik ──────────────────────────────────────────────────
  const mekanikBasePerM2 = 3800;
  const elektrikBasePerM2 = 2800;
  const mekanikTotal = totalArea * mekanikBasePerM2 * qMult * cityMult;
  const elektrikTotal = totalArea * elektrikBasePerM2 * qMult * cityMult;

  // ─── Cephe ───────────────────────────────────────────────────────────────
  // Cephe alanı: Perimeter × Kat Yüksekliği (her kat 3m)
  const estPerimeter = 4 * Math.sqrt(totalArea / floorCount); // m
  const facadeArea   = estPerimeter * floorCount * 3;
  const facadeExtraTotal = facadeArea * FACADE_EXTRA_PER_M2[facadeType];
  const cepheBaseTotal   = facadeArea * 1800 * qMult * cityMult; // Klasik baz cephe
  const cepheTotal       = cepheBaseTotal + facadeExtraTotal;

  // ─── Diğer Giderler ──────────────────────────────────────────────────────
  const elevatorCost = hasElevator ? elevatorCount * ELEVATOR_COST * cityMult : 0;
  const digerBasePerM2 = 1800; // Ruhsat, harç, proje, şantiye vb.
  const digerTotal = totalArea * digerBasePerM2 * cityMult + elevatorCost;

  // ─── Grand Total ─────────────────────────────────────────────────────────
  const grandTotal = kabaTotal + inceTotal + mekanikTotal + elektrikTotal + cepheTotal + digerTotal;

  // Risk aralığı (±%15 iyimser, ±%25 kötümser — Türkiye'de malzeme fiyat oynaklığı)
  const optimistic  = Math.round(grandTotal * 0.85);
  const pessimistic = Math.round(grandTotal * 1.25);

  const macroMaterials: MacroMaterials = {
    concreteM3:  Math.round(totalConcreteM3),
    ironTon:     Math.round(totalIronTon * 10) / 10,
    concreteCost: Math.round(concreteCost),
    ironCost:    Math.round(ironCost),
    brickM2:     Math.round(brickM2),
    brickCost:   Math.round(brickCost),
  };

  const categories: CostCategoryV3[] = [
    {
      id: "kaba",
      label: "Kaba İnşaat",
      description: "Beton, Demir, Kalıp, Tuğla, Bodrum, Çatı ve Su Yalıtımı",
      total: Math.round(kabaTotal),
      share: kabaTotal / grandTotal,
    },
    {
      id: "ince",
      label: "İnce İşler",
      description: "Alçı, Boya, Zemin, Seramik, Kapı, Pencere, Mutfak/Banyo",
      total: Math.round(inceTotal),
      share: inceTotal / grandTotal,
    },
    {
      id: "mekanik",
      label: "Mekanik Tesisat",
      description: "Isıtma/Soğutma, Sıhhi, Havalandırma (TS EN 12831 baz alınmıştır)",
      total: Math.round(mekanikTotal),
      share: mekanikTotal / grandTotal,
    },
    {
      id: "elektrik",
      label: "Elektrik Tesisatı",
      description: "Aydınlatma, Güç, Akıllı Sistem, Jeneratör, Zayıf Akım",
      total: Math.round(elektrikTotal),
      share: elektrikTotal / grandTotal,
    },
    {
      id: "cephe",
      label: "Cephe & Dış Kabuk",
      description: "Isı yalıtımı, cephe kaplama, mantolama ve pencere sistemleri",
      total: Math.round(cepheTotal),
      share: cepheTotal / grandTotal,
    },
    {
      id: "diger",
      label: "Diğer Giderler",
      description: `Ruhsat/Harç, Proje, Şantiye, Sigorta${hasElevator ? `, ${elevatorCount} Asansör` : ""}`,
      total: Math.round(digerTotal),
      share: digerTotal / grandTotal,
    },
  ];

  const assumptions: string[] = [
    `Beton fiyatı: ${CURRENT_PRICES.concretePerM3.toLocaleString("tr-TR")} TL/m³ (C25/30 hazır beton)`,
    `İnşaat demiri: ${CURRENT_PRICES.ironPerTon.toLocaleString("tr-TR")} TL/Ton`,
    `Bölge katsayısı: ${cityInfo.label} (×${cityMult.toFixed(2)})`,
    `Zemin sınıfı katsayısı: ×${soilMult.toFixed(2)}`,
    "Tahminin doğruluk payı ±%15 iyimser / ±%25 kötümser olarak alınmıştır",
    "Zemin etüdü, proje müellifliği ve arazi bedeli dahil değildir",
    "Fiyatlar 2025 yılı piyasa verilerine dayanmaktadır",
  ];

  return {
    inputs,
    grandTotal:  Math.round(grandTotal),
    costPerM2:   Math.round(grandTotal / totalArea),
    optimistic,
    pessimistic,
    macroMaterials,
    categories,
    assumptions,
    generatedAt: new Date().toISOString(),
    cityLabel:   cityInfo.label,
  };
}
