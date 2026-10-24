// ============================================================================
// BELGE PAYLAŞIM — İSTEK DOĞRULAMA VE GÜVENLİK FİLTRESİ
// ============================================================================

import { DOCUMENT_EDITABLE_FIELDS, DOCUMENT_PDF_ONLY_FIELDS } from "../document-field-contracts";
import { BELGE_SHARE_CONFIG } from "./config";
import { isValidClientRequestId } from "./tokens";
import type { BelgePaylasimDocumentId } from "./types";

export interface ValidatedShareCreateInput {
  clientRequestId: string;
  documentId: BelgePaylasimDocumentId;
  values: Record<string, string>;
  creatorIp: string;
}

export class RequestValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export const REQUEST_BODY_READ_TIMEOUT_MS = 10_000;

function validationError(code: string, message: string, statusCode = 400): RequestValidationError {
  return new RequestValidationError(code, message, statusCode);
}

/** İstemci IP'si kota anahtarı değildir; yalnız anonim/operasyonel kayıtta kullanılır. */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Browser API mutation isteklerinde Origin, Request URL ve Host aynı scheme,
 * hostname ve portu göstermelidir. Eksik, `null` veya bozuk başlık fail-closed'dur.
 * Salt-okunur GET uçları yalnız Origin başlığı hiç yoksa aynı Host kontrolünü seçebilir.
 */
export function validateSameOrigin(
  request: Request,
  options: { allowMissingOrigin?: boolean } = {},
): void {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw validationError(
      "CROSS_SITE_FORBIDDEN",
      "Farklı kaynaklardan gelen istekler güvenlik nedeniyle reddedildi.",
      403,
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) {
    throw validationError("INVALID_ORIGIN", "Origin ve Host başlıkları zorunludur.", 403);
  }

  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    throw validationError("INVALID_ORIGIN", "İstek kaynağı doğrulanamadı.", 403);
  }

  // Same-origin GET requests commonly omit Origin. This exception is only for
  // explicitly opted-in read endpoints; cross-site Fetch Metadata still fails above.
  if (!origin && options.allowMissingOrigin && host.toLowerCase() === requestUrl.host.toLowerCase()) {
    return;
  }

  if (!origin || origin === "null") {
    throw validationError("INVALID_ORIGIN", "Origin ve Host başlıkları zorunludur.", 403);
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw validationError("INVALID_ORIGIN", "İstek kaynağı doğrulanamadı.", 403);
  }

  if (
    originUrl.username || originUrl.password || originUrl.pathname !== "/" ||
    originUrl.search || originUrl.hash || origin !== originUrl.origin ||
    originUrl.origin !== requestUrl.origin || host.toLowerCase() !== requestUrl.host.toLowerCase()
  ) {
    throw validationError("INVALID_ORIGIN", "İstek kaynağı ile hedef sunucu uyuşmuyor.", 403);
  }
}

function validateContentLength(request: Request): void {
  const declared = request.headers.get("content-length");
  if (declared === null) return;
  if (!/^\d+$/.test(declared)) {
    throw validationError("INVALID_CONTENT_LENGTH", "Content-Length başlığı geçersiz.");
  }
  const bytes = Number(declared);
  if (!Number.isSafeInteger(bytes)) {
    throw validationError("INVALID_CONTENT_LENGTH", "Content-Length başlığı geçersiz.");
  }
  if (bytes > BELGE_SHARE_CONFIG.MAX_JSON_BODY_BYTES) {
    void request.body?.cancel().catch(() => undefined);
    throw validationError("PAYLOAD_TOO_LARGE", "İstek gövdesi 64 KiB sınırını aşamaz.", 413);
  }
}

/** Reads at most 64 KiB+1, cancels the stream on overflow/timeout/abort and releases its lock. */
export async function readShareJsonBody(
  request: Request,
  timeoutMs = REQUEST_BODY_READ_TIMEOUT_MS,
): Promise<string> {
  validateContentLength(request);
  const stream = request.body;
  if (!stream) return "";

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let abortListener: (() => void) | undefined;

  const cancel = (reason?: unknown) => {
    try {
      void reader.cancel(reason).catch(() => undefined);
    } catch {
      // The source may already be closed or cancelled.
    }
  };

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(validationError("REQUEST_BODY_TIMEOUT", "İstek gövdesi zaman aşımına uğradı.", 408));
        cancel("request body timeout");
      }, timeoutMs);
    });
    const abortPromise = new Promise<never>((_, reject) => {
      abortListener = () => {
        reject(validationError("REQUEST_ABORTED", "İstek tamamlanmadan bağlantı kesildi.", 408));
        cancel("request aborted");
      };
      if (request.signal.aborted) abortListener();
      else request.signal.addEventListener("abort", abortListener, { once: true });
    });

    while (true) {
      const result = await Promise.race([reader.read(), timeoutPromise, abortPromise]);
      if (result.done) break;
      totalBytes += result.value.byteLength;
      if (totalBytes > BELGE_SHARE_CONFIG.MAX_JSON_BODY_BYTES) {
        cancel("request body exceeds limit");
        throw validationError("PAYLOAD_TOO_LARGE", "İstek gövdesi 64 KiB sınırını aşamaz.", 413);
      }
      chunks.push(result.value);
    }
  } catch (error) {
    cancel(error);
    if (error instanceof RequestValidationError) throw error;
    throw validationError("REQUEST_BODY_READ_FAILED", "İstek gövdesi okunamadı.", 400);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (abortListener) request.signal.removeEventListener("abort", abortListener);
    try {
      reader.releaseLock();
    } catch {
      // A cancelled stream can release its lock itself.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw validationError("INVALID_UTF8", "İstek gövdesi geçerli UTF-8 olmalıdır.");
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Validates a strict, bounded JSON contract before any database or Blob access. */
export async function validateShareCreateRequest(
  request: Request,
  bodyReadTimeoutMs = REQUEST_BODY_READ_TIMEOUT_MS,
): Promise<ValidatedShareCreateInput> {
  validateSameOrigin(request);

  const contentType = request.headers.get("content-type") || "";
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw validationError("UNSUPPORTED_MEDIA_TYPE", "İçerik türü application/json olmalıdır.", 415);
  }

  const rawBodyText = await readShareJsonBody(request, bodyReadTimeoutMs);
  if (Buffer.byteLength(rawBodyText, "utf8") === 0) {
    throw validationError("EMPTY_BODY", "İstek gövdesi boş olamaz.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBodyText);
  } catch {
    throw validationError("INVALID_JSON", "İstek gövdesi geçerli bir JSON içermiyor.");
  }
  if (!isPlainRecord(parsed)) {
    throw validationError("INVALID_BODY_STRUCTURE", "İstek gövdesi bir JSON nesnesi olmalıdır.");
  }

  const forbiddenKeys = new Set(["__proto__", "constructor", "prototype"]);
  const bodyKeys = Object.keys(parsed);
  if (bodyKeys.some((key) => forbiddenKeys.has(key))) {
    throw validationError("INVALID_BODY_KEY", "İstek gövdesi yasak bir anahtar içeriyor.");
  }
  if (bodyKeys.some((key) => !["clientRequestId", "documentId", "values"].includes(key))) {
    throw validationError("UNKNOWN_BODY_FIELD", "İstek gövdesinde izin verilmeyen bir alan var.");
  }

  const rawRequestId = parsed.clientRequestId;
  if (typeof rawRequestId !== "string" || !isValidClientRequestId(rawRequestId)) {
    throw validationError("INVALID_CLIENT_REQUEST_ID", "clientRequestId 256-bit URL-güvenli kimlik olmalıdır.");
  }

  const rawDocId = parsed.documentId;
  if (typeof rawDocId !== "string" || !rawDocId.trim()) {
    throw validationError("MISSING_DOCUMENT_ID", "documentId alanı zorunludur.");
  }
  const documentId = rawDocId.trim() as BelgePaylasimDocumentId;
  if (!BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes(documentId)) {
    throw validationError("UNSUPPORTED_DOCUMENT", "Desteklenmeyen belge türü.");
  }

  const rawValues = parsed.values;
  if (!isPlainRecord(rawValues)) {
    throw validationError("INVALID_VALUES", "values bir düz alan-değer nesnesi olmalıdır.");
  }

  const allowedFieldKeys = new Set<string>([
    ...DOCUMENT_EDITABLE_FIELDS[documentId],
    ...DOCUMENT_PDF_ONLY_FIELDS[documentId],
  ]);
  const entries = Object.entries(rawValues);
  if (entries.length > 100) throw validationError("TOO_MANY_FIELDS", "Form alan sayısı sınırı aşıldı.");

  const cleanValues: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (forbiddenKeys.has(key)) {
      throw validationError("INVALID_FIELD_KEY", "values yasak bir anahtar içeriyor.");
    }
    if (!allowedFieldKeys.has(key)) {
      throw validationError("UNKNOWN_FIELD", "Belge için izin verilmeyen bir form alanı var.");
    }
    if (typeof value !== "string") {
      throw validationError("INVALID_FIELD_TYPE", "Form alanlarının tüm değerleri metin olmalıdır.");
    }
    if (value.length > 2000) {
      throw validationError("FIELD_TOO_LONG", "Bir form alanı 2000 karakter sınırını aşıyor.");
    }
    cleanValues[key] = value;
  }

  for (const key of allowedFieldKeys) {
    if (!(key in cleanValues)) cleanValues[key] = "";
  }

  return {
    clientRequestId: rawRequestId,
    documentId,
    values: cleanValues,
    creatorIp: extractClientIp(request),
  };
}
