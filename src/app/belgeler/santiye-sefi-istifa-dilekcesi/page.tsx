import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IstifaStudio } from "@/components/istifa-studio";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Şantiye Şefi İstifa Dilekçesi Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmî Şantiye Şefi İstifa ve Görevden Ayrılma Dilekçesi doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/santiye-sefi-istifa-dilekcesi",
});

export default function IstifaPage() {
  return (
    <main className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col p-1 sm:p-2 box-border">
      <div className="w-full h-full flex-1 min-h-0 flex flex-col gap-1 overflow-hidden">
        {/* Back Link */}
        <div className="shrink-0 px-1">
          <Link
            href="/belgeler"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Tüm Belgelere Dön</span>
          </Link>
        </div>

        {/* Viewport Fit Studio */}
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <IstifaStudio isModal={false} />
        </div>
      </div>
    </main>
  );
}
