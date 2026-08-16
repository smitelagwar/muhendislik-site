import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BetonDokumStudio } from "@/components/beton-dokum-studio";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Beton Döküm Tutanağı Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmi Beton Döküm Tutanağı düzenleme ve doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/beton-dokum-tutanagi",
});

export default function BetonDokumTutanagiPage() {
  return (
    <main className="w-full h-[calc(100dvh-64px)] overflow-hidden flex flex-col p-1 sm:p-2">
      <div className="w-full h-full flex flex-col gap-1 overflow-hidden">
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
        <BetonDokumStudio isModal={false} />
      </div>
    </main>
  );
}
