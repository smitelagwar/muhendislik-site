import type { Metadata } from "next";
import { TaahhutnameStudio } from "@/components/taahhutname-studio";
import { BelgeStudioPageShell } from "@/components/belge-studio-page-shell";
import { BELGE_STUDIO_ROUTE_TITLES } from "@/lib/belge-studio-routes";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Şantiye Şefi Taahhütnamesi Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmî Şantiye Şefi Taahhütnamesi düzenleme ve doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/santiye-sefi-taahhutnamesi",
});

export default function TaahhutnamePage() {
  return (
    <BelgeStudioPageShell title={BELGE_STUDIO_ROUTE_TITLES["/belgeler/santiye-sefi-taahhutnamesi"]}>
      <TaahhutnameStudio isModal={false} />
    </BelgeStudioPageShell>
  );
}
