import type { Metadata } from "next";
import ConcreteCoverPage from "@/app/araclar/pas-payi/page";

export const metadata: Metadata = {
  title: "Pas Payı",
  description: "Nominal beton örtüsü ve pratik pas payını TS 500 mantığıyla hızlıca hesaplayın.",
  alternates: {
    canonical: "/kategori/araclar/pas-payi",
  },
};

export default function CategoryConcreteCoverPage() {
  return <ConcreteCoverPage />;
}
