"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { calculateFormworkQuantity } from "@/lib/engineering/quantity/formwork-ratio";
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

export function FormworkQuantityCalculator() {
  const [floorArea, setFloorArea] = useState(300);
  const [stories, setStories] = useState(5);
  const [height, setHeight] = useState(3.0);
  const [ratio, setRatio] = useState(2.5); // 2.5 m2 kalıp / m2 döşeme
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateFormworkQuantity({
      storyFloorAreaM2: floorArea,
      storyCount: stories,
      floorHeightM: height,
      formworkToFloorRatio: ratio,
    });
  }, [floorArea, stories, height, ratio]);

  const handleCopyReport = () => {
    const text = `PRATİK KALIP & İSKELE METRAJI RAPORU
-------------------------------------------
BİNA ÖLÇÜLERİ:
- Kat Döşeme Alanı: ${floorArea} m² (Toplam ${stories} Kat)
- Kat Yüksekliği: ${height} m | Kalıp/Taban Oranı: ${ratio} m²/m²

METRAJ VE EKİPMAN İHTİYACI:
- Tek Kat Kalıp Alanı: ${result?.singleStoryFormworkAreaM2.toFixed(1)} m²
- Tüm Bina Toplam Kalıp Yüzeyi: ${result?.totalBuildingFormworkAreaM2.toFixed(1)} m²
- Tek Takım Plywood İhtiyacı: ~${result?.plywoodSheetsCount} Plaka (250x125 cm)
- Döşeme Altı İskele Hacmi: ${result?.scaffoldingVolumeM3.toFixed(1)} m³
- Teleskopik Dikme Sayısı: ~${result?.telescopicPropsCount} Adet
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/kategori/araclar"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 text-purple-400" />
            Tüm Hesap Araçlarına Dön
          </Link>
        </div>

        {/* Header */}
        <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15),transparent_50%)]" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Layers className="h-6 w-6" />
              </div>
              <ToolScopeBadge kind="estimate" />
              <ToolSourceStamp sources={["Kalıp Açınım Standartları", "ÇŞB Pozları"]} tier="C" />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Pratik Kalıp & İskele Metrajı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Kat alanı ve açınım katsayısına göre tek kat ve tüm bina kalıp açınım yüzeyini, gerekli plywood plaka sayısını ve döşeme altı iskele / teleskopik dikme adetlerini yaklaşık olarak hesaplayın.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300/90">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Yaklaşık Metraj:</strong> Kat yüksekliği, kolon-kiriş sıklığı ve kalıp sistemi firelerine göre metraj değişebilir; sipariş öncesi mimari/statik kalıp planları kontrol edilmelidir.
              </span>
            </div>
          </div>
        </section>

        {/* Workspace */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">
                  Kalıp Boyutlandırma Bilgileri
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kat Döşeme Alanı (m²)
                  </label>
                  <input
                    type="number"
                    value={floorArea}
                    onChange={(e) => setFloorArea(Math.max(10, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Toplam Kat Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={stories}
                    onChange={(e) => setStories(Math.max(1, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kat Yüksekliği (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(Math.max(2, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kalıp Açınım Oranı (m²/m²)
                  </label>
                  <select
                    value={ratio}
                    onChange={(e) => setRatio(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-xs font-bold text-foreground dark:text-white"
                  >
                    <option value={1.8}>1.8 (Mantar / Düz Döşeme)</option>
                    <option value={2.5}>2.5 (Tipik Kolon-Kiriş-Döşeme)</option>
                    <option value={3.2}>3.2 (Yoğun Perdeli / Kaset)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Kalıp Metraj Özeti</h3>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Kopyalandı" : "Raporu Kopyala"}
                </button>
              </div>

              {result && (
                <>
                  <div className="rounded-2xl border border-purple-400/40 bg-purple-500/20 p-6 text-center space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                      Tek Kat Kalıp Yüzeyi
                    </span>
                    <p className="text-5xl font-black tracking-tight text-white font-mono">
                      {result.singleStoryFormworkAreaM2.toFixed(1)} <span className="text-2xl font-bold text-zinc-300">m²</span>
                    </p>
                    <p className="text-xs text-zinc-300">
                      Tüm Bina ({stories} Kat): {result.totalBuildingFormworkAreaM2.toFixed(1)} m²
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Tek Takım Plywood
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        ~{result.plywoodSheetsCount} <span className="text-xs text-zinc-400">Plaka</span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Teleskopik Dikme
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        ~{result.telescopicPropsCount} <span className="text-xs text-zinc-400">Adet</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-300">
                    {result.notes.map((note, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-purple-400">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <GoverningCheckCard
                      label="Kalıp Açınımı ve Plywood Plaka Tahkiki"
                      demand={Number(result.singleStoryFormworkAreaM2.toFixed(1))}
                      capacity={Number((result.plywoodSheetsCount * 3.125).toFixed(1))}
                      unit="m²"
                      status="ok"
                      explanation={`Kat döşeme alanı ${floorArea} m² için açınım katsayısı ${ratio} ile tek kat kalıp alanı = ${result.singleStoryFormworkAreaM2.toFixed(1)} m². Tek takım için 250x125 cm ebatlarında ~${result.plywoodSheetsCount} plaka plywood ve döşeme altı için ~${result.telescopicPropsCount} adet dikme gereklidir.`}
                    />
                  </div>
                </>
              )}
            </section>
          </div>
        </div>

        {/* Tool Limitations & Normative Bounds */}
        <div className="mt-8">
          <ToolLimitations
            scope={[
              "Kat döşeme alanı ve mimari/statik açınım katsayısı (2.0 - 3.5) ile tek kat ve toplam kalıp yüzey alanı hesabı",
              "Standart plywood plaka ebadına (250x125 cm = 3.125 m²) göre tek takım plaka ihtiyacı",
              "Kat yüksekliği ve hacmine göre döşeme altı iskele (m³) ve teleskopik dikme adedi hesabı"
            ]}
            limitations={[
              "Kalıp sirkülasyon devir sayısı (tek takım veya çift takım çalışma) şantiye iş programına göre haricen belirlenir",
              "Kaset, asmolen veya nervürlü döşemelerde kalıp açınım katsayısı düz plak döşemelere göre daha yüksek seçilmelidir",
              "Kalıp iskelesi taşıma kapasitesi ve rüzgar devrilme tahkikleri TS EN 12812 standardına göre harici statik hesaba tabidir"
            ]}
            inputProvenance="Kalıp İskelesi ve Açınım Şantiye Pratik Katsayıları, ÇŞB Kaba İnşaat Rayiçleri"
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}
