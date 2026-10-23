// ============================================================================
// BELGE PAYLAŞIM — TİP TANIMLARI
// ============================================================================

export type BelgePaylasimStatus = "pending" | "ready" | "revoked" | "purged" | "failed";

export type BelgePaylasimDocumentId =
  | "beton-dokum-tutanagi"
  | "santiye-sefi-taahhutnamesi"
  | "santiye-sefi-istifa-dilekcesi"
  | "insaat-ruhsati-dilekcesi"
  | "santiye-sefi-sozlesmesi";

export interface BelgePaylasimRecord {
  id: string;
  requestIdHash: string;
  payloadDigest: string;
  tokenHash: string;
  manageTokenHash: string;
  documentId: BelgePaylasimDocumentId;
  blobPathname: string;
  sizeBytes: number | null;
  pdfSha256: string | null;
  status: BelgePaylasimStatus;
  creatorIpHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  purgedAt: Date | null;
  purgeAttempts: number;
  lastPurgeErrorCode: string | null;
  leaseUntil: Date | null;
}

export interface PendingReservationInput {
  requestIdHash: string;
  payloadDigest: string;
  tokenHash: string;
  manageTokenHash: string;
  documentId: BelgePaylasimDocumentId;
  blobPathname: string;
  creatorIpHash: string;
  expiresAt: Date;
}

export interface BelgeShareTokens {
  viewToken: string;
  manageToken: string;
  viewTokenHash: string;
  manageTokenHash: string;
}

export interface CreateShareReservationParams {
  clientRequestId: string;
  documentId: BelgePaylasimDocumentId;
  values: Record<string, string>;
  creatorIp: string;
}

export interface CreateShareReservationResult {
  status: "new" | "existing_ready" | "conflict";
  record?: BelgePaylasimRecord;
  tokens?: BelgeShareTokens;
  url?: string;
  manageToken?: string;
  expiresAt?: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}
