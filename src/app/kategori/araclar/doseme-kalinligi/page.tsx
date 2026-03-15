import type { Metadata } from "next";
import SlabThicknessPage from "@/app/araclar/doseme-kalinligi/page";

export const metadata: Metadata = {
  title: "Döşeme Kalınlığı",
  description: "Açıklık-kalınlık oranı, minimum döşeme kalınlığı ve minimum donatı aralığını hızlıca kontrol edin.",
  alternates: {
    canonical: "/kategori/araclar/doseme-kalinligi",
  },
};

export default function CategorySlabThicknessPage() {
  return <SlabThicknessPage />;
}
