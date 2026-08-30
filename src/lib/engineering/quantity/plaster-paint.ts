export type PlasterType = "gypsum" | "cement_lime";
export type PaintType = "interior_silicone" | "exterior_acrylic";

export interface PlasterPaintInput {
  wallAreaM2: number;
  ceilingAreaM2?: number;
  plasterType: PlasterType;
  paintType: PaintType;
  plasterThicknessCm?: number; // Varsayılan 1.5 cm
  wastePercentage?: number; // Varsayılan %5
}

export interface PlasterPaintResult {
  totalPlasterAreaM2: number;
  totalPaintAreaM2: number;
  plasterKg: number;
  plasterBags35KgCount: number; // 35 kg torba
  primerKg: number; // Astar boya (~0.08 kg/m2)
  paintKg: number; // 2 kat son kat boya
  paintBucketsCount: number; // 15L / 20kg kova
  notes: string[];
}

export function calculatePlasterPaint(input: PlasterPaintInput): PlasterPaintResult | null {
  const {
    wallAreaM2: walls,
    ceilingAreaM2: ceiling = 0,
    plasterType,
    paintType,
    plasterThicknessCm = 1.5,
    wastePercentage = 5.0,
  } = input;

  if (walls <= 0 && ceiling <= 0) return null;

  const totalPlasterAreaM2 = walls + ceiling;
  const totalPaintAreaM2 = walls + ceiling;

  const wasteFactor = 1 + Math.max(0, wastePercentage) / 100;

  // Sıva Sarfiyatı (Alçı: ~9.5 kg/m2/cm, Çimento: ~18 kg/m2/cm)
  const kgPerM2PerCm = plasterType === "gypsum" ? 9.5 : 18.0;
  const plasterKg = totalPlasterAreaM2 * plasterThicknessCm * kgPerM2PerCm * wasteFactor;
  const plasterBags35KgCount = Math.ceil(plasterKg / 35.0);

  // Astar: 0.08 kg/m2
  const primerKg = totalPaintAreaM2 * 0.08 * wasteFactor;

  // 2 Kat Boya: İç cephe 0.22 kg/m2, Dış cephe 0.35 kg/m2
  const paintRateKgPerM2 = paintType === "interior_silicone" ? 0.22 : 0.35;
  const paintKg = totalPaintAreaM2 * paintRateKgPerM2 * wasteFactor;
  const paintBucketsCount = Math.ceil(paintKg / 20.0); // 20 kg'lık kova

  const notes = [
    `Toplam Sıva & Boya Yüzeyi: ${totalPlasterAreaM2.toFixed(1)} m² (Duvar: ${walls.toFixed(1)} m², Tavan: ${ceiling.toFixed(1)} m²).`,
    `Sıva İhtiyacı (${plasterType === "gypsum" ? "Perlitli Alçı Sıva" : "Çimento Esaslı Sıva"}, ${plasterThicknessCm} cm): ${plasterKg.toFixed(0)} kg (~${plasterBags35KgCount} torba 35 kg).`,
    `Dönüşüm Astarı: ~${primerKg.toFixed(1)} kg.`,
    `2 Kat Son Kat Boya (${paintType === "interior_silicone" ? "İç Cephe Silikonlu" : "Dış Cephe Akrilik"}): ${paintKg.toFixed(1)} kg (~${paintBucketsCount} kova 20 kg).`,
  ];

  return {
    totalPlasterAreaM2,
    totalPaintAreaM2,
    plasterKg,
    plasterBags35KgCount,
    primerKg,
    paintKg,
    paintBucketsCount,
    notes,
  };
}
