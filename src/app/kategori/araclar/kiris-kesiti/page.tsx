import type { Metadata } from "next";
import BeamSectionPage from "@/app/araclar/kiris-kesiti/page";

export const metadata: Metadata = {
  title: "Kiriş Kesiti",
  description: "TS 500 mantığıyla kiriş eğilme donatısı ve kesme kontrolünü aynı ekranda hızlıca görün.",
  alternates: {
    canonical: "/kategori/araclar/kiris-kesiti",
  },
};

export default function CategoryBeamSectionPage() {
  return <BeamSectionPage />;
}
