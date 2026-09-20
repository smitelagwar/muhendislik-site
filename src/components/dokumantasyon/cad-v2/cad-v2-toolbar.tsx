// ============================================================================
// DWG/DXF MOTOR V2 — FLOATING TOOLBAR
// ============================================================================

"use client";

import React from "react";
import { Plus, Minus, Maximize, Hand, Layers, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CadV2ToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  isPanActive: boolean;
  onTogglePan: () => void;
  isLayerPanelOpen: boolean;
  onToggleLayerPanel: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
}

export const CadV2Toolbar: React.FC<CadV2ToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFit,
  isPanActive,
  onTogglePan,
  isLayerPanelOpen,
  onToggleLayerPanel,
  isSettingsOpen,
  onToggleSettings,
}) => {
  return (
    <div className="absolute sm:top-4 sm:left-4 bottom-14 left-1/2 -translate-x-1/2 sm:translate-x-0 z-20 sm:z-10 flex flex-row sm:flex-col items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-neutral-900/95 border border-neutral-800/80 shadow-2xl rounded-2xl backdrop-blur-xl">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Yakınlaştır (+)"
        className="h-10 w-10 sm:h-9 sm:w-9 text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Uzaklaştır (-)"
        className="h-10 w-10 sm:h-9 sm:w-9 text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onFit}
        title="Çizimi Sığdır (F)"
        className="h-10 w-10 sm:h-9 sm:w-9 text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-xl"
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <div className="w-[1px] h-5 sm:w-5 sm:h-[1px] bg-neutral-800 my-0 sm:my-0.5 mx-0.5 sm:mx-0" />

      <Button
        variant={isPanActive ? "secondary" : "ghost"}
        size="icon"
        onClick={onTogglePan}
        title="Kaydır (H / Space)"
        className={`h-10 w-10 sm:h-9 sm:w-9 rounded-xl ${
          isPanActive
            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
            : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
        }`}
      >
        <Hand className="h-4 w-4" />
      </Button>

      <Button
        variant={isLayerPanelOpen ? "secondary" : "ghost"}
        size="icon"
        onClick={onToggleLayerPanel}
        title="Katmanlar"
        className={`h-10 w-10 sm:h-9 sm:w-9 rounded-xl ${
          isLayerPanelOpen
            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
            : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
        }`}
      >
        <Layers className="h-4 w-4" />
      </Button>

      <Button
        variant={isSettingsOpen ? "secondary" : "ghost"}
        size="icon"
        onClick={onToggleSettings}
        title="Görünüm Ayarları"
        className={`h-10 w-10 sm:h-9 sm:w-9 rounded-xl ${
          isSettingsOpen
            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
            : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
        }`}
      >
        <Sliders className="h-4 w-4" />
      </Button>
    </div>
  );
};
