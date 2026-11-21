"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import type { HologramAtmosphere } from "@/lib/home/hologram-engine";

interface HomeNavbarProps {
  onOpenSearch: () => void;
  atmosphere: HologramAtmosphere;
}

const DESKTOP_NAV_LINKS = [
  { id: "hesaplamalar", label: "Hesaplamalar", href: "/hesaplamalar" },
  { id: "araclar", label: "Araçlar", href: "/kategori/araclar" },
  { id: "mevzuat", label: "Mevzuat", href: "/kategori/deprem-yonetmelik" },
  { id: "belgeler", label: "Belgeler", href: "/belgeler" },
  { id: "dokumantasyon", label: "Dokümantasyon", href: "/dokumantasyon" },
] as const;

const MOBILE_DRAWER_LINKS = [
  { id: "home", label: "Ana Sayfa", href: "/" },
  { id: "deprem-yonetmelik", label: "Mevzuat", href: "/kategori/deprem-yonetmelik" },
  { id: "hesaplamalar", label: "Hesaplamalar", href: "/hesaplamalar" },
  { id: "araclar", label: "Araçlar", href: "/kategori/araclar" },
  { id: "belgeler", label: "Belgeler", href: "/belgeler" },
  { id: "dokumantasyon", label: "Dokümantasyon", href: "/dokumantasyon" },
  { id: "iletisim", label: "İletişim", href: "/iletisim" },
] as const;

export function HomeNavbar({ onOpenSearch, atmosphere }: HomeNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      data-site-header
      data-home-atmosphere={atmosphere}
      className="sticky top-0 z-40 border-b border-[var(--hp-border-subtle)] bg-[var(--hp-bg-nav)] backdrop-blur-md transition-colors duration-500"
    >
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-10">
        {/* Bölge 1: Tek metin marka logosu */}
        <div data-home-navbar-logo className="shrink-0">
          <Link
            href="/"
            className="hp-font-display inline-flex items-center text-lg font-bold tracking-tight text-[var(--hp-ink-primary)] transition-colors hover:text-[var(--hp-accent)] whitespace-nowrap"
          >
            İnşa Blog
          </Link>
        </div>

        {/* Bölge 2: 5 tek satırlık ana portal bağlantısı */}
        <nav aria-label="Ana navigasyon" className="hidden items-center gap-6 lg:flex xl:gap-7">
          {DESKTOP_NAV_LINKS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              data-testid="home-desktop-nav-item"
              className="text-sm font-medium text-[var(--hp-ink-secondary)] transition-colors hover:text-[var(--hp-ink-primary)] whitespace-nowrap shrink-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bölge 3: Hızlı Ara + Mobil Menü */}
        <div className="flex items-center gap-2 shrink-0 sm:gap-2.5">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Hızlı Ara"
            aria-haspopup="dialog"
            aria-controls="command-palette-dialog"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[var(--hp-border-strong)] bg-[var(--hp-bg-surface)]/80 px-3 py-2 text-xs font-medium text-[var(--hp-ink-primary)] transition-colors hover:border-[var(--hp-accent-border)] hover:bg-[var(--hp-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hp-accent)] whitespace-nowrap shrink-0 cursor-pointer sm:gap-2.5 sm:px-3.5"
          >
            <Search className="h-3.5 w-3.5 text-[var(--hp-accent)]" aria-hidden="true" />
            <span>Hızlı Ara</span>
            <kbd className="hidden font-mono text-[11px] text-[var(--hp-ink-muted)] sm:inline">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] text-[var(--hp-ink-primary)] transition-colors hover:border-[var(--hp-accent-border)] lg:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation-drawer"
          aria-label="Mobil navigasyon"
          className="border-t border-[var(--hp-border-subtle)] bg-[var(--hp-bg-surface)] px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {MOBILE_DRAWER_LINKS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                data-testid="mobile-menu-item"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-medium text-[var(--hp-ink-primary)] transition-colors hover:bg-[var(--hp-bg-surface-hover)] hover:text-[var(--hp-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--hp-border-subtle)] pt-3 text-xs text-[var(--hp-ink-muted)]">
            <a
              href="#hesapla"
              onClick={() => setMobileOpen(false)}
              className="rounded border border-[var(--hp-border-subtle)] px-2.5 py-1.5 font-mono transition-colors hover:border-[var(--hp-accent-border)] hover:text-[var(--hp-ink-primary)]"
            >
              01. Hesapla
            </a>
            <a
              href="#ogren"
              onClick={() => setMobileOpen(false)}
              className="rounded border border-[var(--hp-border-subtle)] px-2.5 py-1.5 font-mono transition-colors hover:border-[var(--hp-accent-border)] hover:text-[var(--hp-ink-primary)]"
            >
              02. Öğren
            </a>
            <a
              href="#uygula"
              onClick={() => setMobileOpen(false)}
              className="rounded border border-[var(--hp-border-subtle)] px-2.5 py-1.5 font-mono transition-colors hover:border-[var(--hp-accent-border)] hover:text-[var(--hp-ink-primary)]"
            >
              03. Uygula
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
