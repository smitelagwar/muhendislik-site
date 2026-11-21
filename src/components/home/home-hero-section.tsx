"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search, Sparkles } from "lucide-react";
import { HologramCanvas } from "@/components/home/hologram-canvas";
import {
  DEFAULT_SCATTER_BOOST,
  type HologramAtmosphere,
  type HologramSubject,
} from "@/lib/home/hologram-engine";

interface HomeHeroSectionProps {
  subject: HologramSubject;
  atmosphere: HologramAtmosphere;
  onSubjectChange: (s: HologramSubject) => void;
  onAtmosphereChange: (a: HologramAtmosphere) => void;
  onOpenSearch: () => void;
}

const SUBJECT_OPTIONS: Array<{ id: HologramSubject; label: string; shortLabel: string }> = [
  { id: "building", label: "Yapı", shortLabel: "Yapı" },
  { id: "bust", label: "Filozof", shortLabel: "Filozof" },
  { id: "mosque", label: "Sultanahmet Camii", shortLabel: "Sultanahmet" },
];

const THEME_SWATCHES: Array<{
  id: HologramAtmosphere;
  ariaLabel: string;
  swatchBg: string;
  swatchBorder: string;
}> = [
  {
    id: "obsidian",
    ariaLabel: "Koyu tema",
    swatchBg: "linear-gradient(135deg, #242830 0%, #0B0C0E 100%)",
    swatchBorder: "rgba(242, 239, 233, 0.38)",
  },
  {
    id: "crimson",
    ariaLabel: "Kızıl tema",
    swatchBg: "linear-gradient(135deg, #C83214 0%, #6B0F04 100%)",
    swatchBorder: "rgba(255, 230, 210, 0.45)",
  },
  {
    id: "alabaster",
    ariaLabel: "Açık tema",
    swatchBg: "linear-gradient(135deg, #FFFFFF 0%, #E7E3D9 100%)",
    swatchBorder: "rgba(15, 23, 42, 0.35)",
  },
];

export function HomeHeroSection({
  subject,
  atmosphere,
  onSubjectChange,
  onAtmosphereChange,
  onOpenSearch,
}: HomeHeroSectionProps) {
  const heroContainerRef = useRef<HTMLElement | null>(null);
  const [dockExpanded, setDockExpanded] = useState(false);
  const [stageLightEnabled, setStageLightEnabled] = useState(true);

  return (
    <section
      id="hero"
      ref={heroContainerRef}
      data-testid="home-hero"
      data-stage-light={stageLightEnabled ? "on" : "off"}
      aria-label="Mühendislik hologram tanıtım alanı"
      className="relative isolate flex h-[min(calc(100svh-124px),600px)] min-h-[470px] w-full flex-col overflow-hidden border-b border-[var(--hp-border-subtle)] bg-[var(--hp-bg-page)] transition-colors duration-500 sm:h-[620px] lg:h-auto lg:min-h-[calc(100vh-69px)]"
    >
      <h1 className="sr-only">İnşa Blog — Mühendislik ve Mimarlık Çalışma Alanı</h1>

      {/* Temel tema derinlik gradyanı */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ background: "var(--hp-hero-radial)" }}
      />

      {/* Açılıp kapatılabilir müze sahne ışığı ve mimari pavyon arka planı */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          stageLightEnabled ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="hp-architectural-grid-hero absolute inset-0 opacity-90" />

        {/* Büstün üzerine inen müze spot ışığı konisi */}
        <div className="absolute inset-0" style={{ background: "var(--hp-hero-stage-beam)" }} />

        {/* Omuz ve gövde arkasında heykelsi ışık halesi */}
        <div className="absolute inset-0" style={{ background: "var(--hp-hero-stage-rim)" }} />

        {/* Alt kaide yansıması */}
        <div className="absolute inset-0" style={{ background: "var(--hp-hero-stage-floor)" }} />

        {/* Eşmerkezli mimari pavyon halkaları (mobilde orantılı ölçek) */}
        <div
          className="absolute left-1/2 top-[58%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border sm:top-[56%] sm:h-[680px] sm:w-[680px]"
          style={{ borderColor: "var(--hp-hero-stage-ring)" }}
        />
        <div
          className="absolute left-1/2 top-[56%] hidden h-[940px] w-[940px] -translate-x-1/2 -translate-y-1/2 rounded-full border sm:block"
          style={{ borderColor: "var(--hp-hero-stage-ring)", opacity: 0.55 }}
        />

        {/* Müze köşe vinyeti */}
        <div className="absolute inset-0" style={{ background: "var(--hp-hero-vignette)" }} />
      </div>

      {/* Temiz galeri sahnesi: üstte komut arama çubuğu, tam sahnede WebGL hologram */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 pt-4 sm:px-6 sm:pt-5 lg:min-h-[calc(100vh-69px)] lg:px-12 lg:pt-7 lg:pb-0 lg:pointer-events-none">
        {/* Filozofun tepesinde hizalı mimari arama çubuğu */}
        <div className="relative z-30 mx-auto w-full max-w-[468px] lg:pointer-events-auto">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="KAKS, maliyet, donatı veya TBDY 2018 ara"
            aria-haspopup="dialog"
            aria-controls="command-palette-dialog"
            className="group relative flex min-h-[44px] w-full items-center justify-between gap-2.5 rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-bg-dock)] px-3 py-2 text-left transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--hp-accent-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hp-accent)] cursor-pointer shadow-[0_14px_38px_-14px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,244,230,0.14)] sm:gap-3"
          >
            <span className="inline-flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--hp-accent-border)]/45 bg-[var(--hp-accent-soft)] text-[var(--hp-accent)] transition-colors group-hover:border-[var(--hp-accent-border)] group-hover:bg-[var(--hp-accent)] group-hover:text-[var(--hp-accent-ink)]">
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="truncate text-[12px] font-medium tracking-[-0.01em] text-[var(--hp-ink-secondary)] transition-colors group-hover:text-[var(--hp-ink-primary)] sm:text-[13px]">
                <span className="sm:hidden">KAKS, maliyet, donatı ara...</span>
                <span className="hidden sm:inline">KAKS, maliyet, donatı veya TBDY 2018 ara...</span>
              </span>
            </span>

            <span className="hidden shrink-0 items-center gap-1 pr-0.5 sm:inline-flex">
              <kbd className="rounded border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-dock-inner)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--hp-ink-muted)] transition-colors group-hover:border-[var(--hp-accent-border)]/50 group-hover:text-[var(--hp-ink-primary)]">
                Ctrl
              </kbd>
              <kbd className="rounded border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-dock-inner)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--hp-ink-muted)] transition-colors group-hover:border-[var(--hp-accent-border)]/50 group-hover:text-[var(--hp-ink-primary)]">
                K
              </kbd>
            </span>
          </button>
        </div>

        {/* Tek WebGL Hologram Sahnesi: hem mobil hem masaüstünde tüm sahneyi doldurur ve alt kenara oturur */}
        <div
          data-testid="home-hero-visual"
          className="relative -mx-4 mt-1 flex-1 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:pointer-events-auto lg:absolute lg:inset-0 lg:z-10 lg:m-0 lg:h-full lg:w-full"
        >
          <div className="absolute inset-0">
            <HologramCanvas
              subject={subject}
              atmosphere={atmosphere}
              scatterBoost={DEFAULT_SCATTER_BOOST}
              containerRef={heroContainerRef}
            />
          </div>
        </div>
      </div>

      {/* Alt-orta açılır/kapanır Hologram Kontrol Çubuğu (Mobil + Masaüstü uyumlu) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex flex-col items-center px-3 sm:bottom-4 sm:px-4">
        {dockExpanded && (
          <div
            role="region"
            aria-label="Hologram kontrol çubuğu"
            className="pointer-events-auto mb-2 flex w-full max-w-[360px] flex-col gap-2.5 rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-bg-dock)] p-2.5 shadow-2xl backdrop-blur-md lg:mb-2 lg:w-auto lg:max-w-none lg:flex-row lg:flex-wrap lg:items-center lg:justify-center lg:gap-3 lg:rounded-lg lg:px-3.5 lg:py-2"
          >
            {/* Model seçici: Yapı · Filozof · Sultanahmet Camii */}
            <div
              role="group"
              aria-label="Hologram modeli"
              className="flex items-center gap-1 rounded-md bg-[var(--hp-bg-dock-inner)] p-1"
            >
              {SUBJECT_OPTIONS.map((opt) => {
                const active = subject === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSubjectChange(opt.id)}
                    aria-pressed={active}
                    className={`min-h-[38px] flex-1 rounded px-2 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer lg:min-h-0 lg:flex-none lg:px-2.5 lg:py-1 lg:text-xs ${
                      active
                        ? "bg-[var(--hp-accent)] text-[var(--hp-accent-ink)]"
                        : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                    }`}
                  >
                    <span className="sm:hidden">{opt.shortLabel}</span>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--hp-border-subtle)] lg:block" />

            <div className="flex items-center justify-between gap-2 lg:contents">
              {/* 3 renkli tema paleti */}
              <div
                role="group"
                aria-label="Tema renk paleti"
                className="flex items-center gap-1 rounded-md bg-[var(--hp-bg-dock-inner)] px-1.5 py-1 lg:gap-2 lg:px-2.5 lg:py-1.5"
              >
                {THEME_SWATCHES.map((swatch) => {
                  const active = atmosphere === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => onAtmosphereChange(swatch.id)}
                      aria-label={swatch.ariaLabel}
                      aria-pressed={active}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md cursor-pointer lg:h-auto lg:w-auto"
                    >
                      <span
                        className={`block h-5 w-5 rounded-full border transition-transform ${
                          active
                            ? "scale-110 ring-2 ring-[var(--hp-accent)] ring-offset-2 ring-offset-[var(--hp-bg-dock-inner)]"
                            : "opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{
                          background: swatch.swatchBg,
                          borderColor: swatch.swatchBorder,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--hp-border-subtle)] lg:block" />

              {/* Sahne ışığı anahtarı */}
              <button
                type="button"
                onClick={() => setStageLightEnabled((prev) => !prev)}
                aria-pressed={stageLightEnabled}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer lg:min-h-0 lg:px-2.5 lg:py-1 lg:text-xs ${
                  stageLightEnabled
                    ? "border-[var(--hp-accent-border)] bg-[var(--hp-accent-soft)] text-[var(--hp-ink-primary)]"
                    : "border-[var(--hp-border-subtle)] bg-[var(--hp-bg-dock-inner)] text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[var(--hp-accent)]" aria-hidden="true" />
                <span>Sahne ışığı</span>
                <span
                  aria-hidden="true"
                  className={`ml-0.5 inline-block h-1.5 w-1.5 rounded-full ${
                    stageLightEnabled ? "bg-[var(--hp-accent)]" : "bg-[var(--hp-ink-muted)]/45"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setDockExpanded((prev) => !prev)}
          aria-expanded={dockExpanded}
          data-testid="hologram-dock-toggle"
          className="pointer-events-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-dock)] px-3.5 py-1.5 text-[11px] font-medium text-[var(--hp-ink-secondary)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--hp-accent-border)] hover:text-[var(--hp-ink-primary)] cursor-pointer lg:min-h-0 lg:px-3 lg:py-1"
        >
          {dockExpanded ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hologram ayarlarını gizle</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hologram ayarlarını aç</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
