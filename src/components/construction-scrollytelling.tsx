"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useMotionValueEvent, useScroll } from "framer-motion";

interface Stage {
  id: number;
  title: string;
  subtitle: string;
  textSide: "left" | "right";
  background: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    title: "Boş arazi",
    subtitle: "Aplikasyon, kot kontrolü ve şantiye hazırlıkları tamamlanır.",
    textSide: "right",
    background: "linear-gradient(180deg, #8cc7f0 0%, #bfdff8 50%, #eef6ff 100%)",
  },
  {
    id: 2,
    title: "Kazı ve hafriyat",
    subtitle: "Temel çukuru açılır, zemin düzenlenir ve çalışma kotu hazırlanır.",
    textSide: "left",
    background: "linear-gradient(180deg, #79b6e5 0%, #d7c08d 55%, #f1d19f 100%)",
  },
  {
    id: 3,
    title: "Temel imalatı",
    subtitle: "Temel donatısı yerleştirilir, kalıp ve ilk beton dökümü yapılır.",
    textSide: "right",
    background: "linear-gradient(180deg, #5b8fc0 0%, #d1b88e 55%, #d9c7a4 100%)",
  },
  {
    id: 4,
    title: "Taşıyıcı sistem",
    subtitle: "Kolon ve kirişler yükselir, iskelet okunur hale gelir.",
    textSide: "left",
    background: "linear-gradient(180deg, #4e7aac 0%, #c79363 55%, #ddaa79 100%)",
  },
  {
    id: 5,
    title: "Katlar yükseliyor",
    subtitle: "Döşemeler tamamlanır, bina kademeli olarak form kazanır.",
    textSide: "right",
    background: "linear-gradient(180deg, #355881 0%, #d27a48 55%, #e8a061 100%)",
  },
  {
    id: 6,
    title: "Cephe kapanıyor",
    subtitle: "Cam, panel ve dış kabuk elemanları yapıyı korumaya başlar.",
    textSide: "left",
    background: "linear-gradient(180deg, #20385d 0%, #8f5f66 52%, #d28f7b 100%)",
  },
  {
    id: 7,
    title: "Son dokunuşlar",
    subtitle: "Çatı, pencere ve bitiş elemanları devreye alınır.",
    textSide: "right",
    background: "linear-gradient(180deg, #132441 0%, #2d4568 52%, #506e8e 100%)",
  },
  {
    id: 8,
    title: "Teslime hazır",
    subtitle: "Peyzaj, çevre düzeni ve son kontrollerle yapı kullanıma açılır.",
    textSide: "left",
    background: "linear-gradient(180deg, #0b1426 0%, #152744 48%, #21385d 100%)",
  },
];

const STAGE_SEGMENT = 1 / STAGES.length;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getStageProgress(progress: number, stageIndex: number) {
  const start = stageIndex * STAGE_SEGMENT;
  const end = start + STAGE_SEGMENT;
  return clamp((progress - start) / (end - start));
}

export default function ConstructionScrollytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [progress, setProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setProgress(clamp(value));
  });

  const activeIndex = Math.min(STAGES.length - 1, Math.floor(progress / STAGE_SEGMENT));
  const activeStage = STAGES[activeIndex];

  const scene = useMemo(() => {
    const excavation = getStageProgress(progress, 1);
    const foundation = getStageProgress(progress, 2);
    const skeleton = getStageProgress(progress, 3);
    const floors = getStageProgress(progress, 4);
    const facade = getStageProgress(progress, 5);
    const roof = getStageProgress(progress, 6);
    const landscape = getStageProgress(progress, 7);

    return {
      excavation,
      foundation,
      skeleton,
      floors,
      facade,
      roof,
      landscape,
      floorCount: Math.max(0, Math.round(floors * 5)),
      columnHeight: 70 + skeleton * 190,
      buildingBaseY: 500,
      buildingLeft: 240,
      buildingWidth: 520,
    };
  }, [progress]);

  const floorLevels = Array.from({ length: scene.floorCount }, (_, index) => scene.buildingBaseY - 90 - index * 44);

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={containerRef}
        className="relative scrollytelling-container"
        style={{ height: "333vh" }}
        aria-label="İnşaat süreci anlatımı"
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <div
            className="absolute inset-0 transition-[background] duration-500"
            style={{ background: activeStage.background }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.22),transparent_28%)]" />

          <div className="absolute inset-0 flex items-end justify-center px-6 pb-[10vh]">
            <svg
              viewBox="0 0 1000 620"
              className="h-auto max-h-[72vh] w-full max-w-6xl"
              preserveAspectRatio="xMidYMax meet"
              role="img"
              aria-label="Aşama aşama inşaat ilerleyişi"
            >
              <defs>
                <linearGradient id="glass-panels" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9dd9ff" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#68b4ff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#c6e8ff" stopOpacity="0.18" />
                </linearGradient>
                <linearGradient id="ground-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#927151" />
                  <stop offset="100%" stopColor="#6d563d" />
                </linearGradient>
              </defs>

              <rect x="0" y="500" width="1000" height="120" fill="url(#ground-fill)" />
              <rect x="0" y="500" width="1000" height="10" fill="#a48462" />

              {[90, 185, 310, 430, 570, 730, 890].map((x) => (
                <g key={x} opacity={0.7 - progress * 0.4}>
                  <line x1={x} y1="500" x2={x - 4} y2="486" stroke="#638d2d" strokeWidth="2" />
                  <line x1={x + 4} y1="500" x2={x + 7} y2="484" stroke="#7aa737" strokeWidth="2" />
                </g>
              ))}

              <g opacity={1 - scene.excavation * 0.45}>
                <line x1="250" y1="470" x2="250" y2="500" stroke="#d97706" strokeWidth="3" />
                <polygon points="240,468 260,468 250,455" fill="#ef4444" />
                <line x1="750" y1="470" x2="750" y2="500" stroke="#d97706" strokeWidth="3" />
                <polygon points="740,468 760,468 750,455" fill="#ef4444" />
                <line x1="250" y1="474" x2="750" y2="474" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.7" />
              </g>

              <g opacity={Math.max(scene.excavation, 0.001)}>
                <rect x="220" y="500" width="560" height={scene.excavation * 82} fill="#5c482f" />
                <rect x="220" y="500" width="560" height="6" fill="#765b3c" />
                <ellipse cx="845" cy="512" rx="75" ry={18 + scene.excavation * 24} fill="#9d7d58" opacity="0.9" />
                <ellipse cx="145" cy="515" rx="55" ry={12 + scene.excavation * 18} fill="#a88963" opacity="0.8" />
                <g transform={`translate(${700 - scene.excavation * 90}, 430)`} opacity={scene.excavation}>
                  <rect x="0" y="40" width="92" height="16" rx="8" fill="#353535" />
                  <rect x="8" y="20" width="70" height="24" rx="5" fill="#f59e0b" />
                  <rect x="48" y="6" width="24" height="18" rx="3" fill="#374151" />
                  <line x1="18" y1="24" x2={-18 - scene.excavation * 22} y2={8 + scene.excavation * 10} stroke="#f59e0b" strokeWidth="7" strokeLinecap="round" />
                  <line x1={-18 - scene.excavation * 22} y1={8 + scene.excavation * 10} x2={-35 - scene.excavation * 12} y2={34 + scene.excavation * 8} stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                  <path d={`M${-35 - scene.excavation * 12},${34 + scene.excavation * 8} l-10,6 l-12,0 l0,-11 l12,-4 Z`} fill="#374151" />
                </g>
              </g>

              <g opacity={scene.foundation}>
                <rect x="236" y="536" width="528" height="44" fill="#b4b9bf" />
                <rect x="236" y="536" width="528" height="6" fill="#d8dee5" />
                {Array.from({ length: 11 }).map((_, index) => {
                  const x = 264 + index * 44;
                  return <line key={x} x1={x} y1="542" x2={x} y2="575" stroke="#7a4a23" strokeWidth="1.6" opacity={0.9} />;
                })}
                {[550, 560, 570].map((y) => (
                  <line key={y} x1="244" y1={y} x2="756" y2={y} stroke="#7a4a23" strokeWidth="1.6" opacity="0.65" />
                ))}
              </g>

              <g opacity={Math.max(scene.skeleton, scene.floors * 0.25)}>
                {[276, 396, 516, 636, 756].map((x) => (
                  <g key={x}>
                    <rect x={x - 9} y={scene.buildingBaseY - scene.columnHeight} width="18" height={scene.columnHeight} fill="#6f7884" />
                    <rect x={x - 11} y={scene.buildingBaseY - scene.columnHeight} width="22" height="8" fill="#99a5b1" />
                  </g>
                ))}
              </g>

              {floorLevels.map((floorY) => (
                <g key={floorY}>
                  <rect x={scene.buildingLeft} y={floorY} width={scene.buildingWidth} height="10" fill="#929ba7" />
                  <rect x={scene.buildingLeft} y={floorY - 34} width="8" height="34" fill="#d0944d" opacity="0.4" />
                  <rect x={scene.buildingLeft + scene.buildingWidth - 8} y={floorY - 34} width="8" height="34" fill="#d0944d" opacity="0.4" />
                </g>
              ))}

              <g opacity={scene.facade}>
                {floorLevels.map((floorY) => (
                  <g key={`facade-${floorY}`}>
                    {Array.from({ length: 7 }).map((_, index) => {
                      const x = 286 + index * 62;
                      return (
                        <g key={x}>
                          <rect x={x} y={floorY - 30} width="42" height="24" fill="url(#glass-panels)" rx="2" />
                          <rect x={x} y={floorY - 30} width="42" height="24" fill="none" stroke="#9fb7cb" strokeWidth="1" rx="2" />
                        </g>
                      );
                    })}
                  </g>
                ))}
              </g>

              <g opacity={scene.roof}>
                <rect x="228" y={scene.buildingBaseY - scene.columnHeight - 12} width="544" height="14" fill="#798391" />
                <rect x="222" y={scene.buildingBaseY - scene.columnHeight - 20} width="556" height="10" fill="#b8c2cf" />
                <rect x="360" y={scene.buildingBaseY - scene.columnHeight - 34} width="48" height="14" rx="2" fill="#6d737d" opacity="0.8" />
                <rect x="600" y={scene.buildingBaseY - scene.columnHeight - 30} width="36" height="10" rx="2" fill="#6d737d" opacity="0.7" />
              </g>

              <g opacity={Math.max(scene.skeleton, scene.floors * 0.8) * 0.95}>
                <rect x="835" y="195" width="10" height="310" fill="#f59e0b" />
                <rect x="520" y="195" width="325" height="6" fill="#f59e0b" />
                <rect x="840" y="195" width="86" height="6" fill="#f59e0b" />
                <rect x="894" y="201" width="32" height="18" fill="#677384" />
                <line x1="560" y1="201" x2="560" y2={255 + (1 - scene.floors) * 100} stroke="#374151" strokeWidth="2" />
                <path d={`M553,${255 + (1 - scene.floors) * 100} q7,10 14,0`} stroke="#374151" strokeWidth="2" fill="none" />
              </g>

              <g opacity={scene.landscape}>
                {[170, 250, 790, 880].map((x, index) => (
                  <g key={x}>
                    <rect x={x - 3} y="470" width="6" height="30" fill="#60412b" />
                    <ellipse cx={x} cy="458" rx={18 + index * 3} ry={22 + index * 2} fill="#2f7c39" />
                    <ellipse cx={x - 5} cy="454" rx={13 + index * 2} ry={16 + index} fill="#3a9245" />
                  </g>
                ))}
                <rect x="0" y="505" width="1000" height="8" fill="#566774" opacity="0.95" />
                <line x1="0" y1="509" x2="1000" y2="509" stroke="#ffd76b" strokeWidth="1.5" strokeDasharray="20 14" opacity="0.65" />
              </g>
            </svg>
          </div>

          <AnimatePresence mode="wait">
            <m.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`absolute top-1/2 z-20 max-w-sm -translate-y-1/2 px-6 ${
                activeStage.textSide === "left"
                  ? "left-4 text-left sm:left-8 lg:left-16"
                  : "right-4 text-right sm:right-8 lg:right-16"
              }`}
            >
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
                {String(activeStage.id).padStart(2, "0")} / 08
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg md:text-5xl">
                {activeStage.title}
              </h2>
              <p className="mt-4 text-sm font-medium leading-7 text-white/78 md:text-base">{activeStage.subtitle}</p>
            </m.div>
          </AnimatePresence>

          <div className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex">
            {STAGES.map((stage, index) => {
              const isActive = index === activeIndex;
              return (
                <div key={stage.id} className="group flex items-center justify-end gap-3">
                  <span
                    className={`hidden text-[11px] font-black uppercase tracking-[0.18em] transition-opacity xl:block ${
                      isActive ? "text-white/90" : "text-white/40"
                    }`}
                  >
                    {stage.title}
                  </span>
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      isActive ? "w-8 bg-orange-400" : "w-2.5 bg-white/35 group-hover:bg-white/55"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          <m.div
            animate={{ opacity: progress < 0.08 ? 1 : 0, y: progress < 0.08 ? 0 : 12 }}
            className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
          >
            <span className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">Kaydırarak keşfet</span>
            <m.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/30 p-1.5"
            >
              <div className="h-2.5 w-1.5 rounded-full bg-white/60" />
            </m.div>
          </m.div>

          <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-zinc-900/30">
            <m.div
              className="h-full origin-left bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
              style={{ scaleX: progress }}
            />
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
