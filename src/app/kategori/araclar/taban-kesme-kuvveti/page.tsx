import type { Metadata } from "next";
import TabanKesmeKuvvetiPage from "@/app/araclar/taban-kesme-kuvveti/page";

export const metadata: Metadata = {
  title: "Eşdeğer Deprem Yükü (Taban Kesme Kuvveti) Hesaplama Aracı",
  description: "TBDY 2018'e göre Eşdeğer Deprem Yükü ve Minimum Taban Kesme Kuvveti hesabı.",
  alternates: {
    canonical: "/kategori/araclar/taban-kesme-kuvveti",
  },
};

export default function KategoriTabanKesmeKuvvetiPage() {
  return <TabanKesmeKuvvetiPage />;
}
