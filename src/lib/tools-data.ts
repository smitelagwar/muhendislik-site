export type ToolIconKey = "rebar" | "column" | "beam" | "slab" | "cover" | "site" | "insulation" | "plot" | "earthquake";

export interface ToolDefinition {
  id: string;
  name: string;
  href: string;
  description: string;
  iconKey: ToolIconKey;
  discipline: string;
  featured: boolean;
  status: "live";
  order: number;
}

export const TOOLS_HUB_HREF = "/kategori/araclar";

export const TOOLS: ToolDefinition[] = [
  {
    id: "donati-hesabi",
    name: "Donatı Hesabı",
    href: "/kategori/araclar/donati-hesabi",
    description: "Çap ve adet girerek toplam donatı alanını ve eşdeğer seçenekleri hızlıca görün.",
    iconKey: "rebar",
    discipline: "Donatı Tasarımı",
    featured: true,
    status: "live",
    order: 1,
  },
  {
    id: "kolon-on-boyutlandirma",
    name: "Kolon Ön Boyutlandırma",
    href: "/kategori/araclar/kolon-on-boyutlandirma",
    description: "Dikdörtgen kolonlar için ilk kesiti ve tasarım alanını hızlı şekilde kontrol edin.",
    iconKey: "column",
    discipline: "Betonarme",
    featured: false,
    status: "live",
    order: 2,
  },
  {
    id: "kiris-kesiti",
    name: "Kiriş Kesiti",
    href: "/kategori/araclar/kiris-kesiti",
    description: "Eğilme donatısı ve kesme kontrolünü TS 500 mantığıyla aynı ekranda hızlıca görün.",
    iconKey: "beam",
    discipline: "Kiriş Tasarımı",
    featured: false,
    status: "live",
    order: 3,
  },
  {
    id: "doseme-kalinligi",
    name: "Döşeme Kalınlığı",
    href: "/kategori/araclar/doseme-kalinligi",
    description: "Açıklık-kalınlık oranı ve minimum donatı aralığını tek araçta ön kontrol edin.",
    iconKey: "slab",
    discipline: "Döşeme Tasarımı",
    featured: false,
    status: "live",
    order: 4,
  },
  {
    id: "pas-payi",
    name: "Pas Payı",
    href: "/kategori/araclar/pas-payi",
    description: "Nominal beton örtüsünü ve pratik pas payını hızlıca hesaplayın.",
    iconKey: "cover",
    discipline: "Betonarme Detay",
    featured: false,
    status: "live",
    order: 5,
  },
  {
    id: "kalip-sokum-suresi",
    name: "Kalıp Söküm Süresi",
    href: "/kategori/araclar/kalip-sokum-suresi",
    description: "Çimento tipi, sıcaklık ve eleman tipine göre tahmini kalıp söküm süresini görün.",
    iconKey: "site",
    discipline: "Şantiye",
    featured: false,
    status: "live",
    order: 6,
  },
  {
    id: "dis-cephe-yalitim-kalinligi",
    name: "D\u0131\u015f Cephe Yal\u0131t\u0131m Kal\u0131nl\u0131\u011f\u0131",
    href: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
    description: "TS 825:2024 mant\u0131\u011f\u0131yla d\u0131\u015f duvar i\u00e7in \u00f6nerilen yal\u0131t\u0131m kal\u0131nl\u0131\u011f\u0131n\u0131 h\u0131zl\u0131ca g\u00f6r\u00fcn.",
    iconKey: "insulation",
    discipline: "Is\u0131 Yal\u0131t\u0131m\u0131",
    featured: false,
    status: "live",
    order: 7,
  },
  {
    id: "imar-hesaplayici",
    name: "\u0130mar Hesaplay\u0131c\u0131",
    href: "/kategori/araclar/imar-hesaplayici",
    description: "Arsa alan\u0131, TAKS, KAKS ve \u00e7ekme mesafelerine g\u00f6re taban alan\u0131, kat kar\u015f\u0131l\u0131\u011f\u0131 ve yap\u0131la\u015fma \u00f6zetini \u00f6n kontrol edin.",
    iconKey: "plot",
    discipline: "\u0130mar",
    featured: false,
    status: "live",
    order: 8,
  },
  {
    id: "taban-kesme-kuvveti",
    name: "Taban Kesme Kuvveti (Eşdeğer Deprem Yükü)",
    href: "/kategori/araclar/taban-kesme-kuvveti",
    description: "TBDY 2018'e göre Eşdeğer Deprem Yükü ve Minimum Taban Kesme Kuvveti hesabı.",
    iconKey: "earthquake",
    discipline: "Deprem Mühendisliği",
    featured: false,
    status: "live",
    order: 9,
  },
];

export function getLiveTools(): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.status === "live").sort((left, right) => left.order - right.order);
}

export function getFeaturedTool(): ToolDefinition | null {
  const liveTools = getLiveTools();
  return liveTools.find((tool) => tool.featured) ?? liveTools[0] ?? null;
}

