import type { Metadata } from "next";
import { EstimatedConstructionAreaClient } from "./estimated-construction-area-client";

export const metadata: Metadata = {
  title: "Tahmini Insaat Alani Hesabi",
  description:
    "Hizli TAKS/KAKS fizibilitesi ile detayli kat programini ayni sayfada birlestirin; Toplam Insaat Alani tahminini kat bazli gorun.",
};

export default function TahminiInsaatAlaniPage() {
  return <EstimatedConstructionAreaClient />;
}
