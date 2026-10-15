import type { Metadata } from "next";
import { BetonDokumStudio } from "@/components/beton-dokum-studio";
import { BelgeStudioPageShell } from "@/components/belge-studio-page-shell";
import { BELGE_STUDIO_ROUTE_TITLES } from "@/lib/belge-studio-routes";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Beton Döküm Tutanağı Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmi Beton Döküm Tutanağı düzenleme ve doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/beton-dokum-tutanagi",
});

export default function BetonDokumTutanagiPage() {
  return (
    <BelgeStudioPageShell title={BELGE_STUDIO_ROUTE_TITLES["/belgeler/beton-dokum-tutanagi"]}>
      <BetonDokumStudio isModal={false} />
    </BelgeStudioPageShell>
  );
}
