import type { Metadata } from "next";
import KolonAraciPage from "@/app/araclar/kolon-on-boyutlandirma/page";

export const metadata: Metadata = {
  title: "Kolon Ön Boyutlandırma",
  description: "Dikdörtgen kolonlar için ön tasarım kesitini ve başlangıç alanını hızlıca kontrol edin.",
  alternates: {
    canonical: "/kategori/araclar/kolon-on-boyutlandirma",
  },
};

export default function KategoriKolonAraciPage() {
  return <KolonAraciPage />;
}
