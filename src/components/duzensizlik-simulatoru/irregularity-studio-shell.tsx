"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CameraView } from "./building-viewer";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Play, Pause, Layers, RotateCcw } from "lucide-react";

const BuildingViewer = dynamic(() => import("./building-viewer"), { ssr: false });

const SCENARIOS = [
  { id: "A1", title: "Burulma", note: "Katın iki kenarı aynı miktarda ötelenmez.", watch: "Köşe hareketlerini karşılaştır." },
  { id: "A2", title: "Döşeme süreksizliği", note: "Döşemedeki boşluk ve süreksizlik yük aktarımını etkiler.", watch: "Döşeme düzlemindeki kesintiye odaklan." },
  { id: "A3", title: "Planda çıkıntılar", note: "Çıkıntılı plan biçimi deprem davranışını etkiler.", watch: "İç köşedeki kritik bölgeyi incele." },
  { id: "B1", title: "Zayıf kat", note: "Komşu katlar arasındaki dayanım farkı önemlidir.", watch: "Dayanımı düşük katı bul." },
  { id: "B2", title: "Yumuşak kat", note: "Bir katta göreli ötelenme yoğunlaşabilir.", watch: "Alt kat hareketine dikkat et." },
  { id: "B3", title: "Düşey süreksizlik", note: "Düşey taşıyıcı elemanların sürekliliği bozulmuştur.", watch: "Yük aktarım yolunu takip et." },
] as const;

export function IrregularityStudioShell() {
  const [selected, setSelected] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [cameraView, setCameraView] = useState<CameraView>("perspective");
  const [cameraReset, setCameraReset] = useState(0);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSlabs, setShowSlabs] = useState(true);
  const current = SCENARIOS[selected];
  const selectScenario = (index: number) => { setSelected(index); setPlaying(false); };
  useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  return (
    <div data-testid="irregularity-studio" className="isolate flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#09111d] text-slate-100">
      <header className="z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0d1928] px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/kategori/araclar" aria-label="Araçlara geri dön" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/15 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
            <ArrowLeft aria-hidden="true" size={19} />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold sm:text-base">Bina Düzensizlikleri <span className="hidden font-normal text-slate-400 sm:inline">/ TBDY 2018</span></p>
            <p className="hidden text-[11px] text-slate-400 sm:block">Etkileşimli öğrenme stüdyosu</p>
          </div>
        </div>
        <button type="button" onClick={() => setPanelOpen(open => !open)} aria-expanded={panelOpen} aria-controls="irregularity-learning-panel" aria-label={panelOpen ? "Öğretici paneli kapat" : "Öğretici paneli aç"} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-semibold hover:bg-white/10">
          {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          <span className="hidden sm:inline">Öğretici panel</span>
        </button>
      </header>
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main aria-label="3B simülasyon sahnesi" className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,#18344c_0%,#09111d_68%)]" />
          <div className="relative z-[1] flex shrink-0 gap-2 overflow-x-auto border-b border-white/10 p-2 sm:p-3 [scrollbar-width:thin]" aria-label="Düzensizlik senaryoları">
            {SCENARIOS.map((scenario, index) => <button type="button" key={scenario.id} onClick={() => selectScenario(index)} aria-pressed={selected === index} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selected === index ? "border-cyan-400/70 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>{scenario.id} · {scenario.title}</button>)}
          </div>
          <div className="relative z-[1] min-h-0 flex-1">
            {viewerFailed ? (
              <div role="alert" className="flex h-full items-center justify-center p-5 text-center text-sm text-slate-300">Bu cihazda 3B görüntüleme kullanılamıyor. 2B öğretici görünüm sonraki aşamada eklenecek.</div>
            ) : (
              <BuildingViewer view={cameraView} resetToken={cameraReset} scenario={current.id} playing={playing} speed={speed} showSlabs={showSlabs} onFailure={() => setViewerFailed(true)} />
            )}
            <div className="absolute right-3 top-3 rounded-full border border-cyan-300/25 bg-[#0d1928]/85 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-cyan-200 backdrop-blur-sm">EĞİTSEL MODEL · {current.id}</div>
            <div role="group" aria-label="Kamera görünümleri" className="absolute bottom-3 left-3 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#0d1928]/90 p-1.5 backdrop-blur-sm">
              {([{ id: "perspective", label: "3B" }, { id: "front", label: "Ön" }, { id: "side", label: "Yan" }, { id: "top", label: "Üst" }] as const).map(v => (
                <button type="button" key={v.id} onClick={() => setCameraView(v.id)} aria-pressed={cameraView === v.id} className={`rounded-md px-3 py-2 text-xs font-semibold ${cameraView === v.id ? "bg-cyan-400 text-[#09111d]" : "text-slate-200 hover:bg-white/10"}`}>{v.label}</button>
              ))}
            </div>
          </div>
          <div className="relative z-[1] flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#0d1928]/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <span className="text-[11px] text-slate-400">Eğitsel gösterim · Hesap sonucu değildir</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setPlaying(false); setCameraView("perspective"); setCameraReset(v => v + 1); }} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs hover:bg-white/10"><RotateCcw size={15}/> Sıfırla</button>
              <button type="button" aria-pressed={showSlabs} onClick={() => setShowSlabs(v => !v)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs hover:bg-white/10"><Layers size={15}/><span className="hidden sm:inline">Döşeme</span></button>
              <label className="sr-only" htmlFor="irregularity-speed">Hareket hızı</label>
              <select id="irregularity-speed" value={speed} onChange={event => setSpeed(Number(event.target.value))} className="h-9 rounded-lg border border-white/15 bg-[#10243a] px-2 text-xs" aria-label="Hareket hızı"><option value={0.5}>0,5×</option><option value={1}>1×</option><option value={1.5}>1,5×</option></select>
              <button type="button" onClick={() => setPlaying(v => !v)} aria-pressed={playing} className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-400 px-3 text-xs font-bold text-[#0b1624] hover:bg-cyan-300">{playing ? <Pause size={15}/> : <Play size={15}/>} {playing ? "Duraklat" : "Depremi başlat"}</button>
            </div>
          </div>
        </main>
        {panelOpen && <button type="button" aria-label="Öğretici paneli kapat" className="absolute inset-0 z-10 bg-black/55 lg:hidden" onClick={() => setPanelOpen(false)} />}
        <aside id="irregularity-learning-panel" aria-label="Öğretici panel" hidden={!panelOpen} className={`${panelOpen ? "flex" : "hidden"} absolute bottom-0 right-0 top-0 z-20 w-[min(90vw,340px)] flex-col border-l border-white/10 bg-[#101d2d] shadow-2xl lg:static lg:top-auto lg:w-[min(29vw,350px)] lg:shadow-none`}>
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4"><span className="flex items-center gap-2 text-sm font-bold"><BookOpen size={17} className="text-cyan-300"/> Öğrenme rehberi</span><button type="button" onClick={() => setPanelOpen(false)} aria-label="Paneli kapat" className="rounded p-2 hover:bg-white/10"><ChevronRight size={18}/></button></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
            <span className="text-xs font-bold tracking-widest text-cyan-300">SENARYO {selected + 1} / 6</span>
            <h2 className="mt-3 text-xl font-bold">{current.id} · {current.title}</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">{current.note}</p>
            <div className="mt-7 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4"><p className="text-xs font-bold text-cyan-300">Neye bakmalıyım?</p><p className="mt-2 text-sm leading-6 text-slate-200">{current.watch}</p></div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 p-4">
            <button type="button" disabled={selected === 0} onClick={() => selectScenario(Math.max(0,selected-1))} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs disabled:opacity-30"><ChevronLeft size={15}/> Önceki</button>
            <button type="button" disabled={selected === SCENARIOS.length - 1} onClick={() => selectScenario(Math.min(SCENARIOS.length-1,selected+1))} className="inline-flex items-center gap-1 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-[#09111d] disabled:opacity-30">Sonraki <ChevronRight size={15}/></button>
          </div>
        </aside>
      </div>
    </div>
  );
}
