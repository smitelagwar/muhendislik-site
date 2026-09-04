// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — CAD FÜTÜRİSTİK AI YÜKLEME ANİMASYONU BİLEŞENİ
// Dribbble Referansı: AI technology product loading animation
// Tam karanlık (pure pitch black), büyütülmüş kristal küre animasyonu ve sade "yükleniyor..."
// ============================================================================

"use client";

import React, { useState } from "react";

interface CadTechnologyLoaderProps {
  message?: string;
  elapsedSeconds?: number;
  onCancel?: () => void;
  fileName?: string;
}

export function CadTechnologyLoader({
  elapsedSeconds = 0,
  onCancel,
}: CadTechnologyLoaderProps) {
  const [videoError, setVideoError] = useState(false);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black select-none transition-opacity duration-300"
      data-testid="cad-loading-overlay"
      aria-label="CAD çizimi yükleniyor"
      role="status"
    >
      {/* ── BÜYÜTÜLMÜŞ MERKEZ ANİMASYONU ── */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative w-[340px] h-[255px] sm:w-[460px] sm:h-[345px] md:w-[540px] md:h-[405px] flex items-center justify-center overflow-hidden">
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/images/cad/cad-ai-loader-poster.png"
              onError={() => setVideoError(true)}
              className="w-full h-full object-contain pointer-events-none drop-shadow-[0_0_35px_rgba(99,102,241,0.35)]"
            >
              <source src="/images/cad/cad-ai-loader.webm" type="video/webm" />
              <source src="/images/cad/cad-ai-loader.mp4" type="video/mp4" />
            </video>
          ) : (
            /* CSS / SVG 6'lı Ters Piramit Kristal Küre Yedeği */
            <div className="relative flex flex-col items-center gap-5 py-6">
              {/* Üst Sıra: 3 Küre */}
              <div className="flex items-center gap-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={`orb-top-${i}`}
                    className="h-11 w-11 rounded-full bg-gradient-to-b from-blue-400/30 to-indigo-900/70 border border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.7),inset_0_0_10px_rgba(255,255,255,0.6)] animate-pulse"
                    style={{ animationDelay: `${i * 180}ms` }}
                  />
                ))}
              </div>
              {/* Orta Sıra: 2 Küre */}
              <div className="flex items-center gap-5">
                {[0, 1].map((i) => (
                  <div
                    key={`orb-mid-${i}`}
                    className="h-11 w-11 rounded-full bg-gradient-to-b from-indigo-400/30 to-purple-900/70 border border-indigo-400/60 shadow-[0_0_20px_rgba(129,140,248,0.7),inset_0_0_10px_rgba(255,255,255,0.6)] animate-pulse"
                    style={{ animationDelay: `${360 + i * 180}ms` }}
                  />
                ))}
              </div>
              {/* Alt Sıra: 1 Küre */}
              <div className="flex items-center">
                <div
                  className="h-11 w-11 rounded-full bg-gradient-to-b from-purple-400/30 to-indigo-950/80 border border-purple-400/60 shadow-[0_0_24px_rgba(168,85,247,0.7),inset_0_0_12px_rgba(255,255,255,0.7)] animate-pulse"
                  style={{ animationDelay: "720ms" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── SADE VE ŞIK "yükleniyor..." YAZISI ── */}
        <p
          className="-mt-2 sm:-mt-4 text-xs sm:text-sm font-light tracking-[0.3em] text-zinc-400/90 font-sans select-none animate-pulse lowercase"
          data-testid="cad-loading-phase-text"
        >
          yükleniyor...
        </p>

        {/* Gizli erişilebilirlik ve test sayacı */}
        <span className="sr-only" data-testid="cad-loading-elapsed">
          {elapsedSeconds > 0 ? `${elapsedSeconds} saniye geçti` : "Yükleniyor..."}
        </span>

        {/* Minimalist İptal Aksiyonu */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            data-testid="cad-loading-cancel"
            className="pointer-events-auto mt-4 text-[11px] font-sans tracking-widest text-zinc-700 transition-colors hover:text-zinc-400 uppercase cursor-pointer"
          >
            İptal Et
          </button>
        )}
      </div>
    </div>
  );
}

