"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, HardHat, Mountain, Trees, Waves } from "lucide-react";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  detail: string;
  background: string;
  accent: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: "Boş Arazi",
    subtitle: "Aplikasyon, kot kontrolü ve sahaya giriş hazırlıkları tamamlanır.",
    detail: "Ön keşif, güvenli kurulum ve kot doğrulamasıyla saha üretime hazırlanır.",
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 42%, #f8fafc 100%)",
    accent: "text-blue-700 dark:text-blue-300",
  },
  {
    id: 2,
    title: "Kazı ve Hafriyat",
    subtitle: "Temel çukuru açılır, zemin düzenlenir ve çalışma kotu netleşir.",
    detail: "Kazı derinliği, saha lojistiği ve taban suyu riski bu aşamada belirleyicidir.",
    background: "linear-gradient(135deg, #e0f2fe 0%, #cbd5e1 44%, #f8fafc 100%)",
    accent: "text-sky-700 dark:text-sky-300",
  },
  {
    id: 3,
    title: "Temel İmalatı",
    subtitle: "Donatı, kalıp ve ilk beton dökümüyle taşıyıcı taban kurgusu oluşur.",
    detail: "Temel, üst yapı için yük aktarımının başladığı ilk kararlı katmandır.",
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 46%, #f8fafc 100%)",
    accent: "text-blue-700 dark:text-blue-300",
  },
  {
    id: 4,
    title: "Taşıyıcı Sistem",
    subtitle: "Kolonlar ve kirişler yükselir, iskelet görünür hale gelir.",
    detail: "Düşey ve yatay elemanların birlikte okunabildiği ilk net strüktür aşaması.",
    background: "linear-gradient(135deg, #dbeafe 0%, #c4b5fd 44%, #f8fafc 100%)",
    accent: "text-indigo-700 dark:text-indigo-300",
  },
  {
    id: 5,
    title: "Katlar Yükseliyor",
    subtitle: "Döşemeler tamamlanır, kütle ve dolaşım şeması ortaya çıkar.",
    detail: "Şaftlar, döşemeler ve ana hacim organizasyonu yapının karakterini belirler.",
    background: "linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 42%, #f8fafc 100%)",
    accent: "text-sky-700 dark:text-sky-300",
  },
  {
    id: 6,
    title: "Cephe Kapanıyor",
    subtitle: "Dış kabuk, panel ve cam katmanları iç hacmi korumaya başlar.",
    detail: "Enerji performansı, gölgeleme ve cephe ritmi bu aşamada görünür hale gelir.",
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 38%, #f8fafc 100%)",
    accent: "text-cyan-700 dark:text-cyan-300",
  },
  {
    id: 7,
    title: "Son Dokunuşlar",
    subtitle: "Çatı, pencere ve bitiş elemanlarıyla yapı teslim tonuna yaklaşır.",
    detail: "Su yalıtımı, kabuk detayı ve son katmanlar kullanım güvenliğini tamamlar.",
    background: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 38%, #f8fafc 100%)",
    accent: "text-blue-700 dark:text-blue-300",
  },
  {
    id: 8,
    title: "Teslime Hazır",
    subtitle: "Peyzaj ve çevre düzeniyle bina kullanım senaryosuna açılır.",
    detail: "Yapı, sadece kabuk değil; erişim, çevre ve kullanıcı deneyimiyle tamamlanır.",
    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 32%, #eff6ff 100%)",
    accent: "text-blue-700 dark:text-blue-300",
  },
];

const STAGE_SEGMENT = 1 / STAGES.length;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getActiveIndex(progress: number) {
  return Math.min(STAGES.length - 1, Math.floor(clamp(progress) / STAGE_SEGMENT));
}

function useCompactMode() {
  const reducedMotion = useReducedMotion();
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const update = (event: MediaQueryListEvent) => setIsCompact(event.matches);
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, [reducedMotion]);

  return isCompact || reducedMotion;
}

function BuildingScene({ stageIndex }: { stageIndex: number }) {
  const floors = Math.max(0, Math.min(stageIndex - 3, 4));
  const hasFoundation = stageIndex >= 2;
  const hasSkeleton = stageIndex >= 3;
  const hasFacade = stageIndex >= 5;
  const hasRoof = stageIndex >= 6;
  const hasLandscape = stageIndex >= 7;
  const columnHeight = 120 + Math.max(stageIndex - 2, 0) * 22;
  const floorLevels = Array.from({ length: floors }, (_, index) => 280 - index * 34);

  return (
    <svg viewBox="0 0 720 460" className="h-auto w-full max-w-3xl" role="img" aria-label="İnşaat süreci sahne özeti">
      <defs>
        <linearGradient id="scene-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="scene-glass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect x="0" y="336" width="720" height="124" rx="28" fill="url(#scene-ground)" opacity="0.95" />
      <rect x="0" y="332" width="720" height="14" fill="#e2e8f0" opacity="0.92" />

      {stageIndex >= 1 ? (
        <g opacity="0.92">
          <rect x="118" y="336" width="484" height={stageIndex >= 2 ? 44 : 18} rx="10" fill="#8b6c4e" opacity={stageIndex >= 2 ? 0.75 : 0.38} />
          <ellipse cx="88" cy="348" rx="42" ry="16" fill="#b08968" opacity="0.62" />
          <ellipse cx="634" cy="352" rx="54" ry="18" fill="#b08968" opacity="0.7" />
        </g>
      ) : null}

      {hasFoundation ? (
        <g opacity="0.95">
          <rect x="164" y="312" width="392" height="36" rx="10" fill="#cbd5e1" />
          {Array.from({ length: 8 }).map((_, index) => (
            <line key={index} x1={192 + index * 44} y1="316" x2={192 + index * 44} y2="344" stroke="#7c4a2f" strokeWidth="2" opacity="0.7" />
          ))}
        </g>
      ) : null}

      {hasSkeleton ? (
        <g opacity="0.98">
          {[214, 302, 390, 478, 566].map((x) => (
            <rect key={x} x={x} y={336 - columnHeight} width="16" height={columnHeight} rx="6" fill="#475569" />
          ))}
        </g>
      ) : null}

      {floorLevels.map((level) => (
        <g key={level}>
          <rect x="180" y={level} width="368" height="10" rx="4" fill="#64748b" />
          <rect x="176" y={level - 28} width="10" height="28" rx="5" fill="#94a3b8" opacity="0.55" />
          <rect x="542" y={level - 28} width="10" height="28" rx="5" fill="#94a3b8" opacity="0.55" />
        </g>
      ))}

      {hasFacade
        ? floorLevels.map((level) => (
            <g key={`glass-${level}`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <rect
                  key={index}
                  x={204 + index * 64}
                  y={level - 24}
                  width="42"
                  height="18"
                  rx="4"
                  fill="url(#scene-glass)"
                  stroke="#bfdbfe"
                  strokeWidth="1"
                />
              ))}
            </g>
          ))
        : null}

      {hasRoof ? (
        <g opacity="0.98">
          <rect x="172" y={336 - columnHeight - 14} width="388" height="12" rx="6" fill="#334155" />
          <rect x="164" y={336 - columnHeight - 24} width="404" height="10" rx="6" fill="#94a3b8" />
        </g>
      ) : null}

      {stageIndex >= 3 ? (
        <g opacity="0.82">
          <rect x="612" y="112" width="12" height="226" rx="4" fill="#2563eb" />
          <rect x="430" y="112" width="182" height="8" rx="4" fill="#2563eb" />
          <rect x="584" y="120" width="48" height="18" rx="8" fill="#475569" />
        </g>
      ) : null}

      {hasLandscape ? (
        <g opacity="0.98">
          {[112, 162, 612, 656].map((x) => (
            <g key={x}>
              <rect x={x} y="306" width="6" height="30" rx="3" fill="#713f12" />
              <ellipse cx={x + 3} cy="294" rx="18" ry="22" fill="#16a34a" />
            </g>
          ))}
          <rect x="0" y="348" width="720" height="10" fill="#334155" opacity="0.88" />
        </g>
      ) : null}
    </svg>
  );
}

function CompactTimeline() {
  return (
    <section className="tool-page-shell py-12 md:py-16" aria-label="İnşaat süreci özeti">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="tool-panel overflow-hidden rounded-[32px] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="tool-chip rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em]">
              Aşama özeti
            </span>
            <span className="rounded-full border border-zinc-200 bg-white/90 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
              Mobil ve hafif mod
            </span>
          </div>

          <h2 className="mt-6 max-w-3xl text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
            Şantiye ilerleyişini ağır animasyon olmadan tek akışta izleyin.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
            Mobil ekranlarda ve düşük hareket tercihinde sahneyi sabit kartlara indirgedik. İçerik korunuyor; scroll maliyeti düşüyor.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((stage) => (
              <div key={stage.id} className="tool-panel rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
                    {String(stage.id).padStart(2, "0")}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-[0.16em] ${stage.accent}`}>Saha</span>
                </div>
                <h3 className="mt-5 text-xl font-black text-zinc-950 dark:text-white">{stage.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{stage.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ConstructionScrollytelling() {
  const compactMode = useCompactMode();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const nextIndex = getActiveIndex(value);
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  const activeStage = useMemo(() => STAGES[activeIndex], [activeIndex]);

  if (compactMode) {
    return <CompactTimeline />;
  }

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ height: "190vh" }}
        aria-label="İnşaat süreci anlatımı"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <div
            className="absolute inset-0 transition-[background] duration-500"
            style={{ background: activeStage.background }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_20%)]" />

          <div className="relative mx-auto grid h-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center lg:px-8">
            <div className="tool-panel relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-[36px] p-6 md:min-h-[560px] md:p-10">
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-600 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-300">
                <HardHat className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                Şantiye akışı
              </div>
              <BuildingScene stageIndex={activeIndex} />
              <div className="absolute bottom-6 left-6 rounded-3xl border border-white/70 bg-white/80 px-5 py-4 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-300">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {activeIndex < 2 ? (
                      <Mountain className="h-5 w-5" />
                    ) : activeIndex < 5 ? (
                      <Building2 className="h-5 w-5" />
                    ) : activeIndex < 7 ? (
                      <Waves className="h-5 w-5" />
                    ) : (
                      <Trees className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Aktif aşama</p>
                    <p className="mt-1 font-bold text-zinc-900 dark:text-white">{activeStage.title}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="tool-panel rounded-[32px] p-8">
                <span className={`text-[11px] font-black uppercase tracking-[0.22em] ${activeStage.accent}`}>
                  {String(activeStage.id).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")}
                </span>
                <AnimatePresence mode="wait">
                  <m.div
                    key={activeStage.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <h2 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                      {activeStage.title}
                    </h2>
                    <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
                      {activeStage.subtitle}
                    </p>
                    <p className="mt-5 rounded-[24px] border border-zinc-200/80 bg-white/80 px-5 py-4 text-sm leading-7 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300">
                      {activeStage.detail}
                    </p>
                  </m.div>
                </AnimatePresence>
              </div>

              <div className="grid gap-3">
                {STAGES.map((stage, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={stage.id}
                      className={`rounded-[24px] border px-5 py-4 transition-all ${
                        isActive
                          ? "border-blue-200 bg-white text-zinc-950 shadow-sm dark:border-blue-900/50 dark:bg-zinc-950 dark:text-white"
                          : "border-white/70 bg-white/55 text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950/55 dark:text-zinc-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Aşama {stage.id}</p>
                          <p className="mt-2 text-base font-black">{stage.title}</p>
                        </div>
                        <div className={`h-2.5 rounded-full transition-all ${isActive ? "w-10 bg-blue-600" : "w-2.5 bg-zinc-300 dark:bg-zinc-700"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 h-1.5 bg-slate-900/12 dark:bg-slate-100/8">
            <m.div
              className="h-full origin-left bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
