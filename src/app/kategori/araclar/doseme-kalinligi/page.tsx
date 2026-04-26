import SlabThicknessPage from "@/app/araclar/doseme-kalinligi/page";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { TOOL_PAGE_SEO } from "@/lib/tool-page-seo";

const PAGE_PATH = "/kategori/araclar/doseme-kalinligi";
const seo = TOOL_PAGE_SEO["doseme-kalinligi"];

export const metadata = buildSeoMetadata({
  title: seo.title,
  description: seo.description,
  pathname: PAGE_PATH,
  keywords: seo.keywords,
});

export default function CategorySlabThicknessPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={seo.title}
        description={seo.description}
        pathname={PAGE_PATH}
        keywords={seo.keywords}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <SlabThicknessPage />
    </>
  );
}
