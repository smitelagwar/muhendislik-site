// ============================================================
// src/lib/calculations/presets.ts
// Hızlı başlangıç senaryoları — PDF raporlardan kalibre edilmiş
// ============================================================

import type { CategoryInputs, ProjectProfile } from "./types";

export interface Preset {
  id: string;
  label: string;
  description: string;
  project: ProjectProfile;
  inputs: CategoryInputs;
}

// ─────────────────────────────────────────────
// ORTAK VARSAYILAN KATEGORİ INPUTLARI
// ─────────────────────────────────────────────

/** Her preset için paylaşılan makul varsayılan inputlar */
const BASE_INPUTS: CategoryInputs = {
  betonDemir: {
    temelTuru:      "radye",
    temelKalinligi: 0.40,
    betonSinifi:    "C30",
    dosemeTipi:     "kirisli",
    dosemeKalinligi: 12,
  },
  duvar: {
    icDuvarMalzeme:  "tugla10",
    disDuvarMalzeme: "gazbeton15",
  },
  cati: {
    catiTipi:   "celik",
    kaplama:    "kiremit",
    isiYalitim: "xps",
  },
  suYalitimi: {
    membranKatSayisi:    2,
    balkonTerasSuYalitim: true,
  },
  disCephe: {
    kompozitOrani: 0.20,
    boyaOrani:     0.55,
    mantolama:     true,
  },
  isitmaSogutma: {
    isitmaSistemi: "radyator",
    isitmaCihazi:  "kombi",
    klimaBolumBasi: 2,
    sicakSuYontemi: "kombi",
  },
  seramikMermer: {
    merdivenMermer: true,
  },
  sivaBoya: {},
  pencereKapi: {
    dogramaTipi:          "pvc",
    camTuru:              "isicam",
    daireDiskKapiTipi:    "celik",
    odaKapiBolumBasi:      3,
    binaGirisKapisi:      true,
  },
  parkeKaplama: {
    parkeTuru:  "laminant",
    supurgelik: true,
  },
  elektrikAlcipan: {
    kartonpiyerVarMi:    true,
    goruntuluyDiyafon: true,
    kameraSistemi:     false,
    jenerator:         "yok",
  },
  kamuSabit: {
    ruhsatHarci:  true,
    enerjiBelgesi: true,
    zeminEtudu:    true,
    akustikRapor:  false,
    santiyeAylari: 18,
  },
};

// ─────────────────────────────────────────────
// PRESET 1 — Villa 2023
// Kaynak: ProjeRaporu-01.04.2023-Ornek-Villa-Projesi.pdf (~12.554 TL/m²)
// ─────────────────────────────────────────────

const PRESET_VILLA_2023: Preset = {
  id:           "villa-2023",
  label:        "Villa (Örnek 2023)",
  description:  "286 m², 2 katlı müstakil villa. ~12.554 TL/m² referans.",
  project: {
    presetId: "villa-2023",
    yapiTuru: "villa",
    insaatAlani: 250,
    katAdedi: 2,
    bagimsizBolumSayisi: 1,
    kaliteSeviyesi: "luks",
    muteahhitKariPct: 0.15,
    kdvOraniPct: 0.20,
  },
  inputs: {
    ...BASE_INPUTS,
    cati: {
      catiTipi:   "celik",
      kaplama:    "osb_singil",
      isiYalitim: "tas_yunu",
    },
    isitmaSogutma: {
      ...BASE_INPUTS.isitmaSogutma,
      isitmaSistemi: "yerden",
      isitmaCihazi:  "kombi",
      klimaBolumBasi: 3,
    },
    disCephe: {
      kompozitOrani: 0.30,
      boyaOrani:     0.40,
      mantolama:     true,
    },
    kamuSabit: {
      ...BASE_INPUTS.kamuSabit,
      enerjiBelgesi: true,
      zeminEtudu:    true,
      akustikRapor:  false,
      santiyeAylari: 12,
    },
  },
};

// ─────────────────────────────────────────────
// PRESET 2 — 3-4 Katlı Apartman
// Kaynak: kişisel kullanım senaryosu (radye temel, bağımsız ısıtma)
// ─────────────────────────────────────────────

const PRESET_APARTMAN_KUCUK: Preset = {
  id:           "apartman-3-4-kat",
  label:        "Apartman (3-4 Katlı)",
  description:  "3-4 katlı, 8 bağımsız bölümlü, radye temelli konut.",
  project: {
    presetId: "apartman-3-4-kat",
    yapiTuru: "apartman",
    insaatAlani: 1200,
    katAdedi: 4,
    bagimsizBolumSayisi: 8,
    kaliteSeviyesi: "orta",
    muteahhitKariPct: 0.15,
    kdvOraniPct: 0.20,
  },
  inputs: {
    ...BASE_INPUTS,
    isitmaSogutma: {
      ...BASE_INPUTS.isitmaSogutma,
      isitmaSistemi:  "radyator",
      isitmaCihazi:   "kombi",
      klimaBolumBasi: 2,
    },
    kamuSabit: {
      ...BASE_INPUTS.kamuSabit,
      enerjiBelgesi: true,
      zeminEtudu:    true,
      akustikRapor:  false,
      santiyeAylari: 18,
    },
  },
};

// ─────────────────────────────────────────────
// PRESET 3 — 7 Katlı Apartman
// Kaynak: Huzur Apartmanı 2026 (3705 m²) benzeri
// ─────────────────────────────────────────────

const PRESET_APARTMAN_BUYUK: Preset = {
  id:           "apartman-7-kat",
  label:        "Apartman (7 Katlı)",
  description:  "7 katlı, ~3400 m², merkezi ısıtmalı apartman. Huzur Apt. 2026 benzeri.",
  project: {
    presetId: "apartman-7-kat",
    yapiTuru: "apartman",
    insaatAlani: 3500,
    katAdedi: 7,
    bagimsizBolumSayisi: 28,
    kaliteSeviyesi: "ust",
    muteahhitKariPct: 0.20,
    kdvOraniPct: 0.20,
  },
  inputs: {
    ...BASE_INPUTS,
    isitmaSogutma: {
      isitmaSistemi:  "radyator",
      isitmaCihazi:   "kazan",   // merkezi kazan
      klimaBolumBasi: 2,
      sicakSuYontemi: "boyler",
    },
    kamuSabit: {
      ...BASE_INPUTS.kamuSabit,
      enerjiBelgesi: true,
      zeminEtudu:    true,
      akustikRapor:  true,
      santiyeAylari: 30,
    },
  },
};

// ─────────────────────────────────────────────
// PRESET REGISTRY
// ─────────────────────────────────────────────

export const PRESETS: Preset[] = [
  PRESET_VILLA_2023,
  PRESET_APARTMAN_KUCUK,
  PRESET_APARTMAN_BUYUK,
];

export const PRESET_MAP = new Map<string, Preset>(
  PRESETS.map((p) => [p.id, p])
);

export function getPreset(id: string): Preset | undefined {
  return PRESET_MAP.get(id);
}
