import type { Metadata } from "next";
import BinaConstructionTimelineVisual from "@/components/BinaConstructionTimelineVisual";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Bina Aşamaları",
  description:
    "Proje ve izinlerden peyzaj ve teslime kadar bina yapım sürecinin görsel teknik rehber haritası.",
  pathname: "/kategori/bina-asamalari",
});

export default function BinaAsamalariPage() {
  return (
    <div className="tool-page-shell py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BinaConstructionTimelineVisual />
      </div>
    </div>
  );
}
