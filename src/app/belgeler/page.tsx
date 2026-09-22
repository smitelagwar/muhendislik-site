import type { Metadata } from "next";
import { BelgelerHub } from "@/components/belgeler-hub";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Belgeler ve İndirilebilir Şablonlar | Şantiye Şefi Taahhütname & Tutanaklar",
  description:
    "Mühendis ve mimarlar için şantiye şefliği taahhütnamesi, hizmet sözleşmesi, beton döküm tutanağı, ruhsat ve istifa dilekçesi gibi düzenlenebilir PDF şablonları, form doldurucu ve resmi evrak arşivi.",
  pathname: "/belgeler",
});

export default function BelgelerPage() {
  return (
    <main>
      <BelgelerHub />
    </main>
  );
}
