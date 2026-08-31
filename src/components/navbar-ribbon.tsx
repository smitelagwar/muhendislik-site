"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Box,
  BrickWall,
  Building2,
  Calculator,
  ChevronDown,
  CircleGauge,
  Compass,
  Frame,
  Grid,
  HardHat,
  Home,
  Layers,
  Link as LinkIcon,
  ListChecks,
  Map,
  MoveHorizontal,
  PaintRoller,
  PanelsTopLeft,
  Ruler,
  Scissors,
  Shield,
  Snowflake,
  Target,
  Timer,
  TrendingDown,
  Trees,
  Truck,
  Weight,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Discipline Ribbon Data                                             */
/* ------------------------------------------------------------------ */

interface RibbonTool {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  iconKey: string;
  tier: "A" | "B" | "C";
  norm: string;
}

interface RibbonDiscipline {
  id: string;
  label: string;
  shortLabel: string;
  accentFrom: string;
  accentTo: string;
  iconKey: string;
  tools: RibbonTool[];
}

const RIBBON_DISCIPLINES: RibbonDiscipline[] = [
  {
    id: "betonarme",
    label: "Betonarme",
    shortLabel: "BA",
    accentFrom: "from-violet-600",
    accentTo: "to-purple-600",
    iconKey: "building2",
    tools: [
      { id: "donati-hesabi", label: "Donatı Hesabı", shortLabel: "Donatı", href: "/kategori/araclar/donati-hesabi", iconKey: "rebar", tier: "B", norm: "TS 500" },
      { id: "kolon-on-boyutlandirma", label: "Kolon Ön Boyutlandırma", shortLabel: "Kolon", href: "/kategori/araclar/kolon-on-boyutlandirma", iconKey: "column", tier: "A", norm: "TS 500" },
      { id: "kiris-kesiti", label: "Kiriş Kesiti", shortLabel: "Kiriş", href: "/kategori/araclar/kiris-kesiti", iconKey: "beam", tier: "A", norm: "TS 500" },
      { id: "doseme-kalinligi", label: "Döşeme Kalınlığı", shortLabel: "Döşeme", href: "/kategori/araclar/doseme-kalinligi", iconKey: "slab", tier: "B", norm: "TS 500" },
      { id: "pas-payi", label: "Pas Payı", shortLabel: "Pas Payı", href: "/kategori/araclar/pas-payi", iconKey: "cover", tier: "B", norm: "TS EN 1992" },
      { id: "zimbalama-kontrolu", label: "Zımbalama Kontrolü", shortLabel: "Zımbalama", href: "/kategori/araclar/zimbalama-kontrolu", iconKey: "punching", tier: "A", norm: "TS 500" },
      { id: "kiris-kesme-etriye", label: "Kiriş Kesme & Etriye", shortLabel: "Kesme", href: "/kategori/araclar/kiris-kesme-etriye", iconKey: "shear", tier: "A", norm: "TS 500" },
      { id: "kenetlenme-boyu", label: "Kenetlenme & Ek Boyu", shortLabel: "Kenetlenme", href: "/kategori/araclar/kenetlenme-boyu", iconKey: "splice", tier: "A", norm: "TS 500" },
    ],
  },
  {
    id: "deprem",
    label: "Deprem",
    shortLabel: "DP",
    accentFrom: "from-rose-600",
    accentTo: "to-pink-600",
    iconKey: "earthquake",
    tools: [
      { id: "taban-kesme-kuvveti", label: "Eşdeğer Deprem Yükü", shortLabel: "Taban Kesme", href: "/kategori/araclar/taban-kesme-kuvveti", iconKey: "earthquake", tier: "A", norm: "TBDY 2018" },
      { id: "duzensizlik-kontrolu", label: "Düzensizlik Kontrolleri", shortLabel: "Düzensizlik", href: "/kategori/araclar/duzensizlik-kontrolu", iconKey: "check", tier: "A", norm: "TBDY 2018" },
      { id: "deprem-periyot-hesabi", label: "Periyot & Spektrum", shortLabel: "Periyot", href: "/kategori/araclar/deprem-periyot-hesabi", iconKey: "period", tier: "A", norm: "TBDY 2018" },
      { id: "goreli-kat-otelemesi", label: "Göreli Kat Ötelemesi", shortLabel: "Drift", href: "/kategori/araclar/goreli-kat-otelemesi", iconKey: "drift", tier: "A", norm: "TBDY 2018" },
    ],
  },
  {
    id: "geoteknik",
    label: "Geoteknik & Temel",
    shortLabel: "GT",
    accentFrom: "from-emerald-600",
    accentTo: "to-teal-600",
    iconKey: "soil",
    tools: [
      { id: "zemin-sinifi", label: "Yerel Zemin Sınıfı", shortLabel: "Zemin", href: "/kategori/araclar/zemin-sinifi", iconKey: "soil", tier: "A", norm: "TBDY 2018" },
      { id: "radye-temel-hesabi", label: "Radye Temel", shortLabel: "Radye", href: "/kategori/araclar/radye-temel-hesabi", iconKey: "foundation", tier: "A", norm: "TS 500" },
      { id: "iksa-toprak-basinci", label: "İksa Toprak Basıncı", shortLabel: "İksa", href: "/kategori/araclar/iksa-toprak-basinci", iconKey: "retaining", tier: "A", norm: "Rankine" },
      { id: "sev-stabilitesi", label: "Şev Stabilitesi", shortLabel: "Şev", href: "/kategori/araclar/sev-stabilitesi", iconKey: "slope", tier: "B", norm: "Fellenius" },
    ],
  },
  {
    id: "celik-ahsap",
    label: "Çelik & Ahşap",
    shortLabel: "ÇA",
    accentFrom: "from-slate-600",
    accentTo: "to-zinc-600",
    iconKey: "steel",
    tools: [
      { id: "celik-profil-secimi", label: "Çelik Profil Seçimi", shortLabel: "Profil", href: "/kategori/araclar/celik-profil-secimi", iconKey: "steel", tier: "A", norm: "ÇYTHYE 2018" },
      { id: "celik-birlestesi-hesabi", label: "Cıvata & Kaynak", shortLabel: "Birleşim", href: "/kategori/araclar/celik-birlestesi-hesabi", iconKey: "bolt", tier: "A", norm: "ÇYTHYE 2018" },
      { id: "ahsap-eleman-hesabi", label: "Ahşap Kiriş & Sehim", shortLabel: "Ahşap", href: "/kategori/araclar/ahsap-eleman-hesabi", iconKey: "timber", tier: "B", norm: "EC 5" },
    ],
  },
  {
    id: "metraj-imar",
    label: "Şantiye & Metraj",
    shortLabel: "Mİ",
    accentFrom: "from-amber-600",
    accentTo: "to-orange-600",
    iconKey: "site",
    tools: [
      { id: "kalip-sokum-suresi", label: "Kalıp Söküm Süresi", shortLabel: "Kalıp Söküm", href: "/kategori/araclar/kalip-sokum-suresi", iconKey: "site", tier: "C", norm: "TS 500" },
      { id: "dis-cephe-yalitim-kalinligi", label: "Yalıtım Kalınlığı", shortLabel: "Yalıtım", href: "/kategori/araclar/dis-cephe-yalitim-kalinligi", iconKey: "insulation", tier: "A", norm: "TS 825" },
      { id: "imar-hesaplayici", label: "İmar Hesaplayıcı", shortLabel: "İmar", href: "/kategori/araclar/imar-hesaplayici", iconKey: "plot", tier: "B", norm: "3194" },
      { id: "beton-metraj-hesabi", label: "Beton Metrajı", shortLabel: "Beton M.", href: "/kategori/araclar/beton-metraj-hesabi", iconKey: "quantity", tier: "C", norm: "Metraj" },
      { id: "hafriyat-metraj-hesabi", label: "Hafriyat & Kamyon", shortLabel: "Hafriyat", href: "/kategori/araclar/hafriyat-metraj-hesabi", iconKey: "earthwork", tier: "C", norm: "Metraj" },
      { id: "pratik-donati-metraji", label: "Donatı Metrajı", shortLabel: "Demir M.", href: "/kategori/araclar/pratik-donati-metraji", iconKey: "weight", tier: "C", norm: "Pratik" },
      { id: "pratik-kalip-metraji", label: "Kalıp Metrajı", shortLabel: "Kalıp M.", href: "/kategori/araclar/pratik-kalip-metraji", iconKey: "frame", tier: "C", norm: "Pratik" },
      { id: "duvar-metraji-hesabi", label: "Duvar Metrajı", shortLabel: "Duvar M.", href: "/kategori/araclar/duvar-metraji-hesabi", iconKey: "brickwall", tier: "C", norm: "Metraj" },
      { id: "siva-boya-metraji", label: "Sıva & Boya Metrajı", shortLabel: "Sıva/Boya", href: "/kategori/araclar/siva-boya-metraji", iconKey: "paintroller", tier: "C", norm: "İnce İş" },
      { id: "cati-kaplama-metraji", label: "Çatı Kaplama Metrajı", shortLabel: "Çatı M.", href: "/kategori/araclar/cati-kaplama-metraji", iconKey: "home", tier: "C", norm: "Çatı" },
      { id: "seramik-fayans-metraji", label: "Seramik & Fayans", shortLabel: "Seramik", href: "/kategori/araclar/seramik-fayans-metraji", iconKey: "grid", tier: "C", norm: "Islak H." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Icon Resolver                                                      */
/* ------------------------------------------------------------------ */

function RibbonIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const cls = cn("h-5 w-5", className);
  switch (iconKey) {
    case "rebar": return <CircleGauge className={cls} />;
    case "column": return <Building2 className={cls} />;
    case "beam": return <Ruler className={cls} />;
    case "slab": return <PanelsTopLeft className={cls} />;
    case "cover": return <Shield className={cls} />;
    case "punching": return <Target className={cls} />;
    case "shear": return <Scissors className={cls} />;
    case "splice": return <LinkIcon className={cls} />;
    case "earthquake": return <Activity className={cls} />;
    case "check": return <ListChecks className={cls} />;
    case "period": return <Timer className={cls} />;
    case "drift": return <MoveHorizontal className={cls} />;
    case "soil": return <Compass className={cls} />;
    case "foundation": return <Box className={cls} />;
    case "retaining": return <Layers className={cls} />;
    case "slope": return <TrendingDown className={cls} />;
    case "steel": return <Wrench className={cls} />;
    case "bolt": return <Zap className={cls} />;
    case "timber": return <Trees className={cls} />;
    case "site": return <HardHat className={cls} />;
    case "insulation": return <Snowflake className={cls} />;
    case "plot": return <Map className={cls} />;
    case "quantity": return <Calculator className={cls} />;
    case "earthwork": return <Truck className={cls} />;
    case "weight": return <Weight className={cls} />;
    case "frame": return <Frame className={cls} />;
    case "brickwall": return <BrickWall className={cls} />;
    case "paintroller": return <PaintRoller className={cls} />;
    case "home": return <Home className={cls} />;
    case "grid": return <Grid className={cls} />;
    case "building2": return <Building2 className={cls} />;
    default: return <CircleGauge className={cls} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Tier Badge                                                         */
/* ------------------------------------------------------------------ */

function TierDot({ tier }: { tier: "A" | "B" | "C" }) {
  const colors = {
    A: "bg-emerald-400",
    B: "bg-purple-400",
    C: "bg-amber-400",
  };
  return (
    <span
      className={cn("absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background", colors[tier])}
      title={`Tier ${tier}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN RIBBON COMPONENT                                              */
/* ------------------------------------------------------------------ */

export function NavbarRibbon() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Determine if current page is a tool page and which discipline it belongs to
  const currentToolDiscipline = RIBBON_DISCIPLINES.find((d) =>
    d.tools.some((t) => pathname?.startsWith(t.href)),
  );

  const handleTabClick = useCallback((disciplineId: string) => {
    setActiveTab((prev) => (prev === disciplineId ? null : disciplineId));
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!activeTab) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        tabsRef.current &&
        !tabsRef.current.contains(target)
      ) {
        setActiveTab(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab]);

  // Close panel on route change
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      queueMicrotask(() => setActiveTab(null));
    }
  }, [pathname]);

  // Close panel on Escape
  useEffect(() => {
    if (!activeTab) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveTab(null);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeTab]);

  const activeDiscipline = RIBBON_DISCIPLINES.find((d) => d.id === activeTab);

  return (
    <div className="relative hidden xl:block">
      {/* ── Layer 2: Ribbon Discipline Tabs ── */}
      <div
        ref={tabsRef}
        className="border-b border-border/60 bg-background/60 backdrop-blur-xl dark:border-white/8 dark:bg-[#0a0a0a]/60"
      >
        <div className="mx-auto flex max-w-screen-2xl items-center gap-0 px-2 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
          {/* Discipline tabs */}
          <div className="flex items-center">
            {RIBBON_DISCIPLINES.map((discipline) => {
              const isActive = activeTab === discipline.id;
              const isCurrentRoute = currentToolDiscipline?.id === discipline.id;

              return (
                <button
                  key={discipline.id}
                  type="button"
                  onClick={() => handleTabClick(discipline.id)}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-200",
                    isActive
                      ? "text-foreground dark:text-white"
                      : isCurrentRoute
                        ? "text-foreground/80 dark:text-white/80"
                        : "text-muted-foreground/70 hover:text-foreground dark:text-zinc-500 dark:hover:text-zinc-200",
                  )}
                >
                  <RibbonIcon iconKey={discipline.iconKey} className="h-3.5 w-3.5" />
                  <span className="hidden 2xl:inline">{discipline.label}</span>
                  <span className="2xl:hidden">{discipline.shortLabel}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isActive && "rotate-180",
                    )}
                  />

                  {/* Active indicator line */}
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-[2px] rounded-full transition-all duration-300",
                      isActive
                        ? `bg-gradient-to-r ${discipline.accentFrom} ${discipline.accentTo}`
                        : isCurrentRoute
                          ? "bg-foreground/20 dark:bg-white/20"
                          : "bg-transparent group-hover:bg-foreground/10 dark:group-hover:bg-white/10",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Right side: tool count + link to full catalog */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 dark:text-zinc-600">
              30 Araç
            </span>
            <Link
              href="/kategori/araclar"
              className="text-[10px] font-bold uppercase tracking-wider text-purple-500 transition-colors hover:text-purple-400 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Tam Katalog →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Layer 3: Ribbon Tool Panel (Collapsible) ── */}
      <div
        ref={panelRef}
        className={cn(
          "absolute inset-x-0 top-full z-50 overflow-hidden border-b border-border/60 bg-background/95 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 ease-out dark:border-white/8 dark:bg-[#0c0c0c]/95",
          activeTab
            ? "pointer-events-auto max-h-[280px] opacity-100"
            : "pointer-events-none max-h-0 opacity-0",
        )}
      >
        {activeDiscipline && (
          <div className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
            {/* Panel header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-white",
                    activeDiscipline.accentFrom,
                    activeDiscipline.accentTo,
                  )}
                >
                  <RibbonIcon iconKey={activeDiscipline.iconKey} className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-foreground dark:text-white">
                  {activeDiscipline.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-white/8 dark:text-zinc-400">
                  {activeDiscipline.tools.length} araç
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-zinc-500 dark:hover:bg-white/8 dark:hover:text-white"
              >
                Paneli Kapat ▲
              </button>
            </div>

            {/* Tool grid */}
            <div
              className={cn(
                "grid gap-2",
                activeDiscipline.tools.length <= 4
                  ? "grid-cols-4"
                  : activeDiscipline.tools.length <= 8
                    ? "grid-cols-4 xl:grid-cols-8"
                    : "grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8",
              )}
            >
              {activeDiscipline.tools.map((tool) => {
                const isCurrentTool = pathname?.startsWith(tool.href);

                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    title={`${tool.label}\n${tool.norm} • Tier ${tool.tier}`}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-xl px-2 py-3 transition-all duration-200",
                      isCurrentTool
                        ? "bg-gradient-to-b from-purple-500/15 to-indigo-500/10 ring-1 ring-purple-500/30 dark:from-purple-500/20 dark:to-indigo-500/15 dark:ring-purple-500/40"
                        : "hover:bg-muted/80 dark:hover:bg-white/5",
                    )}
                  >
                    {/* Tool icon with tier dot */}
                    <div className="relative">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
                          isCurrentTool
                            ? "border-purple-500/40 bg-purple-500/15 text-purple-500 dark:text-purple-400"
                            : "border-border/80 bg-card/80 text-muted-foreground group-hover:border-purple-500/30 group-hover:bg-purple-500/10 group-hover:text-purple-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:group-hover:text-purple-400",
                        )}
                      >
                        <RibbonIcon iconKey={tool.iconKey} className="h-5 w-5" />
                      </div>
                      <TierDot tier={tool.tier} />
                    </div>

                    {/* Tool label */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-center text-[10px] font-bold leading-tight transition-colors",
                          isCurrentTool
                            ? "text-foreground dark:text-white"
                            : "text-muted-foreground group-hover:text-foreground dark:text-zinc-500 dark:group-hover:text-zinc-200",
                        )}
                      >
                        {tool.shortLabel}
                      </span>
                      <span className="text-center text-[9px] font-medium text-muted-foreground/60 dark:text-zinc-600">
                        {tool.norm}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
