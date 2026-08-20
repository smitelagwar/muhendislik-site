// ============================================================================
// DOKUMANTASYON MODULU — AUTODESK PLATFORM SERVICES (APS) DWG ADAPTORU
// ============================================================================

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { get } from "@vercel/blob";
import { ensureDatabaseTables, getDb } from "./db";
import { getBlobCommandOptions, hasBlobAccessConfiguration, hasDatabaseUrl, isExplicitLocalDokMode } from "./runtime-mode";
import { getLocalStorageDir, readLocalDb, writeLocalDb } from "./local-store";
import type { DokCadDerivative, DokFile } from "./types";

const APS_API_BASE = "https://developer.api.autodesk.com";
const APS_VIEWER_SCOPES = "viewables:read";
const APS_INTERNAL_SCOPES = "data:read data:write data:create bucket:create bucket:read";
const TOKEN_REFRESH_SKEW_MS = 60_000;
const MAX_DWG_BYTES = 100 * 1024 * 1024;
const APS_REQUEST_TIMEOUT_MS = 30_000;
const APS_UPLOAD_TIMEOUT_MS = 120_000;
const APS_UPLOAD_LOCK_MS = 10 * 60_000;
const APS_TRANSLATION_TIMEOUT_MS = 45 * 60_000;

export type CadTranslationStatus = "pending" | "uploading" | "translating" | "ready" | "failed";

export interface CadPreviewStatus {
  provider: "aps";
  isAvailable: boolean;
  status: CadTranslationStatus;
  urn?: string;
  viewerToken?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface ApsToken {
  token: string;
  expiresAt: number;
}

interface ApsTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
}

interface ApsUploadTicket {
  uploadKey?: unknown;
  urls?: unknown;
}

interface ApsObjectResponse {
  objectId?: unknown;
}

interface ApsManifest {
  status?: unknown;
  progress?: unknown;
  reason?: unknown;
}

interface StoredDerivative extends DokCadDerivative {
  id: string;
}

const tokenCache = new Map<string, ApsToken>();

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs: number = APS_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function apsConfig() {
  return {
    clientId: process.env.APS_CLIENT_ID?.trim() || "",
    clientSecret: process.env.APS_CLIENT_SECRET?.trim() || "",
    bucketKey: process.env.APS_BUCKET_KEY?.trim().toLowerCase() || "",
    bucketPolicy: process.env.APS_BUCKET_POLICY?.trim().toLowerCase() || "persistent",
  };
}

export function isApsConfigured(): boolean {
  const config = apsConfig();
  return Boolean(config.clientId && config.clientSecret && config.bucketKey);
}

function sourceVersionKey(file: DokFile): string {
  return `${file.blob_pathname}:${file.current_version_number || 1}:${String(file.size_bytes)}`;
}

function isDwg(file: DokFile): boolean {
  return file.extension.toLowerCase() === ".dwg";
}

function sanitizeApsError(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim().slice(0, 500) || fallback;
}

async function getApsToken(scopes: string): Promise<string> {
  const cached = tokenCache.get(scopes);
  const now = Date.now();
  if (cached && cached.expiresAt > now + TOKEN_REFRESH_SKEW_MS) return cached.token;

  const { clientId, clientSecret } = apsConfig();
  if (!clientId || !clientSecret) throw new Error("APS_NOT_CONFIGURED");

  const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetchWithTimeout(`${APS_API_BASE}/authentication/v2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicCredentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: scopes }).toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("APS_TOKEN_REQUEST_FAILED");
  }

  const data = (await response.json()) as ApsTokenResponse;
  if (typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    throw new Error("APS_TOKEN_RESPONSE_INVALID");
  }

  tokenCache.set(scopes, { token: data.access_token, expiresAt: now + data.expires_in * 1000 });
  return data.access_token;
}

async function getApsViewerToken(): Promise<string> {
  return getApsToken(APS_VIEWER_SCOPES);
}

async function ensureApsBucket(token: string): Promise<void> {
  const { bucketKey, bucketPolicy } = apsConfig();
  const response = await fetchWithTimeout(`${APS_API_BASE}/oss/v2/buckets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bucketKey, policyKey: bucketPolicy }),
    cache: "no-store",
  });

  if (response.ok || response.status === 409) return;
  throw new Error("APS_BUCKET_CREATE_FAILED");
}

async function readDwgSource(file: DokFile): Promise<Buffer> {
  const sizeBytes = Number(file.size_bytes);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_DWG_BYTES) {
    throw new Error("DWG_SIZE_UNSUPPORTED");
  }

  if (isExplicitLocalDokMode()) {
    const filename = file.blob_url.startsWith("local:")
      ? file.blob_url.replace("local:", "")
      : file.blob_pathname.replace(/^dok_storage\//u, "");
    return fs.readFile(path.join(getLocalStorageDir(), filename));
  }

  if (!hasBlobAccessConfiguration()) throw new Error("BLOB_NOT_CONFIGURED");
  const blobResult = await get(file.blob_pathname, { access: "private", ...getBlobCommandOptions() });
  if (!blobResult?.stream) throw new Error("DWG_SOURCE_UNAVAILABLE");
  const arrayBuffer = await new Response(blobResult.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function getStoredDerivative(file: DokFile): Promise<StoredDerivative | null> {
  const versionKey = sourceVersionKey(file);
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.cad_derivatives?.find(
      (derivative) => derivative.file_id === file.id && derivative.source_version_key === versionKey
    );
    return item ? { ...item } : null;
  }

  const sql = getDb();
  await ensureDatabaseTables(sql);
  const rows = await sql`
    SELECT * FROM dok_cad_derivatives
    WHERE file_id = ${file.id} AND source_version_key = ${versionKey}
    LIMIT 1;
  `;
  return (rows[0] as StoredDerivative | undefined) || null;
}

async function updateDerivative(id: string, patch: Partial<StoredDerivative>): Promise<StoredDerivative> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    if (!db.cad_derivatives) db.cad_derivatives = [];
    const index = db.cad_derivatives.findIndex((derivative) => derivative.id === id);
    if (index === -1) throw new Error("CAD_DERIVATIVE_NOT_FOUND");
    const next = { ...db.cad_derivatives[index], ...patch, updated_at: new Date().toISOString() };
    db.cad_derivatives[index] = next;
    writeLocalDb(db);
    return next;
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_cad_derivatives
    SET
      status = COALESCE(${patch.status ?? null}, status),
      source_sha256 = COALESCE(${patch.source_sha256 ?? null}, source_sha256),
      aps_urn = COALESCE(${patch.aps_urn ?? null}, aps_urn),
      aps_object_key = COALESCE(${patch.aps_object_key ?? null}, aps_object_key),
      error_code = ${patch.error_code ?? null},
      error_message = ${patch.error_message ?? null},
      lock_expires_at = CASE
        WHEN ${patch.status ?? null} IN ('translating', 'ready', 'failed') THEN NULL
        ELSE COALESCE(${patch.lock_expires_at ?? null}, lock_expires_at)
      END,
      started_at = COALESCE(${patch.started_at ?? null}, started_at),
      completed_at = COALESCE(${patch.completed_at ?? null}, completed_at),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  if (!rows[0]) throw new Error("CAD_DERIVATIVE_NOT_FOUND");
  return rows[0] as StoredDerivative;
}

async function claimDerivative(file: DokFile, retry: boolean): Promise<{ derivative: StoredDerivative; claimed: boolean }> {
  const versionKey = sourceVersionKey(file);
  const now = new Date().toISOString();
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    if (!db.cad_derivatives) db.cad_derivatives = [];
    let derivative = db.cad_derivatives.find(
      (item) => item.file_id === file.id && item.source_version_key === versionKey
    );
    if (!derivative) {
      derivative = {
        id: crypto.randomUUID(),
        file_id: file.id,
        source_version_key: versionKey,
        source_sha256: null,
        aps_urn: null,
        aps_object_key: null,
        status: "pending",
        error_code: null,
        error_message: null,
        lock_expires_at: null,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
      };
      db.cad_derivatives.push(derivative);
    }
    const staleUpload = derivative.status === "uploading" &&
      (!derivative.lock_expires_at || Date.parse(derivative.lock_expires_at) <= Date.now());
    const canClaim = derivative.status === "pending" || staleUpload || (retry && derivative.status === "failed");
    if (canClaim) {
      derivative.status = "uploading";
      derivative.error_code = null;
      derivative.error_message = null;
      derivative.started_at = now;
      derivative.completed_at = null;
      derivative.lock_expires_at = new Date(Date.now() + APS_UPLOAD_LOCK_MS).toISOString();
      derivative.updated_at = now;
    }
    writeLocalDb(db);
    return { derivative: { ...derivative }, claimed: canClaim };
  }

  const sql = getDb();
  await ensureDatabaseTables(sql);
  await sql`
    INSERT INTO dok_cad_derivatives (id, file_id, source_version_key, status)
    VALUES (${crypto.randomUUID()}, ${file.id}, ${versionKey}, 'pending')
    ON CONFLICT (file_id, source_version_key) DO NOTHING;
  `;

  const claimedRows = await sql`
    UPDATE dok_cad_derivatives
    SET status = 'uploading', error_code = NULL, error_message = NULL,
        started_at = NOW(), completed_at = NULL,
        lock_expires_at = NOW() + INTERVAL '10 minutes', updated_at = NOW()
    WHERE file_id = ${file.id}
      AND source_version_key = ${versionKey}
      AND (
        status = 'pending'
        OR (status = 'uploading' AND (lock_expires_at IS NULL OR lock_expires_at <= NOW()))
        OR (${retry} = TRUE AND status = 'failed')
      )
    RETURNING *;
  `;
  if (claimedRows[0]) return { derivative: claimedRows[0] as StoredDerivative, claimed: true };

  const existing = await getStoredDerivative(file);
  if (!existing) throw new Error("CAD_DERIVATIVE_NOT_FOUND");
  return { derivative: existing, claimed: false };
}

async function findReadyDerivativeByHash(sourceHash: string): Promise<StoredDerivative | null> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.cad_derivatives?.find(
      (derivative) => derivative.source_sha256 === sourceHash && derivative.status === "ready" && derivative.aps_urn
    );
    return item ? { ...item } : null;
  }

  const sql = getDb();
  const rows = await sql`
    SELECT * FROM dok_cad_derivatives
    WHERE source_sha256 = ${sourceHash} AND status = 'ready' AND aps_urn IS NOT NULL
    ORDER BY updated_at DESC LIMIT 1;
  `;
  return (rows[0] as StoredDerivative | undefined) || null;
}

async function uploadToAps(fileBuffer: Buffer, objectKey: string, token: string): Promise<string> {
  const { bucketKey } = apsConfig();
  const encodedObjectKey = encodeURIComponent(objectKey);
  const ticketResponse = await fetchWithTimeout(
    `${APS_API_BASE}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodedObjectKey}/signeds3upload?minutesExpiration=10`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!ticketResponse.ok) throw new Error("APS_UPLOAD_TICKET_FAILED");

  const ticket = (await ticketResponse.json()) as ApsUploadTicket;
  const firstUrl = Array.isArray(ticket.urls) && typeof ticket.urls[0] === "string" ? ticket.urls[0] : null;
  if (!firstUrl || typeof ticket.uploadKey !== "string") throw new Error("APS_UPLOAD_TICKET_INVALID");

  const putResponse = await fetchWithTimeout(firstUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/acad" },
    body: new Uint8Array(fileBuffer),
  }, APS_UPLOAD_TIMEOUT_MS);
  if (!putResponse.ok) throw new Error("APS_UPLOAD_FAILED");

  const completeResponse = await fetchWithTimeout(
    `${APS_API_BASE}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodedObjectKey}/signeds3upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uploadKey: ticket.uploadKey }),
      cache: "no-store",
    }
  );
  if (!completeResponse.ok) throw new Error("APS_UPLOAD_FINALIZE_FAILED");
  const object = (await completeResponse.json()) as ApsObjectResponse;
  if (typeof object.objectId !== "string") throw new Error("APS_OBJECT_ID_MISSING");
  return object.objectId;
}

function encodeApsUrn(objectId: string): string {
  return Buffer.from(objectId).toString("base64").replace(/=+$/u, "");
}

async function startTranslation(urn: string, token: string): Promise<void> {
  const response = await fetchWithTimeout(`${APS_API_BASE}/modelderivative/v2/designdata/job`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { urn },
      output: { formats: [{ type: "svf2", views: ["2d", "3d"] }] },
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("APS_TRANSLATION_START_FAILED");
}

async function syncTranslationStatus(derivative: StoredDerivative): Promise<StoredDerivative> {
  if (derivative.status === "uploading" && derivative.lock_expires_at && Date.parse(derivative.lock_expires_at) <= Date.now()) {
    return updateDerivative(derivative.id, {
      status: "failed",
      error_code: "APS_UPLOAD_STALE",
      error_message: "APS aktarımı tamamlanmadan kesildi; işlem yeniden denenebilir.",
      completed_at: new Date().toISOString(),
    });
  }
  if (!derivative.aps_urn || derivative.status !== "translating") return derivative;
  if (derivative.started_at && Date.now() - Date.parse(derivative.started_at) > APS_TRANSLATION_TIMEOUT_MS) {
    return updateDerivative(derivative.id, {
      status: "failed",
      error_code: "APS_TRANSLATION_TIMEOUT",
      error_message: "APS CAD görünümünü zaman sınırı içinde tamamlayamadı.",
      completed_at: new Date().toISOString(),
    });
  }
  const token = await getApsToken(APS_INTERNAL_SCOPES);
  const response = await fetchWithTimeout(
    `${APS_API_BASE}/modelderivative/v2/designdata/${encodeURIComponent(derivative.aps_urn)}/manifest`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!response.ok) return derivative;

  const manifest = (await response.json()) as ApsManifest;
  const manifestStatus = typeof manifest.status === "string" ? manifest.status.toLowerCase() : "";
  if (manifestStatus === "success") {
    return updateDerivative(derivative.id, { status: "ready", completed_at: new Date().toISOString() });
  }
  if (manifestStatus === "failed" || manifestStatus === "timeout") {
    return updateDerivative(derivative.id, {
      status: "failed",
      error_code: "APS_TRANSLATION_FAILED",
      error_message: sanitizeApsError(manifest.reason, "APS CAD görünümünü oluşturamadı."),
      completed_at: new Date().toISOString(),
    });
  }
  return derivative;
}

function failureStatus(error: unknown): CadPreviewStatus {
  const code = error instanceof Error ? error.message : "APS_UNKNOWN_ERROR";
  const messages: Record<string, string> = {
    APS_NOT_CONFIGURED: "DWG görüntüleme servisi yapılandırılmamış.",
    BLOB_NOT_CONFIGURED: "Özel dosya depolama erişimi yapılandırılmamış.",
    DWG_SIZE_UNSUPPORTED: "DWG dosyası görüntüleme için desteklenen boyut sınırını aşıyor.",
    DWG_SOURCE_UNAVAILABLE: "Özel DWG kaynağı güvenli olarak okunamadı.",
    APS_TOKEN_REQUEST_FAILED: "Autodesk APS kimlik doğrulaması başarısız oldu.",
    APS_BUCKET_CREATE_FAILED: "APS dosya alanı hazırlanamadı.",
    APS_UPLOAD_TICKET_FAILED: "APS yükleme bağlantısı alınamadı.",
    APS_UPLOAD_TICKET_INVALID: "APS yükleme bağlantısı geçersiz döndü.",
    APS_UPLOAD_FAILED: "DWG Autodesk APS'ye aktarılamadı.",
    APS_UPLOAD_FINALIZE_FAILED: "APS DWG yüklemesini tamamlayamadı.",
    APS_OBJECT_ID_MISSING: "APS yüklenen DWG kimliğini döndürmedi.",
    APS_TRANSLATION_START_FAILED: "APS CAD görünümü oluşturma işini başlatamadı.",
    APS_UPLOAD_STALE: "APS aktarımı tamamlanmadan kesildi; işlem yeniden denenebilir.",
    APS_TRANSLATION_TIMEOUT: "APS CAD görünümünü zaman sınırı içinde tamamlayamadı.",
  };
  return {
    provider: "aps",
    isAvailable: false,
    status: "failed",
    errorCode: code,
    errorMessage: messages[code] || "DWG görüntüleme işlemi kontrollü olarak durduruldu.",
  };
}

async function toPreviewStatus(derivative: StoredDerivative | null): Promise<CadPreviewStatus> {
  if (!isApsConfigured()) return failureStatus(new Error("APS_NOT_CONFIGURED"));
  if (!derivative) return { provider: "aps", isAvailable: true, status: "pending" };

  const synced = await syncTranslationStatus(derivative);
  if (synced.status === "ready" && synced.aps_urn) {
    try {
      return {
        provider: "aps",
        isAvailable: true,
        status: "ready",
        urn: synced.aps_urn,
        viewerToken: await getApsViewerToken(),
      };
    } catch (error: unknown) {
      return failureStatus(error);
    }
  }
  if (synced.status === "failed") {
    return {
      provider: "aps",
      isAvailable: false,
      status: "failed",
      errorCode: synced.error_code || "APS_TRANSLATION_FAILED",
      errorMessage: synced.error_message || "APS CAD görünümünü oluşturamadı.",
    };
  }
  return { provider: "aps", isAvailable: true, status: synced.status };
}

export async function resolveCadPreviewStatus(file: DokFile): Promise<CadPreviewStatus> {
  if (!isDwg(file)) return { provider: "aps", isAvailable: false, status: "failed", errorCode: "CAD_NOT_DWG", errorMessage: "APS yalnızca DWG dönüşümü için kullanılır." };
  return toPreviewStatus(await getStoredDerivative(file));
}

export async function startCadPreview(file: DokFile, retry: boolean): Promise<CadPreviewStatus> {
  if (!isDwg(file)) return failureStatus(new Error("CAD_NOT_DWG"));
  if (!isApsConfigured()) return failureStatus(new Error("APS_NOT_CONFIGURED"));

  const claim = await claimDerivative(file, retry);
  if (!claim.claimed) return toPreviewStatus(claim.derivative);

  try {
    const fileBuffer = await readDwgSource(file);
    const sourceHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const reusable = await findReadyDerivativeByHash(sourceHash);
    if (reusable?.aps_urn) {
      const ready = await updateDerivative(claim.derivative.id, {
        status: "ready",
        source_sha256: sourceHash,
        aps_urn: reusable.aps_urn,
        aps_object_key: reusable.aps_object_key,
        completed_at: new Date().toISOString(),
      });
      return toPreviewStatus(ready);
    }

    const internalToken = await getApsToken(APS_INTERNAL_SCOPES);
    await ensureApsBucket(internalToken);
    const objectKey = `dwg/${sourceHash}.dwg`;
    const objectId = await uploadToAps(fileBuffer, objectKey, internalToken);
    const urn = encodeApsUrn(objectId);
    const translating = await updateDerivative(claim.derivative.id, {
      status: "translating",
      source_sha256: sourceHash,
      aps_object_key: objectKey,
      aps_urn: urn,
    });
    await startTranslation(urn, internalToken);
    return toPreviewStatus(translating);
  } catch (error: unknown) {
    const failed = failureStatus(error);
    await updateDerivative(claim.derivative.id, {
      status: "failed",
      error_code: failed.errorCode || "APS_UNKNOWN_ERROR",
      error_message: failed.errorMessage || "DWG görüntüleme işlemi durduruldu.",
      completed_at: new Date().toISOString(),
    });
    return failed;
  }
}

async function deleteRemoteDerivative(derivative: StoredDerivative): Promise<void> {
  if (!isApsConfigured()) return;
  const token = await getApsToken(APS_INTERNAL_SCOPES);
  const { bucketKey } = apsConfig();

  if (derivative.aps_urn) {
    const manifestResponse = await fetchWithTimeout(
      `${APS_API_BASE}/modelderivative/v2/designdata/${encodeURIComponent(derivative.aps_urn)}/manifest`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!manifestResponse.ok && manifestResponse.status !== 404) {
      throw new Error("APS_DERIVATIVE_DELETE_FAILED");
    }
  }

  if (derivative.aps_object_key) {
    const objectResponse = await fetchWithTimeout(
      `${APS_API_BASE}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(derivative.aps_object_key)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!objectResponse.ok && objectResponse.status !== 404) {
      throw new Error("APS_OBJECT_DELETE_FAILED");
    }
  }
}

export async function releaseCadDerivatives(fileId: string): Promise<void> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    if (!db.cad_derivatives) return;
    const removed = db.cad_derivatives.filter((derivative) => derivative.file_id === fileId);
    db.cad_derivatives = db.cad_derivatives.filter((derivative) => derivative.file_id !== fileId);
    writeLocalDb(db);
    for (const derivative of removed) {
      const stillReferenced = db.cad_derivatives.some(
        (item) => item.aps_object_key && item.aps_object_key === derivative.aps_object_key
      );
      if (!stillReferenced) {
        try {
          await deleteRemoteDerivative({ ...derivative });
        } catch (error: unknown) {
          console.warn("APS CAD varlığı temizlenemedi:", error instanceof Error ? error.message : "Bilinmeyen hata");
        }
      }
    }
    return;
  }
  const sql = getDb();
  await ensureDatabaseTables(sql);
  const removedRows = await sql`SELECT * FROM dok_cad_derivatives WHERE file_id = ${fileId};`;
  await sql`DELETE FROM dok_cad_derivatives WHERE file_id = ${fileId};`;
  for (const row of removedRows) {
    const derivative = row as StoredDerivative;
    if (!derivative.aps_object_key) continue;
    const references = await sql`
      SELECT id FROM dok_cad_derivatives
      WHERE aps_object_key = ${derivative.aps_object_key}
      LIMIT 1;
    `;
    if (references.length > 0) continue;
    try {
      await deleteRemoteDerivative(derivative);
    } catch (error: unknown) {
      console.warn("APS CAD varlığı temizlenemedi:", error instanceof Error ? error.message : "Bilinmeyen hata");
    }
  }
}
