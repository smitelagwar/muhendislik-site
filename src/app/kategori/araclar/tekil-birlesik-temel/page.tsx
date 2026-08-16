import type { Metadata } from "next";
import { FootingCalculator } from "@/components/footing-calculator";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Tekil Temel Boyutlandırma — TS 500",
  description: "Eksantrik yüklü tekil temelde zemin emniyet gerilmesi, taban basıncı dağılımı ve eğilme donatısı hesabı.",
  pathname: "/kategori/araclar/tekil-birlesik-temel",
});

export default function TekilTemelPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="Tekil Temel Boyutlandırma"
        description="Eksantrik yüklü tekil temelde zemin emniyet gerilmesi, taban basıncı dağılımı ve eğilme donatısı hesabı."
        pathname="/kategori/araclar/tekil-birlesik-temel"
        keywords={["tekil temel hesabı", "ts 500 temel", "zemin emniyet gerilmesi", "taban basıncı hesabı"]}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <FootingCalculator />
    </>
  );
}
