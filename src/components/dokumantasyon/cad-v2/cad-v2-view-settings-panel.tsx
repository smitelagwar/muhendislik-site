// ============================================================================
// DWG/DXF MOTOR V2 — VIEW SETTINGS PANEL
// ============================================================================

"use client";

import React from "react";
import { X, Moon, Sun, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CadV2ViewSettings {
  monochrome: boolean;
  showLineweights: boolean;
  background: "black" | "darkGray" | "light";
}

export interface CadV2ViewSettingsPanelProps {
  settings: CadV2ViewSettings;
  onUpdateSettings: (newSettings: Partial<CadV2ViewSettings>) => void;
  onClose: () => void;
}

export const CadV2ViewSettingsPanel: React.FC<CadV2ViewSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 sm:right-auto sm:left-16 z-20 w-auto sm:w-72 flex flex-col bg-neutral-900/95 border border-neutral-800 shadow-2xl rounded-2xl backdrop-blur-2xl text-neutral-200 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200">
      <div className="flex items-center justify-between p-3.5 border-b border-neutral-800">
        <span className="font-semibold text-sm">Görünüm Ayarları</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-neutral-400 hover:text-white rounded-lg"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3.5 space-y-4 text-xs">
        {/* Çizim Zemini */}
        <div>
          <span className="text-neutral-400 font-medium block mb-2">Çizim Zemini</span>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950/70 border border-neutral-800/80 rounded-xl">
            <button
              onClick={() => onUpdateSettings({ background: "black" })}
              className={`flex items-center justify-center py-1.5 rounded-lg font-medium transition-colors ${
                settings.background === "black"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Siyah
            </button>
            <button
              onClick={() => onUpdateSettings({ background: "darkGray" })}
              className={`flex items-center justify-center py-1.5 rounded-lg font-medium transition-colors ${
                settings.background === "darkGray"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Koyu Gri
            </button>
            <button
              onClick={() => onUpdateSettings({ background: "light" })}
              className={`flex items-center justify-center py-1.5 rounded-lg font-medium transition-colors ${
                settings.background === "light"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Açık
            </button>
          </div>
        </div>

        {/* Tek Renk (Monochrome) */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="font-medium text-neutral-200">Tek Renk Modu</div>
            <div className="text-[11px] text-neutral-500">AutoCAD siyah/beyaz görünümü</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ monochrome: !settings.monochrome })}
            className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
              settings.monochrome ? "bg-amber-500" : "bg-neutral-800"
            }`}
          >
            <div
              className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                settings.monochrome ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Çizgi Kalınlıkları */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
          <div>
            <div className="font-medium text-neutral-200">Çizgi Kalınlıkları</div>
            <div className="text-[11px] text-neutral-500">Lineweight sunumu</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ showLineweights: !settings.showLineweights })}
            className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
              settings.showLineweights ? "bg-amber-500" : "bg-neutral-800"
            }`}
          >
            <div
              className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                settings.showLineweights ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
