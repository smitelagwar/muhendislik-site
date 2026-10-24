"use client";

import { Check, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Density,
  FORM_SCALE_PRESETS,
  FitStatus,
  FormMode,
  ManualScale,
  formatScaleLabel,
} from "@/lib/belge-studio-form-view";

export interface BelgeStudioFormViewMenuProps {
  mode: FormMode;
  manualScale: ManualScale;
  density: Density;
  appliedScale: number;
  fitStatus: FitStatus;
  onChooseScale: (scale: ManualScale) => void;
  onToggleCompact: () => void;
  onFit: () => void;
  onReset: () => void;
  disabled?: boolean;
  className?: string;
  side?: "top" | "bottom";
  align?: "start" | "end" | "center";
  iconOnly?: boolean;
}

/**
 * Belge Stüdyosu — Form Görünümü Menüsü (V3 Sözleşmesi)
 *
 * Kurallar:
 * 1. Alt işlem barında "Boş form indir" düğmesinin hemen solunda yer alır.
 * 2. Masaüstünde etiketli ("Form Görünümü"), mobilde 44x44px ikon olarak sunulur.
 * 3. Popover alt bardan YUKARI (side="top") doğru açılır, viewport dışına taşmaz.
 * 4. "Varsayılana dön" yalnız form ölçeğini sıfırlar; belge form alanlarını sıfırlamaz.
 * 5. PDF sığdırma ve PDF zoom durumundan tamamen bağımsızdır.
 */
export function BelgeStudioFormViewMenu({
  mode,
  manualScale,
  density,
  appliedScale,
  fitStatus,
  onChooseScale,
  onToggleCompact,
  onFit,
  onReset,
  disabled = false,
  className = "",
  side = "top",
  align = "end",
  iconOnly = false,
}: BelgeStudioFormViewMenuProps) {
  let buttonLabel = `Form ${formatScaleLabel(manualScale)}`;
  if (mode === "fit") {
    if (fitStatus === "fitted") {
      buttonLabel = `Form · Sığdır (${formatScaleLabel(appliedScale)})`;
    } else if (fitStatus === "limited") {
      buttonLabel = "Form · Sığdır (Sınırlı)";
    } else if (fitStatus === "measuring") {
      buttonLabel = "Form · Sığdır...";
    } else {
      buttonLabel = "Form · Sığdır";
    }
  }

  const isFitActive = mode === "fit";
  const isCompactActive = density === "compact";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <button
            type="button"
            disabled={disabled}
            data-testid="belge-studio-form-view-trigger"
            aria-label="Form görünüm seçenekleri"
            title="Form görünüm seçenekleri"
            className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card/90 p-0 text-muted-foreground transition hover:border-amber-500/50 hover:text-foreground dark:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${className}`}
          >
            <SlidersHorizontal className="h-[20px] w-[20px] text-amber-500 shrink-0" />
          </button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            data-testid="belge-studio-form-view-trigger"
            aria-label="Form görünüm seçenekleri"
            title="Form görünümü ve yakınlaştırma seçenekleri"
            className={`min-h-11 gap-2 text-xs font-semibold ${className}`}
          >
            <SlidersHorizontal className="size-4 text-amber-500 shrink-0" />
            <span>Form Görünümü</span>
            <span className="text-[10px] opacity-70">▾</span>
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={10}
        collisionPadding={12}
        className="w-56 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-popover p-1.5 shadow-xl text-popover-foreground z-50 max-h-[85vh] overflow-y-auto"
        data-testid="belge-studio-form-view-menu"
      >
        <DropdownMenuLabel className="px-2 py-1 text-xs font-bold text-muted-foreground flex items-center justify-between">
          <span>Form Görünümü</span>
          <span className="text-[10px] font-mono font-normal opacity-70">{buttonLabel}</span>
        </DropdownMenuLabel>

        {FORM_SCALE_PRESETS.map((scale) => {
          const isSelected = mode === "manual" && Math.abs(manualScale - scale) < 0.01;
          const testId = `form-view-scale-${Math.round(scale * 100)}`;

          return (
            <DropdownMenuItem
              key={scale}
              data-testid={testId}
              role="menuitemradio"
              aria-checked={isSelected}
              onSelect={() => onChooseScale(scale)}
              className="flex items-center justify-between min-h-9 px-2 py-1.5 rounded-lg text-xs cursor-pointer focus:bg-amber-500/10 focus:text-amber-600 dark:focus:text-amber-400"
            >
              <span>
                {scale === 1.00
                  ? "Normal %100"
                  : scale === 0.90
                  ? "Küçük %90"
                  : scale === 1.10
                  ? "Büyük %110"
                  : "Çok büyük %125"}
              </span>
              {isSelected && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1 border-border/60" />

        <DropdownMenuItem
          data-testid="form-view-fit"
          role="menuitemcheckbox"
          aria-checked={isFitActive}
          onSelect={onFit}
          className="flex items-center justify-between min-h-9 px-2 py-1.5 rounded-lg text-xs cursor-pointer focus:bg-amber-500/10 focus:text-amber-600 dark:focus:text-amber-400"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="font-medium">Formu tam sığdır</span>
          </div>
          {isFitActive && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          data-testid="form-view-compact"
          role="menuitemcheckbox"
          aria-checked={isCompactActive}
          onSelect={onToggleCompact}
          className="flex items-center justify-between min-h-9 px-2 py-1.5 rounded-lg text-xs cursor-pointer focus:bg-amber-500/10 focus:text-amber-600 dark:focus:text-amber-400"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>Kompakt görünüm</span>
          </div>
          {isCompactActive && <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 border-border/60" />

        <DropdownMenuItem
          data-testid="form-view-reset"
          onSelect={onReset}
          className="flex items-center gap-1.5 min-h-9 px-2 py-1.5 rounded-lg text-xs cursor-pointer text-muted-foreground hover:text-foreground focus:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Varsayılana dön</span>
        </DropdownMenuItem>

        {mode === "fit" && fitStatus === "limited" && (
          <div
            data-testid="form-view-limited-notice"
            className="mt-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] leading-snug text-amber-800 dark:text-amber-300"
          >
            Bu ekranda tüm form aynı anda sığmıyor; kaydırma aktif tutuldu.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
