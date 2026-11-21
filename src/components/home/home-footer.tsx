"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { HologramAtmosphere } from "@/lib/home/hologram-engine";

interface HomeFooterProps {
  atmosphere: HologramAtmosphere;
  onAtmosphereChange: (a: HologramAtmosphere) => void;
}

export function HomeFooter({ atmosphere, onAtmosphereChange }: HomeFooterProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }
    setError("");
    setSubscribedEmail(cleaned);
    setEmail("");
  };

  return (
    <footer className="hp-architectural-grid bg-[var(--hp-bg-footer)] py-14 text-[var(--hp-ink-secondary)] transition-colors duration-500 sm:py-16">
      <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 border-b border-[var(--hp-border-subtle)] pb-10 sm:gap-12 sm:pb-12 lg:grid-cols-12">
          {/* Marka özeti + atmosfer seçici */}
          <div className="lg:col-span-5">
            <a
              href="#hero"
              className="hp-font-display text-xl font-bold tracking-tight text-[var(--hp-ink-primary)]"
            >
              İnşa Blog
            </a>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--hp-ink-secondary)]">
              İnşaat mühendisleri ve mimarlar için TS 500, TBDY 2018 ve TS EN 1992-1-1 odaklı
              hesaplama araçları, teknik rehberler ve şantiye uygulama çalışma alanı.
            </p>
            <p className="mt-4 text-xs text-[var(--hp-ink-muted)]">
              Hesaplamalar ön fizibilite ve teknik kontrol amaçlıdır; nihai statik proje onayı
              yetkili inşaat mühendisi sorumluluğundadır.
            </p>

            {/* Satır içi atmosfer seçici */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--hp-ink-muted)]">Atmosfer:</span>
              <div
                role="group"
                aria-label="Alt bilgi atmosfer seçimi"
                className="inline-flex flex-wrap items-center gap-1 rounded-md border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] p-1"
              >
                <button
                  type="button"
                  onClick={() => onAtmosphereChange("obsidian")}
                  aria-pressed={atmosphere === "obsidian"}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    atmosphere === "obsidian"
                      ? "bg-[#2B2E36] text-[#FAF7F2]"
                      : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-sm border border-[#F2EFE9]/30 bg-[#0B0C0E]" />
                  <span>Obsidyen</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAtmosphereChange("crimson")}
                  aria-pressed={atmosphere === "crimson"}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    atmosphere === "crimson"
                      ? "bg-[#8F1B0E] text-[#FFF8EF]"
                      : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-sm border border-[#F2EFE9]/30 bg-[#A42010]" />
                  <span>Kızıl Kil</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAtmosphereChange("alabaster")}
                  aria-pressed={atmosphere === "alabaster"}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    atmosphere === "alabaster"
                      ? "bg-[#14161A] text-[#FAF7F2]"
                      : "text-[var(--hp-ink-secondary)] hover:text-[var(--hp-ink-primary)]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-sm border border-[#14161A]/35 bg-[#F5F2EB]" />
                  <span>Beyaz</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hızlı portal ve araç bağlantıları */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-3">
            <div>
              <h3 className="font-mono text-xs text-[var(--hp-ink-primary)]">Portal</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li>
                  <Link href="/hesaplamalar" className="transition-colors hover:text-[var(--hp-accent)]">
                    Hesaplamalar
                  </Link>
                </li>
                <li>
                  <Link href="/kategori/araclar" className="transition-colors hover:text-[var(--hp-accent)]">
                    Yapısal Araçlar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kategori/deprem-yonetmelik"
                    className="transition-colors hover:text-[var(--hp-accent)]"
                  >
                    Mevzuat & TBDY
                  </Link>
                </li>
                <li>
                  <Link href="/belgeler" className="transition-colors hover:text-[var(--hp-accent)]">
                    Belgeler
                  </Link>
                </li>
                <li>
                  <Link href="/dokumantasyon" className="transition-colors hover:text-[var(--hp-accent)]">
                    Dokümantasyon
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs text-[var(--hp-ink-primary)]">Araçlar</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/kategori/araclar/donati-hesabi"
                    className="transition-colors hover:text-[var(--hp-accent)]"
                  >
                    Donatı Hesabı
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kategori/araclar/taban-kesme-kuvveti"
                    className="transition-colors hover:text-[var(--hp-accent)]"
                  >
                    Deprem Yükü
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kategori/araclar/pas-payi"
                    className="transition-colors hover:text-[var(--hp-accent)]"
                  >
                    Pas Payı
                  </Link>
                </li>
                <li>
                  <Link
                    href="/hesaplamalar/tahmini-insaat-alani"
                    className="transition-colors hover:text-[var(--hp-accent)]"
                  >
                    TAKS · KAKS
                  </Link>
                </li>
                <li>
                  <Link href="/iletisim" className="transition-colors hover:text-[var(--hp-accent)]">
                    İletişim
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Doğrulamalı Teknik Bülten Formu */}
          <div className="lg:col-span-4">
            <h3 className="font-mono text-xs text-[var(--hp-ink-primary)]">Teknik Bülten</h3>
            <p className="mt-3 text-sm text-[var(--hp-ink-secondary)]">
              Yeni yönetmelik notları, birim fiyat güncellemeleri ve şantiye kontrol listeleri
              yayımlandığında haberdar olun.
            </p>

            {subscribedEmail ? (
              <div
                role="status"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-[var(--hp-accent-border)] bg-[var(--hp-accent-soft)] p-3.5 text-xs text-[var(--hp-ink-primary)]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hp-accent)]" />
                <span>
                  <strong>{subscribedEmail}</strong> teknik bültene eklendi.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <label htmlFor="bulletin-email" className="sr-only">
                    E-posta adresiniz
                  </label>
                  <input
                    id="bulletin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="muhendis@ornek.com"
                    className="min-h-[42px] min-w-0 flex-1 rounded-md border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-input)] px-3.5 py-2 text-sm text-[var(--hp-ink-primary)] placeholder:text-[var(--hp-ink-muted)] focus:border-[var(--hp-accent)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] rounded-md bg-[var(--hp-accent)] px-4 py-2 text-xs font-semibold text-[var(--hp-accent-ink)] transition-colors hover:bg-[var(--hp-accent-hover)] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Katıl
                  </button>
                </div>
                {error && (
                  <p role="alert" className="text-xs text-[var(--hp-error-ink)]">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--hp-ink-muted)]">
          <span>© 2026 İnşa Blog · Teknik Mühendislik Çalışma Alanı</span>
          <span className="font-mono">TS 500 · TBDY 2018 · TS EN 1992-1-1 · TS EN 206</span>
        </div>
      </div>
    </footer>
  );
}
