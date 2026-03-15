import type { ConcreteToolNavItem } from "@/lib/concrete-tools/types";

export const CONCRETE_TOOL_NAV: ConcreteToolNavItem[] = [
  {
    id: "kolon-on-boyutlandirma",
    label: "Kolon",
    href: "/kategori/araclar/kolon-on-boyutlandirma",
  },
  {
    id: "kiris-kesiti",
    label: "Kiriş Kesiti",
    href: "/kategori/araclar/kiris-kesiti",
  },
  {
    id: "doseme-kalinligi",
    label: "Döşeme Kalınlığı",
    href: "/kategori/araclar/doseme-kalinligi",
  },
  {
    id: "pas-payi",
    label: "Pas Payı",
    href: "/kategori/araclar/pas-payi",
  },
];

export const CONCRETE_TOOL_STANDARDS = "TS 500 · TBDY 2018 · TS EN 1992-1-1";

export const CONCRETE_TOOL_DISCLAIMER =
  "Bu araçlar ön tasarım ve hızlı teknik kontrol içindir. Nihai kesit, detay ve donatı kararları proje modeli, yük kombinasyonları ve yönetmelik kontrolleri ile birlikte verilmelidir.";
