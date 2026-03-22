import type { Metadata } from "next";
import { EstimatedConstructionAreaClient } from "./estimated-construction-area-client";

export const metadata: Metadata = {
  title: "Tahmini İnşaat Alanı Hesabı",
  description:
    "Net parsel, TAKS ve KAKS üzerinden emsal alanını, emsal harici büyümeyi ve bodrum katkısını birlikte değerlendirerek yaklaşık toplam inşaat alanını görün.",
};

export default function TahminiInsaatAlaniPage() {
  return <EstimatedConstructionAreaClient />;
}
