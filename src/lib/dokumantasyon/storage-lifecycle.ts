// ============================================================================
// DOKÜMANTASYON — STORAGE LIFECYCLE SINIFLANDIRMASI
// ============================================================================

export const STORAGE_ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;

export interface StorageDbRecord {
  id: string;
  blob_pathname: string;
  deleted_at?: string | null;
  purge_status?: string | null;
}

export interface StoragePhysicalObject {
  pathname: string;
  uploadedAt?: string | Date | null;
}

export interface StorageUploadIntent {
  id: string;
  pathname: string;
  status: "issued" | "finalized" | "failed" | string;
  expires_at: string;
}

export type StorageLifecycleKind =
  | "healthy"
  | "pending_purge"
  | "orphan_blob"
  | "awaiting_callback"
  | "broken_metadata"
  | "interrupted_upload"
  | "untracked";

export interface StorageLifecycleState {
  kind: StorageLifecycleKind;
  pathname: string;
  isPastGracePeriod: boolean;
  canDeletePhysicalObject: boolean;
}

function asMilliseconds(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isSignedAccessExpired(expiresAt: string, nowMs: number = Date.now()): boolean {
  const expiresAtMs = asMilliseconds(expiresAt);
  return expiresAtMs === null || expiresAtMs <= nowMs;
}

/**
 * Reconcile betiği ile testlerin paylaştığı tek yaşam döngüsü matrisi.
 * Bu fonksiyon hiçbir I/O yapmaz; silme kararı yalnız burada üretilen açık
 * `canDeletePhysicalObject` işaretiyle verilir.
 */
export function classifyStorageLifecycle({
  pathname,
  dbRecord,
  physicalObject,
  uploadIntent,
  nowMs = Date.now(),
  graceMs = STORAGE_ORPHAN_GRACE_MS,
}: {
  pathname: string;
  dbRecord?: StorageDbRecord | null;
  physicalObject?: StoragePhysicalObject | null;
  uploadIntent?: StorageUploadIntent | null;
  nowMs?: number;
  graceMs?: number;
}): StorageLifecycleState {
  const uploadedAtMs = asMilliseconds(physicalObject?.uploadedAt);
  const isPastGracePeriod = uploadedAtMs !== null && nowMs - uploadedAtMs > graceMs;
  const hasActiveIntent = Boolean(
    uploadIntent &&
      uploadIntent.status === "issued" &&
      !isSignedAccessExpired(uploadIntent.expires_at, nowMs)
  );

  if (dbRecord && physicalObject) {
    return {
      kind: dbRecord.purge_status === "failed" ? "pending_purge" : "healthy",
      pathname,
      isPastGracePeriod,
      canDeletePhysicalObject: false,
    };
  }

  if (dbRecord && !physicalObject) {
    return { kind: "broken_metadata", pathname, isPastGracePeriod, canDeletePhysicalObject: false };
  }

  if (!dbRecord && physicalObject) {
    if (hasActiveIntent) {
      return { kind: "awaiting_callback", pathname, isPastGracePeriod, canDeletePhysicalObject: false };
    }
    return {
      kind: "orphan_blob",
      pathname,
      isPastGracePeriod,
      canDeletePhysicalObject: isPastGracePeriod,
    };
  }

  if (uploadIntent) {
    return { kind: "interrupted_upload", pathname, isPastGracePeriod: false, canDeletePhysicalObject: false };
  }

  return { kind: "untracked", pathname, isPastGracePeriod: false, canDeletePhysicalObject: false };
}
