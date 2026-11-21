"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TECHNICAL_GUIDES } from "@/lib/home/home-studio-data";

type TopicFilter = "Tümü" | "TBDY" | "Zemin" | "Malzeme";

const TOPIC_OPTIONS: Array<{ id: TopicFilter; label: string }> = [
  { id: "Tümü", label: "Tümü" },
  { id: "TBDY", label: "TBDY" },
  { id: "Zemin", label: "Zemin & Saha" },
  { id: "Malzeme", label: "Malzeme" },
];

export function HomeLearnSection() {
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("Tümü");

  const visibleGuides =
    topicFilter === "Tümü"
      ? TECHNICAL_GUIDES
      : TECHNICAL_GUIDES.filter((g) => g.topic === topicFilter);

  const featuredGuide = visibleGuides[0] ?? TECHNICAL_GUIDES[0];
  const secondaryGuides = visibleGuides.slice(1);

  return (
    <section
      id="ogren"
      className="hp-studio-section-alt border-b border-[var(--hp-border-subtle)] py-14 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
        {/* Bölüm başlığı + konu filtresi */}
        <div className="flex flex-col justify-between gap-5 border-b border-[var(--hp-border-subtle)] pb-8 sm:gap-6 sm:pb-10 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-[var(--hp-accent)]" />
              <p className="font-mono text-xs font-medium text-[var(--hp-accent)]">02. Öğren</p>
            </div>
            <h2 className="hp-font-display mt-3 text-[clamp(1.75rem,3.4vw,3rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--hp-ink-primary)]">
              Yönetmelikten malzemeye, projeden saha pratiğine.
            </h2>
          </div>

          <div
            role="group"
            aria-label="Teknik içerik konuları"
            className="grid grid-cols-2 gap-1 rounded-lg border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] p-1 sm:flex sm:flex-wrap sm:items-center"
          >
            {TOPIC_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTopicFilter(opt.id)}
                aria-pressed={topicFilter === opt.id}
                className={`min-h-[38px] rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer sm:px-3.5 ${
                  topicFilter === opt.id
                    ? "bg-[var(--hp-accent)] text-[var(--hp-accent-ink)]"
                    : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Asimetrik editoryal ızgara */}
        <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-12 lg:items-stretch">
          {/* Öne çıkan rehber kartı (7 sütun) */}
          <article
            data-testid="home-lead-article"
            className="group flex flex-col overflow-hidden rounded-xl border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] lg:col-span-7 transition-colors duration-500"
          >
            <Link
              href={featuredGuide.href}
              className="relative block aspect-[16/9] w-full overflow-hidden bg-[var(--hp-bg-surface-2)]"
            >
              {featuredGuide.imageUrl ? (
                <Image
                  src={featuredGuide.imageUrl}
                  alt={featuredGuide.imageAlt ?? featuredGuide.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--hp-bg-surface-2)] p-8">
                  <span className="hp-font-display text-xl text-[var(--hp-ink-secondary)]">
                    {featuredGuide.categoryLabel}
                  </span>
                </div>
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(to top, var(--hp-card-fade) 0%, transparent 55%)",
                }}
              />
            </Link>

            <div className="flex flex-1 flex-col justify-between p-4 sm:p-6 lg:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--hp-ink-muted)]">
                  <span className="font-mono text-[var(--hp-accent)]">
                    {featuredGuide.categoryLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredGuide.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredGuide.readTime}</span>
                </div>

                <h3 className="hp-font-display mt-3 text-lg font-semibold leading-snug text-[var(--hp-ink-primary)] sm:text-2xl">
                  <Link
                    href={featuredGuide.href}
                    className="transition-colors hover:text-[var(--hp-accent)]"
                  >
                    {featuredGuide.title}
                  </Link>
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-[var(--hp-ink-secondary)]">
                  {featuredGuide.excerpt}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hp-border-subtle)] pt-5">
                <span className="text-xs text-[var(--hp-ink-muted)]">
                  {featuredGuide.checklistCount} maddelik saha kontrol listesi içerir
                </span>
                <Link
                  href={featuredGuide.href}
                  className="inline-flex min-h-[38px] items-center gap-1.5 text-sm font-semibold text-[var(--hp-accent)] transition-colors hover:text-[var(--hp-accent-hover)] whitespace-nowrap shrink-0"
                >
                  <span>Rehberi oku</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>

          {/* İkincil rehberler yığını (5 sütun) */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {secondaryGuides.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center rounded-xl border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] p-6 sm:p-8">
                <p className="hp-font-display text-lg font-medium text-[var(--hp-ink-primary)]">
                  Bu konuda öne çıkan rehber solda görüntüleniyor.
                </p>
                <p className="mt-2 text-sm text-[var(--hp-ink-secondary)]">
                  Diğer disiplinlere ait saha rehberlerini görmek için konu filtresini Tümü olarak
                  değiştirebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => setTopicFilter("Tümü")}
                  className="mt-5 min-h-[40px] self-start rounded-md border border-[var(--hp-border-strong)] px-4 py-2 text-xs font-medium text-[var(--hp-ink-primary)] hover:border-[var(--hp-accent-border)] cursor-pointer"
                >
                  Tüm rehberleri göster
                </button>
              </div>
            ) : (
              secondaryGuides.map((guide) => (
                <article
                  key={guide.id}
                  data-testid="home-supporting-article"
                  className="group flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] transition-colors duration-500"
                >
                  {guide.imageUrl && (
                    <Link
                      href={guide.href}
                      className="relative block h-44 w-full overflow-hidden bg-[var(--hp-bg-surface-2)]"
                    >
                      <Image
                        src={guide.imageUrl}
                        alt={guide.imageAlt ?? guide.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top, var(--hp-card-fade) 0%, transparent 55%)",
                        }}
                      />
                    </Link>
                  )}

                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--hp-ink-muted)]">
                        <span className="font-mono text-[var(--hp-accent)]">
                          {guide.categoryLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{guide.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{guide.readTime}</span>
                      </div>

                      <h3 className="hp-font-display mt-2.5 text-base font-semibold leading-snug text-[var(--hp-ink-primary)] sm:text-lg">
                        <Link
                          href={guide.href}
                          className="transition-colors hover:text-[var(--hp-accent)]"
                        >
                          {guide.title}
                        </Link>
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-[var(--hp-ink-secondary)]">
                        {guide.excerpt}
                      </p>
                    </div>

                    <div className="mt-5 flex justify-end border-t border-[var(--hp-border-subtle)] pt-4">
                      <Link
                        href={guide.href}
                        className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-[var(--hp-ink-primary)] transition-colors hover:text-[var(--hp-accent)] whitespace-nowrap shrink-0"
                      >
                        <span>İncele</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
