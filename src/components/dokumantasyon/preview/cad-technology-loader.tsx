// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — CAD FÜTÜRİSTİK AI YÜKLEME ANİMASYONU BİLEŞENİ
// Dribbble Referansı: AI technology product loading animation
// Tam karanlık (pure pitch black), büyütülmüş kristal küreler, sıfır takılma (seamless WebP)
// Mobil ve masaüstü mükemmel uyumlu responsive tasarım
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
  const [mediaError, setMediaError] = useState(false);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-black select-none transition-opacity duration-300"
      data-testid="cad-loading-overlay"
      aria-label="CAD çizimi yükleniyor"
      role="status"
    >
      {/* ── BÜYÜTÜLMÜŞ MERKEZ ANİMASYONU (MOBİL & MASAÜSTÜ KUSURSUZ UYUM) ── */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative w-[min(92vw,440px)] aspect-[4/3] sm:w-[560px] sm:h-[420px] md:w-[680px] md:h-[510px] lg:w-[780px] lg:h-[585px] flex items-center justify-center overflow-hidden">
          {/* Donanım hızlandırmalı yumuşak arka plan aydınlatması (per-frame GPU drop-shadow yerine sıfır maliyetli ambiyans) */}
          <div
            className="pointer-events-none absolute -inset-6 sm:-inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.22)_0%,_rgba(59,130,246,0.06)_45%,_transparent_70%)] blur-2xl"
            aria-hidden="true"
          />

          {!mediaError ? (
            <picture className="w-full h-full flex items-center justify-center">
              <source srcSet="/images/cad/cad-ai-loader.webp" type="image/webp" />
              <img
                src="/images/cad/cad-ai-loader.webp"
                alt="CAD çizimi yükleniyor"
                width={560}
                height={420}
                fetchPriority="high"
                decoding="async"
                onError={() => setMediaError(true)}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </picture>
          ) : (
            /* CSS / SVG 6'lı Ters Piramit Kristal Küre Yedeği */
            <div className="relative flex flex-col items-center gap-6 py-6 scale-110 sm:scale-125">
              {/* Üst Sıra: 3 Küre */}
              <div className="flex items-center gap-5 sm:gap-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={`orb-top-${i}`}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-b from-blue-400/30 to-indigo-900/70 border border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.7),inset_0_0_10px_rgba(255,255,255,0.6)] animate-pulse"
                    style={{ animationDelay: `${i * 180}ms` }}
                  />
                ))}
              </div>
              {/* Orta Sıra: 2 Küre */}
              <div className="flex items-center gap-5 sm:gap-6">
                {[0, 1].map((i) => (
                  <div
                    key={`orb-mid-${i}`}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-b from-indigo-400/30 to-purple-900/70 border border-indigo-400/60 shadow-[0_0_20px_rgba(129,140,248,0.7),inset_0_0_10px_rgba(255,255,255,0.6)] animate-pulse"
                    style={{ animationDelay: `${360 + i * 180}ms` }}
                  />
                ))}
              </div>
              {/* Alt Sıra: 1 Küre */}
              <div className="flex items-center">
                <div
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-b from-purple-400/30 to-indigo-950/80 border border-purple-400/60 shadow-[0_0_24px_rgba(168,85,247,0.7),inset_0_0_12px_rgba(255,255,255,0.7)] animate-pulse"
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

        {/* Minimalist İptal Aksiyonu (Mobilde de rahat tıklanabilir dokunma alanı) */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            data-testid="cad-loading-cancel"
            className="pointer-events-auto mt-4 px-3 py-2 text-[11px] sm:text-xs font-sans tracking-widest text-zinc-600 transition-colors hover:text-zinc-300 uppercase cursor-pointer"
          >
            İptal Et
          </button>
        )}
      </div>
    </div>
  );
}

