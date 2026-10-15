import type { Metadata } from "next";
import { SozlesmeStudio } from "@/components/sozlesme-studio";
import { BelgeStudioPageShell } from "@/components/belge-studio-page-shell";
import { BELGE_STUDIO_ROUTE_TITLES } from "@/lib/belge-studio-routes";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Şantiye Şefi Hizmet Sözleşmesi Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmî 2 sayfalı Şantiye Şefi Hizmet Sözleşmesi düzenleme ve doldurma aracı. Taraflar, işyeri, ücret ve sözleşme tarihini girin; canlı PDF önizleyin ve doğrudan indirin.",
  pathname: "/belgeler/santiye-sefi-sozlesmesi",
});

export default function SozlesmePage() {
  return (
    <BelgeStudioPageShell title={BELGE_STUDIO_ROUTE_TITLES["/belgeler/santiye-sefi-sozlesmesi"]}>
      <SozlesmeStudio isModal={false} />
    </BelgeStudioPageShell>
  );
}
