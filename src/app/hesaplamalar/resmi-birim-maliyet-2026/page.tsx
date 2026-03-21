import type { Metadata } from "next";
import { OfficialUnitCostClient } from "./official-unit-cost-client";

export const metadata: Metadata = {
  title: "Resmi Birim Maliyet 2026",
  description:
    "2026 resmi yaklasik birim maliyet gruplarindan secim yapin, metrekare ve toplam maliyeti aninda hesaplayin.",
};

export default function ResmiBirimMaliyet2026Page() {
  return <OfficialUnitCostClient />;
}
