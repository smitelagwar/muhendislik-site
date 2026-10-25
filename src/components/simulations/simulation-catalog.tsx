import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Box, Layers, Eye } from "lucide-react";
import type { SimulationCatalogItem } from "@/lib/simulations/catalog";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";

export function SimulationCatalog({
  items,
}: {
  items: SimulationCatalogItem[];
}) {
  return (
    <div className="space-y-8" data-testid="simulation-catalog-page">
      {/* Üst Hero Bölümü */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0f0d22]/90 p-6 sm:p-8 md:p-10 shadow-sm">
        <div className="relative space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground dark:text-zinc-400">
            <Link
              href={TOOLS_HUB_HREF}
              data-testid="catalog-back-to-tools"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 dark:border-white/15 bg-muted/60 dark:bg-[#171330] px-3 py-1 text-foreground dark:text-zinc-200 hover:border-purple-500/40 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Araçlar Merkezine Dön</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-3 py-1 font-bold text-purple-700 dark:text-purple-200">
              <Box className="h-3.5 w-3.5 text-purple-400" />
              <span>3B Betonarme & Donatı Kütüphanesi</span>
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
            Etkileşimli Betonarme ve{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-cyan-400">
              Donatı Simülasyonları
            </span>
          </h1>

          <p className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 sm:text-base">
            Taşıyıcı elemanların iç donatı kafesini, sarılma bölgelerini, filiz boylarını ve
            pas payı örtüsünü her yönden döndürerek, betonu gizleyerek ve 2B şemayla
            karşılaştırarak inceleyin.
          </p>
        </div>
      </section>

      {/* Canlı Simülasyon Kartları (Katalogda canlı WebGL canvas çalıştırılmaz; hafif SVG poster kullanılır) */}
      <section aria-label="Kullanılabilir simülasyon sahneleri" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground dark:text-white">
            Açık Eğitim Sahneleri ({items.length})
          </h2>
          <span className="text-xs font-mono text-muted-foreground dark:text-zinc-400">
            Canlı 3B + 2B Şematik Destekli
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={item.href}
              data-testid={`simulation-card-${item.slug}`}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0f0d22]/90 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-purple-400/60 hover:shadow-[0_0_35px_rgba(139,92,246,0.22)]"
            >
              <div>
                {/* Statik SVG Poster Önizlemesi */}
                <div className="relative mb-5 overflow-hidden rounded-2xl border border-border/60 dark:border-white/10 bg-muted/50 dark:bg-[#090814] p-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground dark:text-zinc-300 mb-2">
                    <span className="inline-flex items-center gap-1.5 text-purple-600 dark:text-purple-300">
                      <Layers className="h-3.5 w-3.5" />
                      {item.categoryLabel}
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-300">
                      {item.referenceLabel}
                    </span>
                  </div>

                  <svg
                    viewBox="0 0 280 140"
                    className="w-full h-32"
                    role="img"
                    aria-label={`${item.shortTitle} statik kafes önizlemesi`}
                  >
                    {item.slug === "radye-temel" ? (
                      <>
                        {/* Grobeton + Radye temel plağı + merkez kolon boynu */}
                        <rect x={24} y={114} width={232} height={11} rx={2} fill="#475569" fillOpacity={0.32} stroke="#94a3b8" strokeDasharray="3 2" strokeWidth={1.1} />
                        <rect x={34} y={58} width={212} height={56} rx={3} fill="#64748b" fillOpacity={0.22} stroke="#94a3b8" strokeWidth={1.5} />
                        <rect x={112} y={18} width={56} height={40} rx={3} fill="#64748b" fillOpacity={0.18} stroke="#94a3b8" strokeWidth={1.4} />
                        {/* Alt iki yönlü ızgara (mavi) */}
                        <line x1={42} y1={105} x2={238} y2={105} stroke="#38bdf8" strokeWidth={3} />
                        {[56, 80, 104, 128, 152, 176, 200, 224].map((x) => (
                          <circle key={`bot-${x}`} cx={x} cy={101} r={2.4} fill="#0ea5e9" />
                        ))}
                        {/* Üst iki yönlü ızgara (pembe) */}
                        <line x1={42} y1={67} x2={238} y2={67} stroke="#ec4899" strokeWidth={3} />
                        {[56, 80, 104, 128, 152, 176, 200, 224].map((x) => (
                          <circle key={`top-${x}`} cx={x} cy={71} r={2.4} fill="#f472b6" />
                        ))}
                        {/* Sehpa (chair) donatıları */}
                        <path d="M 60 102 L 68 102 L 68 74 L 94 74 L 94 102 L 102 102" fill="none" stroke="#eab308" strokeWidth={2.1} />
                        <path d="M 178 102 L 186 102 L 186 74 L 212 74 L 212 102 L 220 102" fill="none" stroke="#eab308" strokeWidth={2.1} />
                        {/* Merkez kolon filizleri */}
                        <path d="M 124 8 L 124 94 Q 124 98 118 98 L 96 98" fill="none" stroke="#f59e0b" strokeWidth={2.7} strokeLinecap="round" />
                        <path d="M 156 8 L 156 94 Q 156 98 162 98 L 184 98" fill="none" stroke="#f59e0b" strokeWidth={2.7} strokeLinecap="round" />
                      </>
                    ) : item.slug === "perde-detayi" ? (
                      <>
                        {/* Boşluksuz perde gövdesi + sol ve sağ uç bölgeleri */}
                        <rect x={24} y={20} width={232} height={100} rx={4} fill="#64748b" fillOpacity={0.2} stroke="#94a3b8" strokeWidth={1.5} />
                        <rect x={28} y={24} width={48} height={92} rx={3} fill="#06b6d4" fillOpacity={0.14} stroke="#06b6d4" strokeDasharray="3 2" strokeWidth={1.2} />
                        <rect x={204} y={24} width={48} height={92} rx={3} fill="#22c55e" fillOpacity={0.14} stroke="#22c55e" strokeDasharray="3 2" strokeWidth={1.2} />
                        {/* Uç bölge boyuna çubukları */}
                        {[36, 52, 68, 212, 228, 244].map((x) => (
                          <line key={x} x1={x} y1={120} x2={x} y2={10} stroke="#f59e0b" strokeWidth={2.5} />
                        ))}
                        {/* İki yüz gövde düşey ve yatay ağları */}
                        {[96, 118, 140, 162, 184].map((x) => (
                          <line key={x} x1={x} y1={120} x2={x} y2={12} stroke="#38bdf8" strokeWidth={1.9} />
                        ))}
                        {[32, 48, 64, 80, 96, 110].map((y) => (
                          <line key={y} x1={30} y1={y} x2={250} y2={y} stroke="#cbd5e1" strokeWidth={1.6} />
                        ))}
                      </>
                    ) : item.slug === "tekil-temel" ? (
                      <>
                        {/* Temsilî grobeton + tekil temel + kolon boynu */}
                        <rect x={28} y={114} width={224} height={12} rx={2} fill="#475569" fillOpacity={0.32} stroke="#94a3b8" strokeDasharray="3 2" strokeWidth={1.1} />
                        <rect x={42} y={72} width={196} height={42} rx={3} fill="#64748b" fillOpacity={0.22} stroke="#94a3b8" strokeWidth={1.5} />
                        <rect x={112} y={24} width={56} height={48} rx={3} fill="#64748b" fillOpacity={0.18} stroke="#94a3b8" strokeWidth={1.4} />
                        {/* Alt X ızgarası (mavi) ve Alt Y ızgarası kesit daireleri (pembe) */}
                        <line x1={52} y1={104} x2={228} y2={104} stroke="#38bdf8" strokeWidth={3} />
                        {[64, 86, 108, 130, 150, 172, 194, 216].map((x) => (
                          <circle key={x} cx={x} cy={99} r={2.6} fill="#ec4899" />
                        ))}
                        {/* L-bükümlü kolon filizleri */}
                        <path d="M 122 10 L 122 92 Q 122 96 116 96 L 84 96" fill="none" stroke="#f59e0b" strokeWidth={2.8} strokeLinecap="round" />
                        <path d="M 158 10 L 158 92 Q 158 96 164 96 L 196 96" fill="none" stroke="#f59e0b" strokeWidth={2.8} strokeLinecap="round" />
                        {/* Filiz etriyeleri */}
                        {[34, 46, 58, 78, 88].map((y, idx) => (
                          <line key={y} x1={118} y1={y} x2={162} y2={y} stroke={idx < 3 ? "#06b6d4" : "#22c55e"} strokeWidth={1.8} />
                        ))}
                      </>
                    ) : item.slug === "kolon-kiris-birlesimi" ? (
                      <>
                        {/* Dış kolon + sağa saplanan kiriş beton gövdesi */}
                        <rect x={64} y={14} width={64} height={112} rx={4} fill="#64748b" fillOpacity={0.22} stroke="#94a3b8" strokeWidth={1.5} />
                        <rect x={128} y={44} width={124} height={52} rx={3} fill="#64748b" fillOpacity={0.18} stroke="#94a3b8" strokeWidth={1.4} />
                        {/* Kolon boyuna donatıları */}
                        <line x1={76} y1={124} x2={76} y2={8} stroke="#cbd5e1" strokeWidth={2.8} />
                        <line x1={116} y1={124} x2={116} y2={8} stroke="#cbd5e1" strokeWidth={2.8} />
                        {/* Kiriş üst ve alt 90° ankrajlı donatıları */}
                        <path d="M 246 53 L 82 53 L 82 84" fill="none" stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 246 87 L 90 87 L 90 58" fill="none" stroke="#38bdf8" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        {/* Düğüm çekirdeği ve kolon etriyeleri */}
                        {[24, 34, 48, 60, 70, 80, 90, 104, 114].map((y, idx) => (
                          <line
                            key={y}
                            x1={73}
                            y1={y}
                            x2={119}
                            y2={y}
                            stroke={idx >= 2 && idx <= 6 ? "#22c55e" : "#06b6d4"}
                            strokeWidth={2}
                          />
                        ))}
                        {/* Kiriş sarılma etriyeleri */}
                        {[138, 150, 162, 174, 188, 204, 222, 238].map((x) => (
                          <line key={x} x1={x} y1={49} x2={x} y2={91} stroke="#ec4899" strokeWidth={1.9} />
                        ))}
                      </>
                    ) : item.slug === "kiris-detayi" ? (
                      <>
                        {/* Sol ve sağ uç mesnetler + kiriş beton gövdesi */}
                        <rect x={16} y={24} width={28} height={92} rx={3} fill="#475569" fillOpacity={0.28} stroke="#94a3b8" strokeWidth={1.2} />
                        <rect x={236} y={24} width={28} height={92} rx={3} fill="#475569" fillOpacity={0.28} stroke="#94a3b8" strokeWidth={1.2} />
                        <rect x={44} y={40} width={192} height={60} rx={3} fill="#64748b" fillOpacity={0.18} stroke="#94a3b8" strokeWidth={1.5} />
                        {/* Alt açıklık ve üst montaj donatıları */}
                        <line x1={26} y1={90} x2={254} y2={90} stroke="#38bdf8" strokeWidth={3} />
                        <line x1={26} y1={50} x2={254} y2={50} stroke="#cbd5e1" strokeWidth={2.5} />
                        {/* Mesnet üst ilave donatıları */}
                        <line x1={24} y1={55} x2={98} y2={55} stroke="#f59e0b" strokeWidth={2.8} />
                        <line x1={182} y1={55} x2={256} y2={55} stroke="#f59e0b" strokeWidth={2.8} />
                        {/* Bölgesel etriyeler */}
                        {[52, 62, 72, 82, 92, 110, 128, 146, 164, 182, 198, 208, 218, 228].map((x, idx) => (
                          <line
                            key={x}
                            x1={x}
                            y1={46}
                            x2={x}
                            y2={94}
                            stroke={idx < 5 ? "#06b6d4" : idx > 9 ? "#22c55e" : "#eab308"}
                            strokeWidth={2}
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Beton dış kutu */}
                        <rect
                          x={95}
                          y={24}
                          width={90}
                          height={104}
                          rx={4}
                          fill="#64748b"
                          fillOpacity={0.18}
                          stroke="#94a3b8"
                          strokeWidth={1.5}
                        />
                        {/* Boyuna donatı ve filizler */}
                        <line x1={108} y1={128} x2={108} y2={24} stroke="#cbd5e1" strokeWidth={3} />
                        <line x1={172} y1={128} x2={172} y2={24} stroke="#cbd5e1" strokeWidth={3} />
                        <line x1={126} y1={128} x2={126} y2={24} stroke="#94a3b8" strokeWidth={2.2} />
                        <line x1={154} y1={128} x2={154} y2={24} stroke="#94a3b8" strokeWidth={2.2} />
                        {/* Filiz üst uzantılar */}
                        <line x1={108} y1={24} x2={108} y2={6} stroke="#f59e0b" strokeWidth={3} strokeDasharray="4 2" />
                        <line x1={172} y1={24} x2={172} y2={6} stroke="#f59e0b" strokeWidth={3} strokeDasharray="4 2" />
                        {/* Etriyeler */}
                        {[32, 40, 52, 66, 80, 94, 106, 114, 122].map((y, idx) => (
                          <line
                            key={y}
                            x1={105}
                            y1={y}
                            x2={175}
                            y2={y}
                            stroke={idx < 2 ? "#22c55e" : idx > 6 ? "#06b6d4" : "#eab308"}
                            strokeWidth={2}
                          />
                        ))}
                      </>
                    )}
                  </svg>
                </div>

                <h3 className="text-xl font-black tracking-tight text-foreground dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors">
                  {item.shortTitle}
                </h3>
                <p className="mt-1 font-mono text-xs font-semibold text-purple-600 dark:text-purple-300">
                  {item.subtitle}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground dark:text-zinc-300">
                  {item.description}
                </p>

                <ul className="mt-4 space-y-1.5 border-t border-border/60 dark:border-white/10 pt-3 text-[11px] text-muted-foreground dark:text-zinc-400">
                  {item.learningFocus.map((focus) => (
                    <li key={focus} className="flex items-start gap-2">
                      <Eye className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{focus}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 dark:border-white/10 pt-4">
                <span className="font-mono text-[11px] font-bold text-muted-foreground dark:text-zinc-400">
                  3B Kafes + 2B Kesit
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-300 group-hover:translate-x-0.5 transition-transform">
                  Simülasyonu Aç
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
