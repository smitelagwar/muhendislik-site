import type { ArticleData } from "./articles-data";

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
const TDTH_PAGE = "https://www.afad.gov.tr/turkiye-deprem-tehlike-haritasi";
const UPDATED_AT = "25 Ağustos 2026";

export type DepremRolloutReferenceProfile = "tbdy" | "tbdy-hazard" | "preserve";

export interface DepremRolloutSpec {
  slug: string;
  batch: 1 | 2;
  headline: string;
  eyebrow: string;
  steps: readonly [string, string, string];
  referenceProfile: DepremRolloutReferenceProfile;
}

export const DEPREM_ROLLOUT_BATCH_1: readonly DepremRolloutSpec[] = [
  {
    slug: "tbdy-2018-betonarme-analiz",
    batch: 1,
    headline: "TBDY 2018 ile Betonarme Analiz",
    eyebrow: "MODELLEME · ANALİZ · KONTROL",
    steps: ["Model kabulleri", "Analiz ve düzensizlik", "Tasarım sonuçları"],
    referenceProfile: "tbdy",
  },
  {
    slug: "kisa-kolon-etkisi-tbdy-2018",
    batch: 1,
    headline: "Kısa Kolon Etkisi",
    eyebrow: "GEOMETRİ · KESME · DETAY",
    steps: ["Serbest kolon boyu", "Kesme talebi", "Detay ve önlem"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-2018-dogrusal-olmayan-tasarim",
    batch: 1,
    headline: "Doğrusal Olmayan Tasarım",
    eyebrow: "MODEL · TALEP · PERFORMANS",
    steps: ["Model ve mafsal", "Deprem talebi", "Performans kontrolü"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-2018-guclu-kolon-kontrolu",
    batch: 1,
    headline: "Güçlü Kolon Kontrolü",
    eyebrow: "KAPASİTE · BİRLEŞİM · SÜNEKLİK",
    steps: ["Düğüm momentleri", "Kolon-kiriş kapasitesi", "Birleşim kontrolü"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-2018-duzensizlikler-rehberi",
    batch: 1,
    headline: "TBDY Düzensizlik Kontrolleri",
    eyebrow: "PLAN · DÜŞEY · ANALİZ",
    steps: ["Geometri ve rijitlik", "A/B düzensizlikleri", "Analiz kararı"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-2018-sismik-izolasyon",
    batch: 1,
    headline: "Sismik İzolasyon",
    eyebrow: "SİSTEM · DEPLASMAN · DOĞRULAMA",
    steps: ["İzolasyon sistemi", "Tasarım deplasmanı", "Üst-alt yapı kontrolü"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-deprem-yer-hareketi-duzeyleri",
    batch: 1,
    headline: "Deprem Yer Hareketi Düzeyleri",
    eyebrow: "DD DÜZEYİ · SPEKTRUM · HEDEF",
    steps: ["DD düzeyi", "Spektral parametre", "Performans hedefi"],
    referenceProfile: "tbdy-hazard",
  },
  {
    slug: "tbdy-afad-ss-s1-okuma",
    batch: 1,
    headline: "AFAD Ss ve S1 Okuma",
    eyebrow: "KOORDİNAT · HARİTA · PARAMETRE",
    steps: ["Proje koordinatı", "Ss ve S1", "Zemin ve spektrum"],
    referenceProfile: "tbdy-hazard",
  },
  {
    slug: "tbdy-yerel-zemin-sinifi-spektrum",
    batch: 1,
    headline: "Yerel Zemin Sınıfı ve Spektrum",
    eyebrow: "ZEMİN · KATSAYI · SPEKTRUM",
    steps: ["Yerel zemin sınıfı", "Fs ve F1", "Tasarım spektrumu"],
    referenceProfile: "tbdy-hazard",
  },
  {
    slug: "tbdy-tasarim-spektrumu-cizimi",
    batch: 1,
    headline: "Tasarım Spektrumu Çizimi",
    eyebrow: "SDS · SD1 · PERİYOT",
    steps: ["SDS ve SD1", "TA ve TB", "Spektrum ordinatları"],
    referenceProfile: "tbdy-hazard",
  },
  {
    slug: "tbdy-r-d-dayanim-fazlaligi",
    batch: 1,
    headline: "R ve D Katsayıları",
    eyebrow: "SİSTEM · DAVRANIŞ · TASARIM",
    steps: ["Taşıyıcı sistem", "R ve D seçimi", "Azaltılmış deprem etkisi"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-bina-onem-katsayisi",
    batch: 1,
    headline: "Bina Önem Katsayısı",
    eyebrow: "KULLANIM · BKS · I KATSAYISI",
    steps: ["Kullanım amacı", "Bina kullanım sınıfı", "Önem katsayısı"],
    referenceProfile: "tbdy",
  },
] as const;

export const DEPREM_ROLLOUT_BATCH_2: readonly DepremRolloutSpec[] = [
  {
    slug: "tbdy-suneklik-duzeyi-sistem-farki",
    batch: 2,
    headline: "Süneklik Düzeyi ve Sistem Farkı",
    eyebrow: "SİSTEM · SÜNEKLİK · DETAY",
    steps: ["Taşıyıcı sistem", "Süneklik düzeyi", "Tasarım koşulları"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-mod-birlesim-srss-cqc",
    batch: 2,
    headline: "Mod Birleştirme: SRSS ve CQC",
    eyebrow: "MOD · BİRLEŞTİRME · SONUÇ",
    steps: ["Modal çözüm", "SRSS/CQC seçimi", "Tepki birleştirme"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-goreli-kat-otelenmesi",
    batch: 2,
    headline: "Göreli Kat Ötelenmesi",
    eyebrow: "DEPLASMAN · KAT · SINIR",
    steps: ["Kat deplasmanları", "Göreli ötelenme", "Sınır kontrolü"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-dismerkezlik-kurali",
    batch: 2,
    headline: "TBDY Dışmerkezlik Kuralı",
    eyebrow: "KÜTLE · TORSİYON · YÜKLEME",
    steps: ["Kütle merkezi", "Ek dışmerkezlik", "Torsiyon etkisi"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-bodrum-katli-binalar",
    batch: 2,
    headline: "Bodrum Katlı Binalar",
    eyebrow: "BODRUM · RİJİTLİK · MODEL",
    steps: ["Bodrum çevresi", "Rijitlik geçişi", "Analiz modeli"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-cati-agirligi-yuk-azaltma",
    batch: 2,
    headline: "Çatı Ağırlığı ve Yük Azaltma",
    eyebrow: "KÜTLE · YÜK · DEPREM",
    steps: ["Çatı yükleri", "Kütle hesabı", "Deprem etkisi"],
    referenceProfile: "tbdy",
  },
  {
    slug: "tbdy-p-delta-ikinci-mertebe",
    batch: 2,
    headline: "P-Delta ve İkinci Mertebe Etkileri",
    eyebrow: "EKSENEL · ÖTELENME · İKİNCİ MERTEBE",
    steps: ["Eksenel yük", "Kat ötelenmesi", "İkinci mertebe kontrolü"],
    referenceProfile: "tbdy",
  },
  {
    slug: "turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi",
    batch: 2,
    headline: "Türkiye'de Depremler ve Yönetmelik Evrimi",
    eyebrow: "DEPREM · DENEYİM · MEVZUAT",
    steps: ["Tarihsel olaylar", "Mühendislik dersleri", "Mevzuat gelişimi"],
    referenceProfile: "preserve",
  },
  {
    slug: "1999-marmara-depreminden-cikarilan-muhendislik-dersleri",
    batch: 2,
    headline: "1999 Marmara Depremi: Mühendislik Dersleri",
    eyebrow: "GÖZLEM · HASAR · DERS",
    steps: ["Hasar gözlemleri", "Yapısal nedenler", "Tasarım dersleri"],
    referenceProfile: "preserve",
  },
  {
    slug: "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari",
    batch: 2,
    headline: "Betonarme Perde Tasarımı",
    eyebrow: "GEOMETRİ · DAVRANIŞ · DETAY",
    steps: ["Perde yerleşimi", "Boyut ve davranış", "Donatı detayları"],
    referenceProfile: "preserve",
  },
  {
    slug: "duzensiz-binalarda-dinamik-analiz-zorunlulugu",
    batch: 2,
    headline: "Düzensiz Binalarda Dinamik Analiz",
    eyebrow: "DÜZENSİZLİK · MODEL · ANALİZ",
    steps: ["Düzensizliği tanı", "Modeli doğrula", "Dinamik analizi değerlendir"],
    referenceProfile: "preserve",
  },
  {
    slug: "deprem-yuku-ile-ruzgar-yuku-kombinasyonu",
    batch: 2,
    headline: "Deprem ve Rüzgâr Etkilerinin Ayrımı",
    eyebrow: "YÜK · KOMBİNASYON · TASARIM",
    steps: ["Yük durumları", "Kombinasyon mantığı", "Tasarım zarfı"],
    referenceProfile: "preserve",
  },
] as const;

export const DEPREM_ROLLOUT_ARTICLES: readonly DepremRolloutSpec[] = [
  ...DEPREM_ROLLOUT_BATCH_1,
  ...DEPREM_ROLLOUT_BATCH_2,
];

const ROLLOUT_BY_SLUG = new Map(DEPREM_ROLLOUT_ARTICLES.map((spec) => [spec.slug, spec] as const));

export const DEPREM_ROLLOUT_BATCH_1_SLUGS = new Set(DEPREM_ROLLOUT_BATCH_1.map((spec) => spec.slug));
export const DEPREM_ROLLOUT_BATCH_2_SLUGS = new Set(DEPREM_ROLLOUT_BATCH_2.map((spec) => spec.slug));
export const DEPREM_ROLLOUT_SLUGS = new Set(DEPREM_ROLLOUT_ARTICLES.map((spec) => spec.slug));

export function getDepremRolloutSpec(slug: string): DepremRolloutSpec | undefined {
  return ROLLOUT_BY_SLUG.get(slug);
}

export function isDepremRolloutSlug(slug: string): boolean {
  return DEPREM_ROLLOUT_SLUGS.has(slug);
}

export function getDepremRolloutVisualPath(slug: string, asset: "cover" | "diagram") {
  return `/deprem-visual/${slug}/${asset}.svg`;
}

function dedupeReferences(references: NonNullable<ArticleData["references"]>) {
  const seen = new Set<string>();
  return references.filter((reference) => {
    const key = `${reference.href ?? ""}|${reference.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function officialReferencesFor(spec: DepremRolloutSpec): NonNullable<ArticleData["references"]> {
  if (spec.referenceProfile === "preserve") return [];

  const references: NonNullable<ArticleData["references"]> = [
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018", href: TBDY_PDF },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği sayfası", href: TBDY_PAGE },
  ];

  if (spec.referenceProfile === "tbdy-hazard") {
    references.push({
      label: "AFAD — Türkiye Deprem Tehlike Haritası",
      href: TDTH_PAGE,
      note: "Konuma bağlı deprem tehlike parametrelerinin resmi harita kaynağı.",
    });
  }

  return references;
}

export function applyDepremRolloutEnhancement(article: ArticleData): ArticleData {
  const spec = getDepremRolloutSpec(article.slug);
  if (!spec) return article;

  const diagramPath = getDepremRolloutVisualPath(article.slug, "diagram");
  const figureMarkup = [
    `![${spec.headline} için teknik kontrol akışı](${diagramPath})`,
    `*${spec.steps.join(" → ")} sırasıyla okunacak teknik kontrol hattı.*`,
    "{figure:R1 | note:Şema makaledeki kontrol sırasını özetler; yönetmelik metninin veya proje hesabının yerine geçmez. | source:Mühendislik Site — makale içeriğinden türetilmiş kontrol şeması | lightbox:true}",
  ].join("\n");

  const sections = article.sections.map((section, index) =>
    index === 0
      ? { ...section, content: `${section.content.trim()}\n\n${figureMarkup}` }
      : section,
  );

  return {
    ...article,
    image: getDepremRolloutVisualPath(article.slug, "cover"),
    updatedAt: UPDATED_AT,
    sections,
    references: dedupeReferences([...(article.references ?? []), ...officialReferencesFor(spec)]),
  };
}

export function getDepremRolloutSignature(): string {
  return DEPREM_ROLLOUT_ARTICLES
    .map((spec) => `${spec.batch}:${spec.slug}:${spec.headline}:${spec.steps.join(">")}:${spec.referenceProfile}:${UPDATED_AT}`)
    .join("|");
}
