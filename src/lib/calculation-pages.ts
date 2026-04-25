export type CalculationPageIconKey = "building" | "plot" | "file" | "layers";

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
    id: "tekil-temel",
    href: "/hesaplamalar/tekil-temel",
    title: "Tekil Temel Hesabı",
    navLabel: "Tekil Temel",
    description:
      "TS 500 ve zemin emniyet gerilmesi esaslarına göre tekil temel boyutlandırması, delme kesme ve donatı kontrollerini tek ekranda yapın.",
    badge: "Yeni",
    iconKey: "layers",
    order: 1.5,
    keywords: ["temel", "tekil temel", "zemin emniyet", "delme kesme", "donatı hesabı", "ts 500"],
  },
  {
    id: "hizli-metraj",
    href: "/hesaplamalar/hizli-metraj",
    title: "Hızlı Metraj Hesaplayıcı",
    navLabel: "Hızlı Metraj",
    description:
      "Kat alanı ve kat adedinden yaklaşık beton, donatı, kalıp ve taşıyıcı sistem maliyet bandını görün; resmî toplam maliyet ile yan yana kıyaslayın.",
    badge: "Yeni",
    iconKey: "layers",
    order: 2,
    keywords: [
      "hızlı metraj",
      "beton metrajı",
      "donatı tonajı",
      "kalıp alanı",
      "ön keşif",
      "taşıyıcı maliyet",
    ],
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
    order: 3,
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
    order: 4,
    keywords: ["çevre şehircilik", "tebliğ", "resmî maliyet", "birim maliyet", "2026"],
  },
];

export function getCalculationPages(): CalculationPageDefinition[] {
  return [...CALCULATION_PAGES].sort((left, right) => left.order - right.order);
}
