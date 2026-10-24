"use client";

import { cn } from "@/lib/utils";
import { useBelgeStudioTheme } from "@/hooks/use-belge-studio-theme";
import { BelgeMoonIcon, BelgeSunIcon } from "@/components/belge-studio-icons";

export interface BelgeStudioThemeToggleProps {
  className?: string;
}

/**
 * Belge Stüdyosu — Tek Ortak Tema Anahtarı (V3 Sözleşmesi)
 *
 * Kurallar:
 * - Üst barın görsel ve DOM olarak EN SAĞINDA yer alır.
 * - Mobilde doğrudan erişilebilirdir, alt menülerde kopyası bulunmaz.
 * - En az 44x44px dokunma alanına ve tam erişilebilirlik (role="switch", aria-checked) özelliklerine sahiptir.
 */
export function BelgeStudioThemeToggle({ className }: BelgeStudioThemeToggleProps) {
  const { isDark, toggle: handleToggleTheme } = useBelgeStudioTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Koyu tema"
      data-testid="belge-theme-toggle"
      data-belge-preview-control="true"
      onClick={handleToggleTheme}
      title={isDark ? "Aydınlık temaya geç" : "Koyu temaya geç"}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-border/80 bg-secondary/30 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer",
        className
      )}
    >
      <span
        className={`h-5 w-5 items-center justify-center rounded transition-all ${
          !isDark ? "inline-flex text-amber-600 dark:text-amber-400" : "hidden"
        }`}
      >
        <BelgeSunIcon className="h-4 w-4" />
      </span>
      <span
        className={`h-5 w-5 items-center justify-center rounded transition-all ${
          isDark ? "inline-flex text-amber-400" : "hidden"
        }`}
      >
        <BelgeMoonIcon className="h-4 w-4" />
      </span>
    </button>
  );
}
