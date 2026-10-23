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

import React, { useId } from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import type { BelgeStudioSectionDefinition } from "@/lib/belge-studio-sections";
import type { UseBelgeStudioSectionsReturn } from "@/hooks/use-belge-studio-sections";
import { BELGE_UX_FLAGS } from "@/lib/belge-ux-config";

export interface BelgeStudioSectionProps {
  section: BelgeStudioSectionDefinition;
  isOpen: boolean;
  onToggle: () => void;
  onActive?: () => void;
  filledCount: { filled: number; total: number };
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function BelgeStudioSection({
  section,
  isOpen,
  onToggle,
  onActive,
  filledCount,
  children,
  icon,
  className = "",
}: BelgeStudioSectionProps) {
  const isExpanded = !BELGE_UX_FLAGS.ACCORDION ? true : isOpen;
  const instanceId = useId();
  const headerId = `section-header-${section.id}-${instanceId}`;
  const contentId = `section-content-${section.id}-${instanceId}`;

  return (
    <div
      data-testid={`belge-section-${section.id}`}
      onFocusCapture={onActive}
      className={`rounded-xl lg:rounded-lg border border-border/80 bg-card/60 overflow-hidden transition-colors ${className}`}
    >
      <h3 className="m-0 p-0 text-inherit font-inherit">
        <button
          type="button"
          id={headerId}
          data-testid={`belge-section-toggle-${section.id}`}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={() => {
            if (!BELGE_UX_FLAGS.ACCORDION) return;
            onActive?.();
            onToggle();
          }}
          className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3 py-2 text-left hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && <span className="text-amber-500 shrink-0">{icon}</span>}
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 lg:text-muted-foreground truncate">
              {section.title}
            </span>
            <span
              data-testid={`belge-section-badge-${section.id}`}
              className="ml-1 inline-flex items-center rounded-full border border-border/60 bg-secondary/70 px-2 py-0.5 text-[9px] font-medium text-muted-foreground shrink-0"
              title={`${filledCount.total} alandan ${filledCount.filled} tanesi dolduruldu (doluluk geçerlilik kontrolü değildir)`}
              aria-label={`${section.title}, ${filledCount.total} alandan ${filledCount.filled} tanesi dolduruldu, doluluk geçerlilik kontrolü değildir`}
            >
              {filledCount.filled}/{filledCount.total} dolu
            </span>
          </div>

          {BELGE_UX_FLAGS.ACCORDION && (
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground shrink-0 ${
                isExpanded ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          )}
        </button>
      </h3>

      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        data-testid={`belge-section-content-${section.id}`}
        className={isExpanded ? "space-y-2 p-3 pt-1 lg:p-2 lg:pt-0" : "hidden"}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Tüm bölümleri açma / diğerlerini kapatma üst yardımcı kontrolleri (F12)
 */
export interface BelgeStudioSectionMasterControlsProps {
  sectionsApi?: UseBelgeStudioSectionsReturn;
  onOpenAll?: () => void;
  onCloseOthers?: () => void;
  allOpen?: boolean;
}

export function BelgeStudioSectionMasterControls({
  sectionsApi,
  onOpenAll,
  onCloseOthers,
  allOpen,
}: BelgeStudioSectionMasterControlsProps) {
  if (!BELGE_UX_FLAGS.ACCORDION) return null;

  const isAllOpen = sectionsApi ? sectionsApi.allOpen : Boolean(allOpen);
  const handleToggle = () => {
    if (sectionsApi) {
      if (sectionsApi.allOpen) {
        sectionsApi.closeOthers();
      } else {
        sectionsApi.openAll();
      }
      return;
    }
    if (allOpen) {
      onCloseOthers?.();
    } else {
      onOpenAll?.();
    }
  };

  return (
    <div className="flex items-center justify-end gap-1 px-1 py-0.5 text-xs">
      <button
        type="button"
        data-testid="belge-sections-toggle-all"
        onClick={handleToggle}
        className="inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-1 px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors cursor-pointer"
        title={isAllOpen ? "Diğerlerini Kapat" : "Tümünü Aç"}
      >
        {isAllOpen ? (
          <>
            <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Tümünü Kapat </span>
            <span className="font-medium">Diğerlerini Kapat</span>
          </>
        ) : (
          <>
            <ChevronsUpDown className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium">Tümünü Aç</span>
          </>
        )}
      </button>
    </div>
  );
}
