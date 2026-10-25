import type { Metadata } from "next";
import { SimulationCatalog } from "@/components/simulations/simulation-catalog";
import {
  getLiveSimulations,
  SIMULATIONS_HUB_HREF,
} from "@/lib/simulations/catalog";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "3B Betonarme ve Donatı Simülasyon Kütüphanesi",
  description:
    "Betonarme kolon ve taşıyıcı yapı elemanlarının donatı yerleşimini, sarılma bölgelerini ve beton örtüsü ilişkisini 3B ve 2B olarak inceleyin.",
  pathname: SIMULATIONS_HUB_HREF,
});

export default function SimulationsCatalogPage() {
  const items = getLiveSimulations();

  return (
    <div className="tool-page-shell py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SimulationCatalog items={items} />
      </div>
    </div>
  );
}
