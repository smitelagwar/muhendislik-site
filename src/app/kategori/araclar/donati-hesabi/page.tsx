import type { Metadata } from "next";
import { RebarCalculator } from "@/components/rebar-calculator";

export const metadata: Metadata = {
  title: "Donatı Hesabı",
  description: "Donatı çapı ve adet girerek toplam donatı alanını ve eşdeğer donatı alternatiflerini hesaplayın.",
  alternates: {
    canonical: "/kategori/araclar/donati-hesabi",
  },
};

export default function DonatiHesabiPage() {
  return <RebarCalculator />;
}
