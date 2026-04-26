import TabanKesmeKuvvetiPage from "@/app/araclar/taban-kesme-kuvveti/page";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { TOOL_PAGE_SEO } from "@/lib/tool-page-seo";

const PAGE_PATH = "/kategori/araclar/taban-kesme-kuvveti";
const seo = TOOL_PAGE_SEO["taban-kesme-kuvveti"];

export const metadata = buildSeoMetadata({
  title: seo.title,
  description: seo.description,
  pathname: PAGE_PATH,
  keywords: seo.keywords,
});

export default function KategoriTabanKesmeKuvvetiPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={seo.title}
        description={seo.description}
        pathname={PAGE_PATH}
        keywords={seo.keywords}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <TabanKesmeKuvvetiPage />
    </>
  );
}
