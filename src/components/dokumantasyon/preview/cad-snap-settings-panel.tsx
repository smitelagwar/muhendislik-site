"use client";

import { Check, Magnet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CAD_SNAP_MODES,
  setCadSnapEnabled,
  setCadSnapMode,
  type CadSnapMode,
  type CadSnapSettings,
} from "@/lib/dokumantasyon/cad-upstream/snap-settings";

const MODE_COPY: Record<CadSnapMode, { label: string; description: string }> = {
  endpoint: {
    label: "Uç Nokta",
    description: "Çizgi ve yayların başlangıç/bitiş noktaları",
  },
  midpoint: {
    label: "Orta Nokta",
    description: "Çizgi ve yayların geometrik orta noktaları",
  },
  intersection: {
    label: "Kesişim",
    description: "Birbirini kesen CAD geometrilerinin kesişimleri",
  },
  center: {
    label: "Merkez",
    description: "Daire ve yay merkezleri",
  },
  nearest: {
    label: "En Yakın",
    description: "İşaretçiye en yakın geometri noktası",
  },
  perpendicular: {
    label: "Dik (Perpendicular)",
    description: "Referans noktasına tam 90° dik kesişim noktası (Shift)",
  },
};

export function CadSnapSettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: CadSnapSettings;
  onChange: (settings: CadSnapSettings) => void;
  onClose: () => void;
}) {
  return (
    <aside
      className="absolute left-14 top-14 z-30 max-h-[calc(100%-4.5rem)] w-[min(18rem,calc(100vw-4.5rem))] overflow-y-auto rounded-xl border border-border/80 bg-background/95 p-3 shadow-xl backdrop-blur"
      aria-label="Nesne yakalama ayarları"
      data-testid="cad-snap-settings-panel"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Magnet className="h-4 w-4 shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">Nesne Yakalama</h3>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            Ölçüm noktalarını gerçek CAD geometrisine hassas biçimde yaklaştırır.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 shrink-0 p-0"
          onClick={onClose}
          aria-label="Nesne yakalama ayarlarını kapat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={settings.enabled}
        data-testid="cad-snap-master-toggle"
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-left transition-colors hover:bg-accent/60"
        onClick={() => onChange(setCadSnapEnabled(settings, !settings.enabled))}
      >
        <span>
          <span className="block text-xs font-semibold text-foreground">Snap</span>
          <span className="block text-[10px] text-muted-foreground">
            {settings.enabled ? "Nesne yakalama açık" : "Nesne yakalama kapalı"}
          </span>
        </span>
        <span
          className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
            settings.enabled
              ? "border-primary/60 bg-primary"
              : "border-border bg-muted"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-background shadow-sm transition-transform ${
              settings.enabled ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </span>
      </button>

      <div className="mt-3 space-y-1" aria-label="Snap modları">
        {CAD_SNAP_MODES.map((mode) => {
          const active = settings.modes[mode];
          const copy = MODE_COPY[mode];
          return (
            <button
              key={mode}
              type="button"
              role="checkbox"
              aria-checked={active}
              disabled={!settings.enabled}
              data-testid={`cad-snap-mode-${mode}`}
              className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => onChange(setCadSnapMode(settings, mode, !active))}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
                aria-hidden="true"
              >
                {active ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium text-foreground">{copy.label}</span>
                <span className="block text-[10px] leading-4 text-muted-foreground">
                  {copy.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!settings.enabled ? (
        <p className="mt-2 rounded-md bg-muted/60 px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">
          Alt seçimler korunur. Snap tekrar açıldığında aynı tercihler kullanılacaktır.
        </p>
      ) : null}
    </aside>
  );
}
