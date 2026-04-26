import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { OfficialUnitCostClient } from "./official-unit-cost-client";

const PAGE_TITLE = "Resmî Birim Maliyet 2026";
const PAGE_DESCRIPTION =
  "2026 resmî yaklaşık birim maliyet gruplarından seçim yapın, metrekare ve toplam maliyeti anında hesaplayın.";
const PAGE_PATH = "/hesaplamalar/resmi-birim-maliyet-2026";
const PAGE_KEYWORDS = [
  "resmî birim maliyet 2026",
  "yaklaşık maliyet",
  "çevre şehircilik tebliği",
  "m2 maliyet",
  "resmî maliyet",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function ResmiBirimMaliyet2026Page() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <OfficialUnitCostClient />
    </>
  );
}
