import type { Metadata } from "next";
import { ExternalWallInsulationCalculator } from "@/components/external-wall-insulation-calculator";

export const metadata: Metadata = {
  title: "Dış Duvar U Değeri ve Yalıtım Kalınlığı",
  description:
    "TS 825:2024'e göre dış duvar U değerini, mevcut yalıtımı ve gereken uygulama kalınlığını kontrol edin.",
  alternates: {
    canonical: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
  },
};

export default function ExternalWallInsulationPage() {
  return <ExternalWallInsulationCalculator />;
}
