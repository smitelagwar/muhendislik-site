export type CalculationPageIconKey = "building" | "plot" | "file";

export interface CalculationPageDefinition {
  id: string;
  href: string;
  title: string;
  navLabel: string;
  description: string;
  badge: string;
  iconKey: CalculationPageIconKey;
  order: number;
  keywords: string[];
}

export const CALCULATIONS_HUB_HREF = "/hesaplamalar";

const CALCULATION_PAGES: CalculationPageDefinition[] = [
  {
    id: "insaat-maliyeti",
    href: "/hesaplamalar/insaat-maliyeti",
    title: "Insaat Maliyet Analizi",
    navLabel: "Insaat Maliyeti",
    description:
      "Kaba is, ince is ve kamu giderlerini 12 kategori altinda gorun. Varsayimlari duzenleyin, toplam maliyeti aninda izleyin.",
    badge: "Canli",
    iconKey: "building",
    order: 1,
    keywords: ["maliyet", "metraj", "yaklasik maliyet", "insaat gideri", "proje butcesi"],
  },
  {
    id: "tahmini-insaat-alani",
    href: "/hesaplamalar/tahmini-insaat-alani",
    title: "Tahmini Insaat Alani",
    navLabel: "Tahmini Insaat Alani",
    description:
      "Net parsel, TAKS ve KAKS verilerini girin; emsal disi buyumeyi ve bodrum katkisini da ekleyerek yaklasik toplam insaat alanini gorun.",
    badge: "Yeni",
    iconKey: "plot",
    order: 2,
    keywords: ["arsa", "emsal", "kaks", "taks", "imar", "alan hesabi"],
  },
  {
    id: "resmi-birim-maliyet-2026",
    href: "/hesaplamalar/resmi-birim-maliyet-2026",
    title: "Resmi Birim Maliyet 2026",
    navLabel: "Resmi Birim Maliyet 2026",
    description:
      "2026 tebligindeki resmi sinifi secin, m2 birim maliyeti ve toplam resmi yaklasik maliyeti tek ekranda gorun.",
    badge: "Yeni",
    iconKey: "file",
    order: 3,
    keywords: ["cevre sehircilik", "teblig", "resmi maliyet", "birim maliyet", "2026"],
  },
];

export function getCalculationPages(): CalculationPageDefinition[] {
  return [...CALCULATION_PAGES].sort((left, right) => left.order - right.order);
}
