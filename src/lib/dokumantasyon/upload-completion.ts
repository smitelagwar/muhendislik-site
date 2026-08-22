// ============================================================================
// DÖKÜMANTASYON — PRESIGNED BLOB CALLBACK SONLANDIRMA
// ============================================================================

import type { PutBlobResult } from "@vercel/blob";
import { del, get, head } from "@vercel/blob";
import path from "path";
import { createFileRecord } from "./files";
import { getBlobCommandOptions } from "./runtime-mode";
import { markUploadIntentFailed, markUploadIntentFinalized, verifyUploadIntentToken } from "./upload-intent";
import { validateFileContent } from "./file-validation";

const METADATA_RETRY_DELAYS_MS = [0, 150, 400, 900, 1800] as const;
const SIGNATURE_PREFIX_BYTES = 512;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload-completed callback ile metadata görünürlüğü arasında çok kısa bir gecikme
 * oluşabilmesine karşı Blob metadata'sını sınırlı backoff ile doğrular.
 */
async function headUploadedBlob(urlOrPathname: string) {
  let lastError: unknown = null;

  for (const delayMs of METADATA_RETRY_DELAYS_MS) {
    if (delayMs > 0) await sleep(delayMs);

    try {
      return await head(urlOrPathname, getBlobCommandOptions());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Blob metadata okunamadı.");
}

/** Stream'in ilk chunk'ının 512 byte olacağını varsaymadan imza prefix'ini toplar. */
async function readSignaturePrefix(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (totalLength < SIGNATURE_PREFIX_BYTES) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      const remaining = SIGNATURE_PREFIX_BYTES - totalLength;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      chunks.push(chunk);
      totalLength += chunk.byteLength;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const prefix = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    prefix.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return prefix;
}

/**
 * Yalnız Vercel'in imzalı `blob.upload-completed` callback'i sonrasında çağrılır.
 * Presence ve boyut doğrulaması GET stream metadata'sına değil Blob HEAD metadata'sına
 * dayanır. GET yalnız gerçek dosya içeriğinin signature kontrolü için kullanılır.
 */
export async function finalizePresignedUpload({ blob, intentToken }: { blob: PutBlobResult; intentToken: string }) {
  const intent = await verifyUploadIntentToken(intentToken);
  if (!intent || intent.pathname !== blob.pathname) {
    throw new Error("Geçersiz upload intent.");
  }

  const canonicalBlobLocation = blob.url || blob.pathname;

  let metadata;
  try {
    metadata = await headUploadedBlob(canonicalBlobLocation);
  } catch (error) {
    await markUploadIntentFailed(intent.intentId, "BLOB_METADATA_UNAVAILABLE");
    console.error("Presigned Blob metadata doğrulaması başarısız:", {
      pathname: blob.pathname,
      expectedSize: intent.sizeBytes,
      error: error instanceof Error ? error.message : "bilinmeyen hata",
    });
    throw new Error("Yüklenen Blob metadata'sı doğrulanamadı.");
  }

  const actualSize = Number(metadata.size);
  if (!Number.isFinite(actualSize) || actualSize !== intent.sizeBytes) {
    await markUploadIntentFailed(intent.intentId, "BLOB_SIZE_INVALID");
    console.error("Presigned Blob boyut uyuşmazlığı:", {
      pathname: blob.pathname,
      expectedSize: intent.sizeBytes,
      actualSize: metadata.size,
    });
    throw new Error("Yüklenen Blob beklenen boyutta değil.");
  }

  const blobResult = await get(canonicalBlobLocation, {
    access: "private",
    useCache: false,
    ...getBlobCommandOptions(),
  });

  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    await markUploadIntentFailed(intent.intentId, "BLOB_NOT_READABLE");
    console.error("Presigned Blob içerik okuması başarısız:", {
      pathname: blob.pathname,
      expectedSize: intent.sizeBytes,
      statusCode: blobResult?.statusCode ?? null,
    });
    throw new Error("Yüklenen Blob içerik doğrulaması için okunamadı.");
  }

  const signaturePrefix = await readSignaturePrefix(blobResult.stream);
  const validation = validateFileContent(signaturePrefix, intent.filename);
  if (!validation.isValid) {
    try {
      await del(canonicalBlobLocation, getBlobCommandOptions());
    } finally {
      await markUploadIntentFailed(intent.intentId, "FILE_SIGNATURE_INVALID");
    }
    throw new Error(validation.errorMessage || "Dosya imzası geçersiz.");
  }

  const file = await createFileRecord({
    folder_id: intent.folderId,
    display_name: intent.filename.trim(),
    blob_pathname: blob.pathname,
    blob_url: blob.url,
    size_bytes: intent.sizeBytes,
    mime_type: validation.detectedMime || metadata.contentType || blobResult.blob.contentType || "application/octet-stream",
    extension: path.extname(intent.filename).toLowerCase(),
  });

  await markUploadIntentFinalized(intent.intentId, file.id);
  return file;
}
