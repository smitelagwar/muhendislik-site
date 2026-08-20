import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { RuhsatOnFizibiliteClient } from "./ruhsat-on-fizibilite-client";

const PAGE_TITLE = "Ruhsat Ön Fizibilite ve Daire Senaryoları";
const PAGE_DESCRIPTION =
  "Parsel, TAKS/KAKS, kat, belge güveni ve açık varsayımlarla ruhsat ön fizibilitesini; teorik imar haklarını ve daire senaryolarını birlikte değerlendirin.";
const PAGE_PATH = "/hesaplamalar/tahmini-insaat-alani";
const PAGE_KEYWORDS = [
  "ruhsat ön fizibilite",
  "daire senaryosu",
  "imar hakkı",
  "taks kaks",
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
      <RuhsatOnFizibiliteClient />
    </>
  );
}
