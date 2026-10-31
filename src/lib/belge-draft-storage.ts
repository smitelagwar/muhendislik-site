/**
 * Belge Stüdyosu — Saf, İki Modlu Taslak Depolama ve Kodlama Çekirdeği (ASAMA_01)
 *
 * Sorumluluklar:
 * - Pure + dependency-injected StorageLike arayüzü ile test edilebilirlik.
 * - Strict şema, allowlist, versiyon, parmak izi (fingerprint) ve prototype pollution koruması.
 * - Cihaz (localStorage) ve sekme (sessionStorage) için izole anahtar ad alanları.
 * - 64 KiB UTF-8 bayt sınır kontrolü ve 30 günlük yaş uyarı sistemi.
 * - Read-back doğrulaması ile sahte başarı (false positive) engelleme.
 * - Monotonik revizyon ve yazar (writer) çakışma analizi.
 * - İçe aktarımda window/document erişimi kesinlikle yoktur (SSR safe).
 */

import {
  ALL_BELGE_DOCUMENT_IDS,
  BELGE_UX_LIMITS,
  getKeyForMode,
  getConsentKeyForMode,
  type BelgeDraftScope,
  type BelgeDocumentId,
  type DraftConsentDecision,
} from "./belge-ux-config";
import {
  DOCUMENT_EDITABLE_FIELDS,
  DOCUMENT_PDF_ONLY_FIELDS,
} from "./document-field-contracts";

/**
 * Bağımlılık enjeksiyonu için soyut depolama arayüzü
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Tarayıcı depolamasını güvenle çözen yardımcı (yalnız istemci tarafında çağrılır)
 */
export function getSafeBrowserStorage(mode: "device" | "session"): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = mode === "device" ? window.localStorage : window.sessionStorage;
    if (!storage) return null;
    if (typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
      return null;
    }
    // Depolama erişimini zararsız bir okuma özelliği ile doğrula (özel gezinti / izin kontrolü).
    // Kota doluyken hata vermemesi için setItem probe'u kullanılmaz.
    void storage.length;
    return storage;
  } catch {
    return null;
  }
}

/**
 * Taslak zarfı (Envelope) veri yapısı
 */
export interface BelgeDraftEnvelope<D extends BelgeDocumentId = BelgeDocumentId> {
  schemaVersion: 1;
  documentId: D;
  fieldSchemaFingerprint: string;
  savedAt: number; // Unix epoch ms
  writerId: string; // Sekmeye özel UUID/kimlik
  revision: number; // Monotonik pozitif tam sayı >= 1
  values: Record<string, string>; // DOCUMENT_EDITABLE_FIELDS tam eşlemesi
  /** Optional for new signed-in drafts; absent for legacy guest drafts. */
  manualFields?: string[];
}

/**
 * Doğrulama hata kodları
 */
export type DraftStorageErrorCode =
  | "INVALID_DATA_TYPE"
  | "PROTOTYPE_POLLUTION"
  | "UNKNOWN_FIELD"
  | "MISSING_FIELD"
  | "FIELD_TYPE_MISMATCH"
  | "UNKNOWN_DOCUMENT"
  | "DOCUMENT_MISMATCH"
  | "SCHEMA_VERSION_MISMATCH"
  | "FINGERPRINT_MISMATCH"
  | "INVALID_SAVED_AT"
  | "INVALID_REVISION"
  | "INVALID_WRITER_ID"
  | "CORRUPT_JSON"
  | "OVERSIZE_LIMIT"
  | "STORAGE_EXCEPTION"
  | "READ_BACK_MISMATCH";

/**
 * Taslak yaş durumu
 */
export interface DraftAgeStatus {
  isStale: boolean;
  ageMs: number;
  ageDays: number;
  warningMessage: string | null;
}

/**
 * Bir belgenin düzenlenebilir alan şemasından kararlı parmak izi (fingerprint) üretir.
 */
export function computeSchemaFingerprint(documentId: BelgeDocumentId): string {
  const fields = DOCUMENT_EDITABLE_FIELDS[documentId];
  if (!fields) return "";
  return `v1:${fields.join(",")}`;
}

/**
 * Metnin UTF-8 bayt uzunluğunu hesaplar.
 */
export function utf8ByteLength(text: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text).length;
  }
  // Node.js fallback
  return Buffer.from(text, "utf8").length;
}

/**
 * Taslağın kayıt yaşını ve 30 günlük bayatlık uyarısını hesaplar.
 * NOT: 30 gün aşılsa dahi veri ASLA otomatik silinmez, yalnızca uyarı döndürülür.
 */
export function draftAgeStatus(
  savedAt: number,
  now: number = Date.now()
): DraftAgeStatus {
  const ageMs = Math.max(0, now - savedAt);
  const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
  const isStale = ageMs > BELGE_UX_LIMITS.DRAFT_STALE_AGE_MS;

  return {
    isStale,
    ageMs,
    ageDays,
    warningMessage: isStale
      ? "Bu taslak 30 günden eski olabilir. Geri yüklemeden önce güncelliğini gözden geçiriniz."
      : null,
  };
}

/**
 * Form değerleri anlık görüntüsünü (snapshot) sıkı kurallarla doğrular:
 * - Prototype pollution engelleme (__proto__, constructor, prototype)
 * - Yalnız belgeye ait DOCUMENT_EDITABLE_FIELDS allowlist'i
 * - Fazla/bilinmeyen alan olamaz (İstifa PDF-only alanları dahil reddedilir)
 * - Eksik alan olamaz (her alan string olmalıdır; boş metin "" kabul edilir)
 * - String tipi dışında hiçbir tip (number, boolean, object vb.) kabul edilmez
 */
export function validateEditableSnapshot(
  documentId: BelgeDocumentId,
  rawValues: unknown
):
  | { ok: true; values: Record<string, string> }
  | { ok: false; error: DraftStorageErrorCode; details: string } {
  if (!rawValues || typeof rawValues !== "object" || Array.isArray(rawValues)) {
    return {
      ok: false,
      error: "INVALID_DATA_TYPE",
      details: "Form değerleri geçerli bir nesne olmalıdır.",
    };
  }

  // Prototype pollution koruması
  const proto = Object.getPrototypeOf(rawValues);
  if (proto !== Object.prototype && proto !== null) {
    return {
      ok: false,
      error: "PROTOTYPE_POLLUTION",
      details: "Nesne prototipi standart Object.prototype veya null olmalıdır.",
    };
  }

  const forbiddenKeys = ["__proto__", "constructor", "prototype"];
  for (const fk of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(rawValues, fk)) {
      return {
        ok: false,
        error: "PROTOTYPE_POLLUTION",
        details: `Yasaklı prototip anahtarı tespit edildi: ${fk}`,
      };
    }
  }

  const expectedFields = DOCUMENT_EDITABLE_FIELDS[documentId];
  if (!expectedFields) {
    return {
      ok: false,
      error: "UNKNOWN_DOCUMENT",
      details: `Bilinmeyen belge kimliği: ${documentId}`,
    };
  }

  const expectedSet = new Set<string>(expectedFields);
  const rawRecord = rawValues as Record<string, unknown>;
  const ownKeys = Object.keys(rawRecord);

  // 1. Bilinmeyen veya fazla alan denetimi
  for (const key of ownKeys) {
    if (!expectedSet.has(key)) {
      // İstifa PDF-only alanları form snapshot'ında bulunamaz
      const isPdfOnly =
        (DOCUMENT_PDF_ONLY_FIELDS[documentId] as readonly string[] | undefined)?.includes(
          key
        ) ?? false;
      return {
        ok: false,
        error: "UNKNOWN_FIELD",
        details: isPdfOnly
          ? `Alana izin verilmiyor (PDF-only sabit etiket form taslağına yazılamaz): ${key}`
          : `Belge şemasında tanımlanmamış alan: ${key}`,
      };
    }
  }

  // 2. Eksik alan denetimi ve tip kontrolü
  const sanitizedValues: Record<string, string> = Object.create(null);

  for (const field of expectedFields) {
    if (!Object.prototype.hasOwnProperty.call(rawRecord, field)) {
      return {
        ok: false,
        error: "MISSING_FIELD",
        details: `Zorunlu düzenlenebilir alan eksik: ${field}`,
      };
    }

    const val = rawRecord[field];
    if (typeof val !== "string") {
      return {
        ok: false,
        error: "FIELD_TYPE_MISMATCH",
        details: `Alan değeri string olmalıdır (${field}: ${typeof val})`,
      };
    }

    sanitizedValues[field] = val;
  }

  return {
    ok: true,
    values: { ...sanitizedValues },
  };
}

/**
 * Geçerli bir taslak zarfı oluşturur.
 */
export function createDraftEnvelope<D extends BelgeDocumentId>(options: {
  documentId: D;
  values: Record<string, string>;
  writerId: string;
  revision: number;
  savedAt?: number;
  manualFields?: readonly string[];
}):
  | { ok: true; envelope: BelgeDraftEnvelope<D> }
  | { ok: false; error: DraftStorageErrorCode; details: string } {
  const { documentId, values, writerId, revision, savedAt = Date.now(), manualFields } = options;

  if (!ALL_BELGE_DOCUMENT_IDS.includes(documentId)) {
    return {
      ok: false,
      error: "UNKNOWN_DOCUMENT",
      details: `Geçersiz belge kimliği: ${documentId}`,
    };
  }

  if (typeof writerId !== "string" || writerId.trim().length === 0) {
    return {
      ok: false,
      error: "INVALID_WRITER_ID",
      details: "writerId geçerli ve boş olmayan bir metin olmalıdır.",
    };
  }

  if (!Number.isSafeInteger(revision) || revision < 1) {
    return {
      ok: false,
      error: "INVALID_REVISION",
      details: "revision 1 veya daha büyük bir pozitif tam sayı olmalıdır.",
    };
  }

  if (typeof savedAt !== "number" || !Number.isFinite(savedAt) || savedAt <= 0) {
    return {
      ok: false,
      error: "INVALID_SAVED_AT",
      details: "savedAt geçerli bir epoch zaman damgası olmalıdır.",
    };
  }

  const validatedSnapshot = validateEditableSnapshot(documentId, values);
  if (!validatedSnapshot.ok) {
    return validatedSnapshot;
  }

  const validatedManual = validateDraftManualFields(documentId, manualFields);
  if (validatedManual === null) {
    return { ok: false, error: "UNKNOWN_FIELD", details: "Taslak alan kökenleri geçersiz." };
  }

  const envelope: BelgeDraftEnvelope<D> = {
    schemaVersion: 1,
    documentId,
    fieldSchemaFingerprint: computeSchemaFingerprint(documentId),
    savedAt,
    writerId: writerId.trim(),
    revision,
    values: validatedSnapshot.values,
    ...(validatedManual === undefined ? {} : { manualFields: validatedManual }),
  };

  return { ok: true, envelope };
}

/** Account drafts carry only known edited field names; guest draft envelopes stay unchanged. */
function validateDraftManualFields(documentId: BelgeDocumentId, values: unknown): string[] | undefined | null {
  if (values === undefined) return undefined;
  if (!Array.isArray(values) || values.length > DOCUMENT_EDITABLE_FIELDS[documentId].length) return null;
  const allow = new Set<string>(DOCUMENT_EDITABLE_FIELDS[documentId]);
  const unique = new Set<string>();
  for (const field of values) {
    if (typeof field !== "string" || !allow.has(field) || unique.has(field)) return null;
    unique.add(field);
  }
  return [...unique];
}

/**
 * Ham JSON metnini veya ayrıştırılmış nesneyi sıkı bir BelgeDraftEnvelope nesnesine ayrıştırır.
 */
export function parseDraft(
  raw: unknown,
  expectedDocumentId?: BelgeDocumentId
):
  | { ok: true; draft: BelgeDraftEnvelope }
  | { ok: false; error: DraftStorageErrorCode; details: string } {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        ok: false,
        error: "CORRUPT_JSON",
        details: "Taslak JSON sözdizimi bozuk veya ayrıştırılamıyor.",
      };
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "INVALID_DATA_TYPE",
      details: "Taslak zarfı bir nesne olmalıdır.",
    };
  }

  // S02: Prototip zinciri bozulmuş veya kalıtılmış nesne koruması
  const proto = Object.getPrototypeOf(parsed);
  if (proto !== Object.prototype && proto !== null) {
    return {
      ok: false,
      error: "PROTOTYPE_POLLUTION",
      details: "Taslak zarfı prototipi standart Object.prototype veya null olmalıdır.",
    };
  }

  // S03: Yasaklı prototip anahtarları denetimi
  const forbiddenKeys = ["__proto__", "constructor", "prototype"];
  for (const fk of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(parsed, fk)) {
      return {
        ok: false,
        error: "PROTOTYPE_POLLUTION",
        details: `Taslak zarfında yasaklı prototip anahtarı tespit edildi: ${fk}`,
      };
    }
  }

  const record = parsed as Record<string, unknown>;

  // Zarf alanları denetimi (fazla/bilinmeyen üst düzey alan engelleme)
  const allowedEnvelopeKeys = new Set([
    "schemaVersion",
    "documentId",
    "fieldSchemaFingerprint",
    "savedAt",
    "writerId",
    "revision",
    "values",
    "manualFields",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowedEnvelopeKeys.has(key)) {
      return {
        ok: false,
        error: "UNKNOWN_FIELD",
        details: `Taslak zarfında beklenmeyen alan: ${key}`,
      };
    }
  }

  // Şema sürüm denetimi
  if (record.schemaVersion !== BELGE_UX_LIMITS.DRAFT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: "SCHEMA_VERSION_MISMATCH",
      details: `Beklenen şema sürümü 1, alınan: ${String(record.schemaVersion)}`,
    };
  }

  // Belge kimlik denetimi
  const docId = record.documentId as BelgeDocumentId;
  if (!ALL_BELGE_DOCUMENT_IDS.includes(docId)) {
    return {
      ok: false,
      error: "UNKNOWN_DOCUMENT",
      details: `Taslakta geçersiz belge kimliği: ${String(docId)}`,
    };
  }

  if (expectedDocumentId && docId !== expectedDocumentId) {
    return {
      ok: false,
      error: "DOCUMENT_MISMATCH",
      details: `Beklenen belge '${expectedDocumentId}', taslaktaki belge '${docId}'`,
    };
  }

  // Şema parmak izi denetimi
  const expectedFingerprint = computeSchemaFingerprint(docId);
  if (record.fieldSchemaFingerprint !== expectedFingerprint) {
    return {
      ok: false,
      error: "FINGERPRINT_MISMATCH",
      details: "Belge alan şeması parmak izi uyuşmuyor; şablon güncellenmiş olabilir.",
    };
  }

  // Zaman damgası denetimi (makul aralık: 2020 sonrası ve gelecekte en çok 1 dakika)
  if (
    typeof record.savedAt !== "number" ||
    Number.isNaN(record.savedAt) ||
    record.savedAt < 1577836800000 || // 2020-01-01
    record.savedAt > Date.now() + 60000 // Saat kayması toleransı 1 dk
  ) {
    return {
      ok: false,
      error: "INVALID_SAVED_AT",
      details: "Geçersiz veya mantıksız zaman damgası.",
    };
  }

  // WriterId denetimi
  if (typeof record.writerId !== "string" || record.writerId.trim().length === 0) {
    return {
      ok: false,
      error: "INVALID_WRITER_ID",
      details: "Taslak writerId bilgisi geçersiz.",
    };
  }

  // Revizyon denetimi
  if (
    typeof record.revision !== "number" ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1
  ) {
    return {
      ok: false,
      error: "INVALID_REVISION",
      details: "Taslak revizyonu 1 veya daha büyük bir tam sayı olmalıdır.",
    };
  }

  // Değerler anlık görüntüsü doğrulama
  const snapshotValidation = validateEditableSnapshot(docId, record.values);
  if (!snapshotValidation.ok) {
    return snapshotValidation;
  }

  const manualFields = validateDraftManualFields(docId, record.manualFields);
  if (manualFields === null) {
    return { ok: false, error: "UNKNOWN_FIELD", details: "Taslağın düzenlenmiş alan bilgisi geçersiz." };
  }
  const envelope: BelgeDraftEnvelope = {
    schemaVersion: 1,
    documentId: docId,
    fieldSchemaFingerprint: expectedFingerprint,
    savedAt: record.savedAt,
    writerId: record.writerId.trim(),
    revision: record.revision,
    values: snapshotValidation.values,
    ...(manualFields === undefined ? {} : { manualFields }),
  };

  return { ok: true, draft: envelope };
}

/**
 * Taslak zarfını belirtilen depolama motoruna (StorageLike) yazar.
 * Güvenlik kuralları:
 * - 64 KiB UTF-8 bayt sınırı denetlenir.
 * - setItem çağrılır, kota/erişim hataları güvenle yakalanır.
 * - setItem ardından read-back yapılarak yazılan verinin birebirliği doğrulanır.
 */
export function saveDraft(
  storage: StorageLike,
  mode: "device" | "session",
  envelope: BelgeDraftEnvelope,
  options?: { maxBytes?: number; scope?: BelgeDraftScope }
):
  | { ok: true; byteLength: number; revision: number; key: string }
  | { ok: false; error: DraftStorageErrorCode; details: string; byteLength?: number } {
  const maxBytes = options?.maxBytes ?? BELGE_UX_LIMITS.DRAFT_MAX_BYTES;
  const key = getKeyForMode(mode, envelope.documentId, options?.scope);

  let serialized: string;
  try {
    serialized = JSON.stringify(envelope);
  } catch (err) {
    return {
      ok: false,
      error: "CORRUPT_JSON",
      details: `Serileştirme hatası: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const byteLength = utf8ByteLength(serialized);
  if (byteLength > maxBytes) {
    return {
      ok: false,
      error: "OVERSIZE_LIMIT",
      byteLength,
      details: `Taslak boyutu güvenlik sınırını aştı (${byteLength} B > ${maxBytes} B). Kayıt yapılmadı.`,
    };
  }

  try {
    storage.setItem(key, serialized);
  } catch (err) {
    return {
      ok: false,
      error: "STORAGE_EXCEPTION",
      byteLength,
      details: `Depolama yazma hatası (kota aşımı veya erişim engeli): ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  // Read-back doğrulaması
  let readBack: string | null = null;
  try {
    readBack = storage.getItem(key);
  } catch (err) {
    return {
      ok: false,
      error: "READ_BACK_MISMATCH",
      byteLength,
      details: `Depolama doğrulama okuması başarısız: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  if (readBack !== serialized) {
    return {
      ok: false,
      error: "READ_BACK_MISMATCH",
      byteLength,
      details: "Kayıt sonrası okuma doğrulaması eşleşmedi; veri bütünlüğü sağlanamadı.",
    };
  }

  return {
    ok: true,
    byteLength,
    revision: envelope.revision,
    key,
  };
}

/**
 * Belirtilen depolama motorundan taslağı okur ve yaş durumunu hesaplar.
 */
export function loadDraft(
  storage: StorageLike,
  mode: "device" | "session",
  documentId: BelgeDocumentId,
  now: number = Date.now(),
  options?: { maxBytes?: number; scope?: BelgeDraftScope }
):
  | { ok: true; draft: BelgeDraftEnvelope | null; ageStatus: DraftAgeStatus | null }
  | { ok: false; error: DraftStorageErrorCode; details: string } {
  const maxBytes = options?.maxBytes ?? BELGE_UX_LIMITS.DRAFT_MAX_BYTES;
  const key = getKeyForMode(mode, documentId, options?.scope);

  let rawValue: string | null = null;
  try {
    rawValue = storage.getItem(key);
  } catch (err) {
    return {
      ok: false,
      error: "STORAGE_EXCEPTION",
      details: `Depolama okuma hatası: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (rawValue === null) {
    return { ok: true, draft: null, ageStatus: null };
  }

  // S01 & F15: Depodaki ham metnin UTF-8 bayt sınırını JSON.parse öncesinde denetle
  const byteLength = utf8ByteLength(rawValue);
  if (byteLength > maxBytes) {
    return {
      ok: false,
      error: "OVERSIZE_LIMIT",
      details: `Depodaki taslak boyutu güvenlik sınırını aşıyor (${byteLength} B > ${maxBytes} B). Güvenlik nedeniyle yüklenmedi.`,
    };
  }

  const parsed = parseDraft(rawValue, documentId);
  if (!parsed.ok) {
    return parsed;
  }

  const age = draftAgeStatus(parsed.draft.savedAt, now);

  return {
    ok: true,
    draft: parsed.draft,
    ageStatus: age,
  };
}

/**
 * Belirtilen depolama motorundaki taslağı siler ve doğrulama yapar.
 */
export function deleteDraft(
  storage: StorageLike,
  mode: "device" | "session",
  documentId: BelgeDocumentId,
  options?: { scope?: BelgeDraftScope },
): { ok: true; key: string } | { ok: false; error: DraftStorageErrorCode; details: string } {
  const key = getKeyForMode(mode, documentId, options?.scope);

  try {
    storage.removeItem(key);
  } catch (err) {
    return {
      ok: false,
      error: "STORAGE_EXCEPTION",
      details: `Taslak silinemedi: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  try {
    const check = storage.getItem(key);
    if (check !== null) {
      return {
        ok: false,
        error: "READ_BACK_MISMATCH",
        details: "Taslak silindikten sonra doğrulanamadı; kayıt hala depoda mevcut.",
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: "STORAGE_EXCEPTION",
      details: `Taslak silme doğrulama okuması başarısız: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  return { ok: true, key };
}

/**
 * Çoklu sekme / yazar çakışma tespiti.
 * - Farklı writerId: Başka sekme kaydetmiş mi?
 * - Aynı writerId: Gelen revizyon mevcut revizyondan eski mi?
 */
export function compareWriterRevision(
  currentDraft: BelgeDraftEnvelope | null,
  incomingWriterId: string,
  incomingRevision: number
): { isConflict: boolean; reason: "CONCURRENT_WRITER" | "STALE_REVISION" | null } {
  if (!currentDraft) {
    return { isConflict: false, reason: null };
  }

  // Farklı yazar sekmesi müdahalesi
  if (currentDraft.writerId !== incomingWriterId) {
    return {
      isConflict: true,
      reason: "CONCURRENT_WRITER",
    };
  }

  // Aynı sekmede bayatlayan revizyon
  if (incomingRevision < currentDraft.revision) {
    return {
      isConflict: true,
      reason: "STALE_REVISION",
    };
  }

  return { isConflict: false, reason: null };
}

/**
 * PII içermeyen taslak izin tercihini okur.
 */
export function loadDraftConsent(
  storage: StorageLike,
  mode: "device" | "session"
): DraftConsentDecision | null {
  const key = getConsentKeyForMode(mode);
  try {
    const raw = storage.getItem(key);
    if (raw === "device" || raw === "session" || raw === "dismissed") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * PII içermeyen taslak izin tercihini kaydeder.
 */
export function saveDraftConsent(
  storage: StorageLike,
  mode: "device" | "session",
  decision: DraftConsentDecision
): { ok: true } | { ok: false; error: DraftStorageErrorCode; details: string } {
  const key = getConsentKeyForMode(mode);
  try {
    storage.setItem(key, decision);
    if (storage.getItem(key) !== decision) {
      return { ok: false, error: "READ_BACK_MISMATCH", details: "Kayıt tercihi doğrulanamadı." };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: "STORAGE_EXCEPTION",
      details: `İzin tercihi kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * PII içermeyen taslak izin tercihini siler.
 */
export function clearDraftConsent(
  storage: StorageLike,
  mode: "device" | "session"
): { ok: true } | { ok: false; error: DraftStorageErrorCode; details: string } {
  const key = getConsentKeyForMode(mode);
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: "STORAGE_EXCEPTION",
      details: `İzin tercihi temizlenemedi: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
