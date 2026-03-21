// ============================================================
// src/lib/calculations/price-books.ts
// Varsayılan birim fiyat seti (2024-2025 ortalama piyasa)
// Referans: insaathesabi.com örnek villa ve apartman raporları
// ============================================================

import type { PriceBook } from "./types";

export const DEFAULT_PRICE_BOOK: PriceBook = {
  // ── Beton & Demir ──────────────────────────
  c25Beton:           2_600,   // TL/m³
  c30Beton:           2_800,
  c35Beton:           3_100,
  demir:             22_000,   // TL/ton
  kalipIscilik:         480,   // TL/m²
  demirIscilik:         130,   // TL/m²

  // ── Duvar ──────────────────────────────────
  tugla10:              6.5,   // TL/adet
  tugla85:              5.5,
  gazbeton:          2_200,    // TL/m³
  tuglaIscilik:          65,   // TL/m²
  gazbetonIscilik:       60,

  // ── Çatı ───────────────────────────────────
  celik:            24_000,    // TL/ton
  singil:              120,    // TL/m²
  membran:             650,    // TL/top (≈ 8m²)
  tasYunu:              60,    // TL/m²
  xps:                  65,

  // ── Su yalıtımı ────────────────────────────
  membranIscilik:        55,   // TL/m²
  drenaj:                45,   // TL/mt

  // ── Dış cephe ──────────────────────────────
  kompozit:          2_000,    // TL/m²
  sove:                 95,    // TL/m²
  soveMtul:            490,    // TL/mtül
  cepheBoya:             90,   // TL/m²
  mantolama5cm:         380,   // TL/m²

  // ── Isıtma & soğutma ───────────────────────
  yerdenIsitma:         180,   // TL/m²
  radyator:           1_350,   // TL/mtül
  kombi:             16_000,   // TL/adet
  kazan:            160_000,   // TL/adet (yoğuşmalı, merkezi)
  klima:             15_000,   // TL/adet

  // ── Seramik & mermer ───────────────────────
  banyoDuvarSeramik:    550,   // TL/m²
  banyoYerSeramik:      530,
  mutfakYerSeramik:     550,
  holYerSeramik:        550,
  seramikIscilik:       140,   // TL/m²
  mermerBasamak:        520,   // TL/mtül
  mermerIscilik:        150,
  seramikYapistirici:   150,   // TL/torba

  // ── Sıva & boya ────────────────────────────
  makineAlcisi:          90,   // TL/torba
  alciIscilik:           60,   // TL/m²
  karaSivaIscilik:       80,
  boyaMalzemeIscilik:    55,   // TL/m² (malzeme + işçilik)

  // ── Pencere & kapı ─────────────────────────
  pvcProfil:          1_100,   // TL/mtül
  aluminyumProfil:      950,
  isicam:             1_100,   // TL/m²
  celikKapi:          9_500,   // TL/adet
  ahsapKapi:         15_000,
  binaGirisKapisi:   45_000,

  // ── Parke ──────────────────────────────────
  laminantParke:        950,   // TL/m²
  masifParke:         2_200,
  spcParke:           1_200,
  lamineParke:          850,
  ahsapSupurgelik:       20,   // TL/mtül

  // ── Elektrik & alçıpan ─────────────────────
  elektrikBolumBasi: 12_000,   // TL/bölüm
  kartonpiyer:           90,   // TL/mtül
  alcipan:              260,   // TL/m²

  // ── Kamu & sabit giderler ──────────────────
  bayindirlikBirimM2: 6_500,   // TL/m² (Bayındırlık birim fiyatı)
  yapiDenetimOrani:    0.0158, // oran (1.58%)
  santiyeAylikMaliyet:45_000,  // TL/ay
};

/** Bölgesel katsayılar (ilerleyen fazda genişletilebilir) */
export const REGIONAL_COEFFICIENTS: Record<string, number> = {
  istanbul:   1.12,
  ankara:     1.05,
  izmir:      1.08,
  antalya:    1.04,
  diger:      1.00,
};
