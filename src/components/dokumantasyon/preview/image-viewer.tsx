// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ GÖRSEL GÖRÜNTÜLEYİCİ (IMAGE VIEWER STUDIO)
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Grid,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { StudioCommandButton } from "../studio/studio-command-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DokImageViewerProps {
  accessUrl: string;
  displayName: string;
}

export function DokImageViewer({ accessUrl, displayName }: DokImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [isFitMode, setIsFitMode] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Sürükleme (Pan) Durumu
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setError(null);
    setLoading(false);
  };

  const handleImageError = () => {
    setError("Görsel yüklenirken bir hata oluştu veya bağlantı süresi doldu.");
    setLoading(false);
  };

  // Zoom to Fit
  const handleFitScreen = useCallback(() => {
    if (!containerRef.current || !naturalSize) return;
    const compactViewport = containerRef.current.clientWidth < 640;
    const padding = compactViewport ? 32 : 64;
    const containerWidth = Math.max(containerRef.current.clientWidth - padding, 1);
    const containerHeight = Math.max(containerRef.current.clientHeight - padding, 1);
    const isQuarterTurn = rotation % 180 !== 0;
    const imageWidth = isQuarterTurn ? naturalSize.height : naturalSize.width;
    const imageHeight = isQuarterTurn ? naturalSize.width : naturalSize.height;

    const widthRatio = containerWidth / imageWidth;
    const heightRatio = containerHeight / imageHeight;
    const fitRatio = Math.min(widthRatio, heightRatio, 1);

    setScale(parseFloat(Math.max(fitRatio, 0.2).toFixed(2)));
  }, [naturalSize, rotation]);

  useEffect(() => {
    if (naturalSize && isFitMode) {
      handleFitScreen();
    }
  }, [naturalSize, isFitMode, handleFitScreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !naturalSize) return;
    const observer = new ResizeObserver(() => {
      if (isFitMode) handleFitScreen();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [handleFitScreen, isFitMode, naturalSize]);

  const setCustomScale = useCallback((updater: (current: number) => number) => {
    setIsFitMode(false);
    setScale((current) => parseFloat(Math.min(Math.max(updater(current), 0.1), 5).toFixed(2)));
  }, []);

  const rotate = (direction: 1 | -1) => {
    setRotation((current) => (current + direction * 90 + 360) % 360);
  };

  const resetView = () => {
    setIsFitMode(false);
    setScale(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
      containerRef.current.scrollTop = 0;
    }
  };

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  // Ctrl + Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setCustomScale((current) => current + delta);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [setCustomScale]);

  // Pan (Sürükleme) Olayları
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({
      x: e.clientX + containerRef.current.scrollLeft,
      y: e.clientY + containerRef.current.scrollTop,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    containerRef.current.scrollLeft = dragStart.x - e.clientX;
    containerRef.current.scrollTop = dragStart.y - e.clientY;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  // CSS Transform Hesabı
  const scaledWidth = naturalSize ? naturalSize.width * scale : 0;
  const scaledHeight = naturalSize ? naturalSize.height * scale : 0;
  const isQuarterTurn = rotation % 180 !== 0;
  const transformStyle = {
    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    transition: isDragging ? "none" : "transform 0.15s ease-out",
  };

  return (
    <div data-zoom-mode={isFitMode ? "fit" : "custom"} data-rotation={rotation} className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* Görsel Araç Çubuğu (Toolbar) */}
      <div className="z-30 flex h-11 shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-2 text-xs backdrop-blur-md sm:px-3">
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
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {/* Zoom Kontrolleri */}
          <StudioCommandButton
            commandId="image.zoom.out"
            onClick={() => setCustomScale((current) => current - 0.2)}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<ZoomOut className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.zoom.100"
            onClick={resetView}
            className="h-6 px-1.5 text-[11px] font-mono text-zinc-300 hover:text-zinc-100 rounded-md"
            label={`${Math.round(scale * 100)}%`}
          />

          <StudioCommandButton
            commandId="image.zoom.in"
            onClick={() => setCustomScale((current) => current + 0.2)}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<ZoomIn className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.zoom.fit"
            onClick={() => {
              setIsFitMode(true);
              handleFitScreen();
            }}
            className="inline-flex h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 rounded-md"
            label="Sığdır"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Görsel ek işlemleri" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 sm:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-zinc-900 text-zinc-100">
              <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => rotate(-1)}>Sola döndür</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => rotate(1)}>Sağa döndür</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs" onClick={resetView}>Görünümü sıfırla</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => setFlipH((value) => !value)}>Yatay aynala</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => setFlipV((value) => !value)}>Dikey aynala</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => setShowCheckerboard((value) => !value)}>Şeffaflık zeminini değiştir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden h-4 w-px bg-zinc-800 sm:mx-1 sm:block" />

          {/* Döndürme */}
          <StudioCommandButton
            commandId="image.rotate.ccw"
            onClick={() => rotate(-1)}
            showLabel={false}
            className="hidden h-7 w-7 rounded-md p-0 text-zinc-400 hover:text-zinc-100 sm:inline-flex"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.rotate.cw"
            onClick={() => rotate(1)}
            showLabel={false}
            className="hidden h-7 w-7 rounded-md p-0 text-zinc-400 hover:text-zinc-100 sm:inline-flex"
            icon={<RotateCw className="h-3.5 w-3.5" />}
          />

          <div className="hidden h-4 w-px bg-zinc-800 sm:mx-1 sm:block" />

          {/* Aynalama */}
          <StudioCommandButton
            commandId="image.flip.h"
            onClick={() => setFlipH((f) => !f)}
            active={flipH}
            showLabel={false}
            className="hidden h-7 w-7 rounded-md p-0 text-zinc-400 hover:text-zinc-100 sm:inline-flex"
            icon={<FlipHorizontal className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.flip.v"
            onClick={() => setFlipV((f) => !f)}
            active={flipV}
            showLabel={false}
            className="hidden h-7 w-7 rounded-md p-0 text-zinc-400 hover:text-zinc-100 sm:inline-flex"
            icon={<FlipVertical className="h-3.5 w-3.5" />}
          />

          <div className="hidden h-4 w-px bg-zinc-800 sm:mx-1 sm:block" />

          {/* Şeffaflık Izgarası (Checkerboard) */}
          <StudioCommandButton
            commandId="image.checkerboard"
            onClick={() => setShowCheckerboard((c) => !c)}
            active={showCheckerboard}
            showLabel={false}
            className="hidden h-7 w-7 rounded-md p-0 text-zinc-400 hover:text-zinc-100 sm:inline-flex"
            icon={<Grid className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Görsel Çalışma Alanı (Viewport) */}
      <div
        ref={containerRef}
        data-testid="image-viewer-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className={`relative flex flex-1 touch-none items-start justify-start overflow-auto p-4 sm:p-8 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${
          showCheckerboard
            ? "bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-zinc-950"
            : "bg-zinc-950"
        }`}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">Görsel yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl backdrop-blur-md">
            <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">Görsel Yükleme Hatası</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
            <button type="button" onClick={retryLoad} className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white">Tekrar dene</button>
          </div>
        )}

        {naturalSize && (
          <div
            className="relative m-auto shrink-0"
            style={{ width: isQuarterTurn ? scaledHeight : scaledWidth, height: isQuarterTurn ? scaledWidth : scaledHeight }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              key={loadAttempt}
              src={accessUrl}
              alt={displayName}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ ...transformStyle, width: scaledWidth, height: scaledHeight }}
              className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 origin-center rounded shadow-2xl transition-opacity duration-200 pointer-events-none select-none ${loading ? "opacity-0" : "opacity-100"}`}
            />
          </div>
        )}
        {!naturalSize && (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imageRef} key={loadAttempt} src={accessUrl} alt={displayName} onLoad={handleImageLoad} onError={handleImageError} className="hidden" />
        )}
      </div>
    </div>
  );
}
