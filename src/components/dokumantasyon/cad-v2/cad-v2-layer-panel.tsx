// ============================================================================
// DWG/DXF MOTOR V2 — LAYER MANAGEMENT PANEL
// ============================================================================

"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Search, Lock, Snowflake, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CadLayer } from "@/lib/cad-v2/canonical/types";
import { ACI_COLOR_TABLE } from "@/lib/cad-v2/compile/cad-color-resolver";

export interface CadV2LayerPanelProps {
  layers: Record<string, CadLayer>;
  onToggleVisibility: (layerId: string, visible: boolean) => void;
  onToggleAllVisibility?: (visible: boolean) => void;
  onClose: () => void;
}

function getLayerColorCss(layer: CadLayer): string {
  if (layer.color.method === "rgb" && layer.color.rgb) {
    return `rgb(${layer.color.rgb[0]}, ${layer.color.rgb[1]}, ${layer.color.rgb[2]})`;
  }
  if (layer.color.method === "aci" && layer.color.aci != null) {
    if (layer.color.aci === 7) return "#ffffff";
    const rgb = ACI_COLOR_TABLE[layer.color.aci];
    if (rgb) {
      return `rgb(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)})`;
    }
  }
  return "#3b82f6";
}

export const CadV2LayerPanel: React.FC<CadV2LayerPanelProps> = ({
  layers,
  onToggleVisibility,
  onToggleAllVisibility,
  onClose,
}) => {
  const [search, setSearch] = useState("");

  const layerList = Object.values(layers);
  const visibleCount = layerList.filter((l) => l.visible).length;
  const filteredLayers = layerList.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute top-4 left-4 right-4 sm:right-auto sm:left-16 z-20 w-auto sm:w-80 max-h-[calc(100%-2rem)] flex flex-col bg-neutral-900/95 border border-neutral-800 shadow-2xl rounded-2xl backdrop-blur-2xl text-neutral-200 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
      {/* Başlık */}
      <div className="flex items-center justify-between p-3.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Katmanlar</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
            {layerList.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-neutral-400 hover:text-white rounded-lg"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Arama */}
      <div className="p-2.5 border-b border-neutral-800/80">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Katman ara..."
            className="pl-8 h-8 text-xs bg-neutral-950/60 border-neutral-800 focus-visible:ring-amber-500/50 rounded-xl"
          />
        </div>
      </div>

      {/* Tümünü Göster / Gizle Hızlı Eylem */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800/60 bg-neutral-950/40 text-[11px]">
        <span className="text-neutral-400">
          Görünür: <strong className="text-neutral-200">{visibleCount}</strong> / {layerList.length}
        </span>
        {onToggleAllVisibility && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleAllVisibility(true)}
              className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              Tümünü Göster
            </button>
            <span className="text-neutral-600">|</span>
            <button
              type="button"
              onClick={() => onToggleAllVisibility(false)}
              className="text-neutral-400 hover:text-neutral-300 font-medium cursor-pointer"
            >
              Tümünü Gizle
            </button>
          </div>
        )}
      </div>

      {/* Katman Listesi */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 max-h-96">
        {filteredLayers.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">Katman bulunamadı</div>
        ) : (
          filteredLayers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleVisibility(layer.id, !layer.visible)}
                  className="h-6 w-6 text-neutral-400 hover:text-white rounded-md shrink-0"
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-neutral-600" />
                  )}
                </Button>

                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40 shadow-sm"
                  style={{ backgroundColor: getLayerColorCss(layer) }}
                  title={`Renk: ${layer.color.method === "aci" ? `ACI ${layer.color.aci}` : "RGB"}`}
                />

                <span
                  className={`truncate font-medium ${
                    layer.visible ? "text-neutral-200" : "text-neutral-500"
                  }`}
                  title={layer.name}
                >
                  {layer.name}
                </span>
              </div>

              <div className="flex items-center gap-1 text-neutral-600 shrink-0">
                {layer.frozen && (
                  <span title="Donuk">
                    <Snowflake className="h-3 w-3 text-blue-400/80" />
                  </span>
                )}
                {layer.locked && (
                  <span title="Kilitli">
                    <Lock className="h-3 w-3 text-amber-500/80" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
