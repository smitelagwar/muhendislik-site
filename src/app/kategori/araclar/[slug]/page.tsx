import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, Sliders, ShieldCheck, Sparkles } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { ToolWatermarkIllustration } from "@/components/tool-watermarks";
import { getLiveTools, getToolDefinition } from "@/lib/tools-data";
import { buildSeoMetadata } from "@/lib/seo";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tools = getLiveTools();
  return tools.map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolDefinition(slug);

  if (!tool) {
    return {
      title: "Araç Bulunamadı",
    };
  }

  return buildSeoMetadata({
    title: tool.name,
    description: tool.description,
    pathname: `/kategori/araclar/${slug}`,
  });
}

export default async function GenericToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolDefinition(slug);

  if (!tool) {
    notFound();
  }

  const allTools = getLiveTools();
  const relatedTools = allTools.filter((t) => t.id !== tool.id).slice(0, 3);

  return (
    <div className="tool-page-shell py-8 md:py-14">
      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div>
          <Link
            href="/kategori/araclar"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tüm Hesap Araçlarına Dön
          </Link>
        </div>

        {/* Tool Header Card */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8 md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_50%)]" />

          <ToolWatermarkIllustration toolId={tool.id} color="#f59e0b" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <ToolIcon iconKey={tool.iconKey} className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                {tool.discipline}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                Resmî Standart & Yönetmelik
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {tool.name}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-zinc-400">
              {tool.description}
            </p>
          </div>
        </section>

        {/* Interactive Parameter Panel Placeholder / Workbench Shell */}
        <section className="rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
            <Sliders className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Hesaplama Parametreleri & Girdiler
            </h2>
          </div>

          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Tasarım Elemanı / Kesit Türü
                </label>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  Varsayılan Standart Kesit
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Malzeme Sınıfı (Beton & Donatı)
                </label>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  C30/37 · B420C (TS 500)
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hesaplama Modülü Yapılandırılıyor
              </h3>
              <p className="mx-auto max-w-lg text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                Bu araç için canlı hesaplama algoritması ve CAD grafik arayüzü yayına hazırlanıyor. Diğer canlı hesap araçlarını inceleyebilir veya /hesaplamalar sayfasını kullanabilirsiniz.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/kategori/araclar/donati-hesabi"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-amber-400 transition-colors"
                >
                  Canlı Donatı Hesabını Aç
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/hesaplamalar/hizli-metraj"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition-colors"
                >
                  Hızlı Metrajı Aç
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Tools */}
        <section className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Diğer İlgili Hesap Araçları
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {relatedTools.map((rt) => (
              <Link
                key={rt.id}
                href={rt.href}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.15]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                    <ToolIcon iconKey={rt.iconKey} className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400 transition-colors">
                    {rt.name}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] text-slate-500 dark:text-zinc-400">
                  {rt.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
