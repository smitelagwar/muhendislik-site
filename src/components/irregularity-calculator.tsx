"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  checkTorsionalIrregularity,
  checkSoftStoryIrregularity,
  checkFloorDiscontinuity,
} from "@/lib/engineering/tbdy2018/irregularity";
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

export function IrregularityCalculator() {
  // A1 Burulma Düzensizliği girdileri
  const [deltaMaxMm, setDeltaMaxMm] = useState(14.5);
  const [deltaMinMm, setDeltaMinMm] = useState(9.5);

  // B2 Yumuşak Kat girdileri
  const [driftCurRatio, setDriftCurRatio] = useState(0.007);
  const [driftUpRatio, setDriftUpRatio] = useState(0.004);

  // A2 Döşeme Süreksizliği girdileri
  const [floorAreaM2, setFloorAreaM2] = useState(400);
  const [openingAreaM2, setOpeningAreaM2] = useState(60);

  const [copied, setCopied] = useState(false);

  const a1Result = useMemo(() => {
    return checkTorsionalIrregularity({
      maxInterstoryDriftMm: deltaMaxMm,
      minInterstoryDriftMm: deltaMinMm,
    });
  }, [deltaMaxMm, deltaMinMm]);

  const b2Result = useMemo(() => {
    return checkSoftStoryIrregularity({
      currentStoryDriftRatio: driftCurRatio,
      upperStoryDriftRatio: driftUpRatio,
    });
  }, [driftCurRatio, driftUpRatio]);

  const a2Result = useMemo(() => {
    return checkFloorDiscontinuity({
      totalFloorAreaM2: floorAreaM2,
      totalOpeningAreaM2: openingAreaM2,
    });
  }, [floorAreaM2, openingAreaM2]);

  const handleCopyReport = () => {
    const text = `TBDY 2018 TABLO 3.6 BİNA DÜZENSİZLİK KONTROLLERİ RAPORU
------------------------------------------------------
1. A1 BURULMA DÜZENSİZLİĞİ:
   (Δi)max = ${deltaMaxMm} mm | (Δi)min = ${deltaMinMm} mm
   ηbi = ${a1Result?.torsionalRatioEtaBi.toFixed(3)}
   DURUM: ${a1Result?.statusText}

2. B2 YUMUŞAK KAT DÜZENSİZLİĞİ (RİJİTLİK FARKI):
   Alt/Mevcut Kat Öteleme Oranı: ${driftCurRatio} | Üst Kat: ${driftUpRatio}
   ηki = ${b2Result?.stiffnessRatioEtaKi.toFixed(3)}
   DURUM: ${b2Result?.statusText}

3. A2 DÖŞEME SÜREKSİZLİKLERİ:
   Kat Alanı: ${floorAreaM2} m² | Boşluk Alanı: ${openingAreaM2} m² (%${((a2Result?.openingRatio ?? 0) * 100).toFixed(1)})
   DURUM: ${a2Result?.statusText}
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
                <Activity className="h-6 w-6" />
              </div>
              <ToolScopeBadge kind="check" />
              <ToolSourceStamp sources={["TBDY 2018 Tablo 3.6"]} tier="A" />
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Bina Düzensizlik Kontrolleri
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              TBDY 2018 Tablo 3.6 uyarınca A1 Burulma, A2 Döşeme Süreksizliği ve B2 Yumuşak Kat düzensizlik katsayılarını hesaplayın ve izin verilen analiz yöntemlerini belirleyin.
            </p>
          </div>
        </section>

        {/* 3 Irregularity Cards */}
        <div className="space-y-6">
          {/* Card 1: A1 Burulma */}
          <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground dark:text-white">
                    A1 — Burulma Düzensizliği Kontrolü
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400">
                    ηbi = (Δi)max / (Δi)ort &gt; 1.20 kontrolü
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl px-3 py-1 text-xs font-bold ${
                  a1Result?.hasA1Irregularity
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {a1Result?.hasA1Irregularity ? "A1 Düzensizliği VAR" : "A1 Düzensizliği YOK"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  (Δi)max Maks. Öteleme (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={deltaMaxMm}
                  onChange={(e) => setDeltaMaxMm(Math.max(0.1, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  (Δi)min Min. Öteleme (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={deltaMinMm}
                  onChange={(e) => setDeltaMinMm(Math.max(0.1, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 flex flex-col justify-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                  Burulma Katsayısı ηbi
                </span>
                <p className="mt-1 text-3xl font-black font-mono text-white">
                  {a1Result?.torsionalRatioEtaBi.toFixed(3)}
                </p>
                <span className="text-[10px] text-zinc-300 mt-1">Sınır: 1.20</span>
              </div>
            </div>

            <GoverningCheckCard
              label="A1 Burulma Düzensizliği Tahkiki (eta_bi <= 1.20)"
              demand={Number((a1Result?.torsionalRatioEtaBi ?? 1.0).toFixed(3))}
              capacity={1.2}
              status={a1Result?.hasA1Irregularity ? "warn" : "ok"}
              explanation={
                a1Result?.hasA1Irregularity
                  ? "eta_bi > 1.20 olduğundan A1 burulma düzensizliği mevcuttur. TBDY 2018 uyarınca dinamik analiz (Mod Birleştirme) zorunludur."
                  : "eta_bi <= 1.20 olduğundan katta burulma düzensizliği bulunmamaktadır."
              }
            />
          </section>

          {/* Card 2: B2 Yumuşak Kat */}
          <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground dark:text-white">
                    B2 — Komşu Katlar Arası Rijitlik Düzensizliği (Yumuşak Kat)
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400">
                    ηki = (Δi/hi) / (Δi+1/hi+1) &gt; 2.00 kontrolü
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl px-3 py-1 text-xs font-bold ${
                  b2Result?.hasB2Irregularity
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {b2Result?.hasB2Irregularity ? "B2 Düzensizliği VAR" : "B2 Düzensizliği YOK"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Mevcut/Alt Kat Öteleme Oranı (Δi/hi)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={driftCurRatio}
                  onChange={(e) => setDriftCurRatio(Math.max(0.0001, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Üst Kat Öteleme Oranı (Δi+1/hi+1)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={driftUpRatio}
                  onChange={(e) => setDriftUpRatio(Math.max(0.0001, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 flex flex-col justify-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                  Rijitlik Oranı ηki
                </span>
                <p className="mt-1 text-3xl font-black font-mono text-white">
                  {b2Result?.stiffnessRatioEtaKi.toFixed(3)}
                </p>
                <span className="text-[10px] text-zinc-300 mt-1">Sınır: 2.00</span>
              </div>
            </div>

            <GoverningCheckCard
              label="B2 Komşu Katlar Arası Rijitlik Düzensizliği (eta_ki <= 2.00)"
              demand={Number((b2Result?.stiffnessRatioEtaKi ?? 1.0).toFixed(3))}
              capacity={2.0}
              status={b2Result?.hasB2Irregularity ? "fail" : "ok"}
              explanation={
                b2Result?.hasB2Irregularity
                  ? "eta_ki > 2.00 olduğundan komşu katlar arası rijitlik düzensizliği (B2 yumuşak kat) mevcuttur."
                  : "eta_ki <= 2.00 olduğundan komşu katlar arası rijitlik dağılımı güvenlidir."
              }
            />
          </section>

          {/* Card 3: A2 Döşeme Süreksizliği */}
          <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-500/20 p-2 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground dark:text-white">
                    A2 — Döşeme Süreksizliği Kontrolü
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400">
                    Abosluk / Akat &gt; %33 kontrolü
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl px-3 py-1 text-xs font-bold ${
                  a2Result?.hasA2Irregularity
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {a2Result?.hasA2Irregularity ? "A2 Düzensizliği VAR" : "A2 Düzensizliği YOK"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Toplam Brüt Kat Alanı (m²)
                </label>
                <input
                  type="number"
                  value={floorAreaM2}
                  onChange={(e) => setFloorAreaM2(Math.max(10, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Toplam Boşluk Alanı (m²)
                </label>
                <input
                  type="number"
                  value={openingAreaM2}
                  onChange={(e) => setOpeningAreaM2(Math.max(0, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 flex flex-col justify-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                  Boşluk Oranı
                </span>
                <p className="mt-1 text-3xl font-black font-mono text-white">
                  %{((a2Result?.openingRatio ?? 0) * 100).toFixed(1)}
                </p>
                <span className="text-[10px] text-zinc-300 mt-1">Sınır: %33</span>
              </div>
            </div>

            <GoverningCheckCard
              label="A2 Döşeme Süreksizliği Tahkiki (Boşluk Oranı <= %33)"
              demand={Number((((a2Result?.openingRatio ?? 0) * 100)).toFixed(1))}
              capacity={33}
              unit="%"
              status={a2Result?.hasA2Irregularity ? "warn" : "ok"}
              explanation={
                a2Result?.hasA2Irregularity
                  ? "Döşeme boşluk alanı kat alanının 1/3'ünü (%33) aşmaktadır (A2 düzensizliği mevcut). Rijit diyafram modeli yerine yarı rijit diyafram modeli kullanılmalıdır."
                  : "Döşeme boşluk oranı güvenli sınırlar içindedir; rijit diyafram kabulü geçerlidir."
              }
            />
          </section>

          {/* Copy Report Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-all min-h-[44px]"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              {copied ? "Rapor Kopyalandı" : "Tüm Düzensizlik Raporunu Kopyala"}
            </button>
          </div>
        </div>

        {/* Tool Limitations & Normative Bounds */}
        <div className="mt-8">
          <ToolLimitations
            scope={[
              "TBDY 2018 Tablo 3.6 uyarınca A1 (Burulma düzensizliği), A2 (Döşeme süreksizliği) ve B2 (Komşu katlar arası rijitlik düzensizliği / yumuşak kat) kontrolleri",
              "Kat göreli öteleme değerleri ve döşeme boşluk oranlarına göre düzensizlik katsayıları (eta_bi, eta_ki) tayini",
              "TBDY 2018 doğrusal analiz yöntemi seçim sınırlarının (Eşdeğer Deprem Yükü vs Mod Birleştirme) değerlendirilmesi"
            ]}
            limitations={[
              "A3 (Planda çıkıntılar), B1 (Komşu katlar arası dayanım düzensizliği / zayıf kat) ve B3 (Düşey elemanların süreksizliği) harici yapısal analiz gerektirir",
              "3 boyutlu sonlu elemanlar modal analiz sonuçları ile kat ötelemeleri haricen doğrulanmalıdır",
              "Düzensizlik kontrolleri her iki ana deprem doğrultusu (X ve Y) için ayrı ayrı yapılmalıdır"
            ]}
            inputProvenance="TBDY 2018 Türkiye Bina Deprem Yönetmeliği Tablo 3.6 ve Bölüm 3"
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}
