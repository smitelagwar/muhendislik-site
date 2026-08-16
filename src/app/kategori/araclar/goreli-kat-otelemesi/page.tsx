import type { Metadata } from "next";
import { DriftCalculator } from "@/components/drift-calculator";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Göreli Kat Ötelemesi (Drift) Kontrolü — TBDY 2018",
  description: "TBDY 2018 Tablo 4.3 kat ötelemesi sınırı λΔi/hi ≤ 0.008/0.016 tahkiki. Tüm katlar için otomatik kontrol.",
  pathname: "/kategori/araclar/goreli-kat-otelemesi",
});

export default function GoreliKatOtelemesiPage() {
  return <DriftCalculator />;
}
