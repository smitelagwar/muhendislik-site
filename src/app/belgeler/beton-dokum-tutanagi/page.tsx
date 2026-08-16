import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BetonDokumStudio } from "@/components/beton-dokum-studio";
import { SitePageShell } from "@/components/site-page";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Beton Döküm Tutanağı Doldurucu | Canlı PDF Önizleme & Düzenleme",
  description:
    "Resmi Beton Döküm Tutanağı düzenleme ve doldurma aracı. Formu doldurun, canlı PDF'i tam ekran inceleyin ve doğrudan indirin.",
  pathname: "/belgeler/beton-dokum-tutanagi",
});

export default function BetonDokumTutanagiPage() {
  return (
    <SitePageShell
      className="tool-page-shell !p-0 !py-0 !m-0 !overflow-hidden"
      width="ultra"
      contentClassName="!max-w-none !w-full !px-2 sm:!px-3 !py-1.5 !overflow-hidden"
    >
      <div className="w-full h-full flex flex-col gap-1 overflow-hidden">
        {/* Back Link Inline */}
        <div className="shrink-0">
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
    </SitePageShell>
  );
}
