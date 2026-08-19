// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ GÖRSEL GÖRÜNTÜLEYİCİ (IMAGE VIEWER STUDIO)
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
  Hand,
  Sparkles,
} from "lucide-react";
import { StudioCommandButton } from "../studio/studio-command-button";

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

    setScale(parseFloat(Math.max(fitRatio, 0.2).toFixed(2)));
  }, [naturalSize]);

  useEffect(() => {
    if (naturalSize) {
      handleFitScreen();
    }
  }, [naturalSize, handleFitScreen]);

  // Ctrl + Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setScale((prev) => {
          const next = Math.min(Math.max(prev + delta, 0.1), 5.0);
          return parseFloat(next.toFixed(2));
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

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
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* Görsel Araç Çubuğu (Toolbar) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs backdrop-blur-md z-30">
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
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Zoom Kontrolleri */}
          <StudioCommandButton
            commandId="image.zoom.out"
            onClick={() => setScale((s) => Math.max(parseFloat((s - 0.2).toFixed(2)), 0.1))}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<ZoomOut className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.zoom.100"
            onClick={() => setScale(1.0)}
            className="h-6 px-1.5 text-[11px] font-mono text-zinc-300 hover:text-zinc-100 rounded-md"
            label={`${Math.round(scale * 100)}%`}
          />

          <StudioCommandButton
            commandId="image.zoom.in"
            onClick={() => setScale((s) => Math.min(parseFloat((s + 0.2).toFixed(2)), 5.0))}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<ZoomIn className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.zoom.fit"
            onClick={handleFitScreen}
            showLabel={false}
            className="hidden sm:inline-flex h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 rounded-md"
            label="Sığdır"
          />

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Döndürme */}
          <StudioCommandButton
            commandId="image.rotate.ccw"
            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.rotate.cw"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<RotateCw className="h-3.5 w-3.5" />}
          />

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Aynalama */}
          <StudioCommandButton
            commandId="image.flip.h"
            onClick={() => setFlipH((f) => !f)}
            active={flipH}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<FlipHorizontal className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.flip.v"
            onClick={() => setFlipV((f) => !f)}
            active={flipV}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<FlipVertical className="h-3.5 w-3.5" />}
          />

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {/* Şeffaflık Izgarası (Checkerboard) */}
          <StudioCommandButton
            commandId="image.checkerboard"
            onClick={() => setShowCheckerboard((c) => !c)}
            active={showCheckerboard}
            showLabel={false}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
            icon={<Grid className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Görsel Çalışma Alanı (Viewport) */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8 ${
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
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
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
        />
      </div>
    </div>
  );
}
