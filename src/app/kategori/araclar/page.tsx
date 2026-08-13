import type { Metadata } from "next";
import ToolsWorkbenchShowcase from "@/components/ToolsWorkbenchShowcase";
import { getFeaturedTool, getLiveTools } from "@/lib/tools-data";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Araçlar",
  description: "Betonarme, şantiye, ısı yalıtımı ve imar ön değerlendirme araçlarına tek merkezden erişin.",
  pathname: "/kategori/araclar",
});

export default function ToolsCategoryPage() {
  const tools = getLiveTools();
  const featuredTool = getFeaturedTool();

  return (
    <div className="tool-page-shell py-6 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ToolsWorkbenchShowcase tools={tools} featuredTool={featuredTool} />
      </div>
    </div>
  );
}
