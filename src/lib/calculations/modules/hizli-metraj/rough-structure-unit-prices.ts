import type { RoughStructureUnitPriceBook } from "./types";

export const ROUGH_STRUCTURE_PRICE_BOOK_2026_MARCH: RoughStructureUnitPriceBook = {
  id: "2026-03-yfk-kaba-tasiyici",
  year: 2026,
  monthLabel: "Mart 2026",
  publishedAt: "2026-03-03",
  sourceLabel: "2026 Mart Ayı Güncel İnşaat Birim Fiyat Listesi",
  sourceUrl:
    "https://webdosya.csb.gov.tr/v2/yfk/2026/03/2026-Mart-n-aat-B-F-20260303131312.pdf",
  notes: [
    "Beton birim fiyatı C30/37, gri renkli, pompa ile basılan hazır beton satırından alındı.",
    "Donatı birim fiyatı 8-12 mm ve 14-28 mm nervürlü beton çeliği yerleştirme pozlarının ağırlıklı ortalaması ile çözümlendi.",
    "Kalıp birim fiyatı plywood ile düz yüzeyli betonarme kalıbı pozundan alındı.",
  ],
  entries: {
    concreteC30_37: {
      id: "concrete-c30-37",
      pozNo: "15.150.1006",
      label: "Hazır Beton C30/37",
      description:
        "Beton santralinde üretilen veya satın alınan ve beton pompasıyla basılan, C30/37 basınç dayanım sınıfında, gri renkte, normal hazır beton dökülmesi (beton nakli dahil).",
      unit: "m3",
      unitPrice: 3748.06,
      sourceLine: "15.150.1006 · C30/37 hazır beton dökülmesi",
    },
    rebar8To12: {
      id: "rebar-8-12",
      pozNo: "15.160.1003",
      label: "Nervürlü Donatı 8-12 mm",
      description:
        "8-12 mm nervürlü beton çelik çubuğu, çubukların kesilmesi, bükülmesi ve yerine konulması.",
      unit: "ton",
      unitPrice: 47285.23,
      sourceLine: "15.160.1003 · 8-12 mm nervürlü beton çeliği",
    },
    rebar14To28: {
      id: "rebar-14-28",
      pozNo: "15.160.1004",
      label: "Nervürlü Donatı 14-28 mm",
      description:
        "14-28 mm nervürlü beton çelik çubuğu, çubukların kesilmesi, bükülmesi ve yerine konulması.",
      unit: "ton",
      unitPrice: 45419.63,
      sourceLine: "15.160.1004 · 14-28 mm nervürlü beton çeliği",
    },
    formworkPlywood: {
      id: "formwork-plywood",
      pozNo: "15.180.1003",
      label: "Plywood Betonarme Kalıbı",
      description: "Plywood ile düz yüzeyli betonarme kalıbı yapılması.",
      unit: "m2",
      unitPrice: 1058.99,
      sourceLine: "15.180.1003 · Plywood ile düz yüzeyli betonarme kalıbı",
    },
  },
  weightedRebarUnitPrice: 46445.71,
  weightedRebarNote:
    "Donatı birim fiyatı, kaba taşıyıcı sistem için %55 8-12 mm + %45 14-28 mm ağırlıklı ortalama ile kabul edildi.",
};

export function getRoughStructureUnitPriceBook(): RoughStructureUnitPriceBook {
  return ROUGH_STRUCTURE_PRICE_BOOK_2026_MARCH;
}
