// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ DOSYA ERİŞİM VE SIGNED URL KATMANI
// ============================================================================

import { getFile } from "./files";
import { getPreviewKind, PreviewKind } from "./preview-capabilities";
import { requireDokumantasyonAdmin } from "./auth";
import { getPublicShareInfo, verifyShareAccessJwt } from "./public-share";
import { issueSignedToken, presignUrl } from "@vercel/blob";
import { cookies } from "next/headers";
import { DokFile } from "./types";
import { getBlobCommandOptions, hasBlobAccessConfiguration, isExplicitLocalDokMode, DokRuntimeConfigError } from "./runtime-mode";

export interface FileAccessResult {
  file: {
    id: string;
    display_name: string;
    size_bytes: number;
    mime_type: string;
    extension: string;
    created_at: string;
    updated_at?: string;
    folder_id: string | null;
  };
  accessUrl: string;
  previewKind: PreviewKind;
  expiresAt: string;
  isLocal: boolean;
}

const DEFAULT_ADMIN_ACCESS_TTL_SECONDS = Number(process.env.DOK_ADMIN_VIEW_ACCESS_TTL_SECONDS) || 3600; // Varsayılan 60 dakika
const DEFAULT_PUBLIC_ACCESS_TTL_SECONDS = 3 * 60; // 3 dakika

/**
 * Admin kullanıcısı için dosyanın kısa ömürlü Signed GET erişim URL'sini üretir
 */
export async function getAdminFileAccess(
  fileId: string,
  ttlSeconds: number = DEFAULT_ADMIN_ACCESS_TTL_SECONDS
): Promise<FileAccessResult> {
  await requireDokumantasyonAdmin();

  const file = await getFile(fileId);
  if (!file || file.deleted_at) {
    throw new Error("NOT_FOUND");
  }

  const previewKind = getPreviewKind(file.extension);
  const blobConfigured = hasBlobAccessConfiguration();
  const isLocal = Boolean(file.blob_url?.startsWith("local:") && isExplicitLocalDokMode());

  // 1. Yerel Geliştirme Modu (Local Stream URL)
  if (isLocal) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return {
      file: formatSafeFileDto(file),
      accessUrl: `/api/dokumantasyon/files/${file.id}/stream`,
      previewKind,
      expiresAt,
      isLocal: true,
    };
  }

  // 2. Üretim (Vercel Private Blob Signed GET URL)
  if (!blobConfigured) {
    throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
  }

  const validUntil = Date.now() + ttlSeconds * 1000;
  const signedToken = await issueSignedToken({
    pathname: file.blob_pathname,
    operations: ["get", "head"],
    validUntil,
    ...getBlobCommandOptions(),
  });

  const presigned = await presignUrl(signedToken, {
    pathname: file.blob_pathname,
    operation: "get",
    access: "private",
  });

  return {
    file: formatSafeFileDto(file),
    accessUrl: presigned.presignedUrl,
    previewKind,
    expiresAt: new Date(validUntil).toISOString(),
    isLocal: false,
  };
}

/**
 * Public süreli paylaşım bağlantısı üzerinden dosya erişim URL'si üretir
 */
export async function getPublicShareFileAccess(
  rawToken: string,
  itemIdOrFileId: string,
  ttlSeconds: number = DEFAULT_PUBLIC_ACCESS_TTL_SECONDS
): Promise<FileAccessResult> {
  const shareInfo = await getPublicShareInfo(rawToken);

  if (shareInfo.status !== "ok" || !shareInfo.link || !shareInfo.items) {
    throw new Error(shareInfo.status.toUpperCase()); // "EXPIRED", "REVOKED", "NOT_FOUND" vs.
  }

  const link = shareInfo.link;

  // Şifre Koruması Kontrolü
  if (link.password_hash) {
    const cookieStore = await cookies();
    const cookieJwt = cookieStore.get(`dok_share_${link.id}`)?.value;
    const isAuthorized = await verifyShareAccessJwt(cookieJwt, link.id);

    if (!isAuthorized) {
      throw new Error("PASSWORD_REQUIRED");
    }
  }

  // Snapshot içinde öğeyi bul
  const item = shareInfo.items.find(
    (i) => i.id === itemIdOrFileId || i.file_id === itemIdOrFileId
  );

  if (!item) {
    throw new Error("NOT_IN_SHARE");
  }

  const file = await getFile(item.file_id);
  if (!file || file.deleted_at) {
    throw new Error("FILE_DELETED");
  }

  const previewKind = getPreviewKind(file.extension);
  const blobConfigured = hasBlobAccessConfiguration();
  const isLocal = Boolean(file.blob_url?.startsWith("local:") && isExplicitLocalDokMode());

  if (isLocal) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return {
      file: formatSafeFileDto(file),
      accessUrl: `/api/dokumantasyon/public/download/${rawToken}/${item.id}?preview=1`,
      previewKind,
      expiresAt,
      isLocal: true,
    };
  }

  if (!blobConfigured) {
    throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
  }

  const validUntil = Date.now() + ttlSeconds * 1000;
  const signedToken = await issueSignedToken({
    pathname: file.blob_pathname,
    operations: ["get", "head"],
    validUntil,
    ...getBlobCommandOptions(),
  });

  const presigned = await presignUrl(signedToken, {
    pathname: file.blob_pathname,
    operation: "get",
    access: "private",
  });

  return {
    file: formatSafeFileDto(file),
    accessUrl: presigned.presignedUrl,
    previewKind,
    expiresAt: new Date(validUntil).toISOString(),
    isLocal: false,
  };
}

function formatSafeFileDto(file: DokFile) {
  return {
    id: file.id,
    display_name: file.display_name,
    size_bytes: Number(file.size_bytes),
    mime_type: file.mime_type,
    extension: file.extension,
    created_at: file.created_at,
    updated_at: file.updated_at,
    folder_id: file.folder_id,
  };
}
