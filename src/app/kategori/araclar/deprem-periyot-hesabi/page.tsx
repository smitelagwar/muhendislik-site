import type { Metadata } from "next";
import { SeismicPeriodCalculator } from "@/components/seismic-period-calculator";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Deprem Periyodu ve Elastik Spektrum Hesabı — TBDY 2018",
  description: "TBDY 2018'e göre ampirik periyot (TpA), SDS, SD1 ve yatay elastik tasarım spektrumu hesabı.",
  pathname: "/kategori/araclar/deprem-periyot-hesabi",
});

export default function DepremPeriyotPage() {
  return <SeismicPeriodCalculator />;
}
