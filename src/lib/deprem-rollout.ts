import type { ArticleData } from "./articles-data";

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
const TDTH_PAGE = "https://www.afad.gov.tr/turkiye-deprem-tehlike-haritasi";
const UPDATED_AT = "25 Ağustos 2026";

export interface DepremRolloutSpec {
  slug: string;
  headline: string;
  eyebrow: string;
  steps: readonly [string, string, string];
  hazardMap?: boolean;
}

export const DEPREM_ROLLOUT_BATCH_1: readonly DepremRolloutSpec[] = [
  {
    slug: "tbdy-2018-betonarme-analiz",
    headline: "TBDY 2018 ile Betonarme Analiz",
    eyebrow: "MODELLEME · ANALİZ · KONTROL",
    steps: ["Model kabulleri", "Analiz ve düzensizlik", "Tasarım sonuçları"],
  },
  {
    slug: "kisa-kolon-etkisi-tbdy-2018",
    headline: "Kısa Kolon Etkisi",
    eyebrow: "GEOMETRİ · KESME · DETAY",
    steps: ["Serbest kolon boyu", "Kesme talebi", "Detay ve önlem"],
  },
  {
    slug: "tbdy-2018-dogrusal-olmayan-tasarim",
    headline: "Doğrusal Olmayan Tasarım",
    eyebrow: "MODEL · TALEP · PERFORMANS",
    steps: ["Model ve mafsal", "Deprem talebi", "Performans kontrolü"],
  },
  {
    slug: "tbdy-2018-guclu-kolon-kontrolu",
    headline: "Güçlü Kolon Kontrolü",
    eyebrow: "KAPASİTE · BİRLEŞİM · SÜNEKLİK",
    steps: ["Düğüm momentleri", "Kolon-kiriş kapasitesi", "Birleşim kontrolü"],
  },
  {
    slug: "tbdy-2018-duzensizlikler-rehberi",
    headline: "TBDY Düzensizlik Kontrolleri",
    eyebrow: "PLAN · DÜŞEY · ANALİZ",
    steps: ["Geometri ve rijitlik", "A/B düzensizlikleri", "Analiz kararı"],
  },
  {
    slug: "tbdy-2018-sismik-izolasyon",
    headline: "Sismik İzolasyon",
    eyebrow: "SİSTEM · DEPLASMAN · DOĞRULAMA",
    steps: ["İzolasyon sistemi", "Tasarım deplasmanı", "Üst-alt yapı kontrolü"],
  },
  {
    slug: "tbdy-deprem-yer-hareketi-duzeyleri",
    headline: "Deprem Yer Hareketi Düzeyleri",
    eyebrow: "DD DÜZEYİ · SPEKTRUM · HEDEF",
    steps: ["DD düzeyi", "Spektral parametre", "Performans hedefi"],
    hazardMap: true,
  },
  {
    slug: "tbdy-afad-ss-s1-okuma",
    headline: "AFAD Ss ve S1 Okuma",
    eyebrow: "KOORDİNAT · HARİTA · PARAMETRE",
    steps: ["Proje koordinatı", "Ss ve S1", "Zemin ve spektrum"],
    hazardMap: true,
  },
  {
    slug: "tbdy-yerel-zemin-sinifi-spektrum",
    headline: "Yerel Zemin Sınıfı ve Spektrum",
    eyebrow: "ZEMİN · KATSAYI · SPEKTRUM",
    steps: ["Yerel zemin sınıfı", "Fs ve F1", "Tasarım spektrumu"],
    hazardMap: true,
  },
  {
    slug: "tbdy-tasarim-spektrumu-cizimi",
    headline: "Tasarım Spektrumu Çizimi",
    eyebrow: "SDS · SD1 · PERİYOT",
    steps: ["SDS ve SD1", "TA ve TB", "Spektrum ordinatları"],
    hazardMap: true,
  },
  {
    slug: "tbdy-r-d-dayanim-fazlaligi",
    headline: "R ve D Katsayıları",
    eyebrow: "SİSTEM · DAVRANIŞ · TASARIM",
    steps: ["Taşıyıcı sistem", "R ve D seçimi", "Azaltılmış deprem etkisi"],
  },
  {
    slug: "tbdy-bina-onem-katsayisi",
    headline: "Bina Önem Katsayısı",
    eyebrow: "KULLANIM · BKS · I KATSAYISI",
    steps: ["Kullanım amacı", "Bina kullanım sınıfı", "Önem katsayısı"],
  },
] as const;

const ROLLOUT_BY_SLUG = new Map(DEPREM_ROLLOUT_BATCH_1.map((spec) => [spec.slug, spec] as const));

export const DEPREM_ROLLOUT_BATCH_1_SLUGS = new Set(DEPREM_ROLLOUT_BATCH_1.map((spec) => spec.slug));

export function getDepremRolloutSpec(slug: string): DepremRolloutSpec | undefined {
  return ROLLOUT_BY_SLUG.get(slug);
}

export function isDepremRolloutSlug(slug: string): boolean {
  return DEPREM_ROLLOUT_BATCH_1_SLUGS.has(slug);
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

export function applyDepremRolloutEnhancement(article: ArticleData): ArticleData {
  const spec = getDepremRolloutSpec(article.slug);
  if (!spec) return article;

  const diagramPath = getDepremRolloutVisualPath(article.slug, "diagram");
  const figureMarkup = [
    `![${spec.headline} için teknik kontrol akışı](${diagramPath})`,
    `*${spec.steps.join(" → ")} sırasıyla okunacak teknik kontrol hattı.*`,
    "{figure:R1 | note:Şema makaledeki kontrol sırasını özetler; yönetmelik metninin veya proje hesabının yerine geçmez. | source:AFAD — Türkiye Bina Deprem Yönetmeliği 2018 | lightbox:true}",
  ].join("\n");

  const sections = article.sections.map((section, index) =>
    index === 0
      ? { ...section, content: `${section.content.trim()}\n\n${figureMarkup}` }
      : section,
  );

  const officialReferences: NonNullable<ArticleData["references"]> = [
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018", href: TBDY_PDF },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği sayfası", href: TBDY_PAGE },
  ];

  if (spec.hazardMap) {
    officialReferences.push({
      label: "AFAD — Türkiye Deprem Tehlike Haritası",
      href: TDTH_PAGE,
      note: "Konuma bağlı deprem tehlike parametrelerinin resmi harita kaynağı.",
    });
  }

  return {
    ...article,
    image: getDepremRolloutVisualPath(article.slug, "cover"),
    updatedAt: UPDATED_AT,
    sections,
    references: dedupeReferences([...(article.references ?? []), ...officialReferences]),
  };
}

export function getDepremRolloutSignature(): string {
  return DEPREM_ROLLOUT_BATCH_1
    .map((spec) => `${spec.slug}:${spec.headline}:${spec.steps.join(">")}:${UPDATED_AT}`)
    .join("|");
}
