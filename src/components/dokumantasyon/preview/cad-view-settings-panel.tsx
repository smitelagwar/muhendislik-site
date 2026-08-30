"use client";

import { Eye, Palette, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CadBackgroundColorOption,
  CadUpstreamDisplayMode,
} from "@/lib/dokumantasyon/cad-upstream/adapter";

export interface CadViewSettingsPanelProps {
  displayMode: CadUpstreamDisplayMode;
  lineWeightVisible: boolean;
  backgroundColor: CadBackgroundColorOption;
  onSelectDisplayMode: (mode: CadUpstreamDisplayMode) => void;
  onToggleLineWeight: () => void;
  onSelectBackgroundColor: (color: CadBackgroundColorOption) => void;
  onClose: () => void;
}

export function CadViewSettingsPanel({
  displayMode,
  lineWeightVisible,
  backgroundColor,
  onSelectDisplayMode,
  onToggleLineWeight,
  onSelectBackgroundColor,
  onClose,
}: CadViewSettingsPanelProps) {
  return (
    <aside
      className="absolute left-14 top-14 z-30 max-h-[calc(100%-4.5rem)] w-[min(19rem,calc(100vw-4.5rem))] overflow-y-auto rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-xl backdrop-blur"
      aria-label="Görünüm ayarları paneli"
      data-testid="cad-view-settings-panel"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Görünüm Ayarları</h3>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            Çizim renkleri, çizgi kalınlığı ve arka plan yapılandırması.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Görünüm ayarlarını kapat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3.5 text-xs">
        {/* 1. Renk Modu */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Renk Modu</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={displayMode === "source" ? "default" : "outline"}
              className="h-8 text-xs font-medium"
              onClick={() => onSelectDisplayMode("source")}
              aria-pressed={displayMode === "source"}
              data-testid="cad-view-mode-source"
            >
              Gerçek Renk
            </Button>
            <Button
              type="button"
              size="sm"
              variant={displayMode === "monochrome" ? "default" : "outline"}
              className="h-8 text-xs font-medium"
              onClick={() => onSelectDisplayMode("monochrome")}
              aria-pressed={displayMode === "monochrome"}
              data-testid="cad-view-mode-monochrome"
            >
              Siyah-Beyaz
            </Button>
          </div>
        </div>

        {/* 2. Çizgi Kalınlığı */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Çizgi Kalınlığı (Lineweight)</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant={lineWeightVisible ? "default" : "outline"}
            className="w-full h-8 text-xs font-medium justify-between px-3"
            onClick={onToggleLineWeight}
            aria-pressed={lineWeightVisible}
            data-testid="cad-view-toggle-lineweight"
          >
            <span>Kalınlık Gösterimi</span>
            <span className="text-[11px] opacity-80">
              {lineWeightVisible ? "Açık" : "Kapalı"}
            </span>
          </Button>
        </div>

        {/* 3. Arka Plan Rengi */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-foreground">
            <span>Arka Plan Rengi</span>
          </div>
          <div
            className="grid grid-cols-3 gap-1.5"
            role="group"
            aria-label="Arka plan rengi seçenekleri"
          >
            <Button
              type="button"
              size="sm"
              variant={backgroundColor === "autocad" ? "default" : "outline"}
              className="h-8 px-1 text-[11px] font-medium"
              onClick={() => onSelectBackgroundColor("autocad")}
              aria-pressed={backgroundColor === "autocad"}
              data-testid="cad-bg-autocad-panel"
            >
              <span
                className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20 bg-[#212830]"
                aria-hidden="true"
              />
              AutoCAD
            </Button>
            <Button
              type="button"
              size="sm"
              variant={backgroundColor === "black" ? "default" : "outline"}
              className="h-8 px-1 text-[11px] font-medium"
              onClick={() => onSelectBackgroundColor("black")}
              aria-pressed={backgroundColor === "black"}
              data-testid="cad-bg-black-panel"
            >
              <span
                className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20 bg-black"
                aria-hidden="true"
              />
              Siyah
            </Button>
            <Button
              type="button"
              size="sm"
              variant={backgroundColor === "white" ? "default" : "outline"}
              className="h-8 px-1 text-[11px] font-medium"
              onClick={() => onSelectBackgroundColor("white")}
              aria-pressed={backgroundColor === "white"}
              data-testid="cad-bg-white-panel"
            >
              <span
                className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-black/20 bg-white"
                aria-hidden="true"
              />
              Beyaz
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
