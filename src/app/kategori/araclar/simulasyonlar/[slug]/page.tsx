import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimulationWorkspace } from "@/components/simulations/simulation-workspace";
import {
  getLiveSimulations,
  getSimulationCatalogItem,
  isLiveSimulationSlug,
  SIMULATIONS_HUB_HREF,
} from "@/lib/simulations/catalog";
import { loadSimulationSceneModel } from "@/lib/simulations/scene-loaders";
import { buildSeoMetadata } from "@/lib/seo";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";

interface SimulationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getLiveSimulations().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: SimulationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getSimulationCatalogItem(slug);

  if (!item) {
    return {
      title: "Simülasyon Bulunamadı",
    };
  }

  return buildSeoMetadata({
    title: item.title,
    description: item.description,
    pathname: `${SIMULATIONS_HUB_HREF}/${item.slug}`,
  });
}

export default async function SimulationDetailPage({
  params,
}: SimulationDetailPageProps) {
  const { slug } = await params;

  if (!isLiveSimulationSlug(slug)) {
    notFound();
  }

  const item = getSimulationCatalogItem(slug);
  if (!item) {
    notFound();
  }

  const model = await loadSimulationSceneModel(slug);

  return (
    <div className="tool-page-shell py-3 pb-20 md:py-5 md:pb-12">
      <SoftwareApplicationJsonLd
        name={item.title}
        description={item.description}
        pathname={item.href}
        section={{ title: "Simülasyonlar", href: SIMULATIONS_HUB_HREF }}
      />
      <div className="mx-auto w-full max-w-[2400px] px-3 sm:px-4 lg:px-6 2xl:px-8 min-w-0">
        <SimulationWorkspace item={item} model={model} />
      </div>
    </div>
  );
}
