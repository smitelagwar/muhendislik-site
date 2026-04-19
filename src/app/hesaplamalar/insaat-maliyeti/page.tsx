import type { Metadata } from "next";
import { ConstructionCostClient } from "./construction-cost-client";

export const metadata: Metadata = {
  title: "İnşaat Maliyeti Analizi",
  description:
    "Kaba iş, ince iş ve genel giderleri senaryo bazında karşılaştırın; yaklaşık maliyetin ana bileşenlerini tek ekranda izleyin.",
  alternates: {
    canonical: "/hesaplamalar/insaat-maliyeti",
  },
};

export default function ConstructionCostPage() {
  return <ConstructionCostClient />;
}
