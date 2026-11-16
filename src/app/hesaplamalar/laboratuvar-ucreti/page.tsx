import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { LaboratuvarUcretiClient } from "./laboratuvar-ucreti-client";

const PAGE_TITLE = "Tahmini Laboratuvar Ücreti 2026";
const PAGE_DESCRIPTION =
  "Beton numunesi, EBİS çip etiketi ve demir çekme deneyleri için 2026 tahmini yapı laboratuvarı ücretini hesaplayın.";
const PAGE_PATH = "/hesaplamalar/laboratuvar-ucreti";
const PAGE_KEYWORDS = [
  "laboratuvar ücreti",
  "beton laboratuvar ücreti 2026",
  "ebis çip ücreti",
  "beton etiketi fiyatı",
  "demir çekme deneyi ücreti",
  "ek-9 tarife cetveli",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function LaboratuvarUcretiPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <LaboratuvarUcretiClient />
    </>
  );
}
