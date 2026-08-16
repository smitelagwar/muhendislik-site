import type { Metadata } from "next";
import { SeismicPeriodCalculator } from "@/components/seismic-period-calculator";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Deprem Periyot & Spektral İvme Hesabı — TBDY 2018",
  description: "TBDY 2018 ampirik bina periyodu T1, SDS, SD1 hesabı ve Sae(T) tasarım ivme spektrumu grafiği.",
  pathname: "/kategori/araclar/deprem-periyot-hesabi",
});

export default function DepremPeriyotPage() {
  return <SeismicPeriodCalculator />;
}
