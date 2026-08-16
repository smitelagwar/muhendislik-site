import type { Metadata } from "next";
import { PunchingCalculator } from "@/components/punching-calculator";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Döşeme Zımbalama Kontrolü — TS 500 & Eurocode 2",
  description: "Mantar ve kirişsiz plak döşemelerde kolon çevresi kayma (zımbalama) gerilmesi ve çevre tahkiki aracı.",
  pathname: "/kategori/araclar/zimbalama-kontrolu",
});

export default function PunchingPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="Döşeme Zımbalama Kontrolü"
        description="Mantar ve kirişsiz plak döşemelerde kolon çevresi kayma (zımbalama) gerilmesi ve çevre tahkiki aracı."
        pathname="/kategori/araclar/zimbalama-kontrolu"
        keywords={["zımbalama kontrolü", "ts 500 zımbalama", "mantar döşeme zımbalama", "kolon çevresi zımbalama"]}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <PunchingCalculator />
    </>
  );
}
