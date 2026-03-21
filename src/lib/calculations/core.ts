import type { DosemeTipi, KaliteSeviyesi, PriceBook, PriceLayer } from "./types";

export const KALITE_KATSAYILARI: Record<KaliteSeviyesi, number> = {
  ekonomik: 0.8,
  orta: 1,
  ust: 1.25,
  luks: 1.6,
};

export function formatTL(tutar: number): string {
  return `${Math.round(tutar).toLocaleString("tr-TR")} TL`;
}

export function formatSayi(deger: number, digits = 0): string {
  return deger.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatYuzde(oran: number): string {
  return `%${(oran * 100).toFixed(1).replace(".", ",")}`;
}

export function formatM2Fiyat(fiyat: number): string {
  return `${formatSayi(Math.round(fiyat))} TL/m²`;
}

export function resolvePrice(key: keyof PriceBook, layer: PriceLayer): number {
  const override = layer.manualOverrides?.[key];
  if (override !== undefined && override > 0) {
    return override;
  }

  const base = layer.systemDefault[key] as number;
  return base * (layer.regionalCoefficient ?? 1);
}

export function applyKalite(tutar: number, kalite: KaliteSeviyesi): number {
  return tutar * KALITE_KATSAYILARI[kalite];
}

export function applyFire(miktar: number, fireOrani: number): number {
  return miktar * (1 + fireOrani);
}

export function safePositive(val: number, fallback = 0): number {
  return Number.isFinite(val) && val > 0 ? val : fallback;
}

export function safeSum(...vals: number[]): number {
  return vals.reduce((acc, val) => acc + (Number.isFinite(val) && val > 0 ? val : 0), 0);
}

export function kareBinaKenar(katAlani: number): number {
  return Math.sqrt(Math.max(katAlani, 1)) * 4;
}

export function binaDisCepheAlani(
  katAlani: number,
  katAdedi: number,
  katYuksekligi = 3
): number {
  return kareBinaKenar(katAlani) * katAdedi * katYuksekligi;
}

export function katAlaniHesapla(insaatAlani: number, katAdedi: number): number {
  return insaatAlani / Math.max(katAdedi, 1);
}

export function betonHacmiKatsayisi(tip: DosemeTipi): number {
  switch (tip) {
    case "kirisli":
      return 0.22;
    case "asmolen":
      return 0.18;
    case "nervurlu":
      return 0.2;
    case "flat_slab":
      return 0.25;
    default:
      return 0.22;
  }
}

export function demirKatsayisi(tip: DosemeTipi): number {
  switch (tip) {
    case "kirisli":
      return 0.055;
    case "asmolen":
      return 0.045;
    case "nervurlu":
      return 0.05;
    case "flat_slab":
      return 0.06;
    default:
      return 0.055;
  }
}
