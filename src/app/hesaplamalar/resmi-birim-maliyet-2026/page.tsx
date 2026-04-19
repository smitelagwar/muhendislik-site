import type { Metadata } from "next";
import { OfficialUnitCostClient } from "./official-unit-cost-client";

export const metadata: Metadata = {
  title: "Resmî Birim Maliyet 2026",
  description:
    "2026 resmî yaklaşık birim maliyet gruplarından seçim yapın, metrekare ve toplam maliyeti anında hesaplayın.",
  alternates: {
    canonical: "/hesaplamalar/resmi-birim-maliyet-2026",
  },
};

export default function ResmiBirimMaliyet2026Page() {
  return <OfficialUnitCostClient />;
}
