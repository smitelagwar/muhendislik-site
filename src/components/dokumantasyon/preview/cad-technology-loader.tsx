// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — CAD FÜTÜRİSTİK AI YÜKLEME ANİMASYONU BİLEŞENİ
// Dribbble Referansı: AI technology product loading animation
// 6'lı ters piramit ışıldayan kristal küreler, hacimsel ışık demetleri ve fütüristik HUD
// ============================================================================

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface CadTechnologyLoaderProps {
  message?: string;
  elapsedSeconds?: number;
  onCancel?: () => void;
  fileName?: string;
}

export function CadTechnologyLoader({
  message,
  elapsedSeconds = 0,
  onCancel,
  fileName,
}: CadTechnologyLoaderProps) {
  const [videoError, setVideoError] = useState(false);

  const displayMessage =
    message && message.trim().length > 0
      ? message
      : "DWG geometrisi ve katmanları çözümleniyor...";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#02040a]/92 backdrop-blur-md select-none transition-all duration-500"
      data-testid="cad-loading-overlay"
      aria-label="CAD çizimi yükleniyor"
      role="status"
    >
      {/* ── ARKA PLAN AMBİYANS IŞIĞI & HACİMSEL KONİ ── */}
      <div className="pointer-events-none absolute -top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl rounded-full cad-ai-light-beam" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-radial from-blue-500/20 via-indigo-900/10 to-transparent blur-2xl rounded-full" />

      {/* ── MERKEZ ANİMASYON ALANI ── */}
      <div className="relative flex flex-col items-center justify-center z-10">
        <div className="relative w-64 h-48 sm:w-72 sm:h-52 flex items-center justify-center overflow-visible cad-ai-loader-cluster">
          {/* Video döngüsü: Dribbble orijinal animasyonunun 60 FPS optimize WebM / MP4 hali */}
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/images/cad/cad-ai-loader-poster.png"
              onError={() => setVideoError(true)}
              className="w-full h-full object-contain pointer-events-none mix-blend-screen drop-shadow-[0_0_25px_rgba(99,102,241,0.45)]"
            >
              <source src="/images/cad/cad-ai-loader.webm" type="video/webm" />
              <source src="/images/cad/cad-ai-loader.mp4" type="video/mp4" />
            </video>
          ) : (
            /* Video başarısız olursa CSS / SVG 6'lı Ters Piramit Kristal Küre Yedeği */
            <div className="relative flex flex-col items-center gap-3 py-4">
              {/* Üst Sıra: 3 Küre */}
              <div className="flex items-center gap-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={`orb-top-${i}`}
                    className="h-9 w-9 rounded-full bg-gradient-to-b from-blue-400/30 to-indigo-900/70 border border-cyan-400/60 shadow-[0_0_16px_rgba(56,189,248,0.7),inset_0_0_8px_rgba(255,255,255,0.6)] animate-pulse"
                    style={{ animationDelay: `${i * 180}ms` }}
                  />
                ))}
              </div>
              {/* Orta Sıra: 2 Küre */}
              <div className="flex items-center gap-4">
                {[0, 1].map((i) => (
                  <div
                    key={`orb-mid-${i}`}
                    className="h-9 w-9 rounded-full bg-gradient-to-b from-indigo-400/30 to-purple-900/70 border border-indigo-400/60 shadow-[0_0_16px_rgba(129,140,248,0.7),inset_0_0_8px_rgba(255,255,255,0.6)] animate-pulse"
                    style={{ animationDelay: `${360 + i * 180}ms` }}
                  />
                ))}
              </div>
              {/* Alt Sıra: 1 Küre */}
              <div className="flex items-center">
                <div
                  className="h-9 w-9 rounded-full bg-gradient-to-b from-purple-400/30 to-indigo-950/80 border border-purple-400/60 shadow-[0_0_18px_rgba(168,85,247,0.7),inset_0_0_10px_rgba(255,255,255,0.7)] animate-pulse"
                  style={{ animationDelay: "720ms" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── FÜTÜRİSTİK BİLGİ & DURUM PANELİ (HUD) ── */}
        <div className="pointer-events-auto mt-2 flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/65 px-6 py-4 text-center shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          {/* Canlı Teknoloji Rozeti */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-[10px] font-semibold tracking-wider text-cyan-300 uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <span>CAD Geometri Motoru</span>
          </div>

          {/* Aşama Metni */}
          <div className="space-y-1">
            <p
              className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug tracking-wide"
              data-testid="cad-loading-phase-text"
            >
              {displayMessage}
            </p>
            {fileName && (
              <p className="text-[11px] text-zinc-400 max-w-[240px] truncate mx-auto font-mono">
                {fileName}
              </p>
            )}
          </div>

          {/* Geçen Süre Sayacı & İlerleme Parıltısı */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span data-testid="cad-loading-elapsed">
                {elapsedSeconds > 0 ? `${elapsedSeconds} saniye geçti` : "Yükleniyor..."}
              </span>
            </div>
          </div>

          {/* İptal Butonu (Test Sözleşmesi ve Kullanıcı Kontrolü İçin) */}
          {onCancel && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-1 h-7 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-[11px] font-medium text-zinc-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              onClick={onCancel}
              data-testid="cad-loading-cancel"
            >
              İptal Et
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
