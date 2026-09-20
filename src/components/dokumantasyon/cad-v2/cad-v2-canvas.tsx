// ============================================================================
// DWG/DXF MOTOR V2 — CAD V2 CANVAS & INPUT OVERLAY
// ============================================================================
// Sözleşme: motor_v2/21_ARAYUZ_TASARIM_SISTEMI.md ve 28_PAN_ZOOM_FIT_SOZLESMESI.md
// WebGL Canvas (pointer-events: none) + Şeffaf D3 Input Katmanı (touch-action: none)

"use client";

import React, { useEffect, useRef } from "react";
import { CadV2Renderer } from "@/lib/cad-v2/render/cad-v2-renderer";
import type { CadBBox2D } from "@/lib/cad-v2/canonical/types";
import type { CadCameraState } from "@/lib/cad-v2/interaction/d3-camera-adapter";

export interface CadV2CanvasProps {
  initialBBox?: CadBBox2D;
  backgroundColor?: number;
  onRendererReady?: (renderer: CadV2Renderer) => void;
  onCameraChange?: (state: CadCameraState) => void;
  onPanToolChange?: (active: boolean) => void;
  onMouseMoveCoords?: (worldCoords: [number, number]) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

export const CadV2Canvas: React.FC<CadV2CanvasProps> = ({
  initialBBox = [-500, -500, 500, 500],
  backgroundColor = 0x0f0f11,
  onRendererReady,
  onCameraChange,
  onPanToolChange,
  onMouseMoveCoords,
  onContextLost,
  onContextRestored,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputOverlayRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CadV2Renderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !inputOverlayRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new CadV2Renderer({
      canvas,
      inputOverlay: inputOverlayRef.current,
      initialBBox,
      backgroundColor,
      onCameraChange,
      onPanToolChange,
    });
    rendererRef.current = renderer;

    if (onRendererReady) {
      onRendererReady(renderer);
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      if (onContextLost) onContextLost();
    };
    const handleContextRestored = () => {
      renderer.invalidate();
      if (onContextRestored) onContextRestored();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    // ResizeObserver ile responsive boyutlandırma
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          renderer.resize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      resizeObserver.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !inputOverlayRef.current || !onMouseMoveCoords) return;
    const rect = inputOverlayRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const world = rendererRef.current.getCameraAdapter().worldAt(px, py);
    onMouseMoveCoords(world);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-neutral-950"
      style={{ touchAction: "none" }}
    >
      {/* 1. WebGL2 Render Canvas (pointer-events: none) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* 2. D3 Şeffaf Giriş Katmanı (touch-action: none, overscroll-behavior: contain) */}
      <div
        ref={inputOverlayRef}
        onPointerMove={handlePointerMove}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing focus:outline-none"
        style={{
          zIndex: 2,
          touchAction: "none",
          overscrollBehavior: "contain",
          background: "transparent",
        }}
        tabIndex={0}
        aria-label="CAD V2 Çizim Etkileşim Alanı"
      />
    </div>
  );
};
