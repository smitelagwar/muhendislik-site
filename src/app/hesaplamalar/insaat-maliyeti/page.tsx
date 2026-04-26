import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { ConstructionCostClient } from "./construction-cost-client";

const PAGE_TITLE = "İnşaat Maliyeti Analizi";
const PAGE_DESCRIPTION =
  "Kaba iş, ince iş ve genel giderleri senaryo bazında karşılaştırın; yaklaşık maliyetin ana bileşenlerini tek ekranda izleyin.";
const PAGE_PATH = "/hesaplamalar/insaat-maliyeti";
const PAGE_KEYWORDS = [
  "inşaat maliyeti",
  "yaklaşık maliyet",
  "şantiye bütçesi",
  "maliyet analizi",
  "proje maliyeti",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function ConstructionCostPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <ConstructionCostClient />
    </>
  );
}
