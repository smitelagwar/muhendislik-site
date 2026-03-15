import type { Metadata } from "next";
import ExternalWallInsulationPage from "@/app/araclar/dis-cephe-yalitim-kalinligi/page";

export const metadata: Metadata = {
  title: "Bölgesel Dış Cephe Yalıtım Kalınlığı",
  description:
    "TS 825:2024 yaklaşımıyla il, ilçe, duvar tipi ve malzemeye göre dış cephe yalıtım kalınlığı önerisini hızlıca görün.",
  alternates: {
    canonical: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
  },
};

export default function KategoriExternalWallInsulationPage() {
  return <ExternalWallInsulationPage />;
}
