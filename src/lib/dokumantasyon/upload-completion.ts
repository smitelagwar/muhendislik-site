// ============================================================================
// DÖKÜMANTASYON — PRESIGNED BLOB CALLBACK SONLANDIRMA
// ============================================================================

import type { PutBlobResult } from "@vercel/blob";
import { del, get } from "@vercel/blob";
import path from "path";
import { createFileRecord } from "./files";
import { getBlobCommandOptions } from "./runtime-mode";
import { markUploadIntentFailed, markUploadIntentFinalized, verifyUploadIntentToken } from "./upload-intent";
import { validateFileContent } from "./file-validation";

/**
 * Yalnız Vercel'in imzalı `blob.upload-completed` callback'i sonrasında çağrılır.
 * Callback'teki URL'ye güvenmek yerine Blob SDK ile nesneyi tekrar okur ve
 * Neon kaydını canonical pathname/URL üzerinden oluşturur.
 */
export async function finalizePresignedUpload({ blob, intentToken }: { blob: PutBlobResult; intentToken: string }) {
  const intent = await verifyUploadIntentToken(intentToken);
  if (!intent || intent.pathname !== blob.pathname) {
    throw new Error("Geçersiz upload intent.");
  }

  const blobResult = await get(blob.pathname, {
    access: "private",
    useCache: false,
    ...getBlobCommandOptions(),
  });
  if (!blobResult?.stream || Number(blobResult.blob.size) !== intent.sizeBytes) {
    await markUploadIntentFailed(intent.intentId, "BLOB_SIZE_OR_PRESENCE_INVALID");
    throw new Error("Yüklenen Blob bulunamadı veya beklenen boyutta değil.");
  }

  const reader = blobResult.stream.getReader();
  const { value } = await reader.read();
  void reader.cancel();
  const validation = validateFileContent(value?.subarray(0, 512) || new Uint8Array(), intent.filename);
  if (!validation.isValid) {
    try {
      await del(blob.pathname, getBlobCommandOptions());
    } finally {
      await markUploadIntentFailed(intent.intentId, "FILE_SIGNATURE_INVALID");
    }
    throw new Error(validation.errorMessage || "Dosya imzası geçersiz.");
  }

  const file = await createFileRecord({
    folder_id: intent.folderId,
    display_name: intent.filename.trim(),
    blob_pathname: blob.pathname,
    blob_url: blobResult.blob.url,
    size_bytes: intent.sizeBytes,
    mime_type: validation.detectedMime || blobResult.blob.contentType || "application/octet-stream",
    extension: path.extname(intent.filename).toLowerCase(),
  });
  await markUploadIntentFinalized(intent.intentId, file.id);
  return file;
}
