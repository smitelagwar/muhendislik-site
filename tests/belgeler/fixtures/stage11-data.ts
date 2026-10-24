import { createHash } from "node:crypto";
import type { BelgePaylasimRecord } from "../../../src/lib/belge-paylasim/types";

export const stage11Names = ["ready", "unknown", "revoked", "expired", "pending", "db-down", "storage-null", "storage-throw", "purged-revoked", "error"] as const;
export function stage11Token(name: string): string {
  return createHash("sha256").update(`isolated-stage11-${name}`).digest("base64url");
}
export function stage11Record(name: string, sizeBytes = 0): BelgePaylasimRecord {
  return {
    id: `fixture-${name}`, requestIdHash: "fixture-request", payloadDigest: "fixture-payload",
    tokenHash: createHash("sha256").update(stage11Token(name)).digest("hex"), manageTokenHash: "fixture-manage",
    documentId: "beton-dokum-tutanagi", blobPathname: `stage11/${name}.pdf`, sizeBytes,
    pdfSha256: null, status: name === "revoked" ? "revoked" : name === "pending" ? "pending" : name === "purged-revoked" ? "purged" : "ready",
    creatorIpHash: "fixture-ip", createdAt: new Date("2026-10-01T00:00:00Z"),
    expiresAt: new Date(name === "expired" || name === "purged-revoked" ? "2020-01-01T00:00:00Z" : "2099-01-01T00:00:00Z"),
    revokedAt: name === "revoked" || name === "purged-revoked" ? new Date("2026-10-02T00:00:00Z") : null,
    purgedAt: null, purgeAttempts: 0, lastPurgeErrorCode: null, leaseUntil: null,
  };
}
