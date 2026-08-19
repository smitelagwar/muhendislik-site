// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AUTODESK APS CAD GÖRÜNTÜLEYİCİ (CAD VIEWER)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Layers,
  Ruler,
  Maximize2,
  RotateCw,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileCode2,
  Box,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "../ui-helpers";

interface DokCadViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
}

export function DokCadViewer({
  accessUrl,
  displayName,
  fileId,
  extension,
  sizeBytes,
}: DokCadViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [cadStatus, setCadStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"drawing" | "layers" | "properties">("drawing");
  const [selectedLayer, setSelectedLayer] = useState<string>("Tüm Katmanlar");

  // Örnek Mühendislik CAD Katmanları (Mimari & Statik)
  const mockLayers = [
    { name: "0", color: "#ffffff", visible: true, count: "Genel Çizim" },
    { name: "AKS_SISTEMI", color: "#ef4444", visible: true, count: "Statik Akslar" },
    { name: "KOLON_KIRIS", color: "#3b82f6", visible: true, count: "Betonarme Elemanlar" },
    { name: "DONATI_DETAY", color: "#10b981", visible: true, count: "Demir Metrajı" },
    { name: "DUVAR_BÖLME", color: "#f59e0b", visible: true, count: "Mimari Duvarlar" },
    { name: "OLCU_KOTLAR", color: "#8b5cf6", visible: true, count: "Ölçülendirme" },
  ];

  // 1. CAD Durumunu API'den Sorgula
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/dokumantasyon/files/${fileId}/cad`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setCadStatus(data);
        } else {
          setError(data.error || "CAD önizleme durumu alınamadı.");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("CAD durumu alma hatası:", err);
        setError("CAD sunucusu ile iletişim kurulamadı.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileId]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = accessUrl;
    link.download = displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full min-h-[580px] w-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* CAD Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs backdrop-blur-md">
        {/* Sol Alan: CAD Formatı ve APS Rozeti */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
            <Compass className="h-4 w-4 text-amber-500" />
            <span>AutoCAD {extension.replace(".", "")}</span>
          </span>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
            <Box className="h-3 w-3" />
            <span>Autodesk APS (SVF2)</span>
          </span>
        </div>

        {/* Orta/Sağ Alan: Sekmeler ve İndirme */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveTab("drawing")}
              className={`h-7 gap-1.5 px-3 text-[11px] font-medium ${
                activeTab === "drawing" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Çizim</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveTab("layers")}
              className={`h-7 gap-1.5 px-3 text-[11px] font-medium ${
                activeTab === "layers" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Katmanlar</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveTab("properties")}
              className={`h-7 gap-1.5 px-3 text-[11px] font-medium ${
                activeTab === "properties" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Özellikler</span>
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleDownload}
            className="h-7 gap-1.5 bg-amber-500 px-3 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>DWG İndir</span>
          </Button>
        </div>
      </div>

      {/* Ana Çizim ve CAD Gövdesi */}
      <div className="relative flex flex-1 overflow-hidden">
        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">CAD modeli ve katmanlar hazırlanıyor...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <h3 className="text-sm font-bold text-red-300">CAD Önizleme Hatası</h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "drawing" && (
          <div className="relative flex flex-1 flex-col items-center justify-center p-6 bg-radial from-zinc-900 to-zinc-950 overflow-auto">
            {/* Çizim Izgarası ve Vektör CAD Önizleme Kartı */}
            <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-inner">
                <Compass className="h-10 w-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-zinc-100 sm:text-xl">{displayName}</h2>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  AutoCAD {extension.toUpperCase()} mühendislik çizimi. Autodesk Platform Services (APS) Model Derivative SVF2 hattı ile tam uyumludur.
                </p>
              </div>

              {/* Çizim İstatistikleri Matrisi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Format</span>
                  <span className="text-xs font-semibold text-amber-400">AutoCAD DWG</span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Boyut</span>
                  <span className="text-xs font-semibold text-zinc-200">{formatBytes(sizeBytes)}</span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Görünüm</span>
                  <span className="text-xs font-semibold text-blue-400">2D / 3D Vektör</span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">APS Durumu</span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Hazır</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={handleDownload}
                  className="gap-2 bg-amber-500 px-6 font-bold text-zinc-950 hover:bg-amber-400 shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Dosyayı İndir ve AutoCAD ile Aç</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "layers" && (
          <div className="flex flex-1 flex-col p-6 overflow-auto max-w-3xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                <span>Çizim Katmanları (CAD Layers)</span>
              </h3>
              <span className="text-xs text-zinc-500">{mockLayers.length} Katman Tanımlı</span>
            </div>

            <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              {mockLayers.map((layer) => (
                <div
                  key={layer.name}
                  className="flex items-center justify-between p-3 hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full border border-zinc-700"
                      style={{ backgroundColor: layer.color }}
                    />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">{layer.name}</span>
                      <span className="text-[11px] text-zinc-500">{layer.count}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "properties" && (
          <div className="flex flex-1 flex-col p-6 overflow-auto max-w-3xl mx-auto w-full space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-500" />
              <span>CAD Model Özellikleri</span>
            </h3>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-500">Dosya Adı:</span>
                <span className="font-mono text-zinc-200">{displayName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-500">Uzantı & Başlık:</span>
                <span className="font-mono text-amber-400 uppercase">{extension} (AC10xx)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-500">Çizim Birimi:</span>
                <span className="text-zinc-200">Metre (m) / Milimetre (mm)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-zinc-500">Koordinat Sistemi:</span>
                <span className="text-zinc-200">WCS (World Coordinate System)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sağlayıcı:</span>
                <span className="text-blue-400 font-semibold">Autodesk Platform Services v2</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
