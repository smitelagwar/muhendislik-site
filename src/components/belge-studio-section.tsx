/**
 * Belge Stüdyosu — Erişilebilir Akıllı Bölüm (Akordeon) Bileşeni (ASAMA_05)
 *
 * Erişilebilirlik ve Performans Kuralları:
 * - WAI-ARIA Accordion standardına tam uyumludur: h3 > button (aria-expanded, aria-controls).
 * - İçerik gövdesi daima DOM'da montelidir; kapalıyken 'hidden' (display: none) uygulanır.
 * - Kapalıyken tabindex sızıntısı oluşmaz, form değerleri sıfırlanmaz.
 * - Animasyon veya geçiş efekti kullanılmaz; PDF canvas ve ResizeObserver zıplamaları önlenir.
 * - 'n/toplam dolu' sayacı bilgilendirme amaçlıdır; validasyon/hata stili taşımaz.
 */

"use client";

import React from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { BelgeStudioSectionDefinition } from "@/lib/belge-studio-sections";
import type { UseBelgeStudioSectionsReturn } from "@/hooks/use-belge-studio-sections";

export interface BelgeStudioSectionProps {
  section: BelgeStudioSectionDefinition;
  isOpen: boolean;
  onToggle: () => void;
  filledCount: { filled: number; total: number };
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function BelgeStudioSection({
  section,
  isOpen,
  onToggle,
  filledCount,
  children,
  icon,
  className = "",
}: BelgeStudioSectionProps) {
  const headerId = `section-header-${section.id}`;
  const contentId = `section-content-${section.id}`;

  return (
    <div
      data-testid={`belge-section-${section.id}`}
      className={`rounded-xl lg:rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-colors ${className}`}
    >
      <h3 className="m-0 p-0 text-inherit font-inherit">
        <button
          type="button"
          id={headerId}
          data-testid={`belge-section-toggle-${section.id}`}
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-2 p-2.5 lg:p-2 text-left hover:bg-secondary/40 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && <span className="text-amber-500 shrink-0">{icon}</span>}
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 lg:text-muted-foreground truncate">
              {section.title}
            </span>
            <span
              data-testid={`belge-section-badge-${section.id}`}
              className="ml-1 inline-flex items-center rounded-full border border-border/60 bg-secondary/70 px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground shrink-0"
              title={`${filledCount.total} alandan ${filledCount.filled} tanesi dolduruldu`}
            >
              {filledCount.filled}/{filledCount.total} dolu
            </span>
          </div>

          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </h3>

      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        data-testid={`belge-section-content-${section.id}`}
        className={isOpen ? "space-y-2 p-2.5 pt-1 lg:p-2 lg:pt-0" : "hidden"}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Tüm bölümleri açma / kapatma üst yardımcı kontrolleri
 */
export interface BelgeStudioSectionMasterControlsProps {
  sectionsApi?: UseBelgeStudioSectionsReturn;
  onOpenAll?: () => void;
  onCloseAll?: () => void;
  allOpen?: boolean;
}

export function BelgeStudioSectionMasterControls({
  sectionsApi,
  onOpenAll,
  onCloseAll,
  allOpen,
}: BelgeStudioSectionMasterControlsProps) {
  const isAllOpen = sectionsApi ? sectionsApi.allOpen : Boolean(allOpen);
  const handleToggle = () => {
    if (sectionsApi) {
      if (sectionsApi.allOpen) {
        sectionsApi.closeAll();
      } else {
        sectionsApi.openAll();
      }
      return;
    }
    if (allOpen) {
      onCloseAll?.();
    } else {
      onOpenAll?.();
    }
  };

  return (
    <div className="flex items-center justify-end gap-1 px-1 py-0.5 text-[10px]">
      <button
        type="button"
        data-testid="belge-sections-toggle-all"
        onClick={handleToggle}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isAllOpen ? (
          <>
            <ChevronsDownUp className="h-3 w-3 text-muted-foreground" />
            <span>Tümünü Kapat</span>
          </>
        ) : (
          <>
            <ChevronsUpDown className="h-3 w-3 text-amber-500" />
            <span>Tümünü Aç</span>
          </>
        )}
      </button>
    </div>
  );
}
