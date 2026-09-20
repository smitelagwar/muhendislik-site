// ============================================================================
// DWG/DXF MOTOR V2 — STATUS BAR
// ============================================================================

"use client";

import React from "react";
import { Compass, ZoomIn } from "lucide-react";

export interface CadV2StatusBarProps {
  coords: [number, number];
  zoomPercent: number;
  activeLayoutName?: string;
  layouts?: string[];
  onSelectLayout?: (layoutName: string) => void;
  entityCount?: number;
}

export const CadV2StatusBar: React.FC<CadV2StatusBarProps> = ({
  coords,
  zoomPercent,
  activeLayoutName = "Model",
  layouts,
  onSelectLayout,
  entityCount,
}) => {
  return (
    <footer className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 z-10 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-1.5 bg-neutral-900/90 border border-neutral-800/80 rounded-xl shadow-lg backdrop-blur-xl pointer-events-auto text-xs text-neutral-400 font-mono">
        <div className="hidden sm:flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-amber-500" />
          <span>
            X: <strong className="text-neutral-200">{coords[0].toFixed(2)}</strong>
          </span>
          <span className="text-neutral-600">|</span>
          <span>
            Y: <strong className="text-neutral-200">{coords[1].toFixed(2)}</strong>
          </span>
        </div>

        <div className="hidden sm:block w-[1px] h-3 bg-neutral-800" />

        <div className="flex items-center gap-1.5">
          <ZoomIn className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-neutral-200 font-semibold">{Math.round(zoomPercent)}%</span>
        </div>

        {entityCount != null && (
          <>
            <div className="w-[1px] h-3 bg-neutral-800" />
            <span className="hidden sm:inline text-neutral-400">
              Varlık: <strong className="text-neutral-200">{entityCount}</strong>
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-neutral-900/90 border border-neutral-800/80 rounded-xl shadow-lg backdrop-blur-xl pointer-events-auto text-xs">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          MOTOR V2
        </span>
        {layouts && layouts.length > 1 ? (
          <select
            value={activeLayoutName}
            onChange={(e) => onSelectLayout?.(e.target.value)}
            className="bg-neutral-950/80 text-neutral-200 font-medium text-xs focus:outline-none cursor-pointer border border-neutral-700/60 rounded-lg px-2 py-0.5 hover:border-amber-500/50 transition-colors"
            aria-label="Pafta seçimi"
          >
            {layouts.map((name) => (
              <option key={name} value={name} className="bg-neutral-900 text-neutral-200">
                {name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-neutral-300 font-medium">{activeLayoutName}</span>
        )}
      </div>
    </footer>
  );
};
