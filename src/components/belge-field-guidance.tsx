"use client";

/**
 * Belgeler Field Guidance UI & Evaluator (ASAMA_07)
 *
 * Amaç:
 * - Sol form alanlarının hemen altında ve sağ PDF düzenleme popover'ında
 *   aynı saf evaluator ile tutarlı, az uyarılı ve erişilebilir rehberlik sunmak.
 * - Format hatalarında (TCKN, Tarih, Telefon, Ücret, YİBF) ve fiziksel baskı
 *   okunabilirlik risklerinde (özellikle dar şablonlu uzun adreslerde) kullanıcıyı
 *   nazikçe bilgilendirmek.
 * - Çift uyarı üretmemek; nominal serbest metinlerde sıfır yanlış alarm;
 *   boş veya varsayılan değerleri bozmamak.
 * - Hiçbir uyarı PDF İndir, Yazdır, Temizle, Sıfırla ve Geri Al butonlarını engellemez.
 */

import { memo } from "react";
import { getFieldGuidance } from "@/lib/belgeler-field-guidance";
import type { PdfFieldLayout } from "@/lib/belgeler-pdf-layout";
import { assessFieldReadability } from "@/lib/belgeler-pdf-readability";
import type { BelgeDocumentId } from "@/lib/belge-studio-inline-field-map";

export interface FieldGuidanceItem {
  code: string;
  severity: "info" | "warning";
  message: string;
  source: "format" | "readability";
}

export interface EvaluateFieldGuidanceOptions {
  layout?: PdfFieldLayout;
  /** Alan odak kaybedip blur oldu mu veya onay aşamasında mı? */
  isTouched?: boolean;
  /** Popover onayı veya form gönderimi sırasında tam doğrulama aktif mi? */
  isBlurOrSubmitted?: boolean;
}

/**
 * Sol form ve sağ popup için birleşik, saf alan rehberlik değerlendiricisi.
 */
export function evaluateFieldGuidance(
  documentId: BelgeDocumentId,
  fieldKey: string,
  value: string | undefined | null,
  options?: EvaluateFieldGuidanceOptions
): FieldGuidanceItem | null {
  const raw = value ?? "";
  const trimmed = raw.trim();

  // 1. Boş veya nötr '-' değerler için hiçbir uyarı üretilmez
  if (!trimmed || trimmed === "-") {
    return null;
  }

  const readability = assessFieldReadability(documentId, fieldKey, raw, options?.layout);
  // Ciddi baskı riski, aynı alandaki biçim uyarısının arkasında gizlenmez.
  if (readability.risk === "serious" && readability.message) {
    return { code: readability.code, severity: "warning", message: readability.message, source: "readability" };
  }

  // 2. Semantik format doğrulaması (K, F, T, Y, P)
  const format = getFieldGuidance(documentId, fieldKey, raw);
  if (format) {
    const isBlurredOrSubmitted = options?.isBlurOrSubmitted || options?.isTouched;

    // TCKN özel davranış:
    // Kullanıcı henüz 11 haneyi tamamlamadan yazarken erken kontrol basamağı uyarısı verilmez.
    if (format.code === "tckn-checksum") {
      if (!isBlurredOrSubmitted) {
        // Yazım esnasında erken gürültü yapma
        return null;
      }
    } else if (format.code === "tckn-length" && trimmed.length < 11) {
      if (!isBlurredOrSubmitted) {
        // Henüz 11 hane tamamlanmadan yazarken saldırgan olma
        return null;
      }
    }

    return {
      code: format.code,
      severity: format.severity === "printRisk" ? "warning" : format.severity,
      message: format.message,
      source: "format",
    };
  }

  // 3. Gerçek PDF basım okunabilirliği ve widget geometrisi riski
  if (readability.risk === "possible" && readability.message) {
    return {
      code: readability.code,
      severity: "info",
      message: readability.message,
      source: "readability",
    };
  }

  // Nominal alanlar veya riski bulunmayan alanlar için sıfır uyarı
  return null;
}

export interface BelgeFieldGuidanceViewProps {
  id?: string;
  guidance: FieldGuidanceItem | null;
  className?: string;
}

/**
 * Erişilebilir (aria-live="polite", role="status") alan altı rehberlik mesajı bileşeni.
 */
export const BelgeFieldGuidanceView = memo(function BelgeFieldGuidanceView({
  id,
  guidance,
  className = "",
}: BelgeFieldGuidanceViewProps) {
  if (!guidance || !guidance.message) return null;

  const isWarning = guidance.severity === "warning";

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      data-testid="belge-field-guidance-message"
      data-guidance-code={guidance.code}
      data-guidance-severity={guidance.severity}
      className={`mt-1 rounded px-2 py-1 text-[11px] leading-relaxed break-words transition-all ${
        isWarning
          ? "bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/30"
          : "bg-sky-500/10 text-sky-800 dark:text-sky-200 border border-sky-500/30"
      } ${className}`}
    >
      <span>{guidance.message}</span>
    </div>
  );
});
