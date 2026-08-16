import type { Metadata } from "next";
import { SpliceCalculator } from "@/components/splice-calculator";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Donatı Kenetlenme & Ek Boyu Hesabı — TS 500",
  description: "Çekme ve basınç donatıları için temel kenetlenme boyu lb, tasarım kenetlenme boyu lbd ve bindirmeli ek boyu ls hesabı.",
  pathname: "/kategori/araclar/kenetlenme-boyu",
});

export default function KenetlenmeBoyu() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="Donatı Kenetlenme & Ek Boyu Hesabı"
        description="Çekme ve basınç donatıları için temel kenetlenme boyu lb, tasarım kenetlenme boyu lbd ve bindirmeli ek boyu ls hesabı."
        pathname="/kategori/araclar/kenetlenme-boyu"
        keywords={["kenetlenme boyu hesabı", "ts 500 ek boyu", "bindirmeli ek", "lb lbd hesabı"]}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <SpliceCalculator />
    </>
  );
}
