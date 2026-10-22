"use client";

import { Check, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
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
}

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
}: BelgeStudioFormViewMenuProps) {
  // Buton üzerindeki etiket metni
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
        <button
          type="button"
          disabled={disabled}
          data-testid="belge-studio-form-view-trigger"
          aria-label="Form görünüm seçenekleri"
          title="Form görünümü ve yakınlaştırma seçenekleri"
          className={`preview-tool-button inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold tabular-nums text-foreground transition-all ${className}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>{buttonLabel}</span>
          <span className="text-[10px] opacity-70">▾</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-56 rounded-xl border border-border bg-popover p-1.5 shadow-xl text-popover-foreground z-50"
        data-testid="belge-studio-form-view-menu"
      >
        <DropdownMenuLabel className="px-2 py-1 text-xs font-bold text-muted-foreground">
          Form Görünümü
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
