// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ GÖRSEL GÖRÜNTÜLEYİCİ (IMAGE VIEWER)
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DokImageViewerProps {
  accessUrl: string;
  displayName: string;
}

export function DokImageViewer({ accessUrl, displayName }: DokImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sürükleme (Pan) Durumu
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setLoading(false);
  };

  const handleImageError = () => {
    setError("Görsel yüklenirken bir hata oluştu veya bağlantı süresi doldu.");
    setLoading(false);
  };

  // Zoom to Fit
  const handleFitScreen = useCallback(() => {
    if (!containerRef.current || !naturalSize) return;
    const containerWidth = containerRef.current.clientWidth - 48;
    const containerHeight = containerRef.current.clientHeight - 48;

    const widthRatio = containerWidth / naturalSize.width;
    const heightRatio = containerHeight / naturalSize.height;
    const fitRatio = Math.min(widthRatio, heightRatio, 1);

    setScale(Math.max(fitRatio, 0.2));
  }, [naturalSize]);

  useEffect(() => {
    if (naturalSize) {
      handleFitScreen();
    }
  }, [naturalSize, handleFitScreen]);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((prev) => Math.min(Math.max(prev + delta, 0.1), 5.0));
  };

  // Pan (Sürükleme) Olayları
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX + containerRef.current.scrollLeft,
      y: e.clientY + containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    containerRef.current.scrollLeft = dragStart.x - e.clientX;
    containerRef.current.scrollTop = dragStart.y - e.clientY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // CSS Transform Hesabı
  const transformStyle = {
    transform: `scale(${scale}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    transition: isDragging ? "none" : "transform 0.15s ease-out",
  };

  return (
    <div className="flex h-full min-h-[550px] w-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* Görsel Araç Çubuğu (Toolbar) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs backdrop-blur-md">
        {/* Sol Alan: Çözünürlük ve Piksel Bilgisi */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {naturalSize ? (
            <span className="font-mono text-[11px] text-zinc-300">
              {naturalSize.width} × {naturalSize.height} px
            </span>
          ) : (
            <span>Görsel Yükleniyor...</span>
          )}
        </div>

        {/* Sağ Alan: Zoom, Döndürme, Aynalama, Zemin */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom Kontrolleri */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.1))}
            className="h-8 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            title="Uzaklaştır (%-20)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="min-w-[44px] text-center text-[11px] font-medium text-zinc-300">
            {Math.round(scale * 100)}%
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(s + 0.2, 5.0))}
            className="h-8 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            title="Yakınlaştır (%+20)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFitScreen}
            className="hidden sm:inline-flex h-8 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
            title="Ekrana Sığdır"
          >
            Sığdır
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale(1)}
            className="hidden sm:inline-flex h-8 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
            title="%100 Orijinal Boyut"
          >
            %100
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Döndürme */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
            title="Sola Döndür (-90°)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
            title="Sağa Döndür (+90°)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Aynalama */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFlipH((f) => !f)}
            className={`h-8 w-8 p-0 ${flipH ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Yatay Aynala (Flip Horizontal)"
          >
            <FlipHorizontal className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFlipV((f) => !f)}
            className={`h-8 w-8 p-0 ${flipV ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Dikey Aynala (Flip Vertical)"
          >
            <FlipVertical className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Şeffaflık Izgarası (Checkerboard) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCheckerboard((c) => !c)}
            className={`h-8 w-8 p-0 ${showCheckerboard ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Şeffaflık Izgarasını Aç/Kapat"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ana Görsel Görüntüleme Alanı */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative flex flex-1 items-center justify-center overflow-auto p-6 sm:p-10 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${
          showCheckerboard
            ? "bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-zinc-950"
            : "bg-zinc-950"
        }`}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">Görsel yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">Görsel Yüklenemedi</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
          </div>
        )}

        <img
          ref={imageRef}
          src={accessUrl}
          alt={displayName}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={transformStyle}
          className={`max-w-none origin-center rounded shadow-2xl transition-opacity duration-200 pointer-events-none select-none ${
            loading ? "opacity-0" : "opacity-100"
          }`}
          draggable={false}
        />
      </div>
    </div>
  );
}
