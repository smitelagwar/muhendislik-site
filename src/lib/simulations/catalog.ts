export type SimulationSceneSlug =
  | "kolon-detayi"
  | "kiris-detayi"
  | "kolon-kiris-birlesimi"
  | "tekil-temel"
  | "perde-detayi"
  | "radye-temel";

export interface SimulationCatalogItem {
  slug: SimulationSceneSlug;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  href: string;
  categoryLabel: string;
  referenceLabel: string;
  learningFocus: string[];
  status: "live";
  order: number;
}

export const SIMULATIONS_HUB_HREF = "/kategori/araclar/simulasyonlar";

export const SIMULATION_CATALOG: readonly SimulationCatalogItem[] = [
  {
    slug: "kolon-detayi",
    title: "Betonarme Kolon Donatı Detayı (C1 Eğitim Örneği)",
    shortTitle: "Kolon Donatı Detayı",
    subtitle: "300×300 mm kesit, 4Ø20 boyuna donatı ve bölgesel Ø10 etriye yerleşimi",
    description:
      "Boyuna donatı, etriye sıklaştırma/orta bölgeleri, üst filiz uzantısı ve beton örtüsü ilişkisini 3B kafes ve 2B şematik görünüm üzerinde etkileşimli olarak inceleyin.",
    href: `${SIMULATIONS_HUB_HREF}/kolon-detayi`,
    categoryLabel: "Düşey Taşıyıcı Eleman",
    referenceLabel: "C1 Eğitim Örneği",
    learningFocus: [
      "Boyuna donatıların köşe yerleşimi ve filiz uzantısı",
      "Alt/üst sarılma ve orta bölge etriye aralıklarının dağılımı",
      "Beton örtüsü (pas payı) ile iç donatı kafesi ilişkisi",
    ],
    status: "live",
    order: 1,
  },
  {
    slug: "kiris-detayi",
    title: "Betonarme Kiriş Donatı Detayı (K1 Eğitim Örneği)",
    shortTitle: "Kiriş Donatı Detayı",
    subtitle: "300×500 mm kesit, 4000 mm açıklık, alt/üst donatı ve mesnet/açıklık etriye bölgeleri",
    description:
      "Çerçeve kirişinde alt açıklık donatısı, üst montaj ve mesnet ilave donatıları, sol/sağ mesnet sarılma sıklaştırması ile uç mesnet ankrajlarını 3B kafes ve 2B kesitlerle inceleyin.",
    href: `${SIMULATIONS_HUB_HREF}/kiris-detayi`,
    categoryLabel: "Yatay Eğilme Elemanı",
    referenceLabel: "K1 Eğitim Örneği",
    learningFocus: [
      "Yükleme kabulüne göre açıklıkta alt, mesnetlerde üst çekme bölgesi ve ilave donatılar",
      "Sol/sağ mesnet sarılma bölgeleri (Ø10/100) ile orta açıklık (Ø10/150) etriye farkı",
      "Uç mesnet temsili ve kiriş boyuna donatılarının 90° mesnet ankraj kancaları",
    ],
    status: "live",
    order: 2,
  },
  {
    slug: "kolon-kiris-birlesimi",
    title: "Kolon–Kiriş Dış Birleşimi Donatı Detayı (D1 Eğitim Örneği)",
    shortTitle: "Kolon–Kiriş Dış Birleşimi",
    subtitle:
      "400×400 mm dış kolon, 300×500 mm saplanan kiriş, düğüm çekirdeği etriyeleri ve 90° ankraj kancaları",
    description:
      "Dış çerçeve düğüm noktasında kolon boyuna/enine donatıları ile kiriş alt/üst donatılarının kasıtsız çakışma olmadan çekirdek içine 90° ankrajlanmasını, parça izolasyonu ve kesitlerle inceleyin.",
    href: `${SIMULATIONS_HUB_HREF}/kolon-kiris-birlesimi`,
    categoryLabel: "Çerçeve Düğüm Bölgesi",
    referenceLabel: "D1 Eğitim Örneği",
    learningFocus: [
      "Düğüm çekirdeği içinde devam eden yatay kolon etriyeleri ile kiriş sarılma etriyelerinin ayrımı",
      "Kiriş üst ve alt boyuna donatılarının dış kolon arka yüzüne 90° ankraj kancaları",
      "Kolon ve kiriş donatı düzlemlerinin iç içe geçmeden kademeli yerleşimi",
    ],
    status: "live",
    order: 3,
  },
  {
    slug: "tekil-temel",
    title: "Betonarme Tekil Temel ve Kolon Filizi Detayı (T1 Eğitim Örneği)",
    shortTitle: "Tekil Temel Detayı",
    subtitle:
      "1800×1800×500 mm tekil temel, gerçek kot farklı X/Y alt ızgarası, L-bükümlü kolon filizleri ve grobeton",
    description:
      "Tekil temelde grobeton ve paspayı takozları üzerinde yükselen X/Y alt donatı ızgarasının gerçek kot farkını, kolon filizlerinin ızgaraya oturan 90° bükümlü ayaklarını plan ve düşey kesitle inceleyin.",
    href: `${SIMULATIONS_HUB_HREF}/tekil-temel`,
    categoryLabel: "Temel & Altyapı Elemanı",
    referenceLabel: "T1 Eğitim Örneği",
    learningFocus: [
      "Alt X (Z=58 mm) ve Y (Z=74 mm) donatı katmanlarının 16 mm gerçek eksen kotu farkı",
      "Kolon filizlerinin alt ızgara üzerine oturan 90° bükümlü (yay + yatay ayak) kenetlenmesi",
      "Temsilî grobeton tabakası ve paspayı takozlarıyla net örtü (c=50 mm) ilişkisi",
    ],
    status: "live",
    order: 4,
  },
  {
    slug: "perde-detayi",
    title: "Betonarme Perde Duvar Donatı Detayı (P1 Eğitim Örneği)",
    shortTitle: "Perde Duvar Detayı",
    subtitle:
      "2400×300 mm boşluksuz perde, sol/sağ perde uç bölgeleri, ön/arka iki yüz gövde ağları ve çirozlar",
    description:
      "Boşluksuz betonarme perdede ön ve arka iki yüzdeki yatay/düşey gövde donatılarını, her iki uçtaki sargılı perde uç bölgelerini ve iki yüzü birbirine bağlayan çirozları ayrı ayrı inceleyin.",
    href: `${SIMULATIONS_HUB_HREF}/perde-detayi`,
    categoryLabel: "Yatay Yük & Rijitlik Elemanı",
    referenceLabel: "P1 Eğitim Örneği",
    learningFocus: [
      "Ön yüz (Y=-102/-114 mm) ve arka yüz (Y=+102/+114 mm) çift sıra gövde donatı ağlarının ayrımı",
      "Sol ve sağ perde uç bölgelerindeki (450×300 mm) yoğun boyuna donatı ve kapalı uç etriyeleri",
      "İki yüz donatı ağını birbirine bağlayan gövde ve uç bölgesi çirozları (bağlayıcılar)",
    ],
    status: "live",
    order: 5,
  },
  {
    slug: "radye-temel",
    title: "Betonarme Radye Temel, Sehpa ve Kolon Filizi Detayı (R1 Eğitim Örneği)",
    shortTitle: "Radye Temel Detayı",
    subtitle:
      "2200×2200×600 mm radye temel parçası, alt/üst iki yönlü Ø16 ızgara, Ø14 sehpa donatıları ve 8Ø20 kolon filizi",
    description:
      "Radye temel plağında alt iki yönlü ızgara (Z=58/74 mm), üst iki yönlü ızgara (Z=526/542 mm), üst ağı taşıyan sehpa donatıları ve kolon filizlerinin kenetlenmesini katman katman ve kesitlerle inceleyin.",
    href: `${SIMULATIONS_HUB_HREF}/radye-temel`,
    categoryLabel: "Yüzeysel Temel & Altyapı",
    referenceLabel: "R1 Eğitim Örneği",
    learningFocus: [
      "Alt iki yönlü ızgara (Z=58/74 mm) ile üst iki yönlü ızgaranın (Z=526/542 mm) ayrı katmanlarda incelenmesi",
      "Üst radye donatı ağını beton dökümü sırasında kotunda tutan Ø14 sehpa (chair) donatıları",
      "Merkez kolon boynu için 8Ø20 L-bükümlü kolon filizi grubu ve kılavuz etriyeleri",
    ],
    status: "live",
    order: 6,
  },
] as const;

export function getLiveSimulations(): SimulationCatalogItem[] {
  return SIMULATION_CATALOG.filter((item) => item.status === "live").sort(
    (a, b) => a.order - b.order,
  );
}

export function getSimulationCatalogItem(
  slug: string,
): SimulationCatalogItem | undefined {
  return SIMULATION_CATALOG.find(
    (item) => item.slug === slug && item.status === "live",
  );
}

export function isLiveSimulationSlug(slug: string): slug is SimulationSceneSlug {
  return SIMULATION_CATALOG.some(
    (item) => item.slug === slug && item.status === "live",
  );
}
