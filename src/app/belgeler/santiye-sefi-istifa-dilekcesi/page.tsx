import type { Metadata } from "next";
import { IstifaStudio } from "@/components/istifa-studio";
import { BelgeStudioPageShell } from "@/components/belge-studio-page-shell";
import { BELGE_STUDIO_ROUTE_TITLES } from "@/lib/belge-studio-routes";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Şantiye Şefi İstifa Dilekçesi Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmî Şantiye Şefi İstifa ve Görevden Ayrılma Dilekçesi doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/santiye-sefi-istifa-dilekcesi",
});

export default function IstifaPage() {
  return (
    <BelgeStudioPageShell title={BELGE_STUDIO_ROUTE_TITLES["/belgeler/santiye-sefi-istifa-dilekcesi"]}>
      <IstifaStudio isModal={false} />
    </BelgeStudioPageShell>
  );
}
