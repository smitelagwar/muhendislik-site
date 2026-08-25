import type { ArticleData } from "./articles-data";

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
const TDTH_PAGE = "https://www.afad.gov.tr/turkiye-deprem-tehlike-haritasi";
const UPDATED_AT = "25 Ağustos 2026";

export type DepremRolloutReferenceProfile = "tbdy" | "tbdy-hazard" | "preserve";
export type DepremVisualLayout = "flow" | "decision" | "comparison" | "classification";

export interface DepremRolloutSpec {
  slug: string;
  batch: 1 | 2 | 3;
  headline: string;
  eyebrow: string;
  steps: readonly [string, string, string];
  referenceProfile: DepremRolloutReferenceProfile;
  visualLayout: DepremVisualLayout;
}

function makeSpec(
  slug: string,
  batch: 1 | 2 | 3,
  headline: string,
  eyebrow: string,
  steps: readonly [string, string, string],
  referenceProfile: DepremRolloutReferenceProfile,
  visualLayout: DepremVisualLayout = "flow",
): DepremRolloutSpec {
  return { slug, batch, headline, eyebrow, steps, referenceProfile, visualLayout };
}

export const DEPREM_ROLLOUT_BATCH_1: readonly DepremRolloutSpec[] = [
  makeSpec("tbdy-2018-betonarme-analiz", 1, "TBDY 2018 ile Betonarme Analiz", "MODELLEME · ANALİZ · KONTROL", ["Model kabulleri", "Analiz ve düzensizlik", "Tasarım sonuçları"], "tbdy"),
  makeSpec("kisa-kolon-etkisi-tbdy-2018", 1, "Kısa Kolon Etkisi", "GEOMETRİ · KESME · DETAY", ["Serbest kolon boyu", "Kesme talebi", "Detay ve önlem"], "tbdy"),
  makeSpec("tbdy-2018-dogrusal-olmayan-tasarim", 1, "Doğrusal Olmayan Tasarım", "MODEL · TALEP · PERFORMANS", ["Model ve mafsal", "Deprem talebi", "Performans kontrolü"], "tbdy"),
  makeSpec("tbdy-2018-guclu-kolon-kontrolu", 1, "Güçlü Kolon Kontrolü", "KAPASİTE · BİRLEŞİM · SÜNEKLİK", ["Düğüm momentleri", "Kolon-kiriş kapasitesi", "Birleşim kontrolü"], "tbdy"),
  makeSpec("tbdy-2018-duzensizlikler-rehberi", 1, "TBDY Düzensizlik Kontrolleri", "PLAN · DÜŞEY · ANALİZ", ["Geometri ve rijitlik", "A/B düzensizlikleri", "Analiz kararı"], "tbdy"),
  makeSpec("tbdy-2018-sismik-izolasyon", 1, "Sismik İzolasyon", "SİSTEM · DEPLASMAN · DOĞRULAMA", ["İzolasyon sistemi", "Tasarım deplasmanı", "Üst-alt yapı kontrolü"], "tbdy"),
  makeSpec("tbdy-deprem-yer-hareketi-duzeyleri", 1, "Deprem Yer Hareketi Düzeyleri", "DD DÜZEYİ · SPEKTRUM · HEDEF", ["DD düzeyi", "Spektral parametre", "Performans hedefi"], "tbdy-hazard"),
  makeSpec("tbdy-afad-ss-s1-okuma", 1, "AFAD Ss ve S1 Okuma", "KOORDİNAT · HARİTA · PARAMETRE", ["Proje koordinatı", "Ss ve S1", "Zemin ve spektrum"], "tbdy-hazard"),
  makeSpec("tbdy-yerel-zemin-sinifi-spektrum", 1, "Yerel Zemin Sınıfı ve Spektrum", "ZEMİN · KATSAYI · SPEKTRUM", ["Yerel zemin sınıfı", "Fs ve F1", "Tasarım spektrumu"], "tbdy-hazard"),
  makeSpec("tbdy-tasarim-spektrumu-cizimi", 1, "Tasarım Spektrumu Çizimi", "SDS · SD1 · PERİYOT", ["SDS ve SD1", "TA ve TB", "Spektrum ordinatları"], "tbdy-hazard"),
  makeSpec("tbdy-r-d-dayanim-fazlaligi", 1, "R ve D Katsayıları", "SİSTEM · DAVRANIŞ · TASARIM", ["Taşıyıcı sistem", "R ve D seçimi", "Azaltılmış deprem etkisi"], "tbdy"),
  makeSpec("tbdy-bina-onem-katsayisi", 1, "Bina Önem Katsayısı", "KULLANIM · BKS · I KATSAYISI", ["Kullanım amacı", "Bina kullanım sınıfı", "Önem katsayısı"], "tbdy"),
] as const;

export const DEPREM_ROLLOUT_BATCH_2: readonly DepremRolloutSpec[] = [
  makeSpec("tbdy-suneklik-duzeyi-sistem-farki", 2, "Süneklik Düzeyi ve Sistem Farkı", "SİSTEM · SÜNEKLİK · DETAY", ["Taşıyıcı sistem", "Süneklik düzeyi", "Tasarım koşulları"], "tbdy"),
  makeSpec("tbdy-mod-birlesim-srss-cqc", 2, "Mod Birleştirme: SRSS ve CQC", "MOD · BİRLEŞTİRME · SONUÇ", ["Modal çözüm", "SRSS/CQC seçimi", "Tepki birleştirme"], "tbdy"),
  makeSpec("tbdy-goreli-kat-otelenmesi", 2, "Göreli Kat Ötelenmesi", "DEPLASMAN · KAT · SINIR", ["Kat deplasmanları", "Göreli ötelenme", "Sınır kontrolü"], "tbdy"),
  makeSpec("tbdy-dismerkezlik-kurali", 2, "TBDY Dışmerkezlik Kuralı", "KÜTLE · TORSİYON · YÜKLEME", ["Kütle merkezi", "Ek dışmerkezlik", "Torsiyon etkisi"], "tbdy"),
  makeSpec("tbdy-bodrum-katli-binalar", 2, "Bodrum Katlı Binalar", "BODRUM · RİJİTLİK · MODEL", ["Bodrum çevresi", "Rijitlik geçişi", "Analiz modeli"], "tbdy"),
  makeSpec("tbdy-cati-agirligi-yuk-azaltma", 2, "Çatı Ağırlığı ve Yük Azaltma", "KÜTLE · YÜK · DEPREM", ["Çatı yükleri", "Kütle hesabı", "Deprem etkisi"], "tbdy"),
  makeSpec("tbdy-p-delta-ikinci-mertebe", 2, "P-Delta ve İkinci Mertebe Etkileri", "EKSENEL · ÖTELENME · İKİNCİ MERTEBE", ["Eksenel yük", "Kat ötelenmesi", "İkinci mertebe kontrolü"], "tbdy"),
  makeSpec("turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi", 2, "Türkiye'de Depremler ve Yönetmelik Evrimi", "DEPREM · DENEYİM · MEVZUAT", ["Tarihsel olaylar", "Mühendislik dersleri", "Mevzuat gelişimi"], "preserve"),
  makeSpec("1999-marmara-depreminden-cikarilan-muhendislik-dersleri", 2, "1999 Marmara Depremi: Mühendislik Dersleri", "GÖZLEM · HASAR · DERS", ["Hasar gözlemleri", "Yapısal nedenler", "Tasarım dersleri"], "preserve"),
  makeSpec("betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari", 2, "Betonarme Perde Tasarımı", "GEOMETRİ · DAVRANIŞ · DETAY", ["Perde yerleşimi", "Boyut ve davranış", "Donatı detayları"], "preserve"),
  makeSpec("duzensiz-binalarda-dinamik-analiz-zorunlulugu", 2, "Düzensiz Binalarda Dinamik Analiz", "DÜZENSİZLİK · MODEL · ANALİZ", ["Düzensizliği tanı", "Modeli doğrula", "Dinamik analizi değerlendir"], "preserve"),
  makeSpec("deprem-yuku-ile-ruzgar-yuku-kombinasyonu", 2, "Deprem ve Rüzgâr Etkilerinin Ayrımı", "YÜK · KOMBİNASYON · TASARIM", ["Yük durumları", "Kombinasyon mantığı", "Tasarım zarfı"], "preserve"),
] as const;

export const DEPREM_ROLLOUT_BATCH_3: readonly DepremRolloutSpec[] = [
  makeSpec("mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir", 3, "Mevcut Binalarda Deprem Güvenliği", "İNCELEME · MODEL · KARAR", ["Ön inceleme ve veri", "Analiz ve performans", "Mühendislik kararı"], "preserve", "decision"),
  makeSpec("kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu", 3, "Kolon Güçlendirme: CFRP ve Beton Mantolama", "KAPASİTE · YÖNTEM · DETAY", ["Mevcut kapasite", "Güçlendirme yöntemi", "Detay ve uygulama"], "preserve", "comparison"),
  makeSpec("hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi", 3, "Hasarlı Bina Tespiti ve Etiketleme", "GÖZLEM · SINIF · EYLEM", ["Hasar gözlemi", "Sınıflandırma", "Erişim ve işlem kararı"], "preserve", "classification"),
  makeSpec("deprem-sigortasi-dask-ve-muhendislik-baglantisi", 3, "DASK ve Mühendislik Bağlantısı", "RİSK · BELGE · SÜREÇ", ["Yapı ve risk bilgisi", "Sigorta kapsamı", "Mühendislik belgesi"], "preserve", "flow"),
  makeSpec("yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek", 3, "Yatay Yük Taşıma Sistemleri", "ÇERÇEVE · PERDE · ÇEKİRDEK", ["Çerçeve davranışı", "Perde davranışı", "Çekirdek ve birleşik sistem"], "preserve", "comparison"),
  makeSpec("byy-bina-kullanim-siniflari-tehlike-kategorileri", 3, "Bina Kullanım Sınıfları ve Tehlike Kategorileri", "KULLANIM · TEHLİKE · GEREKLİLİK", ["Kullanım amacı", "Tehlike kategorisi", "Koruma gerekliliği"], "preserve", "classification"),
  makeSpec("tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120", 3, "Taşıyıcı Sistemlerde Yangına Dayanım Süresi", "R30 · R60 · R90 · R120", ["Yapı ve eleman", "Gerekli dayanım süresi", "Kesit ve koruma"], "preserve", "classification"),
  makeSpec("sprinkler-sistemi-zorunluluk-sinirlari", 3, "Sprinkler Sistemi Zorunluluk Sınırları", "KULLANIM · SINIR · KARAR", ["Bina kullanımını belirle", "Eşik koşullarını kontrol et", "Sprinkler kararını ver"], "preserve", "decision"),
  makeSpec("duman-tahliyesi-mekanik-ve-dogal-sistemler", 3, "Duman Tahliyesi: Mekanik ve Doğal Sistemler", "DUMAN · TAHLİYE · SİSTEM", ["Duman oluşumu ve bölge", "Doğal tahliye", "Mekanik tahliye"], "preserve", "comparison"),
  makeSpec("kacis-merdiveni-tasarim-kriterleri", 3, "Kaçış Merdiveni Tasarım Kriterleri", "KAÇIŞ · MERDİVEN · GÜVENLİ ALAN", ["Kullanıcı ve kaçış yükü", "Merdiven geometrisi", "Güvenli çıkış"], "preserve", "flow"),
  makeSpec("yangin-kapisi-dosleme-duvar-gecis-detaylari", 3, "Yangın Kapısı ve Geçiş Detayları", "BÖLME · GEÇİŞ · SIZDIRMAZLIK", ["Yangın bölmesi", "Kapı ve tesisat geçişi", "Süreklilik ve sızdırmazlık"], "preserve", "comparison"),
  makeSpec("yangin-algilama-ve-ihbar-sistemi-gereksinimleri", 3, "Yangın Algılama ve İhbar Sistemi", "ALGILAMA · ZON · İHBAR", ["Algılama ihtiyacı", "Zon ve cihaz yerleşimi", "İhbar ve kontrol"], "preserve", "flow"),
] as const;

export const DEPREM_ROLLOUT_ARTICLES: readonly DepremRolloutSpec[] = [
  ...DEPREM_ROLLOUT_BATCH_1,
  ...DEPREM_ROLLOUT_BATCH_2,
  ...DEPREM_ROLLOUT_BATCH_3,
];

const ROLLOUT_BY_SLUG = new Map(DEPREM_ROLLOUT_ARTICLES.map((item) => [item.slug, item] as const));

export const DEPREM_ROLLOUT_BATCH_1_SLUGS = new Set(DEPREM_ROLLOUT_BATCH_1.map((item) => item.slug));
export const DEPREM_ROLLOUT_BATCH_2_SLUGS = new Set(DEPREM_ROLLOUT_BATCH_2.map((item) => item.slug));
export const DEPREM_ROLLOUT_BATCH_3_SLUGS = new Set(DEPREM_ROLLOUT_BATCH_3.map((item) => item.slug));
export const DEPREM_ROLLOUT_SLUGS = new Set(DEPREM_ROLLOUT_ARTICLES.map((item) => item.slug));

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
    `![${spec.headline} için teknik kontrol şeması](${diagramPath})`,
    `*${spec.steps.join(" → ")} başlıklarını ${spec.visualLayout} düzeninde özetleyen teknik şema.*`,
    "{figure:R1 | note:Şema makaledeki kontrol başlıklarını özetler; mevzuat metninin, uzman incelemesinin veya proje hesabının yerine geçmez. | source:Mühendislik Site — makale içeriğinden türetilmiş teknik şema | lightbox:true}",
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
    .map((item) => `${item.batch}:${item.slug}:${item.headline}:${item.steps.join(">")}:${item.referenceProfile}:${item.visualLayout}:${UPDATED_AT}`)
    .join("|");
}
