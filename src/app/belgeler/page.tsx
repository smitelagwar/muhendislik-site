import type { Metadata } from "next";
import {
  ArrowDown,
  FileCheck2,
  FileDown,
  MousePointer2,
  ShieldCheck,
} from "lucide-react";
import { BelgelerHub } from "@/components/belgeler-hub";
import { BelgelerGlassBg } from "@/components/belgeler-glass-bg";
import { TextRotater } from "@/components/text-rotater";
import { ChromaticGlassButton } from "@/components/chromatic-glass-button";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Belgeler ve İndirilebilir Şablonlar | Şantiye Şefi Taahhütname & Tutanaklar",
  description:
    "Mühendis ve mimarlar için şantiye şefliği taahhütnamesi, hizmet sözleşmesi, beton döküm tutanağı, ruhsat ve istifa dilekçesi gibi düzenlenebilir PDF şablonları, form doldurucu ve resmi evrak arşivi.",
  pathname: "/belgeler",
});

const CAPABILITIES = [
  { icon: FileCheck2, value: "5", label: "hazır şablon" },
  { icon: MousePointer2, value: "5", label: "canlı stüdyo" },
  { icon: ShieldCheck, value: "PDF", label: "A4 çıktı" },
];

function DocumentStackVisual() {
  return (
    <div className="relative mx-auto flex h-[440px] w-full max-w-[490px] items-center justify-center" aria-hidden="true">
      {/* Multi-color ambient background flare */}
      <div
        className="pointer-events-none absolute h-[380px] w-[380px] rounded-full blur-[85px]"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(139,92,246,0.25) 45%, rgba(245,158,11,0.15) 75%, transparent 100%)",
          animation: "glow-pulse 6s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />

      {/* Back glass sheet */}
      <div
        className="absolute h-[310px] w-[235px] -rotate-6 rounded-[28px] border border-black/10 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-white/20 dark:bg-white/[0.04] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)]"
        style={{
          animation: "glass-float-slow 9s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        <div className="flex items-center justify-between border-b border-black/10 pb-4 dark:border-white/10">
          <div className="h-6 w-6 rounded-lg border border-black/10 bg-black/5 dark:border-white/20 dark:bg-white/10" />
          <div className="h-2 w-12 rounded-full bg-black/10 dark:bg-white/15" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-2 w-4/5 rounded-full bg-black/10 dark:bg-white/10" />
          <div className="h-2 w-3/5 rounded-full bg-black/10 dark:bg-white/10" />
        </div>
      </div>

      {/* Middle glass sheet */}
      <div
        className="absolute h-[325px] w-[245px] rotate-3 rounded-[30px] border border-blue-500/20 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-blue-400/30 dark:bg-white/[0.06] dark:shadow-[0_35px_80px_-25px_rgba(37,99,235,0.4),inset_0_1.5px_2px_rgba(255,255,255,0.35)]"
        style={{
          animation: "glass-float-slower 7.5s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        <div className="flex items-center justify-between border-b border-blue-500/10 pb-4 dark:border-blue-300/15">
          <div className="h-7 w-7 rounded-xl border border-blue-500/20 bg-blue-500/10 dark:border-blue-400/30 dark:bg-blue-500/15" />
          <div className="h-2 w-16 rounded-full bg-blue-500/20 dark:bg-blue-300/20" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-2 w-5/6 rounded-full bg-black/10 dark:bg-white/15" />
          <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/15" />
          <div className="h-2 w-2/3 rounded-full bg-black/10 dark:bg-white/15" />
        </div>
      </div>

      {/* Front hero glass document with folded corner style */}
      <div
        className="absolute h-[340px] w-[255px] overflow-hidden rounded-[32px] border border-black/10 bg-white/90 p-7 shadow-2xl backdrop-blur-2xl dark:border-white/40 dark:bg-gradient-to-b dark:from-white/[0.18] dark:via-white/[0.09] dark:to-white/[0.04] dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7),0_0_50px_rgba(59,130,246,0.2),inset_0_2px_4px_rgba(255,255,255,0.6)]"
        style={{
          animation: "glass-float 5.5s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        {/* Top accent light bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent dark:via-white/80" />

        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-600 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-300 dark:shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <FileDown className="h-5 w-5" />
          </div>
          <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white/80">
            PDF / A4
          </span>
        </div>

        {/* Embossed text preview lines */}
        <div className="mt-7 space-y-3">
          <div className="h-2.5 w-4/5 rounded-full bg-gradient-to-r from-amber-500/40 to-transparent dark:from-white/60 dark:to-white/30" />
          <div className="h-2 w-3/5 rounded-full bg-black/10 dark:bg-white/30" />
        </div>

        <div className="mt-6 space-y-2.5">
          <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/20" />
          <div className="h-2 w-11/12 rounded-full bg-black/10 dark:bg-white/20" />
          <div className="h-2 w-4/5 rounded-full bg-black/10 dark:bg-white/20" />
          <div className="h-2 w-9/12 rounded-full bg-black/10 dark:bg-white/20" />
        </div>

        {/* Bottom signature & badge section */}
        <div className="mt-7 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/15">
          <div className="flex items-center gap-2">
            <span className="h-2 w-12 rounded-full bg-black/15 dark:bg-white/25" />
            <span className="h-2 w-6 rounded-full bg-amber-500/40 dark:bg-amber-400/40" />
          </div>
          <div className="h-7 w-7 rounded-full border-2 border-amber-500/50 bg-amber-500/10 shadow-sm dark:border-amber-400/60 dark:bg-amber-500/10 dark:shadow-[0_0_12px_rgba(245,158,11,0.3)]" />
        </div>
      </div>

      {/* Floating status badge — Bottom Left */}
      <div className="absolute -bottom-2 -left-2 z-20 flex items-center gap-2.5 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-foreground shadow-lg backdrop-blur-xl dark:border-white/20 dark:bg-black/50 dark:text-white dark:shadow-[0_16px_32px_rgba(0,0,0,0.3)]">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] dark:bg-emerald-400 dark:shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground dark:text-white/50">Arşiv durumu</p>
          <p className="text-xs font-black text-foreground dark:text-white/95">Kullanıma hazır</p>
        </div>
      </div>

      {/* Floating interactive badge — Bottom Right */}
      <div className="absolute -bottom-1 -right-2 z-20 flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-blue-700 shadow-lg backdrop-blur-xl dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-200 dark:shadow-[0_16px_32px_rgba(0,0,0,0.3),0_0_24px_rgba(59,130,246,0.25)]">
        <MousePointer2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        <span className="text-xs font-bold text-foreground dark:text-white">Tarayıcıda doldur</span>
      </div>
    </div>
  );
}

export default function BelgelerPage() {
  return (
    <main className="belgeler-page-shell relative">
      <BelgelerGlassBg />

      {/* ─── Hero Section ─── */}
      <section className="relative z-10 overflow-hidden border-b border-black/5 dark:border-white/[0.08]">
        {/* Ambient volumetric spotlights */}
        <div
          className="pointer-events-none absolute -left-28 -top-28 h-[500px] w-[500px] rounded-full opacity-35 blur-[90px] dark:opacity-50"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/4 h-[450px] w-[450px] rounded-full opacity-30 blur-[95px] dark:opacity-45"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 65%)" }}
        />

        <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-12 lg:items-center lg:px-12 lg:py-24 xl:px-16">
          <div className="lg:col-span-7">
            {/* Frosted glass kicker badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 shadow-sm backdrop-blur-md dark:border-amber-400/35 dark:bg-white/[0.08]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                Resmî şablonlar ve saha evrakları
              </span>
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block">Evrak işini hızlandıran</span>
              <span className="mt-2 block">
                <TextRotater /> <span className="text-amber-600 dark:text-amber-400">teknik arşivi.</span>
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              İhtiyacınız olan tüm mühendislik şablon, form ve sözleşmelerine kolayca ulaşın;
              tarayıcıda canlı doldurun, kontrol edin ve A4 PDF olarak anında indirin.
            </p>

            {/* Chromatic Glass Action Button */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ChromaticGlassButton href="#belge-arsivi" icon={<ArrowDown className="h-4 w-4 text-amber-500 dark:text-amber-400" />}>
                Belgeleri İncele
              </ChromaticGlassButton>
            </div>

            {/* Stats — Frosted Glass Panel */}
            <div className="mt-11 grid max-w-2xl grid-cols-3 rounded-[24px] border border-black/5 bg-white/70 p-1 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-2xl">
              {CAPABILITIES.map(({ icon: Icon, value, label }, index) => (
                <div
                  key={label}
                  className={`px-5 py-5 ${index < 2 ? "border-r border-black/5 dark:border-white/10" : ""}`}
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-lg font-black">{value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <DocumentStackVisual />
          </div>
        </div>
      </section>

      {/* ─── Belge Kütüphanesi (BelgelerHub) ─── */}
      <div className="relative z-10">
        <BelgelerHub />
      </div>

      {/* Footer Author Bar */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-end border-t border-black/5 pt-6 dark:border-white/[0.08]">
          <p className="inline-flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" aria-hidden="true" />
            <span>Hazırlayan</span>
            <span className="font-bold text-foreground">İnşaat Müh. Hüseyin GÜNAYDIN</span>
          </p>
        </div>
      </div>
    </main>
  );
}
