import type { Metadata } from "next";
import { InsaatRuhsatiStudio } from "@/components/insaat-ruhsati-studio";
import { BelgeStudioPageShell } from "@/components/belge-studio-page-shell";
import { BELGE_STUDIO_ROUTE_TITLES } from "@/lib/belge-studio-routes";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "İnşaat Ruhsatı Dilekçesi Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmî Yapı (İnşaat) Ruhsatı Başvuru Dilekçesi doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/insaat-ruhsati-dilekcesi",
});

export default function InsaatRuhsatiPage() {
  return (
    <BelgeStudioPageShell title={BELGE_STUDIO_ROUTE_TITLES["/belgeler/insaat-ruhsati-dilekcesi"]}>
      <InsaatRuhsatiStudio isModal={false} />
    </BelgeStudioPageShell>
  );
}
