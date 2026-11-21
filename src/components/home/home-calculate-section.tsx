"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calculator, RotateCcw } from "lucide-react";
import {
  type BuildingUsage,
  calculateQuickQuantityTakeoff,
  formatTrNumber,
} from "@/lib/home/engineering-calc";
import { ENGINEERING_TOOLS, TECHNICAL_STANDARDS } from "@/lib/home/home-studio-data";

const DEFAULT_TAKEOFF = {
  floorAreaM2: 450,
  normalFloors: 5,
  basementFloors: 1,
  usage: "konut" as BuildingUsage,
};

export function HomeCalculateSection() {
  const [floorAreaM2, setFloorAreaM2] = useState(DEFAULT_TAKEOFF.floorAreaM2);
  const [normalFloors, setNormalFloors] = useState(DEFAULT_TAKEOFF.normalFloors);
  const [basementFloors, setBasementFloors] = useState(DEFAULT_TAKEOFF.basementFloors);
  const [usage, setUsage] = useState<BuildingUsage>(DEFAULT_TAKEOFF.usage);

  const result = useMemo(
    () =>
      calculateQuickQuantityTakeoff({
        floorAreaM2,
        normalFloors,
        basementFloors,
        usage,
      }),
    [floorAreaM2, normalFloors, basementFloors, usage],
  );

  const resetDefaults = () => {
    setFloorAreaM2(DEFAULT_TAKEOFF.floorAreaM2);
    setNormalFloors(DEFAULT_TAKEOFF.normalFloors);
    setBasementFloors(DEFAULT_TAKEOFF.basementFloors);
    setUsage(DEFAULT_TAKEOFF.usage);
  };

  return (
    <section
      id="hesapla"
      data-testid="home-resource-grid"
      className="hp-studio-section border-b border-[var(--hp-border-subtle)] py-14 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
        {/* Bölüm başlığı */}
        <div className="grid gap-5 border-b border-[var(--hp-border-subtle)] pb-8 sm:gap-6 sm:pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-[var(--hp-accent)]" />
              <p className="font-mono text-xs font-medium text-[var(--hp-accent)]">01. Hesapla</p>
            </div>
            <h2 className="hp-font-display mt-3 text-[clamp(1.75rem,3.4vw,3rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--hp-ink-primary)]">
              Projeyi varsayımdan ölçülebilir karara taşıyın.
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-[var(--hp-ink-secondary)] lg:col-span-5">
            Gerçek bir ön metraj çıktısını anlık parametrelerle test edin; imar, maliyet ve taşıyıcı
            sistem hesap araçlarına ihtiyacınız olan yönetmelik bağlamıyla geçin.
          </p>
        </div>

        {/* Asimetrik 12 sütunlu ızgara: Canlı Hızlı Metraj + İkincil Araçlar */}
        <div id="araclar" className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-12 lg:items-stretch">
          {/* Sol 7 sütun: Canlı Etkileşimli Hızlı Metraj Hesaplayıcı */}
          <article
            data-testid="home-featured-calculation"
            className="flex flex-col justify-between rounded-xl border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] p-4 sm:p-6 lg:col-span-7 lg:p-8 transition-colors duration-500"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hp-border-subtle)] pb-4 sm:pb-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--hp-ink-secondary)]">
                  <span className="font-mono text-[var(--hp-accent)]">Örnek ön metraj</span>
                  <span aria-hidden="true">·</span>
                  <span>Canlı hesap motoru</span>
                  <span aria-hidden="true" className="hidden sm:inline">
                    ·
                  </span>
                  <span className="hidden sm:inline">2026 birim verisi</span>
                </div>
                <button
                  type="button"
                  onClick={resetDefaults}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded px-2 text-xs font-medium text-[var(--hp-ink-secondary)] transition-colors hover:text-[var(--hp-ink-primary)] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Varsayılana dön</span>
                </button>
              </div>

              <div className="mt-5 sm:mt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="hp-font-display text-xl font-semibold text-[var(--hp-ink-primary)] sm:text-2xl">
                    Hızlı Metraj Hesaplayıcı
                  </h3>
                  <Link
                    href="/hesaplamalar/hizli-metraj"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--hp-accent)] transition-colors hover:text-[var(--hp-accent-hover)]"
                  >
                    <span>Detaylı ekrana geç</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--hp-ink-secondary)]">
                  Tipik kat alanı, kat adedi ve yapı kullanım tipinden yaklaşık beton, donatı, kalıp
                  miktarlarını ve kaba/toplam maliyet bandını anlık hesaplayın.
                </p>
              </div>

              {/* Etkileşimli kontroller */}
              <div className="mt-6 grid gap-5 sm:mt-7 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="takeoff-area" className="font-medium text-[var(--hp-ink-primary)]">
                      Tipik kat alanı
                    </label>
                    <span className="hp-tabular-nums font-mono font-medium text-[var(--hp-accent)]">
                      {formatTrNumber(floorAreaM2)} m²
                    </span>
                  </div>
                  <input
                    id="takeoff-area"
                    type="range"
                    min={150}
                    max={1500}
                    step={25}
                    value={floorAreaM2}
                    onChange={(e) => setFloorAreaM2(Number(e.target.value))}
                    className="hp-range-input mt-3 w-full accent-[var(--hp-accent)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="takeoff-normal-floors"
                      className="font-medium text-[var(--hp-ink-primary)]"
                    >
                      Normal kat adedi
                    </label>
                    <span className="hp-tabular-nums font-mono font-medium text-[var(--hp-accent)]">
                      {normalFloors} kat
                    </span>
                  </div>
                  <input
                    id="takeoff-normal-floors"
                    type="range"
                    min={1}
                    max={16}
                    step={1}
                    value={normalFloors}
                    onChange={(e) => setNormalFloors(Number(e.target.value))}
                    className="hp-range-input mt-3 w-full accent-[var(--hp-accent)] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="takeoff-basement"
                      className="font-medium text-[var(--hp-ink-primary)]"
                    >
                      Bodrum kat adedi
                    </label>
                    <span className="hp-tabular-nums font-mono font-medium text-[var(--hp-accent)]">
                      {basementFloors} bodrum
                    </span>
                  </div>
                  <input
                    id="takeoff-basement"
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={basementFloors}
                    onChange={(e) => setBasementFloors(Number(e.target.value))}
                    className="hp-range-input mt-3 w-full accent-[var(--hp-accent)] cursor-pointer"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-[var(--hp-ink-primary)]">
                    Yapı kullanım sınıfı
                  </span>
                  <div
                    role="group"
                    aria-label="Yapı kullanım sınıfı"
                    className="mt-2 grid grid-cols-3 gap-1 rounded-md border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface-2)] p-1"
                  >
                    {(
                      [
                        { id: "konut", label: "Konut" },
                        { id: "ticari", label: "Ticari" },
                        { id: "karma", label: "Karma" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setUsage(opt.id)}
                        aria-pressed={usage === opt.id}
                        className={`min-h-[36px] rounded py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          usage === opt.id
                            ? "bg-[var(--hp-accent)] text-[var(--hp-accent-ink)]"
                            : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canlı hesaplanan metraj ızgarası */}
              <div
                data-testid="metraj-results"
                className="mt-7 grid grid-cols-2 gap-4 border-y border-[var(--hp-border-subtle)] py-5 sm:mt-8 sm:grid-cols-4 sm:py-6"
              >
                <div>
                  <div className="text-xs text-[var(--hp-ink-muted)]">Toplam alan</div>
                  <div className="hp-tabular-nums mt-1.5 font-mono text-lg font-medium text-[var(--hp-ink-primary)] sm:text-2xl">
                    {formatTrNumber(result.totalAreaM2)}{" "}
                    <span className="text-xs text-[var(--hp-ink-muted)] sm:text-sm">m²</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--hp-ink-muted)]">Beton hacmi</div>
                  <div className="hp-tabular-nums mt-1.5 font-mono text-lg font-medium text-[var(--hp-ink-primary)] sm:text-2xl">
                    {formatTrNumber(result.concreteM3)}{" "}
                    <span className="text-xs text-[var(--hp-ink-muted)] sm:text-sm">m³</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--hp-ink-muted)]">Donatı tonajı</div>
                  <div className="hp-tabular-nums mt-1.5 font-mono text-lg font-medium text-[var(--hp-accent)] sm:text-2xl">
                    {formatTrNumber(result.rebarTons)}{" "}
                    <span className="text-xs text-[var(--hp-ink-muted)] sm:text-sm">ton</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--hp-ink-muted)]">Kalıp alanı</div>
                  <div className="hp-tabular-nums mt-1.5 font-mono text-lg font-medium text-[var(--hp-ink-primary)] sm:text-2xl">
                    {formatTrNumber(result.formworkM2)}{" "}
                    <span className="text-xs text-[var(--hp-ink-muted)] sm:text-sm">m²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alt maliyet özet şeridi */}
            <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="text-xs text-[var(--hp-ink-secondary)]">
                <div>
                  Kaba yapı bandı:{" "}
                  <strong className="hp-tabular-nums font-mono text-[var(--hp-ink-primary)]">
                    {formatTrNumber(result.structuralCostMinM, 1)} –{" "}
                    {formatTrNumber(result.structuralCostMaxM, 1)} M TL
                  </strong>
                </div>
                <div className="mt-1">
                  Anahtar teslim tahmin:{" "}
                  <strong className="hp-tabular-nums font-mono text-[var(--hp-accent)]">
                    {formatTrNumber(result.totalCostMinM, 1)} –{" "}
                    {formatTrNumber(result.totalCostMaxM, 1)} M TL
                  </strong>
                </div>
              </div>

              <Link
                href="/hesaplamalar/insaat-maliyeti"
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md border border-[var(--hp-accent-border)] bg-[var(--hp-accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--hp-accent)] transition-colors hover:bg-[var(--hp-accent)] hover:text-[var(--hp-accent-ink)] whitespace-nowrap shrink-0"
              >
                <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Maliyet kırılımını aç</span>
              </Link>
            </div>
          </article>

          {/* Sağ 5 sütun: Gerçek portal rotalarına bağlı mühendislik araçları */}
          <div className="flex flex-col divide-y divide-[var(--hp-border-subtle)] overflow-hidden rounded-xl border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] lg:col-span-5 transition-colors duration-500">
            {ENGINEERING_TOOLS.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                data-testid="home-resource-link"
                className="group flex w-full flex-col gap-1.5 px-4 py-4 text-left transition-colors hover:bg-[var(--hp-bg-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--hp-accent)] sm:px-6 sm:py-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="hp-font-display text-base font-semibold text-[var(--hp-ink-primary)] transition-colors group-hover:text-[var(--hp-accent)]">
                      {tool.title}
                    </span>
                    <span className="font-mono text-xs text-[var(--hp-ink-muted)]">
                      {tool.standard}
                    </span>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-[var(--hp-ink-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--hp-accent)]"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs leading-relaxed text-[var(--hp-ink-secondary)]">
                  {tool.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Teknik standartlar ve yönetmelikler referans şeridi */}
        <div
          id="mevzuat"
          aria-label="Teknik dayanaklar ve yönetmelikler"
          className="mt-8 grid grid-cols-1 gap-3.5 border-t border-[var(--hp-border-subtle)] pt-7 sm:mt-10 sm:grid-cols-2 sm:gap-4 sm:pt-8 lg:grid-cols-4"
        >
          {TECHNICAL_STANDARDS.map((std) => (
            <Link
              key={std.code}
              href={std.href}
              className="group flex flex-col items-start rounded-lg border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] p-4 text-left transition-colors hover:border-[var(--hp-accent-border)] hover:bg-[var(--hp-bg-surface-hover)]"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 bg-[var(--hp-accent)]" />
                  <span className="font-mono text-sm font-medium text-[var(--hp-accent)]">
                    {std.code}
                  </span>
                </div>
                <ArrowUpRight
                  className="h-3.5 w-3.5 text-[var(--hp-ink-muted)] group-hover:text-[var(--hp-ink-primary)]"
                  aria-hidden="true"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-[var(--hp-ink-primary)]">
                {std.title}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-[var(--hp-ink-secondary)]">
                {std.scope}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
