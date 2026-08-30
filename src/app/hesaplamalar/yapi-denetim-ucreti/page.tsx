import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { YapiDenetimClient } from "./yapi-denetim-client";

const PAGE_TITLE = "Tahmini Yapı Denetim Ücreti 2026";
const PAGE_DESCRIPTION =
  "2026 yapı denetim birim maliyetleri ve güncel hizmet oranlarıyla standart yeni yapı için tahmini hizmet bedelini anında hesaplayın.";
const PAGE_PATH = "/hesaplamalar/yapi-denetim-ucreti";
const PAGE_KEYWORDS = [
  "yapı denetim ücreti 2026",
  "yapı denetim hesaplama",
  "4708 yapı denetimi",
  "yapı denetim hizmet bedeli",
  "2026 yapı denetim birim maliyet",
  "hizmet bedeli oranları",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function YapiDenetimUcretiPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <YapiDenetimClient />
    </>
  );
}
