"use client";

import { useMemo } from "react";
import { BELGE_PROFILE_FIELD_MAP } from "@/lib/belge-hesap/field-map";
import type { BelgeDocumentId } from "@/lib/belge-ux-config";
import type { BelgeProfile } from "@/lib/belge-hesap/profile-schema";
import { resolveBelgeBaseData } from "@/lib/belge-hesap/resolve-base-data";

const NAMES: Record<string, string> = {
  tc_kimlik_no: "T.C.",
  tc_deger: "T.C.",
  telefon: "telefon",
  iletisim_deger: "telefon",
  tel: "telefon",
  adres: "adres",
  adres_deger: "adres",
  santiye_sefi_ad_soyad: "ad soyad",
  santiye_sefi_ad: "ad soyad",
  ad_soyad: "ad soyad",
};

/** Informational only: does not block download, printing, sharing or PDF preview. */
export function BelgeProfileSampleNotice({
  documentId, profile, warning, values,
}: {
  documentId: BelgeDocumentId;
  profile: BelgeProfile | null;
  warning: boolean;
  values: object;
}) {
  const missing = useMemo(() => {
    if (!profile) return [];
    const names = new Set<string>();
    const samples = resolveBelgeBaseData(documentId, null).data;
    const current = values as Record<string, unknown>;
    for (const [field, mapper] of Object.entries(BELGE_PROFILE_FIELD_MAP[documentId])) {
      if (!mapper || mapper(profile) || String(current[field] ?? "") !== samples[field]) continue;
      const label = NAMES[field];
      if (label) names.add(label);
    }
    return Array.from(names);
  }, [documentId, profile, values]);
  if (!warning && missing.length === 0) return null;
  return (
    <p data-testid="belge-profile-sample-notice" role="status"
      className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[11px] leading-snug text-amber-800 dark:text-amber-300">
      {warning
        ? "Profil yüklenemedi. Misafir/örnek bilgiler kullanılıyor; PDF'yi kontrol edin."
        : "Eksik profil bilgileri örnek değerlerle tamamlandı: " + missing.join(", ") + ". Çıktı almadan önce kontrol edin."}
    </p>
  );
}
