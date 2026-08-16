import type { Metadata } from "next";
import { RetainingWallCalculator } from "@/components/retaining-wall-calculator";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "İksa Perdesi Toprak Basıncı — Rankine & Coulomb",
  description: "Ka ve Kp toprak basıncı katsayıları, aktif toprak itkisi, devrilme momenti ve su basıncı dahil toplam iksa yükü.",
  pathname: "/kategori/araclar/iksa-toprak-basinci",
});

export default function IksaToprakBasinciPage() {
  return <RetainingWallCalculator />;
}
