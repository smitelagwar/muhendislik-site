export const CEMENT_FACTORS = {
  cem1r: { label: "CEM I 42.5 R (Hızlı)", multiplier: 1.0 },
  cem2: { label: "CEM II 32.5 (Normal)", multiplier: 1.35 },
  cem3: { label: "CEM III (Yavaş)", multiplier: 1.9 },
} as const;

export type CementType = keyof typeof CEMENT_FACTORS;

export const STRUCTURAL_ELEMENTS = {
  kolon: { label: "Kolon / Perde yan kalıbı", baseDays: 2, ratio: 0.35 },
  dosemeKucuk: { label: "Döşeme ≤ 4 m", baseDays: 7, ratio: 0.7 },
  dosemeOrta: { label: "Döşeme 4 - 6 m", baseDays: 10, ratio: 0.7 },
  dosemeBuyuk: { label: "Döşeme ≥ 6 m", baseDays: 14, ratio: 0.75 },
  kiris: { label: "Kiriş alt kalıbı", baseDays: 10, ratio: 0.75 },
  konsol: { label: "Konsol", baseDays: 14, ratio: 0.8 },
} as const;

export type StructuralElementType = keyof typeof STRUCTURAL_ELEMENTS;

export interface FormworkStrippingInput {
  concreteClassMpa: number;
  cementType: CementType;
  elementType: StructuralElementType;
  temperatureC: number;
}

export interface FormworkStrippingResult {
  critical: boolean;
  minimumDays: number | null;
  safeDays: number | null;
  targetStrengthMpa: number;
  ratioLabel: string;
  notes: string[];
}

export function getTemperatureFactor(temperature: number): number {
  if (temperature < 5) return 999;
  if (temperature < 10) return 1.5;
  if (temperature < 15) return 1.25;
  if (temperature <= 25) return 1.0;
  return 0.85;
}

export function calculateFormworkStripping(input: FormworkStrippingInput): FormworkStrippingResult | null {
  const { concreteClassMpa: fck, cementType, elementType, temperatureC } = input;

  if (!Number.isFinite(fck) || fck <= 0 || !Number.isFinite(temperatureC)) {
    return null;
  }

  const cement = CEMENT_FACTORS[cementType];
  const element = STRUCTURAL_ELEMENTS[elementType];

  if (!cement || !element) {
    return null;
  }

  const temperatureFactor = getTemperatureFactor(temperatureC);
  const critical = temperatureFactor >= 999;
  const minimumDays = critical ? null : Math.ceil(element.baseDays * cement.multiplier * temperatureFactor);
  const safeDays = critical ? null : Math.ceil((minimumDays ?? 0) * 1.25);
  const targetStrengthMpa = fck * element.ratio;

  const notes = [
    "Kesin karar için 7 günlük küp numune veya karot sonucu esas alınmalıdır.",
    elementType === "konsol"
      ? "Konsollarda erken söküm yerine %80 dayanım ve kademeli söküm tercih edilmelidir."
      : "Yatay elemanlarda askı payandası bırakmak riski düşürür.",
    cementType === "cem3"
      ? "CEM III ile erken söküm ciddi risk taşır; programı daha korumacı kurun."
      : "Çimento tipi hızlandıkça bekleme süresi kısalabilir, ancak saha kürü ihmal edilmemelidir.",
    temperatureC < 10
      ? "Soğuk havada kalıp sökümünü takvimle değil dayanım doğrulamasıyla yönetin."
      : "Sıcak havada dayanım erken gelse bile rötre ve çatlak riskine karşı kürlemeyi sürdürün.",
  ];

  return {
    critical,
    minimumDays,
    safeDays,
    targetStrengthMpa,
    ratioLabel: `%${Math.round(element.ratio * 100)}`,
    notes,
  };
}
