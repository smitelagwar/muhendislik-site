/**
 * Belge Stüdyosu — Akıllı Bölümler, Otomatik Taslak ve PDF Odak Modu Yapılandırması (V3)
 *
 * Bu modül ortamdan bağımsız (pure) yapılandırma sabitlerini, feature flag'lerini
 * ve depolama anahtarlarını barındırır. İçe aktarılırken window veya document'a erişmez.
 */

import { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS } from "./document-field-contracts";

export { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS };

export type BelgeDocumentId = keyof typeof DOCUMENT_EDITABLE_FIELDS;

export const ALL_BELGE_DOCUMENT_IDS = Object.keys(
  DOCUMENT_EDITABLE_FIELDS
) as readonly BelgeDocumentId[];

/**
 * Bağımsız feature flag'ler (build-time & runtime kontrolü)
 */
export const BELGE_UX_FLAGS = {
  ACCORDION: true,
  DRAFT: true,
  FOCUS_MODE: true,
} as const;

/**
 * Taslak depolama modu seçenekleri
 */
export type DraftStorageMode = "device" | "session" | "none";

/**
 * Kullanıcı taslak izin durumu
 */
export type DraftConsentDecision = "device" | "session" | "dismissed";

/**
 * Yaşam döngüsü durumları (UI ve hook için)
 */
export type AutoDraftLifecycleState =
  | "booting"
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "save-error"
  | "conflict"
  | "disabled"
  | "enabled-idle"
  | "consent-pending"
  | "restore-decision";

/**
 * Depolama anahtar ad alanları ve sabitleri
 */
export const BELGE_STORAGE_KEYS = {
  // Mevcut form view (salt okunur referans)
  FORM_VIEW: "belge-studio:form-view:v3",

  // Akıllı bölüm tercihleri (belge başına kapalı bölüm ID'leri)
  SECTIONS_PREFIX: "belgeler:ux:sections:v1:",

  // Otomatik taslak anahtarları (mod ayrımı ile bağımsız ad alanları)
  DRAFT_DEVICE_PREFIX: "belgeler:ux:draft:device:v1:",
  DRAFT_SESSION_PREFIX: "belgeler:ux:draft:session:v1:",
  DRAFT_RECOVERY_PREFIX: "belgeler:ux:draft:recovery:v1:",

  // PII içermeyen onay/tercih anahtarları
  CONSENT_DEVICE: "belgeler:ux:draft-consent:device:v1",
  CONSENT_SESSION: "belgeler:ux:draft-consent:session:v1",
} as const;

/**
 * Zaman ve boyut limitleri
 */
export const BELGE_UX_LIMITS = {
  // Trailing debounce süresi (ms) — V3 kesin sözleşme: 2.000 ms
  AUTOSAVE_DEBOUNCE_MS: 2000,

  // Varsayılan UTF-8 JSON depolama güvenlik sınırı (64 KiB)
  DRAFT_MAX_BYTES: 64 * 1024,

  // Taslak yaş uyarı eşiği: 30 gün (ms)
  DRAFT_STALE_AGE_MS: 30 * 24 * 60 * 60 * 1000,

  // Taslak zarf şema sürümü
  DRAFT_SCHEMA_VERSION: 1,
} as const;

/**
 * Mod ve belge kimliğine göre taslak depolama anahtarını üretir.
 */
export type BelgeDraftScope = { kind: "guest" } | { kind: "account"; accountId: string };
function checkedScopeSuffix(scope: BelgeDraftScope): string {
  if (scope.kind === "guest") return "";
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(scope.accountId)) {
    throw new Error("Geçersiz hesap kimliği.");
  }
  return "acct:" + scope.accountId.toLowerCase() + ":";
}
/** Two-argument guest calls preserve their historical storage keys. */
export function getKeyForMode(
  mode: "device" | "session",
  documentId: BelgeDocumentId,
  scope: BelgeDraftScope = { kind: "guest" },
): string {
  const prefix = mode === "device"
    ? BELGE_STORAGE_KEYS.DRAFT_DEVICE_PREFIX
    : BELGE_STORAGE_KEYS.DRAFT_SESSION_PREFIX;
  return prefix + checkedScopeSuffix(scope) + documentId;
}
export function getScopedRecoveryKey(
  documentId: BelgeDocumentId,
  scope: BelgeDraftScope = { kind: "guest" },
): string {
  return BELGE_STORAGE_KEYS.DRAFT_RECOVERY_PREFIX + checkedScopeSuffix(scope) + documentId;
}

/**
 * Moda göre izin/tercih depolama anahtarını üretir.
 */
export function getConsentKeyForMode(mode: "device" | "session"): string {
  return mode === "device"
    ? BELGE_STORAGE_KEYS.CONSENT_DEVICE
    : BELGE_STORAGE_KEYS.CONSENT_SESSION;
}

/**
 * Belge için bölüm tercihleri depolama anahtarını üretir.
 */
export function getSectionPreferencesKey(documentId: BelgeDocumentId): string {
  return `${BELGE_STORAGE_KEYS.SECTIONS_PREFIX}${documentId}`;
}
