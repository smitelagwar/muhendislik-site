"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Settings2, X } from "lucide-react";
import type { CameraView } from "./building-viewer";
import { IrregularityFallback2D } from "./irregularity-fallback-2d";
import { AFAD_TBDY_URL, SCENARIO_IDS, SCENARIOS, type ScenarioId } from "@/lib/duzensizlik-simulatoru/scenarios";

const Viewer = dynamic(() => import("./building-viewer"), { ssr: false });
type Mode = "3d" | "2d";
const views: readonly { value: CameraView; label: string }[] = [
  { value:"perspective",label:"Serbest" }, { value:"front",label:"Ön" },
  { value:"side",label:"Sağ" }, { value:"left",label:"Sol" }, { value:"top",label:"Üst" },
];

export function IrregularityStudioShell() {
  const [scenario, setScenario] = useState<ScenarioId>("A1");
  const [view, setView] = useState<CameraView>("perspective");
  const [mode, setMode] = useState<Mode>("3d");
  const [panelOpen, setPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lessonStep, setLessonStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSlabs, setShowSlabs] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [viewerKey, setViewerKey] = useState(0);
  const [viewerFailed, setViewerFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const panelButton = useRef<HTMLButtonElement>(null);
  const closePanel = useRef<HTMLButtonElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const data = SCENARIOS[scenario];

  useEffect(() => {
    const frame=window.requestAnimationFrame(()=>setPanelOpen(window.innerWidth>=1024));
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      if(media.matches) setPlaying(false);
    };
    const motionFrame=window.requestAnimationFrame(update);
    media.addEventListener("change", update);
    return () => { window.cancelAnimationFrame(frame); window.cancelAnimationFrame(motionFrame); media.removeEventListener("change",update); };
  }, []);
  useEffect(()=>{
    if(!panelOpen && !settingsOpen) return;
    const onKey=(e:KeyboardEvent)=>{
      if(e.key!=="Escape")return;
      if(settingsOpen){setSettingsOpen(false);settingsButton.current?.focus();}
      else {setPanelOpen(false);panelButton.current?.focus();}
    };
    document.addEventListener("keydown",onKey);
    return ()=>document.removeEventListener("keydown",onKey);
  },[panelOpen,settingsOpen]);
  useEffect(()=>{
    rail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
  },[scenario]);
  const choose=(id:ScenarioId)=>{
    setScenario(id);
    setPlaying(false);
    setLessonStep(0);
    setSettingsOpen(false);
    // Preserve selected camera and layers across scenario changes.
  };
  const reset=()=>{
    setPlaying(false);
    setSpeed(1);
    setShowSlabs(true);
    setShowMembers(true);
    setShowHighlights(true);
    setView("perspective");
    setLessonStep(0);
    setSettingsOpen(false);
    setResetToken(n=>n+1);
  };
  const changeMode=()=>{
    const next:Mode=mode==="3d"?"2d":"3d";
    setMode(next);
    setPlaying(false);
    setSettingsOpen(false);
  };
  const togglePanel=()=>{
    setPanelOpen(v=>!v);
    setSettingsOpen(false);
    if(!panelOpen && typeof window!=="undefined" && window.innerWidth < 1024) {
      window.requestAnimationFrame(()=>closePanel.current?.focus());
    }
  };
  const canAnimate=mode==="3d"&&!viewerFailed&&!reducedMotion;
  const guideContent=lessonStep===0?data.definition:lessonStep===1?data.observe:data.important;
  return (
    <div data-testid="irregularity-studio" data-interactive="true" className="isolate flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#0b1420] text-slate-100">
      <header className="z-30 flex h-12 shrink-0 items-center gap-2 border-b border-white/10 bg-[#111e2c] px-2 sm:h-14 sm:px-4">
        <Link href="/kategori/araclar" aria-label="Araçlara geri dön" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
          <ArrowLeft size={19} aria-hidden="true" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold sm:text-base">Bina Düzensizlikleri <span className="hidden font-medium text-slate-400 sm:inline">· TBDY 2018</span></h1>
        <button ref={panelButton} type="button" data-testid="irregularity-toggle-panel" aria-expanded={panelOpen} aria-controls="irregularity-learning-panel" onClick={togglePanel} className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-white/15 px-2.5 text-xs hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
          <BookOpen size={17} aria-hidden="true" /><span className="hidden sm:inline">{panelOpen?"Rehberi kapat":"Rehber"}</span>
          <span className="sr-only sm:hidden">Öğretici paneli {panelOpen?"kapat":"aç"}</span>
        </button>
      </header>
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <section aria-label="3B düzensizlik simülasyonu" className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div ref={rail} role="group" aria-label="Düzensizlik senaryoları" className="flex h-12 shrink-0 gap-1.5 overflow-x-auto overscroll-x-contain border-b border-white/10 bg-[#101d2c] px-2 py-1.5 [scrollbar-width:none] sm:h-14 sm:gap-2 sm:px-4 sm:py-2">
            {SCENARIO_IDS.map(id=><button key={id} type="button" data-testid={"irregularity-scenario-"+id} aria-pressed={scenario===id} onClick={()=>choose(id)} className={"shrink-0 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 "+(scenario===id?"border-sky-300/70 bg-sky-300/15 text-sky-100":"border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/10")}>
              <span className="font-bold">{id}</span><span className="ml-1.5">{SCENARIOS[id].title}</span>
            </button>)}
          </div>

          <div className="relative min-h-0 flex-1 bg-[radial-gradient(ellipse_at_50%_30%,#1b3447,#0b1725_70%)]" data-testid="irregularity-scene-area">
            <div className={"absolute inset-0 transition-opacity duration-150 "+(mode==="2d"||viewerFailed?"pointer-events-none opacity-0":"opacity-100")} aria-hidden={mode!=="3d"||viewerFailed}>
              <Viewer key={viewerKey} scenario={scenario} view={view} resetToken={resetToken}
                playing={playing} speed={speed} showSlabs={showSlabs} showMembers={showMembers}
                showHighlights={showHighlights} active={mode==="3d"&&!viewerFailed}
                onFailure={()=>{setViewerFailed(true);setMode("2d");setPlaying(false);}} />
            </div>
            {(mode==="2d"||viewerFailed)&&<div className="absolute inset-0"><IrregularityFallback2D scenario={scenario}/></div>}
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-[#102235]/75 px-2.5 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
              <span className="font-semibold text-sky-200">{scenario}</span><span className="ml-2 hidden text-slate-300 sm:inline">{data.emphasis}</span>
            </div>
            {viewerFailed && <button type="button" data-testid="irregularity-retry" onClick={()=>{setViewerFailed(false);setMode("3d");setViewerKey(n=>n+1);}} className="absolute bottom-16 right-3 z-10 rounded-lg border border-sky-300/40 bg-[#18324a] px-4 py-2 text-xs font-semibold">3B&apos;yi tekrar dene</button>}
            {mode==="3d"&&!viewerFailed&&(
              <div role="group" aria-label="Kamera görünümleri" className="absolute bottom-3 left-2 z-10 flex max-w-[calc(100%-16px)] gap-1 rounded-xl border border-white/10 bg-[#102235]/90 p-1 shadow-xl backdrop-blur-md sm:left-3">
                {views.map(item=><button type="button" key={item.value} data-testid={"irregularity-camera-"+item.value} onClick={()=>setView(item.value)} aria-pressed={view===item.value} className={"min-h-9 rounded-lg px-2.5 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 "+(view===item.value?"bg-sky-300 text-[#0b1420]":"text-slate-200 hover:bg-white/10")}>{item.label}</button>)}
              </div>
            )}
            {viewerFailed && <div role="status" className="absolute right-3 top-12 rounded bg-amber-950/70 px-2 py-1 text-xs text-amber-100">3B desteklenemedi; 2B görünüm açık</div>}
          </div>

          <footer className="relative z-20 flex min-h-14 shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-[#101d2c] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:px-4">
            <span className="hidden text-[11px] text-slate-400 xl:block">Ölçeksiz eğitsel hareket · Yapısal analiz değildir</span>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button type="button" data-testid="irregularity-playback" disabled={!canAnimate} aria-pressed={playing} onClick={()=>setPlaying(v=>!v)} className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-300 px-3 text-xs font-bold text-[#0a1622] hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
                {playing?<Pause size={17}/>:<Play size={17}/>}<span>{reducedMotion?"Hareket kapalı":playing?"Duraklat":"Depremi başlat"}</span>
              </button>
              <button type="button" data-testid="irregularity-mode" aria-label={mode==="3d"?"2B çizime geç":"3B sahneye geç"} onClick={changeMode} className="h-11 min-w-14 rounded-xl border border-white/20 px-3 text-xs font-bold hover:bg-white/10">{mode==="3d"?"2B":"3B"}</button>
              <button ref={settingsButton} type="button" data-testid="irregularity-settings" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(v=>!v)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-xs font-semibold hover:bg-white/10">
                <Settings2 size={18}/><span className="hidden sm:inline">Ayarlar</span>
              </button>
            </div>
            {settingsOpen&&(
              <>
                <button type="button" aria-label="Ayarları kapat" onClick={()=>setSettingsOpen(false)} className="fixed inset-0 z-30 bg-transparent"/>
                <div role="group" aria-label="Simülasyon ayarları" className="absolute bottom-[calc(100%+8px)] right-2 z-40 w-[min(310px,calc(100vw-16px))] rounded-2xl border border-white/15 bg-[#142538] p-4 shadow-2xl sm:right-4">
                  <div className="mb-4 flex items-center justify-between"><p className="text-sm font-bold">Görünüm ayarları</p><button type="button" onClick={()=>setSettingsOpen(false)} aria-label="Ayarları kapat" className="rounded p-1 hover:bg-white/10"><X size={18}/></button></div>
                  <label htmlFor="irregularity-speed" className="mb-2 block text-xs text-slate-300">Hareket hızı</label>
                  <select id="irregularity-speed" data-testid="irregularity-speed" disabled={mode==="2d"||reducedMotion||viewerFailed} value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="mb-4 h-11 w-full rounded-lg border border-white/20 bg-[#0f1e2d] px-3 text-sm disabled:opacity-40">
                    <option value={.5}>0,5× · Yavaş</option><option value={1}>1× · Normal</option><option value={1.5}>1,5× · Hızlı</option>
                  </select>
                  {([
                    ["showSlabs","Döşemeler",showSlabs,setShowSlabs],
                    ["showMembers","Taşıyıcı iskelet",showMembers,setShowMembers],
                    ["showHighlights","Kritik vurgular",showHighlights,setShowHighlights],
                  ] as const).map(([id,label,checked,setChecked])=>
                    <label key={id} className="flex min-h-11 items-center justify-between gap-3 border-b border-white/10 py-2 text-sm">
                      {label}
                      <input type="checkbox" data-testid={"irregularity-layer-"+id} checked={checked} disabled={mode==="2d"||viewerFailed} onChange={e=>setChecked(e.target.checked)} className="h-5 w-5 accent-sky-300"/>
                    </label>
                  )}
                  <button type="button" data-testid="irregularity-reset" onClick={reset} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/20 text-xs font-semibold hover:bg-white/10"><RotateCcw size={15}/> Sahneyi sıfırla</button>
                </div>
              </>
            )}
          </footer>
        </section>

        {panelOpen && <button type="button" aria-label="Öğretici paneli kapat" onClick={()=>{setPanelOpen(false);panelButton.current?.focus();}} className="absolute inset-0 z-30 bg-black/55 lg:hidden"/>}
        <aside id="irregularity-learning-panel" aria-label="Öğretici panel" aria-hidden={!panelOpen} className={(panelOpen?"flex":"hidden")+" absolute inset-y-0 right-0 z-40 w-[min(88vw,330px)] flex-col border-l border-white/10 bg-[#132233] shadow-2xl lg:static lg:z-20 lg:w-[min(28vw,338px)] lg:shadow-none"}>
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <span className="flex items-center gap-2 text-sm font-bold"><BookOpen size={17} className="text-sky-300"/> Kısa rehber</span>
            <button ref={closePanel} type="button" onClick={()=>{setPanelOpen(false);panelButton.current?.focus();}} aria-label="Paneli kapat" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10"><X size={18}/></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            <span className="text-xs font-bold tracking-wider text-sky-300">{scenario} · {SCENARIO_IDS.indexOf(scenario)+1}/6</span>
            <h2 className="mt-2 text-xl font-bold">{data.title}</h2>
            <div className="mt-6 flex gap-1.5" role="group" aria-label="Öğrenme adımları">
              {["Tanı","İzle","Anla"].map((label,i)=><button type="button" key={label} data-testid={"irregularity-lesson-"+i} aria-pressed={lessonStep===i} onClick={()=>{setLessonStep(i);if(i===1&&canAnimate)setPlaying(true);else setPlaying(false);}} className={"min-h-10 flex-1 rounded-lg text-xs font-semibold "+(lessonStep===i?"bg-sky-300 text-[#081522]":"bg-white/[0.06] text-slate-300 hover:bg-white/10")}>{i+1}. {label}</button>)}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-200" data-testid="irregularity-guide-copy">{guideContent}</p>
            <p className="mt-7 border-l-2 border-amber-400/75 pl-3 text-xs leading-5 text-slate-400">Örnek gösterim. Gerçek bir binanın düzensizliği hesaplanmamıştır.</p>
            <a href={AFAD_TBDY_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs text-sky-300 underline-offset-4 hover:underline">{data.reference} · Kaynak</a>
          </div>
          <div className="flex shrink-0 items-center gap-2 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button" disabled={lessonStep===0} aria-label="Önceki öğrenme adımı" onClick={()=>{setLessonStep(s=>Math.max(0,s-1));setPlaying(false);}} className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 disabled:opacity-30"><ChevronLeft size={17}/></button>
            <button type="button" disabled={lessonStep===2} onClick={()=>{const next=Math.min(2,lessonStep+1);setLessonStep(next);setPlaying(next===1&&canAnimate);}} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-300 text-xs font-bold text-[#091524] disabled:opacity-30">{lessonStep===2?"Tamamlandı":"Sonraki adım"} <ChevronRight size={15}/></button>
          </div>
        </aside>
      </div>
    </div>
  );
}
