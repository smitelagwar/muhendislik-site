import KolonAraciPage from "@/app/araclar/kolon-on-boyutlandirma/page";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { TOOL_PAGE_SEO } from "@/lib/tool-page-seo";

const PAGE_PATH = "/kategori/araclar/kolon-on-boyutlandirma";
const seo = TOOL_PAGE_SEO["kolon-on-boyutlandirma"];

export const metadata = buildSeoMetadata({
  title: seo.title,
  description: seo.description,
  pathname: PAGE_PATH,
  keywords: seo.keywords,
});

export default function KategoriKolonAraciPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={seo.title}
        description={seo.description}
        pathname={PAGE_PATH}
        keywords={seo.keywords}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <KolonAraciPage />
    </>
  );
}
