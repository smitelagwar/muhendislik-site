import type { Metadata } from "next";
import { HomeEditorialSection } from "@/components/home-editorial-section";
import { HomeHeroSection } from "@/components/home-hero-section";
import { HomeProjectPath } from "@/components/home-project-path";
import { HomeResourceShowcase } from "@/components/home-resource-showcase";
import { HomeScrollLogo } from "@/components/home-scroll-logo";
import { HomeWorkflowBand } from "@/components/home-workflow-band";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomePageModel } from "@/lib/home-content";
import { buildCollectionPageSchema, buildHomeMetadata } from "@/lib/seo";

export const metadata: Metadata = buildHomeMetadata();

export default function Home() {
  const model = getHomePageModel();
  const schema = buildCollectionPageSchema({
    title: "İnşaat mühendisliği ve mimarlık için teknik çalışma alanı",
    description:
      "Mühendis ve mimarlar için hesaplamalar, yapısal araçlar, yönetmelik içerikleri ve bina yapım aşamaları.",
    pathname: "/",
    items: [
      { name: "İnşaat hesaplamaları", href: "/hesaplamalar" },
      { name: "Yapısal araçlar", href: "/kategori/araclar" },
      { name: "Teknik konu haritası", href: "/konu-haritasi" },
      { name: "Bina aşamaları", href: "/kategori/bina-asamalari" },
    ],
  });

  return (
    <>
      <HomeScrollLogo />
      <div className="home-page overflow-hidden">
        <JsonLd schema={schema} />
        <HomeHeroSection counts={model.counts} />
        <HomeResourceShowcase
          featuredCalculation={model.featuredCalculation}
          resources={model.resources}
          standards={model.standards}
        />
        <HomeEditorialSection articles={model.articles} />
        <HomeWorkflowBand steps={model.workflow} />
        <HomeProjectPath phases={model.phases} />
      </div>
    </>
  );
}

