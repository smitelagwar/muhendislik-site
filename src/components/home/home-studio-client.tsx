"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { HomeNavbar } from "@/components/home/home-navbar";
import { HomeHeroSection } from "@/components/home/home-hero-section";
import { HomeCalculateSection } from "@/components/home/home-calculate-section";
import { HomeLearnSection } from "@/components/home/home-learn-section";
import { HomeApplySection } from "@/components/home/home-apply-section";
import { HomeFooter } from "@/components/home/home-footer";
import type { HologramAtmosphere, HologramSubject } from "@/lib/home/hologram-engine";

const ATMOSPHERE_ORDER: HologramAtmosphere[] = ["obsidian", "crimson", "alabaster"];

export function HomeStudioClient() {
  // Sayfa açılışında varsayılan olarak Filozof ve Kızıl Kil atmosferi gösterilir
  const [subject, setSubject] = useState<HologramSubject>("bust");
  const [atmosphere, setAtmosphere] = useState<HologramAtmosphere>("crimson");
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  // Opsiyonel URL parametre desteği (?subject=building|mosque|bust & ?atmosphere=obsidian|crimson|alabaster)
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const paramSub = params.get("subject");
      if (paramSub === "building" || paramSub === "mosque" || paramSub === "bust") {
        setSubject(paramSub);
      }
      const paramAtm = params.get("atmosphere");
      if (paramAtm === "obsidian" || paramAtm === "crimson" || paramAtm === "alabaster") {
        setAtmosphere(paramAtm);
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  // Aktif atmosferi yalnızca ana sayfadayken kök belgeye yansıt (overscroll uyumu için)
  useEffect(() => {
    document.documentElement.dataset.homeAtmosphere = atmosphere;
    return () => {
      delete document.documentElement.dataset.homeAtmosphere;
    };
  }, [atmosphere]);

  // Hero dışına kaydırıldığında kompakt atmosfer ve yukarı dönüş çubuğunu göster
  useEffect(() => {
    const onScroll = () => {
      setScrolledPastHero(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Klavye kısayolları: 1/2/3 hologram modeli değiştirir, T atmosferi döndürür
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isTyping || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.getElementById("command-palette-dialog")) return;

      if (e.key === "1") setSubject("building");
      else if (e.key === "2") setSubject("bust");
      else if (e.key === "3") setSubject("mosque");
      else if (e.key.toLowerCase() === "t") {
        setAtmosphere((prev) => {
          const nextIdx = (ATMOSPHERE_ORDER.indexOf(prev) + 1) % ATMOSPHERE_ORDER.length;
          return ATMOSPHERE_ORDER[nextIdx];
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOpenSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent("open-command-palette"));
  }, []);

  return (
    <div
      data-home-atmosphere={atmosphere}
      className="hp-root min-h-screen transition-colors duration-500"
    >
      <HomeNavbar onOpenSearch={handleOpenSearch} atmosphere={atmosphere} />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <HomeHeroSection
          subject={subject}
          atmosphere={atmosphere}
          onSubjectChange={setSubject}
          onAtmosphereChange={setAtmosphere}
          onOpenSearch={handleOpenSearch}
        />

        <HomeCalculateSection />

        <HomeLearnSection />

        <HomeApplySection
          onInspectInHologram={(nextSubject) => {
            setSubject(nextSubject);
          }}
        />
      </main>

      <HomeFooter atmosphere={atmosphere} onAtmosphereChange={setAtmosphere} />

      {/* Hero sonrası kompakt kayan atmosfer ve hologram dönüş çubuğu (masaüstünde tam bar, mobilde metni kapatmayan ince yukarı düğmesi) */}
      {scrolledPastHero && (
        <>
          <a
            href="#hero"
            aria-label="Başa dön"
            className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hp-border-strong)] bg-[var(--hp-bg-dock)] text-[var(--hp-ink-primary)] shadow-xl backdrop-blur-md transition-colors hover:border-[var(--hp-accent-border)] hover:text-[var(--hp-accent)] md:hidden"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </a>

          <div
            role="region"
            aria-label="Sayfa atmosferi ve hızlı dönüş"
            className="fixed bottom-4 right-4 z-40 hidden items-center gap-1.5 rounded-lg border border-[var(--hp-border-strong)] bg-[var(--hp-bg-dock)] p-1.5 shadow-2xl backdrop-blur-md md:flex"
          >
            <button
              type="button"
              onClick={() => setAtmosphere("obsidian")}
              aria-label="Obsidyen tema"
              aria-pressed={atmosphere === "obsidian"}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                atmosphere === "obsidian"
                  ? "bg-[#2B2E36] text-[#FAF7F2]"
                  : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-sm border border-[#F2EFE9]/35 bg-[#0B0C0E]" />
              <span>Obsidyen</span>
            </button>
            <button
              type="button"
              onClick={() => setAtmosphere("crimson")}
              aria-label="Kızıl Kil tema"
              aria-pressed={atmosphere === "crimson"}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                atmosphere === "crimson"
                  ? "bg-[#8F1B0E] text-[#FFF8EF]"
                  : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-sm border border-[#F2EFE9]/35 bg-[#A42010]" />
              <span>Kızıl Kil</span>
            </button>
            <button
              type="button"
              onClick={() => setAtmosphere("alabaster")}
              aria-label="Beyaz tema"
              aria-pressed={atmosphere === "alabaster"}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                atmosphere === "alabaster"
                  ? "bg-[#14161A] text-[#FAF7F2]"
                  : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-sm border border-[#14161A]/35 bg-[#F5F2EB]" />
              <span>Beyaz</span>
            </button>
            <span aria-hidden="true" className="h-4 w-px bg-[var(--hp-border-subtle)]" />
            <a
              href="#hero"
              aria-label="3B Hologram alanına dön"
              className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--hp-ink-secondary)] transition-colors hover:bg-[var(--hp-bg-surface-hover)] hover:text-[var(--hp-accent)]"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
