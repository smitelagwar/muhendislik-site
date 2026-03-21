// ============================================================
// src/lib/calculations/core.ts
// Saf yardımcı fonksiyonlar — UI bağımlılığı yok
// ============================================================

import type { KaliteSeviyesi, PriceBook, PriceLayer } from "./types";

// ─────────────────────────────────────────────
// KALİTE KATSAYILARI
// ─────────────────────────────────────────────

export const KALITE_KATSAYILARI: Record<KaliteSeviyesi, number> = {
  ekonomik: 0.80,
  orta:     1.00,
  ust:      1.25,
  luks:     1.60,
};

// ─────────────────────────────────────────────
// FORMATLAYICILAR
// ─────────────────────────────────────────────

/** 1234567 → "1.234.567 TL" */
export function formatTL(tutar: number): string {
  return Math.round(tutar).toLocaleString("tr-TR") + " TL";
}

/** 1234567 → "1.234.567" (TL etiketi olmadan) */
export function formatSayi(n: number, digits = 0): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 0.3985 → "%40,0" */
export function formatYuzde(oran: number): string {
  return "%" + (oran * 100).toFixed(1).replace(".", ",");
}

/** 12554.3 → "12.554 TL/m²" */
export function formatM2Fiyat(fiyat: number): string {
  return formatSayi(Math.round(fiyat)) + " TL/m²";
}

// ─────────────────────────────────────────────
// FİYAT KATMANI
// ─────────────────────────────────────────────

/**
 * PriceLayer zincirini çöz ve kullanılabilir PriceBook döndür.
 * Öncelik: manualOverride > systemDefault × regionalCoefficient
 * qualityFactor hesap motorunda ayrıca uygulanır (toplam üzerine).
 */
export function resolvePrice(key: keyof PriceBook, layer: PriceLayer): number {
  // 1. Manuel override en yüksek öncelik
  const override = layer.manualOverrides?.[key];
  if (override !== undefined && override > 0) return override;

  // 2. Sistem fiyatı × bölge katsayısı
  const base = layer.systemDefault[key] as number;
  const regional = layer.regionalCoefficient ?? 1.0;
  return base * regional;
}

/** Alınan tutara kalite katsayısı uygula */
export function applyKalite(tutar: number, kalite: KaliteSeviyesi): number {
  return tutar * KALITE_KATSAYILARI[kalite];
}

/** Alınan tutara fire oranı uygula (üst taraf hesabı) */
export function applyFire(miktar: number, fireOrani: number): number {
  return miktar * (1 + fireOrani);
}

// ─────────────────────────────────────────────
// VALİDASYON
// ─────────────────────────────────────────────

/** Negatif ve sıfır değerlere karşı güvenli sayı döndürür */
export function safePositive(val: number, fallback = 0): number {
  return isFinite(val) && val > 0 ? val : fallback;
}

/** İki değerin toplamını negatif olmayan şekilde döndürür */
export function safeSum(...vals: number[]): number {
  return vals.reduce((acc, v) => acc + (isFinite(v) && v > 0 ? v : 0), 0);
}

// ─────────────────────────────────────────────
// GEOMETRİK TÜRETMELER
// ─────────────────────────────────────────────

/** Kare bina varsayımıyla bina kenar uzunluğu (m) */
export function kareBinaKenar(katAlani: number): number {
  return Math.sqrt(Math.max(katAlani, 1)) * 4;
}

/** Toplam cephe alanı (yaklaşık, kare plan) */
export function binaDisCepheAlani(katAlani: number, katAdedi: number, katYuksekligi = 3.0): number {
  return kareBinaKenar(katAlani) * katAdedi * katYuksekligi;
}

/** Temel kat alanı = toplam inşaat alanı / kat adedi */
export function katAlaniHesapla(insaatAlani: number, katAdedi: number): number {
  return insaatAlani / Math.max(katAdedi, 1);
}

// ─────────────────────────────────────────────
// BETON & DEMİR YARDIMCILARI
// ─────────────────────────────────────────────

import type { DosemeTipi } from "./types";

/** m² başına beton hacmi katsayısı (m³/m²) */
export function betonHacmiKatsayisi(tip: DosemeTipi): number {
  switch (tip) {
    case "kirisli":   return 0.22;
    case "asmolen":   return 0.18;
    case "nervurlu":  return 0.20;
    case "flat_slab": return 0.25;
  }
}

/** m² başına demir tonu katsayısı (ton/m²) */
export function demirKatsayisi(tip: DosemeTipi): number {
  switch (tip) {
    case "kirisli":   return 0.055;
    case "asmolen":   return 0.045;
    case "nervurlu":  return 0.050;
    case "flat_slab": return 0.060;
  }
}
