import type { Metadata } from "next";
import { SlabThicknessCalculator } from "@/components/slab-thickness-calculator";

export const metadata: Metadata = {
  title: "Döşeme Kalınlığı",
  description: "Açıklık-kalınlık oranı, minimum döşeme kalınlığı ve minimum donatı aralığını hızlıca kontrol edin.",
  alternates: {
    canonical: "/kategori/araclar/doseme-kalinligi",
  },
};

export default function SlabThicknessPage() {
  return <SlabThicknessCalculator />;
}
