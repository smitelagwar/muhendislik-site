// ============================================================================
// BELGE PAYLAŞIM — İSTEK DOĞRULAMA VE GÜVENLİK FİLTRESİ
// ============================================================================

import { DOCUMENT_EDITABLE_FIELDS } from "../document-field-contracts";
import { BELGE_SHARE_CONFIG } from "./config";
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

/**
 * İstemci IP adresini platform başlıklarından (x-forwarded-for, x-real-ip) güvenle ayıklar.
 */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Same-Origin / Sec-Fetch-Site denetimi ile harici sitelerden gelen CSRF/abusive istekleri engeller.
 */
export function validateSameOrigin(request: Request): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw new RequestValidationError(
      "CROSS_SITE_FORBIDDEN",
      "Farklı kaynaklardan gelen istekler güvenlik nedeniyle reddedildi.",
      403
    );
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host.toLowerCase() !== host.toLowerCase()) {
        throw new RequestValidationError(
          "INVALID_ORIGIN",
          "İstek kaynağı ile hedef sunucu uyuşmuyor.",
          403
        );
      }
    } catch (err) {
      if (err instanceof RequestValidationError) throw err;
      throw new RequestValidationError("INVALID_ORIGIN", "Geçersiz Origin başlığı.", 403);
    }
  }
}

/**
 * Gelen HTTP isteğini boyut, format, alan ve tip açısından tam olarak doğrular.
 */
export async function validateShareCreateRequest(
  request: Request
): Promise<ValidatedShareCreateInput> {
  // 1. Same-Origin kontrolü
  validateSameOrigin(request);

  // 2. Content-Type doğrulaması
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new RequestValidationError(
      "UNSUPPORTED_MEDIA_TYPE",
      "İçerik türü application/json olmalıdır.",
      415
    );
  }

  // 3. Gövde boyutu kontrolü (azami 64 KiB)
  const rawBodyText = await request.text();
  const bodyBytes = Buffer.byteLength(rawBodyText, "utf-8");

  if (bodyBytes > BELGE_SHARE_CONFIG.MAX_JSON_BODY_BYTES) {
    throw new RequestValidationError(
      "PAYLOAD_TOO_LARGE",
      `İstek boyutu azami ${BELGE_SHARE_CONFIG.MAX_JSON_BODY_BYTES / 1024} KiB sınırını aşamaz.`,
      413
    );
  }

  if (bodyBytes === 0) {
    throw new RequestValidationError(
      "EMPTY_BODY",
      "İstek gövdesi boş olamaz.",
      400
    );
  }

  // 4. JSON çözümleme
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBodyText);
  } catch {
    throw new RequestValidationError(
      "INVALID_JSON",
      "İstek gövdesi geçerli bir JSON içermiyor.",
      400
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RequestValidationError(
      "INVALID_BODY_STRUCTURE",
      "İstek gövdesi bir JSON nesnesi olmalıdır.",
      400
    );
  }

  const body = parsed as Record<string, unknown>;

  // 5. clientRequestId kontrolü
  const rawRequestId = body.clientRequestId;
  if (typeof rawRequestId !== "string" || !rawRequestId.trim()) {
    throw new RequestValidationError(
      "MISSING_CLIENT_REQUEST_ID",
      "clientRequestId alanı zorunludur.",
      400
    );
  }

  const clientRequestId = rawRequestId.trim();
  if (clientRequestId.length < 8 || clientRequestId.length > 128) {
    throw new RequestValidationError(
      "INVALID_CLIENT_REQUEST_ID",
      "clientRequestId uzunluğu 8 ile 128 karakter arasında olmalıdır.",
      400
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(clientRequestId)) {
    throw new RequestValidationError(
      "INVALID_CLIENT_REQUEST_ID",
      "clientRequestId yalnızca harf, rakam, tire ve alt çizgi içerebilir.",
      400
    );
  }

  // 6. documentId kontrolü
  const rawDocId = body.documentId;
  if (typeof rawDocId !== "string" || !rawDocId.trim()) {
    throw new RequestValidationError(
      "MISSING_DOCUMENT_ID",
      "documentId alanı zorunludur.",
      400
    );
  }

  const documentId = rawDocId.trim() as BelgePaylasimDocumentId;
  if (!BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes(documentId)) {
    throw new RequestValidationError(
      "UNSUPPORTED_DOCUMENT",
      `Desteklenmeyen belge türü: ${rawDocId}`,
      400
    );
  }

  // 7. values nesnesi kontrolü
  const rawValues = body.values;
  if (!rawValues || typeof rawValues !== "object" || Array.isArray(rawValues)) {
    throw new RequestValidationError(
      "INVALID_VALUES",
      "values bir alan-değer nesnesi olmalıdır.",
      400
    );
  }

  const allowedFieldKeys = new Set<string>([
    ...(DOCUMENT_EDITABLE_FIELDS[documentId] || []),
    // Güvenli uyumluluk: İstifa bileşen durumunda saklanan sabit etiket alanları
    "adres_etiket",
    "tc_etiket",
    "iletisim_etiket",
  ]);

  const cleanValues: Record<string, string> = {};
  const entries = Object.entries(rawValues as Record<string, unknown>);

  if (entries.length > 100) {
    throw new RequestValidationError(
      "TOO_MANY_FIELDS",
      "Form alan sayısı sınırı aşıldı.",
      400
    );
  }

  for (const [key, val] of entries) {
    // Güvenlik: prototype pollution veya beklenmeyen anahtarları engelle
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    if (!allowedFieldKeys.has(key)) {
      throw new RequestValidationError(
        "UNKNOWN_FIELD",
        `"${key}" alanı ${documentId} belgesi için geçerli bir form alanı değildir.`,
        400
      );
    }

    if (val !== undefined && val !== null && typeof val !== "string") {
      throw new RequestValidationError(
        "INVALID_FIELD_TYPE",
        `"${key}" alanı metin (string) türünde olmalıdır.`,
        400
      );
    }

    const strVal = String(val ?? "");
    if (strVal.length > 2000) {
      throw new RequestValidationError(
        "FIELD_TOO_LONG",
        `"${key}" alanının uzunluğu 2000 karakter sınırını aşamaz.`,
        400
      );
    }

    cleanValues[key] = strVal;
  }

  // Eksik alanları varsayılan boş dize ile tamamla (bütünlük için)
  for (const requiredKey of allowedFieldKeys) {
    if (cleanValues[requiredKey] === undefined) {
      cleanValues[requiredKey] = "";
    }
  }

  const creatorIp = extractClientIp(request);

  return {
    clientRequestId,
    documentId,
    values: cleanValues,
    creatorIp,
  };
}
