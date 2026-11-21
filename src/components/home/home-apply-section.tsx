"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CONSTRUCTION_PHASES } from "@/lib/home/home-studio-data";
import type { HologramSubject } from "@/lib/home/hologram-engine";

interface HomeApplySectionProps {
  onInspectInHologram: (subject: HologramSubject) => void;
}

export function HomeApplySection({ onInspectInHologram }: HomeApplySectionProps) {
  const [selectedSlug, setSelectedSlug] = useState(CONSTRUCTION_PHASES[2].slug);

  const activePhase =
    CONSTRUCTION_PHASES.find((p) => p.slug === selectedSlug) ?? CONSTRUCTION_PHASES[0];
  const activeIndex = CONSTRUCTION_PHASES.findIndex((p) => p.slug === activePhase.slug);

  return (
    <section
      id="uygula"
      data-testid="home-phase-path"
      className="hp-studio-section border-b border-[var(--hp-border-subtle)] py-14 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
        {/* Bölüm başlığı */}
        <div className="grid gap-5 border-b border-[var(--hp-border-subtle)] pb-8 sm:gap-6 sm:pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-[var(--hp-accent)]" />
              <p className="font-mono text-xs font-medium text-[var(--hp-accent)]">03. Uygula</p>
            </div>
            <h2 className="hp-font-display mt-3 text-[clamp(1.75rem,3.4vw,3rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--hp-ink-primary)]">
              Aynı yapının, projeden teslime altı hâli.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[var(--hp-ink-secondary)] lg:col-span-5">
            Tasarım kararını, saha uygulamasını ve teslim sürecini aynı yapı geometrisi üzerinden
            kesintisiz izleyin. Bir faz seçerek teslimatları ve şantiye kontrol kriterlerini
            inceleyin.
          </p>
        </div>

        {/* 6 Faz Seçici + Aktif Teknik Dosya */}
        <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-12 lg:items-start">
          {/* Sol 7 sütun: Mobilde kompakt 2x3 seçici, masaüstünde tam 6 faz ızgarası */}
          <ol className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:col-span-7">
            {CONSTRUCTION_PHASES.map((phase) => {
              const isSelected = phase.slug === activePhase.slug;
              return (
                <li key={phase.slug}>
                  <button
                    type="button"
                    data-testid="home-phase-link"
                    onClick={() => setSelectedSlug(phase.slug)}
                    aria-pressed={isSelected}
                    className={`flex h-full w-full flex-col justify-between rounded-xl border p-3.5 text-left transition-colors cursor-pointer sm:p-5 lg:p-6 ${
                      isSelected
                        ? "border-[var(--hp-accent-border)] bg-[var(--hp-bg-surface-hover)]"
                        : "border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] hover:border-[var(--hp-border-strong)] hover:bg-[var(--hp-bg-surface-hover)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-xs font-medium ${
                            isSelected ? "text-[var(--hp-accent)]" : "text-[var(--hp-ink-muted)]"
                          }`}
                        >
                          {phase.number}
                        </span>
                        <span className="hidden font-mono text-[11px] text-[var(--hp-ink-muted)] sm:inline">
                          {phase.durationShare}
                        </span>
                      </div>
                      <h3 className="hp-font-display mt-2 text-sm font-semibold text-[var(--hp-ink-primary)] sm:mt-3 sm:text-lg">
                        {phase.title}
                      </h3>
                      <p className="mt-2 hidden text-xs leading-relaxed text-[var(--hp-ink-secondary)] sm:block">
                        {phase.summary}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[var(--hp-ink-primary)] sm:mt-5 sm:text-xs">
                      <span>{isSelected ? "Seçili faz" : "Fazı incele"}</span>
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isSelected
                            ? "translate-x-0.5 text-[var(--hp-accent)]"
                            : "text-[var(--hp-ink-muted)]"
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Sağ 5 sütun: Seçili Faz Teknik Dosya Paneli */}
          <aside
            data-testid="phase-detail-panel"
            aria-live="polite"
            className="rounded-xl border border-[var(--hp-border-strong)] bg-[var(--hp-bg-surface)] p-4 sm:p-6 lg:col-span-5 lg:p-8 transition-colors duration-500"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hp-border-subtle)] pb-4">
              <div className="flex items-center gap-2 text-xs text-[var(--hp-ink-secondary)]">
                <span className="font-mono text-[var(--hp-accent)]">
                  Faz {activePhase.number} / 06
                </span>
                <span aria-hidden="true">·</span>
                <span>{activePhase.durationShare}</span>
              </div>
              <span className="hp-tabular-nums font-mono text-xs text-[var(--hp-ink-muted)]">
                İlerleme %{Math.round(((activeIndex + 1) / CONSTRUCTION_PHASES.length) * 100)}
              </span>
            </div>

            {/* Yapısal ilerleme göstergesi */}
            <div className="mt-5 grid grid-cols-6 gap-1.5" aria-hidden="true">
              {CONSTRUCTION_PHASES.map((p, idx) => (
                <div
                  key={p.slug}
                  className={`h-1.5 rounded-sm transition-colors ${
                    idx <= activeIndex ? "bg-[var(--hp-accent)]" : "bg-[var(--hp-bg-surface-2)]"
                  }`}
                />
              ))}
            </div>

            <h3 className="hp-font-display mt-5 text-xl font-semibold text-[var(--hp-ink-primary)] sm:mt-6 sm:text-2xl">
              {activePhase.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--hp-ink-secondary)]">
              {activePhase.elevationNote}
            </p>

            {/* Dayanak standartlar */}
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--hp-ink-secondary)]">
              <span className="font-mono text-[var(--hp-accent)]">Dayanak:</span>
              {activePhase.governingStandards.map((std, i) => (
                <span key={std} className="inline-flex items-center gap-2">
                  <span>{std}</span>
                  {i < activePhase.governingStandards.length - 1 && (
                    <span aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </div>

            {/* Faz çıktıları */}
            <div className="mt-6 border-t border-[var(--hp-border-subtle)] pt-5 sm:mt-7">
              <h4 className="font-mono text-xs text-[var(--hp-ink-primary)]">
                Faz Çıktıları ve Teslimatlar
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[var(--hp-ink-secondary)]">
                {activePhase.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[var(--hp-accent)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Saha kabul kontrolleri */}
            <div className="mt-6 border-t border-[var(--hp-border-subtle)] pt-5">
              <h4 className="font-mono text-xs text-[var(--hp-ink-primary)]">
                Kritik Saha Kabul Kontrolleri
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[var(--hp-ink-secondary)]">
                {activePhase.fieldControls.map((ctrl) => (
                  <li key={ctrl} className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[var(--hp-ink-muted)]"
                    />
                    <span>{ctrl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Aksiyonlar: Kanonik faz rehberi + taşıyıcı yapı hologramına dönüş */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hp-border-subtle)] pt-5 sm:mt-7">
              <Link
                href={activePhase.href}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[var(--hp-accent-border)] bg-[var(--hp-accent-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--hp-accent)] transition-colors hover:bg-[var(--hp-accent)] hover:text-[var(--hp-accent-ink)]"
              >
                <span>Faz rehberini aç</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>

              <a
                href="#hero"
                onClick={() => onInspectInHologram("building")}
                className="inline-flex min-h-[38px] items-center gap-1.5 text-xs font-medium text-[var(--hp-ink-secondary)] transition-colors hover:text-[var(--hp-accent)]"
              >
                <span>Taşıyıcı yapı hologramına dön</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
