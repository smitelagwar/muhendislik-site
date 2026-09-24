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
    <main className="w-full max-w-full min-w-0 h-full flex-1 min-h-0 overflow-x-hidden overflow-y-hidden flex flex-col pt-1 pb-1 pl-[max(0.25rem,env(safe-area-inset-left))] pr-[max(0.25rem,env(safe-area-inset-right))] sm:p-2 box-border">
      <div className="w-full max-w-full min-w-0 h-full flex-1 min-h-0 flex flex-col gap-1 overflow-hidden">
        {/* Back Link */}
        <div className="shrink-0 px-1">
          <Link
            href="/belgeler"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Tüm Belgelere Dön</span>
          </Link>
        </div>

        {/* Viewport Fit Studio */}
        <div className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-hidden">
          <BetonDokumStudio isModal={false} />
        </div>
      </div>
    </main>
  );
}
