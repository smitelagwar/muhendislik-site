"use client";

import { Accessibility, ChevronDown, Minus, Plus, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  TEXT_SCALE_MAX, TEXT_SCALE_MIN, TEXT_SCALE_STEP,
  UI_SCALE_MAX, UI_SCALE_MIN, UI_SCALE_PRESETS, UI_SCALE_STEP,
} from "@/lib/belge-studio-readability";
import type { BelgeReadabilityControls } from "@/hooks/use-belge-studio-readability";

type Props = { readability: BelgeReadabilityControls; embedded?: boolean };

const controlClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-background px-2 font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const toggleClass = "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export function BelgeStudioReadabilityOptions({ readability }: Props) {
  const { settings, update, resetScale, resetAll } = readability;
  return (
    <div data-testid="belge-readability-options" style={readability.rootStyle} data-high-contrast={settings.highContrast ? "true" : undefined} className="space-y-3 text-foreground">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-sm">Arayüz büyüklüğü</span>
        <span data-testid="belge-ui-scale-value" className="font-mono font-bold tabular-nums">%{settings.uiScale}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Hazır arayüz ölçekleri">
        {UI_SCALE_PRESETS.map((scale) => (
          <button key={scale} type="button" data-testid={"belge-ui-scale-" + scale}
            className={"min-h-10 rounded-lg border px-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 " +
              (settings.uiScale === scale ? "border-amber-600 bg-amber-500/15 text-foreground" : "border-border bg-background hover:bg-secondary")}
            onClick={() => update({ uiScale: scale })}
            aria-pressed={settings.uiScale === scale}
            aria-label={"Arayüz ölçeği yüzde " + scale}
          >%{scale}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Arayüzü yüzde beş küçült" className={controlClass}
          disabled={settings.uiScale <= UI_SCALE_MIN}
          onClick={() => update({ uiScale: settings.uiScale - UI_SCALE_STEP })}><Minus className="size-4" /></button>
        <input type="range" min={UI_SCALE_MIN} max={UI_SCALE_MAX} step={UI_SCALE_STEP}
          data-testid="belge-ui-scale-range"
          aria-label="Arayüz ölçeği" aria-valuetext={"Yüzde " + settings.uiScale}
          value={settings.uiScale} onChange={(e) => update({ uiScale: Number(e.target.value) })}
          className="min-w-0 flex-1 accent-amber-600" />
        <button type="button" aria-label="Arayüzü yüzde beş büyüt" className={controlClass}
          disabled={settings.uiScale >= UI_SCALE_MAX}
          onClick={() => update({ uiScale: settings.uiScale + UI_SCALE_STEP })}><Plus className="size-4" /></button>
      </div>
      <button type="button" onClick={resetScale} data-testid="belge-ui-scale-reset"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-amber-700 hover:bg-secondary dark:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
        <RotateCcw className="size-3.5" /> Arayüzü %100&apos;e döndür
      </button>

      <details className="group rounded-xl border border-border p-2.5" data-testid="belge-readability-more">
        <summary className="flex min-h-9 cursor-pointer items-center justify-between gap-2 font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          Daha fazla okunabilirlik <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-border pt-3">
          <label htmlFor="belge-text-scale" className="flex items-center justify-between gap-2 text-sm font-medium">
            Yalnız yazıları büyüt <span className="font-mono">%{settings.textScale}</span>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Yazıları yüzde on küçült" className={controlClass}
              disabled={settings.textScale <= TEXT_SCALE_MIN}
              onClick={() => update({ textScale: settings.textScale - TEXT_SCALE_STEP })}><Minus className="size-4" /></button>
            <input id="belge-text-scale" type="range" min={TEXT_SCALE_MIN} max={TEXT_SCALE_MAX} step={TEXT_SCALE_STEP}
              value={settings.textScale} onChange={(e) => update({ textScale: Number(e.target.value) })}
              aria-valuetext={"Yüzde " + settings.textScale} className="min-w-0 flex-1 accent-amber-600" />
            <button type="button" aria-label="Yazıları yüzde on büyüt" className={controlClass}
              disabled={settings.textScale >= TEXT_SCALE_MAX}
              onClick={() => update({ textScale: settings.textScale + TEXT_SCALE_STEP })}><Plus className="size-4" /></button>
          </div>
          {([
            ["highContrast", "Yüksek kontrast", "Yazıları ve kontrol kenarlıklarını belirginleştir"],
            ["comfortableReading", "Rahat okuma", "Satır ve alan boşluklarını artır"],
            ["largeTargets", "Büyük kontrol alanları", "Düğme ve dokunma alanlarını genişlet"],
          ] as const).map(([key, title, description]) => (
            <label key={key} className={toggleClass}>
              <span className="min-w-0"><span className="block font-semibold">{title}</span>
                <span className="block text-xs font-normal text-muted-foreground">{description}</span></span>
              <input type="checkbox" checked={settings[key]}
                onChange={(e) => update({ [key]: e.target.checked })}
                className="h-5 w-5 shrink-0 accent-amber-600" />
            </label>
          ))}
          <button type="button" onClick={resetAll} data-testid="belge-readability-reset-all"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-secondary focus-visible:ring-2 focus-visible:ring-amber-500">
            <RotateCcw className="size-4" /> Tüm görünüm ayarlarını sıfırla
          </button>
        </div>
      </details>
    </div>
  );
}

export function BelgeStudioReadabilityMenu({ readability, embedded = false }: Props) {
  if (embedded) return <BelgeStudioReadabilityOptions readability={readability} />;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" data-testid="belge-readability-trigger"
          aria-label={"Arayüz ve okunabilirlik ayarları, yüzde " + readability.settings.uiScale}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
          <Accessibility className="size-4 text-amber-600" />
          <span>Arayüz ve Okunabilirlik</span>
          <span className="font-mono opacity-70">%{readability.settings.uiScale}</span>
          <ChevronDown className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top" align="start" sideOffset={8} collisionPadding={12}
        data-testid="belge-readability-menu"
        className="w-[min(94vw,360px)] max-h-[min(85dvh,650px)] overflow-y-auto rounded-xl border border-border bg-popover p-3 shadow-xl z-[80]"
      >
        <BelgeStudioReadabilityOptions readability={readability} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
