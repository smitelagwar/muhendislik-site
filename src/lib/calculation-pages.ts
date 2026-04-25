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
    title: "İnşaat Maliyeti Analizi",
    navLabel: "İnşaat Maliyeti",
    description:
      "Kaba iş, ince iş ve genel giderleri 12 kategori altında görün. Varsayımları güncelleyip toplam maliyeti anlık izleyin.",
    badge: "Canlı",
    iconKey: "building",
    order: 1,
    keywords: ["maliyet", "metraj", "yaklaşık maliyet", "inşaat gideri", "proje bütçesi"],
  },
  {
    id: "tahmini-insaat-alani",
    href: "/hesaplamalar/tahmini-insaat-alani",
    title: "Tahmini İnşaat Alanı",
    navLabel: "Tahmini İnşaat Alanı",
    description:
      "Net parsel, TAKS ve KAKS verilerini girin; emsal dışı büyümeyi ve bodrum katkısını ekleyerek yaklaşık toplam inşaat alanını görün.",
    badge: "Yeni",
    iconKey: "plot",
    order: 2,
    keywords: ["arsa", "emsal", "kaks", "taks", "imar", "alan hesabı"],
  },
  {
    id: "resmi-birim-maliyet-2026",
    href: "/hesaplamalar/resmi-birim-maliyet-2026",
    title: "Resmî Birim Maliyet 2026",
    navLabel: "Resmî Birim Maliyet 2026",
    description:
      "2026 tebliğindeki resmî sınıfı seçin; m² birim maliyetini ve toplam resmî yaklaşık maliyeti tek ekranda görün.",
    badge: "Yeni",
    iconKey: "file",
    order: 3,
    keywords: ["çevre şehircilik", "tebliğ", "resmî maliyet", "birim maliyet", "2026"],
  },
];

export function getCalculationPages(): CalculationPageDefinition[] {
  return [...CALCULATION_PAGES].sort((left, right) => left.order - right.order);
}


