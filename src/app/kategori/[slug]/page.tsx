import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Clock,
  FileText,
  GitBranchPlus,
  HardHat,
  Layers,
  Leaf,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Badge } from "@/components/ui/badge";
import { type ArticleData, getArticleList } from "@/lib/articles-data";
import {
  getSiteSectionById,
  matchesSiteSection,
  SITE_SECTIONS,
  type SiteSectionId,
} from "@/lib/site-sections";
import { buildSeoMetadata } from "@/lib/seo";

const SECTION_ICONS: Record<SiteSectionId, LucideIcon> = {
  araclar: FileText,
  "bina-asamalari": GitBranchPlus,
  "yapi-tasarimi": Building2,
  "deprem-yonetmelik": Shield,
  "tbdy-2018-detay": Shield,
  geoteknik: Layers,
  santiye: HardHat,
  malzeme: Building2,
  surdurulebilirlik: Leaf,
};

const SECTION_STYLES: Record<SiteSectionId, { color: string; bgColor: string }> = {
  araclar: {
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  "bina-asamalari": {
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
  },
  "yapi-tasarimi": {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
  },
  "deprem-yonetmelik": {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
  },
  "tbdy-2018-detay": {
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
  },
  geoteknik: {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
  },
  santiye: {
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  malzeme: {
    color: "text-zinc-600 dark:text-zinc-300",
    bgColor: "bg-zinc-50 dark:bg-zinc-900",
  },
  surdurulebilirlik: {
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
  },
};

const DEPREM_TS500_SERIES_ORDER = [
  "ts500-beton-sinifi-secimi",
  "ts500-egilme-donatisi-hesabi",
  "ts500-kesme-donatisi-etriyer",
  "ts500-donati-orani-sinirlari",
  "ts500-kenetlenme-ek-yeri",
  "ts500-kolon-pm-etkilesimi",
  "ts500-dosleme-tek-cift-dogrultulu",
  "ts500-tablali-kiris",
  "ts500-konsol-kiris-tasarimi",
  "ts500-beton-ortusu-durabilite",
  "ts500-surekli-kiris-moment-dagilimi",
  "ts500-zemin-kirisi-bodrum-perdesi",
  "ts500-betonarme-merdiven",
];

const DEPREM_YANGIN_SERIES_ORDER = [
  "byy-bina-kullanim-siniflari-tehlike-kategorileri",
  "byy-yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma",
  "byy-tasiyici-sistem-yangina-dayanim-suresi-r30-r120",
  "byy-sprinkler-sistemi-zorunluluk-sinirlari",
  "byy-duman-tahliyesi-mekanik-ve-dogal-sistemler",
  "byy-kacis-merdiveni-tasarim-kriterleri",
  "byy-yangin-kapisi-dosleme-duvar-gecis-detaylari",
  "byy-yangin-algilama-ve-ihbar-sistemi-gereksinimleri",
  "byy-yuksek-binalarda-ozel-yangin-onlemleri-bolum-9",
  "byy-bodrum-otopark-mutfak-yangin-uygulamalari",
];

const DEPREM_OTOPARK_SERIES_ORDER = [
  "otopark-kullanim-turune-gore-minimum-alan-hesabi",
  "otopark-rampa-egimi-genislik-donus-yaricapi",
  "otopark-kapali-havalandirma-co-konsantrasyonu",
  "otopark-yapisal-yuk-kombinasyonlari-arac-deprem",
  "otopark-elektrikli-arac-sarj-mevzuati",
];

const DEPREM_IMAR_SERIES_ORDER = [
  "imar-taks-kaks-emsal-hesabi",
  "imar-kat-yuksekligi-bina-yuksekligi-farki",
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari",
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani",
  "imar-cekme-kat-asma-kat-kosullari",
  "imar-balkon-cikma-sacak-emsal-disi-sartlari",
  "imar-ruhsat-sureci-basvurudan-iskan-kadar",
  "imar-parsel-tevhid-ifraz-prosedurleri",
  "imar-plan-notu-celiskisi-uygulama-onceligi",
];

const DEPREM_BEP_SERIES_ORDER = [
  "bep-isi-yalitim-u-degeri-yogusma-kontrolu",
  "bep-ts-825-yontemi-isi-kaybi-hesabi",
  "bep-enerji-kimlik-belgesi-a-g-siniflandirma",
  "bep-yenilenebilir-enerji-zorunlulugu-1000m2",
  "bep-yazilimi-hesaplama-akisi",
  "bep-isil-kopru-detaylari-ve-cozum-yontemleri",
];

const DEPREM_SU_ZEMIN_SERIES_ORDER = [
  "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi",
  "tbdy-bolum-16-zemin-yapi-etkilesimi",
  "zemin-sivlasma-riski-degerlendirmesi",
  "su-yalitimi-ts-4749-uygulama-detaylari",
  "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi",
];

const DEPREM_ENGELSIZ_SERIES_ORDER = [
  "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri",
  "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari",
  "engelsiz-wc-asansor-kapi-boyutlari",
  "engelsiz-yapi-ruhsatinda-uyum-kontrolu",
];

const DEPREM_EUROCODE_SERIES_ORDER = [
  "eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari",
  "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler",
  "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile",
  "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri",
  "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz",
];

const DEPREM_AKUSTIK_SERIES_ORDER = [
  "akustik-ts-en-iso-12354-ile-yalitim-hesabi",
];

const DEPREM_ASANSOR_SERIES_ORDER = [
  "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu",
  "asansor-makine-daireli-ve-dairesiz-sistemler",
  "asansor-guvenlik-aksesuarları-ve-periyodik-bakim-zorunlulugu",
  "asansor-deprem-sirasinda-otomatik-park-ozelligi",
];

const DEPREM_ISG_SERIES_ORDER = [
  "isg-santiye-guvenlik-plani-zorunlu-icerik",
  "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi",
  "isg-yuksekte-calisma-ve-iskele-guvenligi",
  "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol",
  "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi",
];

const DEPREM_CEVRE_SERIES_ORDER = [
  "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri",
  "cevre-insaat-atigi-yonetimi-yonetmeligi",
  "cevre-gurultu-ve-toz-santiye-yukumlulukleri",
  "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = getSiteSectionById(slug as SiteSectionId);

  if (!section || section.id === "araclar") {
    return buildSeoMetadata({
      title: "Kategori bulunamadı",
      description: "Aradığınız kategoriye ulaşılamadı.",
      pathname: `/kategori/${slug}`,
    });
  }

  return buildSeoMetadata({
    title: section.title,
    description: section.description,
    pathname: section.href,
    keywords: section.tags,
  });
}

const DEPREM_TS500_SERIES_PRIORITY = new Map(
  DEPREM_TS500_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_YANGIN_SERIES_PRIORITY = new Map(
  DEPREM_YANGIN_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_OTOPARK_SERIES_PRIORITY = new Map(
  DEPREM_OTOPARK_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_IMAR_SERIES_PRIORITY = new Map(
  DEPREM_IMAR_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_BEP_SERIES_PRIORITY = new Map(
  DEPREM_BEP_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_SU_ZEMIN_SERIES_PRIORITY = new Map(
  DEPREM_SU_ZEMIN_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_ENGELSIZ_SERIES_PRIORITY = new Map(
  DEPREM_ENGELSIZ_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_EUROCODE_SERIES_PRIORITY = new Map(
  DEPREM_EUROCODE_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_AKUSTIK_SERIES_PRIORITY = new Map(
  DEPREM_AKUSTIK_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_ASANSOR_SERIES_PRIORITY = new Map(
  DEPREM_ASANSOR_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_ISG_SERIES_PRIORITY = new Map(
  DEPREM_ISG_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

const DEPREM_CEVRE_SERIES_PRIORITY = new Map(
  DEPREM_CEVRE_SERIES_ORDER.map((slug, index) => [slug, index] as const)
);

function getDepremSeriesPriority(slug: string): number {
  const ts500Priority = DEPREM_TS500_SERIES_PRIORITY.get(slug);
  if (ts500Priority !== undefined) {
    return ts500Priority;
  }

  const firePriority = DEPREM_YANGIN_SERIES_PRIORITY.get(slug);
  if (firePriority !== undefined) {
    return 100 + firePriority;
  }

  const otoparkPriority = DEPREM_OTOPARK_SERIES_PRIORITY.get(slug);
  if (otoparkPriority !== undefined) {
    return 200 + otoparkPriority;
  }

  const imarPriority = DEPREM_IMAR_SERIES_PRIORITY.get(slug);
  if (imarPriority !== undefined) {
    return 300 + imarPriority;
  }

  const bepPriority = DEPREM_BEP_SERIES_PRIORITY.get(slug);
  if (bepPriority !== undefined) {
    return 400 + bepPriority;
  }

  const suZeminPriority = DEPREM_SU_ZEMIN_SERIES_PRIORITY.get(slug);
  if (suZeminPriority !== undefined) {
    return 500 + suZeminPriority;
  }

  const engelsizPriority = DEPREM_ENGELSIZ_SERIES_PRIORITY.get(slug);
  if (engelsizPriority !== undefined) {
    return 600 + engelsizPriority;
  }

  const eurocodePriority = DEPREM_EUROCODE_SERIES_PRIORITY.get(slug);
  if (eurocodePriority !== undefined) {
    return 700 + eurocodePriority;
  }

  const akustikPriority = DEPREM_AKUSTIK_SERIES_PRIORITY.get(slug);
  if (akustikPriority !== undefined) {
    return 800 + akustikPriority;
  }

  const asansorPriority = DEPREM_ASANSOR_SERIES_PRIORITY.get(slug);
  if (asansorPriority !== undefined) {
    return 900 + asansorPriority;
  }

  const isgPriority = DEPREM_ISG_SERIES_PRIORITY.get(slug);
  if (isgPriority !== undefined) {
    return 1000 + isgPriority;
  }

  const cevrePriority = DEPREM_CEVRE_SERIES_PRIORITY.get(slug);
  if (cevrePriority !== undefined) {
    return 1100 + cevrePriority;
  }

  return Number.MAX_SAFE_INTEGER;
}

export function generateStaticParams() {
  return SITE_SECTIONS.filter(
    (section) => section.id !== "araclar" && section.id !== "bina-asamalari"
  ).map((section) => ({ slug: section.id }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sectionId = slug as SiteSectionId;
  const section = getSiteSectionById(sectionId);

  if (!section || section.id === "araclar") {
    notFound();
  }

  const allArticles = getArticleList();
  const articleOrder = new Map(allArticles.map((article, index) => [article.slug, index] as const));
  const articles = allArticles
    .filter((article) => matchesSiteSection(article, section.id))
    .sort((left, right) => {
      if (section.id === "deprem-yonetmelik") {
        const leftPriority = getDepremSeriesPriority(left.slug);
        const rightPriority = getDepremSeriesPriority(right.slug);

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
      }

      return (articleOrder.get(left.slug) ?? 0) - (articleOrder.get(right.slug) ?? 0);
    });
  const Icon = SECTION_ICONS[section.id];
  const styles = SECTION_STYLES[section.id];

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBackLink={false}
          className="mb-8"
          breadcrumbsClassName="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 text-xs font-bold text-zinc-500"
        />

        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center">
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl ${styles.bgColor}`}
          >
            <Icon className={`h-10 w-10 ${styles.color}`} />
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-white md:text-5xl">
              {section.title}
            </h1>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 md:text-base">
              {section.description} • {articles.length} içerik
            </p>
            {section.categories.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {section.categories.map((category) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="border-zinc-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}

          {articles.length === 0 ? (
            <div className="py-12 text-center md:col-span-2 lg:col-span-3">
              <div className="rounded-3xl border-2 border-dashed border-zinc-200 p-10 dark:border-zinc-800">
                <p className="font-medium text-zinc-500">Bu kategoride henüz içerik bulunmuyor.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleData }) {
  return (
    <Link href={`/${article.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 z-10">
            <Badge
              variant="secondary"
              className={`${article.categoryColor} border-none bg-white/90 font-bold shadow-md backdrop-blur-md dark:bg-zinc-900/90`}
            >
              {article.category}
            </Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h2 className="mb-3 line-clamp-2 text-xl font-black leading-snug text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            {article.title}
          </h2>
          <p className="mb-6 line-clamp-2 flex-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {article.description}
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/50">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{article.author}</span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-400">
              <Clock className="h-3 w-3" /> {article.readTime}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
