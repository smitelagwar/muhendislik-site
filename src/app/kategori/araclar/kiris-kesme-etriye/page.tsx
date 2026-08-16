import type { Metadata } from "next";
import { ShearStirrupCalculator } from "@/components/shear-stirrup-calculator";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Kiriş Kesme & Etriye Hesabı — TS 500",
  description: "Betonarme kirişlerde kesme kuvveti, beton katkısı Vc, gerekli etriye aralığı ve yönetmelik sarılma bölgesi kontrolü.",
  pathname: "/kategori/araclar/kiris-kesme-etriye",
});

export default function KirisKesmeEtriyePage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="Kiriş Kesme & Etriye Hesabı"
        description="Betonarme kirişlerde kesme kuvveti, beton katkısı Vc, gerekli etriye aralığı ve yönetmelik sarılma bölgesi kontrolü."
        pathname="/kategori/araclar/kiris-kesme-etriye"
        keywords={["kiriş etriye hesabı", "ts 500 kesme", "Vc Vw kiriş", "sarılma bölgesi etriye"]}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <ShearStirrupCalculator />
    </>
  );
}
