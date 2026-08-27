import type { ArticleData } from "./articles-data";

interface Ts500VisualSpec { slug: string; headline: string; steps: readonly [string, string, string]; }

export const TS500_VISUAL_SPECS: readonly Ts500VisualSpec[] = [
  { slug: "ts500-beton-sinifi-secimi", headline: "Beton Sınıfı Seçimi", steps: ["Taşıyıcı gereksinim", "Çevresel etki", "Sınıf seçimi"] },
  { slug: "ts500-beton-ortusu-durabilite", headline: "Beton Örtüsü ve Durabilite", steps: ["Maruziyet", "Beton örtüsü", "Donatı korunması"] },
  { slug: "ts500-karakteristik-tasarim-dayanimlari", headline: "Karakteristik ve Tasarım Dayanımları", steps: ["Karakteristik dayanım", "Malzeme katsayısı", "Tasarım dayanımı"] },
  { slug: "ts500-donati-orani-sinirlari", headline: "Donatı Oranı Sınırları", steps: ["Eleman türü", "Alt ve üst sınır", "Süneklik ve detay"] },
  { slug: "ts500-kenetlenme-ek-yeri", headline: "Kenetlenme ve Donatı Ek Yeri", steps: ["Aderans", "Kenetlenme ve ek", "Ankraj düzeni"] },
  { slug: "ts500-egilme-donatisi-hesabi", headline: "Eğilme Donatısı Hesabı", steps: ["Kesit ve moment", "Basınç bölgesi", "Donatı düzeni"] },
  { slug: "ts500-tablali-kiris", headline: "Tablalı Kiriş Hesabı", steps: ["Döşeme-kiriş kesiti", "Etkin tabla", "Moment durumu"] },
  { slug: "ts500-surekli-kiris-moment-dagilimi", headline: "Sürekli Kiriş Moment Dağılımı", steps: ["Sürekli açıklıklar", "Moment bölgeleri", "Donatı kararı"] },
  { slug: "ts500-konsol-kiris-tasarimi", headline: "Konsol Kiriş Tasarımı", steps: ["Konsol yük yolu", "Mesnet etkileri", "Üst donatı ve ankraj"] },
  { slug: "ts500-kesme-donatisi-etriyer", headline: "Kesme Donatısı ve Etriye", steps: ["Eğik çatlak", "Beton katkısı", "Etriye düzeni"] },
  { slug: "ts500-kiris-burulma-donatisi", headline: "Kirişlerde Burulma Donatısı", steps: ["Burulma etkisi", "Kapalı etriye", "Boyuna donatı"] },
  { slug: "ts500-kiris-sehim-kontrolu", headline: "Betonarme Kirişlerde Sehim Kontrolü", steps: ["Servis yükü", "Etkin rijitlik", "Sehim kontrolü"] },
  { slug: "ts500-catlak-genisligi-kontrolu", headline: "Çatlak Genişliği Kontrolü", steps: ["Servis gerilmesi", "Donatı ve pas payı", "Çatlak dağılımı"] },
  { slug: "ts500-kolon-pm-etkilesimi", headline: "Kolon P-M Etkileşimi", steps: ["Eksenel yük", "Eğilme momenti", "P-M etkileşimi"] },
  { slug: "ts500-narin-kolon-ikinci-mertebe", headline: "Narin Kolon ve İkinci Mertebe", steps: ["Narinlik", "P-Δ ve P-δ", "Moment büyümesi"] },
  { slug: "ts500-dosleme-tek-cift-dogrultulu", headline: "Tek ve Çift Doğrultulu Döşemeler", steps: ["Döşeme geometrisi", "Yük aktarımı", "Donatı yönleri"] },
  { slug: "ts500-doseme-zimbalama-guvenligi", headline: "Döşemelerde Zımbalama Güvenliği", steps: ["Kolon-döşeme birleşimi", "Kritik çevre", "İki yönlü kesme"] },
  { slug: "ts500-zemin-kirisi-bodrum-perdesi", headline: "Zemin Kirişi ve Bodrum Perdesi", steps: ["Yük türü", "Taşıyıcı işlev", "Donatı yönü"] },
  { slug: "ts500-tekil-birlesik-temel-tasarimi", headline: "Tekil ve Birleşik Temel Tasarımı", steps: ["Kolon konumu", "Taban basıncı", "Temel seçimi"] },
  { slug: "ts500-radye-temel-egilme-kesme", headline: "Radye Temelde Eğilme ve Kesme", steps: ["Zemin tepkisi", "Kritik bölgeler", "Donatı ve zımbalama"] },
  { slug: "ts500-betonarme-merdiven", headline: "Betonarme Merdiven Tasarımı", steps: ["Eğik plak", "Sahanlık", "Donatı sürekliliği"] },
] as const;

const SPEC_BY_SLUG = new Map(TS500_VISUAL_SPECS.map((item) => [item.slug, item] as const));
const UPDATED_AT = "27 Ağustos 2026";

export function getTs500VisualPath(slug: string, asset: "cover" | "diagram") {
  return `/deprem-visual/${slug}/${asset}.svg`;
}

export function applyTs500VisualEnhancement(article: ArticleData): ArticleData {
  const spec = SPEC_BY_SLUG.get(article.slug);
  if (!spec) return article;

  const diagramPath = getTs500VisualPath(article.slug, "diagram");
  const figureMarkup = [
    `![${spec.headline} için açıklayıcı teknik şema](${diagramPath})`,
    `*${spec.steps.join(" → ")} ilişkisini konuya özel teknik düzende özetleyen şema.*`,
    "{figure:TS500-V1 | note:Şema kavramsal teknik anlatımdır; proje hesabı ve yürürlükteki standart metni ayrıca doğrulanmalıdır. | source:Mühendislik Site — makale içeriğinden türetilmiş teknik şema | lightbox:true}",
  ].join("\n");

  const sections = article.sections.map((section, index) => {
    if (index !== 0 || section.content.includes(diagramPath)) return section;
    return { ...section, content: `${section.content.trim()}\n\n${figureMarkup}` };
  });

  return {
    ...article,
    image: getTs500VisualPath(article.slug, "cover"),
    updatedAt: UPDATED_AT,
    sections,
  };
}

export function getTs500VisualSignature() {
  return TS500_VISUAL_SPECS.map((item) => `${item.slug}:${item.headline}:${item.steps.join(">")}:${UPDATED_AT}`).join("|");
}
