import type { Metadata } from "next";
import KalipSokumHesapPage from "@/app/araclar/kalip-sokum-suresi/page";

export const metadata: Metadata = {
  title: "Kalıp Söküm Süresi",
  description: "Çimento tipi, sıcaklık ve eleman tipine göre tahmini kalıp söküm süresini hesaplayın.",
  alternates: {
    canonical: "/kategori/araclar/kalip-sokum-suresi",
  },
};

export default function KategoriKalipSokumPage() {
  return <KalipSokumHesapPage />;
}
