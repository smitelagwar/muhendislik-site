"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import type { UseBelgeAutoDraftReturn } from "@/hooks/use-belge-auto-draft";
import { BELGE_UX_FLAGS } from "@/lib/belge-ux-config";

export interface BelgeStudioDraftControlsProps {
  draftApi: UseBelgeAutoDraftReturn;
}

/**
 * Belge Stüdyosu — Minimal Taslak Şeridi (V3)
 *
 * V3 Sözleşmesi:
 * - Normal kullanımda hiçbir izin / geri yükleme banner'ı gösterilmez.
 * - Yalnızca engellemeyen hata veya çakışma durumunda minimal bilgi sağlar.
 */
export function BelgeStudioDraftControls(_props: BelgeStudioDraftControlsProps) {
  // V3 kuralları: Üstte banner veya izin şeridi bulunmaz, durum üst barda tek rozetle gösterilir.
  void _props;
  return null;
}

export interface BelgeSaveStatusIconProps extends React.SVGProps<SVGSVGElement> {
  status: "idle" | "saving" | "saved";
}

/**
 * Saat yönünde 8 dış ışın çubuğu (0 = 12:00 ... 7 = 10:30)
 * Koordinatlar: kaydedildi_isikli_tik.svg referans alınarak normalize edilmiştir.
 */
const RAYS = [
  { id: 0, d: "M16 3.5v2.5", isUpper: true, rayClass: "save-ray-0" },        // 12:00
  { id: 1, d: "M24.8 7.2l-1.8 1.8", isUpper: true, rayClass: "save-ray-1" }, // 1:30
  { id: 2, d: "M26 16h2.5", isUpper: true, rayClass: "save-ray-2" },          // 3:00
  { id: 3, d: "M23 23l1.8 1.8", isUpper: false, rayClass: "save-ray-3" },     // 4:30
  { id: 4, d: "M16 26v2.5", isUpper: false, rayClass: "save-ray-4" },         // 6:00
  { id: 5, d: "M9 23l-1.8 1.8", isUpper: false, rayClass: "save-ray-5" },     // 7:30
  { id: 6, d: "M3.5 16H6", isUpper: true, rayClass: "save-ray-6" },          // 9:00
  { id: 7, d: "M7.2 7.2l1.8 1.8", isUpper: true, rayClass: "save-ray-7" },   // 10:30
];

/**
 * Belge Kaydetme Durumu İkonu (Vektörel Mikro-Animasyon)
 *
 * Durumlar:
 * 1. idle: Sönük / sakin pasif görünüm.
 * 2. saving: Çubuklar saat yönünde sırayla yanıp söner (akıcı chase/radar döngüsü).
 * 3. saved: Çubuklar sakinleşir, merkezdeki tik işareti hafif fade+scale ile belirir.
 */
export function BelgeSaveStatusIcon({
  status,
  className = "h-6 w-6",
  ...props
}: BelgeSaveStatusIconProps) {
  const isSpinning = status === "saving";
  const isSaved = status === "saved";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={`belge-save-status-svg ${isSpinning ? "belge-save-spinning" : ""} ${className}`}
      {...props}
    >
      {/* 8 Dış Çubuk */}
      <g strokeWidth={2.6} strokeLinecap="round">
        {RAYS.map((ray) => {
          let rayClass = "";
          if (isSpinning) {
            rayClass = ray.rayClass;
          } else if (isSaved) {
            rayClass = ray.isUpper ? "belge-save-settled-upper" : "belge-save-settled-lower";
          } else {
            rayClass = ray.isUpper
              ? "stroke-emerald-600/35 dark:stroke-emerald-400/30"
              : "stroke-emerald-500/25 dark:stroke-emerald-400/20";
          }

          return <path key={ray.id} d={ray.d} className={rayClass} />;
        })}
      </g>

      {/* Merkez Onay Tik İşareti */}
      <path
        d="m9.9 16.3 4.2 4.0 6.7-7.2"
        strokeWidth={3.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`belge-save-check ${isSaved ? "check-enter" : "check-hidden"}`}
      />
    </svg>
  );
}

/**
 * Belge Stüdyosu — Üst Bar Minimal Taslak Durum Rozeti (İkon Tabanlı Mikro-Etkileşim)
 *
 * Kurallar:
 * 1. Görünür metin ("Kaydedildi", "Kaydediliyor") tamamen kaldırılmıştır.
 * 2. Form değişikliği algılandığında ve kayıt sürecinde saat yönünde dönen çubuk animasyonu çalışır.
 * 3. Kayıt tamamlandığında zarifçe merkezde tik belirir ve çubuklar sakinleşir.
 * 4. Pasif (idle) durumda üst barı meşgul etmez, çok hafif / sönük kalır.
 * 5. Hata / çakışma durumunda dikkat çekici uyarı ikonu gösterilir.
 * 6. Erişilebilirlik için sr-only gizli durum metni ve aria-label korunur.
 */
export function BelgeStudioDraftStatusBadge({ draftApi }: BelgeStudioDraftControlsProps) {
  if (!BELGE_UX_FLAGS.DRAFT) return null;

  const { lifecycleState, isSaving, errorMessage, retrySave } = draftApi;

  // Düzenleme / Kaydetme bekleniyor veya yapılıyor durumu
  if (isSaving || lifecycleState === "saving" || lifecycleState === "dirty") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 transition-colors select-none"
        title="Taslak kaydediliyor…"
        role="status"
        aria-label="Taslak kaydediliyor"
      >
        <BelgeSaveStatusIcon status="saving" className="h-6 w-6 sm:h-[26px] sm:w-[26px]" />
        <span role="status" aria-live="polite" className="sr-only">
          Kaydediliyor…
        </span>
      </div>
    );
  }

  // Başarıyla kaydedildi durumu
  if (lifecycleState === "saved") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center rounded-lg border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors select-none"
        title="Taslak bu tarayıcıda güvenle kaydedildi"
        role="status"
        aria-label="Taslak bu tarayıcıda güvenle kaydedildi"
      >
        <BelgeSaveStatusIcon status="saved" className="h-6 w-6 sm:h-[26px] sm:w-[26px]" />
        <span role="status" aria-live="polite" className="sr-only">
          Kaydedildi
        </span>
      </div>
    );
  }

  // Kayıt hatası durumu
  if (lifecycleState === "save-error") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[40px] items-center gap-1.5 px-2 py-1 text-xs text-destructive select-none rounded-lg border border-destructive/20 bg-destructive/5"
        title={errorMessage || "Taslak kaydedilemedi"}
        role="status"
        aria-label="Taslak kaydedilemedi"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="sr-only">Kaydedilemedi</span>
        <button
          type="button"
          onClick={retrySave}
          className="text-[11px] font-bold underline hover:opacity-85 cursor-pointer"
          aria-label="Kaydetmeyi tekrar dene"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  // Çoklu sekme çakışma durumu
  if (lifecycleState === "conflict") {
    return (
      <div
        data-testid="belge-draft-status-badge"
        className="inline-flex min-h-[36px] sm:min-h-[40px] items-center gap-1.5 px-2 py-1 text-xs text-amber-600 dark:text-amber-400 select-none rounded-lg border border-amber-500/20 bg-amber-500/5"
        title="Başka bir sekmede taslak güncellendi"
        role="status"
        aria-label="Başka bir sekmede taslak güncellendi"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-[11px]">Çakışma</span>
      </div>
    );
  }

  // Varsayılan / booting / idle: Sakin, sönük pasif görünüm (yükseklik/düzen itmez)
  return (
    <div
      data-testid="belge-draft-status-badge"
      className="inline-flex min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] items-center justify-center rounded-lg select-none opacity-0 sm:opacity-25 hover:opacity-75 transition-opacity"
      title="Otomatik taslak kaydı hazır"
      aria-hidden="true"
    >
      <BelgeSaveStatusIcon status="idle" className="h-6 w-6 sm:h-[26px] sm:w-[26px]" />
    </div>
  );
}
