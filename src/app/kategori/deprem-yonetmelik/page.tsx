import type { Metadata } from "next";
import DepremKategoriHero from "@/components/deprem/DepremKategoriHero";
import DepremStandartKutuphanesi from "@/components/deprem/DepremStandartKutuphanesi";
import DepremYonetmelikHub from "@/components/deprem/deprem-yonetmelik-hub";
import AraclarGrid from "@/components/deprem/AraclarGrid";
import { getArticleList } from "@/lib/articles-data";
import {
  buildDepremArticleSummaries,
  DEPREM_SERIES,
  sortDepremArticleSummaries,
} from "@/lib/deprem-series";
import { buildCollectionPageSchema, buildSeoMetadata } from "@/lib/seo";

const DEPREM_DESCRIPTION = "TBDY 2018, betonarme kiriş-kolon-perde detayları, TS 500, mevcut bina güçlendirme, yapı denetimi, zemin-temel ve diğer yapı mevzuatı içeriklerini tek merkezde inceleyin.";

export const metadata: Metadata = buildSeoMetadata({
  title: "Deprem ve Yönetmelikler Merkezi",
  description: DEPREM_DESCRIPTION,
  pathname: "/kategori/deprem-yonetmelik",
  keywords: [
    "deprem",
    "tbdy",
    "ts500",
    "betonarme kiriş kolon perde",
    "mevcut bina güçlendirme",
    "yapı denetimi",
    "yangın",
    "imar",
    "otopark",
    "bep-tr",
    "su ve zemin",
    "engelsiz tasarım",
    "eurocode",
    "akustik",
    "asansör",
    "isg",
    "çevre",
  ],
});

export default function DepremYonetmelikPage() {
  const allArticles = getArticleList();
  const depremArticles = sortDepremArticleSummaries(
    buildDepremArticleSummaries(allArticles.filter((article) => article.sectionId === "deprem-yonetmelik")),
    new Map(allArticles.map((article, index) => [article.slug, index] as const)),
  );
  const collectionSchema = buildCollectionPageSchema({
    title: "Deprem ve Yönetmelikler Merkezi",
    description: DEPREM_DESCRIPTION,
    pathname: "/kategori/deprem-yonetmelik",
    items: DEPREM_SERIES.map((series) => ({
      name: series.label,
      href: `/kategori/deprem-yonetmelik?dal=${series.id}`,
    })),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <div className="home-page min-h-screen">
        <DepremKategoriHero articleCount={depremArticles.length} seriesCount={DEPREM_SERIES.length} />
        <main>
          <DepremStandartKutuphanesi articles={depremArticles} />
          <DepremYonetmelikHub articles={depremArticles} />
          <AraclarGrid />
        </main>
      </div>
    </>
  );
}

