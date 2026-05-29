"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import Link from "next/link";
import { X, ArrowRight, BookOpen, Calculator } from "lucide-react";
import { BINA_MINDMAP_DATA, BINA_BRANCH_COLORS, type BinaMindMapNode } from "@/lib/bina-asamalari";
import { useTheme } from "next-themes";

// Mobil ve desktop için farklı layout stratejisi
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function BinaMindMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hiyerarşi oluştur
  const root = useMemo(() => {
    return d3.hierarchy<BinaMindMapNode>(BINA_MINDMAP_DATA, (d) => d.children as BinaMindMapNode[]);
  }, []);

  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });



  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDimensions({
          width: w,
          // Mobilde daha uzun, desktop'ta daha geniş
          height: w < 768 ? Math.max(700, w * 1.4) : Math.max(600, w * 0.7),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;

  // Mobilde dikey ağaç, desktop'ta yatay ağaç layout
  const treeLayout = useMemo(() => {
    if (isMobile) {
      // Dikey layout: geniş, uzun
      const layout = d3.tree<BinaMindMapNode>().size([width - 60, height - 160]);
      return layout(root);
    }
    // Yatay layout: klasik
    const layout = d3.tree<BinaMindMapNode>().size([height - 100, width - 300]);
    return layout(root);
  }, [root, width, height, isMobile]);

  // Zoom kurulumu
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Başlangıç konumu — mobilde fit-to-content
    if (isMobile) {
      svg.call(zoom.transform, d3.zoomIdentity.translate(30, 40).scale(0.85));
    } else {
      svg.call(zoom.transform, d3.zoomIdentity.translate(100, 50).scale(1));
    }
  }, [width, height, isMobile]);

  const [selectedNode, setSelectedNode] = useState<BinaMindMapNode | null>(null);

  const handleNodeClick = (nodeData: BinaMindMapNode) => {
    setSelectedNode(nodeData);
  };

  const getBranchColor = (d: d3.HierarchyPointNode<BinaMindMapNode>) => {
    let current = d;
    while (current.depth > 1) {
      current = current.parent!;
    }
    if (current.depth === 1 && current.data.id in BINA_BRANCH_COLORS) {
      return BINA_BRANCH_COLORS[current.data.id as keyof typeof BINA_BRANCH_COLORS];
    }
    return "#6c63ff";
  };

  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const linkColor = isDark ? "#334155" : "#cbd5e1";
  const bgColor = isDark ? "#0f172a" : "#ffffff";

  // Responsive font boyutu
  const fontSize = isMobile ? 10 : 12;

  // Link çizici: mobilde dikey, desktop'ta yatay
  const linkGenerator = isMobile
    ? d3.linkVertical<d3.HierarchyPointLink<BinaMindMapNode>, d3.HierarchyPointNode<BinaMindMapNode>>()
        .x((d) => d.x)
        .y((d) => d.y)
    : d3.linkHorizontal<d3.HierarchyPointLink<BinaMindMapNode>, d3.HierarchyPointNode<BinaMindMapNode>>()
        .x((d) => d.y)
        .y((d) => d.x);

  // Container yüksekliği
  const containerHeight = isMobile
    ? Math.max(500, dimensions.width * 1.4)
    : Math.max(600, dimensions.width * 0.7);

  if (!mounted) {
    return (
      <section className="space-y-4">
        <div className="flex h-[600px] w-full items-center justify-center rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/50 sm:rounded-[24px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/50 sm:rounded-[24px] md:p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Konu haritası</p>
        <h2 id="bina-mind-map-title" className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
          Bina Yapım Aşamaları
        </h2>
        <p id="bina-mind-map-summary" className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:mt-3">
          İnteraktif harita üzerinde gezinip ilgili aşamalara tıklayarak detaylı bilgiye ulaşabilirsiniz.
          <span className="hidden sm:inline"> Farenizle veya dokunarak yakınlaştırıp kaydırabilirsiniz.</span>
        </p>
      </div>

      {/* Mobil ipucu */}
      {isMobile && (
        <p className="px-1 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
          İki parmakla yakınlaştırın · Düğüme dokunarak sayfayı açın
        </p>
      )}

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
        style={{ height: containerHeight }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ touchAction: "pan-y" }}
          aria-label="Bina Aşamaları Etkileşimli Zihin Haritası"
          role="img"
        >
          <title>Bina inşaat sürecinin tüm aşamalarını gösteren etkileşimli ağaç haritası</title>
          <g ref={gRef}>
            {/* Bağlantı çizgileri */}
            {treeLayout.links().map((link, i) => (
              <path
                key={`link-${i}`}
                d={linkGenerator(link) || undefined}
                fill="none"
                stroke={linkColor}
                strokeWidth={isMobile ? 1.5 : 2}
                opacity={0.6}
              />
            ))}

            {/* Düğümler */}
            {treeLayout.descendants().map((node, i) => {
              const color = getBranchColor(node);
              const hasChildren = !!node.children;
              const isRoot = node.depth === 0;

              // Mobil vs desktop pozisyon
              const tx = isMobile ? node.x : node.y;
              const ty = isMobile ? node.y : node.x;

              // Daha büyük dokunma alanı
              const hitRadius = isMobile ? 18 : 12;

              return (
                <g
                  key={`node-${i}`}
                  transform={`translate(${tx},${ty})`}
                  onClick={() => handleNodeClick(node.data)}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.data.label.replace(/\n/g, " ")} detaylarını görüntüle`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNodeClick(node.data);
                    }
                  }}
                >
                  <title>{node.data.label.replace(/\n/g, " ")}: {node.data.summary}</title>

                  {/* Görünmez hit area (mobilde büyük) */}
                  <circle r={hitRadius} fill="transparent" />

                  {/* Görünür nokta */}
                  <circle
                    r={isRoot ? (isMobile ? 6 : 8) : (hasChildren ? (isMobile ? 4 : 6) : (isMobile ? 3 : 4))}
                    fill={isDark ? bgColor : "#fff"}
                    stroke={color}
                    strokeWidth={isRoot ? 4 : 3}
                  />

                  {/* Etiket */}
                  {isMobile ? (
                    // Dikey layout: etiketler sağda
                    <text
                      dy={isRoot ? -12 : 4}
                      dx={isRoot ? 0 : 10}
                      textAnchor={isRoot ? "middle" : "start"}
                      fill={textColor}
                      fontSize={isRoot ? fontSize + 2 : fontSize}
                      fontWeight={isRoot ? 800 : 600}
                      style={{
                        pointerEvents: "none",
                        userSelect: "none",
                        textShadow: isDark ? "0 1px 3px rgba(0,0,0,0.8)" : "0 1px 3px rgba(255,255,255,0.8)",
                      }}
                    >
                      {node.data.label.replace(/\n/g, " ")}
                    </text>
                  ) : (
                    // Yatay layout: etiketler üst/alt
                    <text
                      dy={isRoot ? -15 : 4}
                      dx={isRoot ? 0 : (hasChildren ? -12 : 12)}
                      textAnchor={isRoot ? "middle" : (hasChildren ? "end" : "start")}
                      fill={textColor}
                      fontSize={fontSize}
                      fontWeight={isRoot ? 800 : 600}
                      style={{
                        pointerEvents: "none",
                        userSelect: "none",
                        textShadow: isDark ? "0 1px 3px rgba(0,0,0,0.8)" : "0 1px 3px rgba(255,255,255,0.8)",
                      }}
                    >
                      {node.data.label.replace(/\n/g, " ")}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Modern Endüstriyel Detay Çekmecesi */}
        {selectedNode && (
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-[380px] border-l border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl transition-all duration-300 z-30 flex flex-col"
            aria-live="polite"
          >
            {/* Üst Vurgu Çizgisi */}
            <div
              className="h-2 w-full shrink-0"
              style={{
                backgroundColor: (() => {
                  const node = treeLayout.descendants().find(n => n.data.id === selectedNode.id);
                  return node ? getBranchColor(node) : "#6c63ff";
                })()
              }}
            />

            {/* Başlık */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-900 shrink-0">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Aşama Bilgileri</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  {selectedNode.label.replace(/\n/g, " ")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Özet Açıklama</p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedNode.summary}
                </p>
              </div>

              {/* İlişkili Hesaplama Modülü */}
              {(() => {
                const NODE_TOOLS_MAP: Record<string, { name: string; url: string; desc: string }> = {
                  "pas-payi": {
                    name: "Pas Payı Hesaplayıcı",
                    url: "/kategori/araclar/pas-payi",
                    desc: "Çevresel etki sınıfları ve TS EN 1992-1-1 pas payı dayanım standartları."
                  },
                  "kalip-sokumu": {
                    name: "Kalıp Söküm Süresi",
                    url: "/kategori/araclar/kalip-sokum",
                    desc: "Beton dayanım gelişim yüzdesine göre güvenli kalıp alma takvimi."
                  },
                  "kolon-donati": {
                    name: "Kolon Kapasite Hesabı",
                    url: "/kategori/araclar/kolon-hesabi",
                    desc: "TS 500 eksenel yük ve moment etkisindeki kolon donatı optimizasyonu."
                  },
                  "kiris-donati": {
                    name: "Kiriş Eğilme Kapasitesi",
                    url: "/kategori/araclar/kiris-hesabi",
                    desc: "Betonarme kirişlerde taşıma gücü momenti ve sınır donatı oranları."
                  },
                  "doseme-donati": {
                    name: "Döşeme Kalınlık & Donatı",
                    url: "/kategori/araclar/doseme-hesabi",
                    desc: "TS 500'e göre tek/çift doğrultulu döşeme sehim sınırları."
                  },
                  "radye-temel": {
                    name: "Tekil Temel Tasarımı",
                    url: "/hesaplamalar/tekil-temel",
                    desc: "Zemin gerilmesi, zımbalama ve donatı alanı ön boyutlandırması."
                  },
                  "temel-donati": {
                    name: "Tekil Temel Tasarımı",
                    url: "/hesaplamalar/tekil-temel",
                    desc: "Zemin gerilmesi, zımbalama ve donatı alanı ön boyutlandırması."
                  },
                  "mimari-proje": {
                    name: "İmar Durumu Hesaplayıcı",
                    url: "/kategori/araclar/imar-hesaplayici",
                    desc: "TAKS, KAKS, çekme mesafeleri ve kat alanları fizibilite ön hesabı."
                  },
                  "yapi-ruhsati": {
                    name: "İmar Durumu Hesaplayıcı",
                    url: "/kategori/araclar/imar-hesaplayici",
                    desc: "TAKS, KAKS, çekme mesafeleri ve kat alanları fizibilite ön hesabı."
                  }
                };

                const tool = NODE_TOOLS_MAP[selectedNode.id];
                if (!tool) return null;

                return (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">İlişkili Hesaplama Modülü</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {tool.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                    <Link
                      href={tool.url}
                      className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-black uppercase tracking-wider text-white gap-1.5 transition-colors mt-2"
                    >
                      Modüle Git
                      <ArrowRight className="h-3.5 w-3.5 text-white" />
                    </Link>
                  </div>
                );
              })()}
            </div>

            {/* Butonlar */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 shrink-0">
              <Link
                href={selectedNode.url}
                onClick={() => setSelectedNode(null)}
                className="h-11 w-full rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-xs font-black uppercase tracking-wider text-white dark:text-slate-900 flex items-center justify-center gap-2 transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Teknik Rehberi Oku
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
