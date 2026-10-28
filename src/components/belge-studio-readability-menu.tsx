"use client";

import { Accessibility, ChevronDown, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TEXT_SCALE_PRESETS } from "@/lib/belge-studio-readability";
import type { BelgeReadabilityControls } from "@/hooks/use-belge-studio-readability";

type Props = { readability: BelgeReadabilityControls; embedded?: boolean };

export function BelgeStudioReadabilityOptions({ readability }: Props) {
  const { settings, update, resetAll } = readability;

  return (
    <div
      data-testid="belge-readability-options"
      style={readability.rootStyle}
      data-high-contrast={settings.highContrast ? "true" : undefined}
      className="space-y-3.5 text-foreground text-xs"
    >
      {/* Başlık / Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Accessibility className="size-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-foreground leading-tight">Okunabilirlik</h4>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Form görüntüleme ayarları</p>
          </div>
        </div>
      </div>

      {/* Bölüm 1: Yazı Büyüklüğü (5 Seçenek) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground text-xs">Yazı Büyüklüğü</span>
          <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
            %{settings.textScale}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1" role="group" aria-label="Yazı boyutu önayarları">
          {TEXT_SCALE_PRESETS.map((scale) => {
            const isActive = settings.textScale === scale;
            return (
              <button
                key={scale}
                type="button"
                data-testid={"belge-text-scale-" + scale}
                onClick={() => update({ textScale: scale })}
                aria-pressed={isActive}
                aria-label={"Yazı boyutu yüzde " + scale}
                className={`min-h-[34px] rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold ring-1 ring-amber-500/50"
                    : "border-border/70 bg-background hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                %{scale}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bölüm 2: Erişilebilirlik Seçenekleri (Modern Switch) */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Görünüm İyileştirmeleri
        </span>

        {/* Yüksek Kontrast Switch */}
        <div
          onClick={() => update({ highContrast: !settings.highContrast })}
          className={`group flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
            settings.highContrast
              ? "border-amber-500/50 bg-amber-500/10 shadow-sm"
              : "border-border/70 bg-background hover:bg-secondary/40"
          }`}
        >
          <div className="min-w-0 flex-1">
            <span className="block font-semibold text-xs text-foreground">Yüksek Kontrast</span>
            <span className="block text-[10px] text-muted-foreground leading-snug">
              Yazıları, etiketleri ve form kenarlıklarını belirginleştirir
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.highContrast}
            aria-label="Yüksek kontrast modunu aç veya kapat"
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              settings.highContrast ? "bg-amber-600" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                settings.highContrast ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Rahat Okuma Switch */}
        <div
          onClick={() => update({ comfortableReading: !settings.comfortableReading })}
          className={`group flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
            settings.comfortableReading
              ? "border-amber-500/50 bg-amber-500/10 shadow-sm"
              : "border-border/70 bg-background hover:bg-secondary/40"
          }`}
        >
          <div className="min-w-0 flex-1">
            <span className="block font-semibold text-xs text-foreground">Rahat Okuma</span>
            <span className="block text-[10px] text-muted-foreground leading-snug">
              Form alanlarının yüksekliğini ve satır aralıklarını genişletir
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.comfortableReading}
            aria-label="Rahat okuma modunu aç veya kapat"
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              settings.comfortableReading ? "bg-amber-600" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                settings.comfortableReading ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sıfırlama Butonu */}
      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
        <button
          type="button"
          onClick={resetAll}
          data-testid="belge-readability-reset-all"
          className="inline-flex min-h-[30px] items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-secondary transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>Ayarları Sıfırla</span>
        </button>
        {(settings.textScale !== 100 || settings.highContrast || settings.comfortableReading) && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Özelleştirildi</span>
        )}
      </div>
    </div>
  );
}

export function BelgeStudioReadabilityMenu({ readability, embedded = false }: Props) {
  if (embedded) return <BelgeStudioReadabilityOptions readability={readability} />;

  const isCustomized =
    readability.settings.textScale !== 100 ||
    readability.settings.highContrast ||
    readability.settings.comfortableReading;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="belge-readability-trigger"
          aria-label={"Arayüz ve okunabilirlik ayarları, yüzde " + readability.settings.textScale}
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
            isCustomized
              ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-border bg-background text-foreground hover:bg-secondary"
          }`}
        >
          <Accessibility className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Okunabilirlik</span>
          <span className="font-mono opacity-80 font-bold">%{readability.settings.textScale}</span>
          <ChevronDown className="size-3.5 opacity-60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        data-testid="belge-readability-menu"
        className="w-[min(94vw,330px)] rounded-2xl border border-border bg-popover/95 p-3.5 shadow-2xl backdrop-blur-md z-[80]"
      >
        <BelgeStudioReadabilityOptions readability={readability} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
