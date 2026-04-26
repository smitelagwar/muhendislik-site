import type { Metadata } from "next";
import DepremKategoriHero from "@/components/deprem/DepremKategoriHero";
import DepremKarsilastirmaMatrisi from "@/components/deprem/DepremKarsilastirmaMatrisi";
import DepremStandartKutuphanesi from "@/components/deprem/DepremStandartKutuphanesi";
import DepremYonetmelikHub from "@/components/deprem/deprem-yonetmelik-hub";
import AraclarGrid from "@/components/deprem/AraclarGrid";
import ReferansTablolar from "@/components/deprem/ReferansTablolar";
import { getArticleList } from "@/lib/articles-data";
import {
  buildDepremArticleSummaries,
  DEPREM_SERIES,
  sortDepremArticleSummaries,
} from "@/lib/deprem-series";
import { buildCollectionPageSchema, buildSeoMetadata } from "@/lib/seo";

const DEPREM_DESCRIPTION = "TBDY 2018, TS 500, yangın, imar, otopark, BEP-TR, zemin, erişilebilirlik, Eurocode, akustik, asansör, İSG ve çevre içeriklerini tek merkezde keşfedin.";

export const metadata: Metadata = buildSeoMetadata({
  title: "Deprem ve Yönetmelikler Merkezi",
  description: DEPREM_DESCRIPTION,
  pathname: "/kategori/deprem-yonetmelik",
  keywords: [
    "deprem",
    "tbdy",
    "ts500",
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

      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <DepremKategoriHero articleCount={depremArticles.length} seriesCount={DEPREM_SERIES.length} />
        <main>
          <DepremKarsilastirmaMatrisi />
          <DepremStandartKutuphanesi />
          <AraclarGrid />
          <ReferansTablolar />
          <DepremYonetmelikHub articles={depremArticles} />
        </main>
      </div>
    </>
  );
}

