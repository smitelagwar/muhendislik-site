import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { EstimatedConstructionAreaClient } from "./estimated-construction-area-client";

const PAGE_TITLE = "Tahmini İnşaat Alanı Hesabı";
const PAGE_DESCRIPTION =
  "Net parsel, TAKS ve KAKS üzerinden emsal alanını, emsal harici büyümeyi ve bodrum katkısını birlikte değerlendirerek yaklaşık toplam inşaat alanını görün.";
const PAGE_PATH = "/hesaplamalar/tahmini-insaat-alani";
const PAGE_KEYWORDS = [
  "tahmini inşaat alanı",
  "emsal hesabı",
  "taks kaks",
  "toplam inşaat alanı",
  "arsa alanı",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function TahminiInsaatAlaniPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <EstimatedConstructionAreaClient />
    </>
  );
}
