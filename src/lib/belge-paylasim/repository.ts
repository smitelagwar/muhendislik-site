// ============================================================================
// BELGE PAYLAŞIM — VERİTABANI ERİŞİM VE DEPO ADAPTÖRÜ
// ============================================================================

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getDatabaseUrl, hasDatabaseUrl } from "@/lib/dokumantasyon/runtime-mode";
import { BELGE_SHARE_CONFIG } from "./config";
import type {
  BelgePaylasimDocumentId,
  BelgePaylasimRecord,
  BelgePaylasimStatus,
  PendingReservationInput,
  QuotaCheckResult,
} from "./types";

export interface BelgePaylasimRepository {
  initSchema(): Promise<void>;
  findByRequestIdHash(requestIdHash: string): Promise<BelgePaylasimRecord | null>;
  findByTokenHash(tokenHash: string): Promise<BelgePaylasimRecord | null>;
  findByManageTokenHash(manageTokenHash: string): Promise<BelgePaylasimRecord | null>;
  createPendingReservation(input: PendingReservationInput): Promise<BelgePaylasimRecord>;
  finalizeReady(id: string, sizeBytes: number, pdfSha256: string): Promise<void>;
  markFailed(id: string, errorCode: string): Promise<void>;
  revokeLink(id: string): Promise<void>;
  checkAndAcquireQuota(creatorIpHash: string): Promise<QuotaCheckResult>;
  getActiveStats(): Promise<{ activeCount: number; totalActiveBytes: number }>;
  claimExpiredForPurge(limit: number, leaseDurationMs: number): Promise<BelgePaylasimRecord[]>;
  claimStalePendingForPurge(olderThan: Date, limit: number): Promise<BelgePaylasimRecord[]>;
  hasRecordWithBlobPathname(pathname: string): Promise<boolean>;
  purgeOldTombstones(olderThan: Date, limit: number): Promise<number>;
  markPurged(id: string): Promise<void>;
  recordPurgeError(id: string, errorCode: string): Promise<void>;
}

/**
 * Testler ve yerel geliştirme için bellek içi repository.
 */
export class MemoryBelgePaylasimRepository implements BelgePaylasimRepository {
  private readonly records = new Map<string, BelgePaylasimRecord>();

  async initSchema(): Promise<void> {
    // Bellek için şema hazırlığı gerekmez
  }

  async findByRequestIdHash(requestIdHash: string): Promise<BelgePaylasimRecord | null> {
    for (const record of this.records.values()) {
      if (record.requestIdHash === requestIdHash) {
        return { ...record };
      }
    }
    return null;
  }

  async findByTokenHash(tokenHash: string): Promise<BelgePaylasimRecord | null> {
    for (const record of this.records.values()) {
      if (record.tokenHash === tokenHash) {
        return { ...record };
      }
    }
    return null;
  }

  async findByManageTokenHash(manageTokenHash: string): Promise<BelgePaylasimRecord | null> {
    for (const record of this.records.values()) {
      if (record.manageTokenHash === manageTokenHash) {
        return { ...record };
      }
    }
    return null;
  }

  async createPendingReservation(input: PendingReservationInput): Promise<BelgePaylasimRecord> {
    // Unique constraint kontrolleri
    for (const record of this.records.values()) {
      if (record.requestIdHash === input.requestIdHash) {
        throw new Error("UNIQUE constraint violation: request_id_hash");
      }
      if (record.tokenHash === input.tokenHash) {
        throw new Error("UNIQUE constraint violation: token_hash");
      }
      if (record.manageTokenHash === input.manageTokenHash) {
        throw new Error("UNIQUE constraint violation: manage_token_hash");
      }
      if (record.blobPathname === input.blobPathname) {
        throw new Error("UNIQUE constraint violation: blob_pathname");
      }
    }

    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();
    const newRecord: BelgePaylasimRecord = {
      id,
      requestIdHash: input.requestIdHash,
      payloadDigest: input.payloadDigest,
      tokenHash: input.tokenHash,
      manageTokenHash: input.manageTokenHash,
      documentId: input.documentId,
      blobPathname: input.blobPathname,
      sizeBytes: null,
      pdfSha256: null,
      status: "pending",
      creatorIpHash: input.creatorIpHash,
      createdAt: now,
      expiresAt: input.expiresAt,
      revokedAt: null,
      purgedAt: null,
      purgeAttempts: 0,
      lastPurgeErrorCode: null,
      leaseUntil: null,
    };

    this.records.set(id, newRecord);
    return { ...newRecord };
  }

  async finalizeReady(id: string, sizeBytes: number, pdfSha256: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) throw new Error(`Kayıt bulunamadı: ${id}`);
    record.status = "ready";
    record.sizeBytes = sizeBytes;
    record.pdfSha256 = pdfSha256;
  }

  async markFailed(id: string, errorCode: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.status = "failed";
    record.lastPurgeErrorCode = errorCode;
  }

  async revokeLink(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) throw new Error(`Kayıt bulunamadı: ${id}`);
    record.status = "revoked";
    record.revokedAt = new Date();
  }

  async checkAndAcquireQuota(creatorIpHash: string): Promise<QuotaCheckResult> {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    let ipLast15MinCount = 0;
    let ipLast24HrCount = 0;
    let ipActiveLinksCount = 0;
    let globalLast24HrCount = 0;
    let totalActiveBytes = 0;

    for (const r of this.records.values()) {
      const createdTime = r.createdAt.getTime();
      const isActive = r.status === "ready" && r.expiresAt.getTime() > now && !r.revokedAt;

      if (isActive && r.sizeBytes) {
        totalActiveBytes += r.sizeBytes;
      }

      if (createdTime > twentyFourHoursAgo) {
        globalLast24HrCount++;
      }

      if (r.creatorIpHash === creatorIpHash) {
        if (createdTime > fifteenMinutesAgo) {
          ipLast15MinCount++;
        }
        if (createdTime > twentyFourHoursAgo) {
          ipLast24HrCount++;
        }
        if (isActive) {
          ipActiveLinksCount++;
        }
      }
    }

    if (ipLast15MinCount >= BELGE_SHARE_CONFIG.IP_RATE_LIMIT_15MIN) {
      return {
        allowed: false,
        reason: "Çok sık bağlantı oluşturdunuz. Lütfen 15 dakika sonra tekrar deneyin.",
        retryAfterSeconds: 900,
      };
    }

    if (ipLast24HrCount >= BELGE_SHARE_CONFIG.IP_RATE_LIMIT_24H) {
      return {
        allowed: false,
        reason: "Günlük bağlantı oluşturma sınırınıza ulaştınız (24 saatte azami 10 bağlantı).",
        retryAfterSeconds: 3600,
      };
    }

    if (ipActiveLinksCount >= BELGE_SHARE_CONFIG.IP_MAX_ACTIVE_LINKS) {
      return {
        allowed: false,
        reason: "Aynı anda en çok 20 aktif bağlantınız bulunabilir. Eski bağlantıları iptal edebilirsiniz.",
      };
    }

    if (globalLast24HrCount >= BELGE_SHARE_CONFIG.GLOBAL_DAILY_LIMIT) {
      return {
        allowed: false,
        reason: "Sistem günlük küresel paylaşım kotasına ulaştı. Lütfen daha sonra tekrar deneyin.",
        retryAfterSeconds: 3600,
      };
    }

    if (totalActiveBytes >= BELGE_SHARE_CONFIG.GLOBAL_MAX_ACTIVE_BLOB_BYTES) {
      return {
        allowed: false,
        reason: "Sistem depolama bütçesi sınırda. Lütfen daha sonra tekrar deneyin.",
      };
    }

    return { allowed: true };
  }

  async getActiveStats(): Promise<{ activeCount: number; totalActiveBytes: number }> {
    const now = Date.now();
    let activeCount = 0;
    let totalActiveBytes = 0;

    for (const r of this.records.values()) {
      if (r.status === "ready" && r.expiresAt.getTime() > now && !r.revokedAt) {
        activeCount++;
        totalActiveBytes += r.sizeBytes ?? 0;
      }
    }

    return { activeCount, totalActiveBytes };
  }

  async claimExpiredForPurge(limit: number, leaseDurationMs: number): Promise<BelgePaylasimRecord[]> {
    const now = Date.now();
    const candidates: BelgePaylasimRecord[] = [];

    for (const r of this.records.values()) {
      const isExpired = r.expiresAt.getTime() <= now;
      const isRevoked = r.status === "revoked";
      const isEligible = (isExpired || isRevoked) && r.status !== "purged";
      const isLeaseFree = !r.leaseUntil || r.leaseUntil.getTime() <= now;

      if (isEligible && isLeaseFree) {
        r.leaseUntil = new Date(now + leaseDurationMs);
        candidates.push({ ...r });
        if (candidates.length >= limit) break;
      }
    }

    return candidates;
  }

  async markPurged(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.status = "purged";
    record.purgedAt = new Date();
    record.leaseUntil = null;
  }

  async recordPurgeError(id: string, errorCode: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.purgeAttempts++;
    record.lastPurgeErrorCode = errorCode;
    record.leaseUntil = null;
  }

  async claimStalePendingForPurge(olderThan: Date, limit: number): Promise<BelgePaylasimRecord[]> {
    const candidates: BelgePaylasimRecord[] = [];
    for (const r of this.records.values()) {
      if (r.status === "pending" && r.createdAt.getTime() <= olderThan.getTime()) {
        candidates.push({ ...r });
        if (candidates.length >= limit) break;
      }
    }
    return candidates;
  }

  async hasRecordWithBlobPathname(pathname: string): Promise<boolean> {
    for (const r of this.records.values()) {
      if (r.blobPathname === pathname) return true;
    }
    return false;
  }

  async purgeOldTombstones(olderThan: Date, limit: number): Promise<number> {
    let count = 0;
    for (const [id, r] of Array.from(this.records.entries())) {
      if (r.status === "purged" && r.purgedAt && r.purgedAt.getTime() <= olderThan.getTime()) {
        this.records.delete(id);
        count++;
        if (count >= limit) break;
      }
    }
    return count;
  }

  clear(): void {
    this.records.clear();
  }

  updateExpiresAtForTest(id: string, expiresAt: Date): void {
    const record = this.records.get(id);
    if (record) {
      record.expiresAt = expiresAt;
    }
  }

  getAllRecordsForTest(): BelgePaylasimRecord[] {
    return Array.from(this.records.values());
  }
}

/**
 * Neon Serverless PostgreSQL repository adaptörü (Production).
 */
export class NeonBelgePaylasimRepository implements BelgePaylasimRepository {
  private readonly sql: NeonQueryFunction<false, false>;
  private ensureSchemaPromise: Promise<void> | null = null;

  constructor() {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
      throw new Error("DATABASE_URL ortam değişkeni bulunamadı.");
    }
    this.sql = neon(dbUrl);
  }

  private async ensureSchema(): Promise<void> {
    if (this.ensureSchemaPromise) return this.ensureSchemaPromise;
    this.ensureSchemaPromise = this.initSchema().catch((err) => {
      this.ensureSchemaPromise = null;
      throw err;
    });
    return this.ensureSchemaPromise;
  }

  async initSchema(): Promise<void> {
    // Migration 005 şeması
    await this.sql`
      CREATE TABLE IF NOT EXISTS belge_paylasim_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id_hash CHAR(64) NOT NULL UNIQUE,
        payload_digest CHAR(64) NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        manage_token_hash CHAR(64) NOT NULL UNIQUE,
        document_id TEXT NOT NULL,
        blob_pathname TEXT NOT NULL UNIQUE,
        size_bytes INTEGER NULL,
        pdf_sha256 CHAR(64) NULL,
        status TEXT NOT NULL,
        creator_ip_hash CHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ NULL,
        purged_at TIMESTAMPTZ NULL,
        purge_attempts INTEGER NOT NULL DEFAULT 0,
        last_purge_error_code TEXT NULL,
        lease_until TIMESTAMPTZ NULL,
        CONSTRAINT chk_belge_paylasim_document_id CHECK (document_id IN (
          'beton-dokum-tutanagi',
          'santiye-sefi-taahhutnamesi',
          'santiye-sefi-istifa-dilekcesi',
          'insaat-ruhsati-dilekcesi',
          'santiye-sefi-sozlesmesi'
        )),
        CONSTRAINT chk_belge_paylasim_status CHECK (status IN (
          'pending', 'ready', 'revoked', 'purged', 'failed'
        ))
      );
    `;

    await this.sql`CREATE INDEX IF NOT EXISTS idx_belge_paylasim_token_hash ON belge_paylasim_links(token_hash);`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_belge_paylasim_manage_token_hash ON belge_paylasim_links(manage_token_hash);`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_belge_paylasim_request_id_hash ON belge_paylasim_links(request_id_hash);`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_belge_paylasim_expiry_status ON belge_paylasim_links(expires_at, status);`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_belge_paylasim_creator_ip ON belge_paylasim_links(creator_ip_hash, created_at);`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_belge_paylasim_lease ON belge_paylasim_links(lease_until);`;
  }

  private mapRow(row: Record<string, unknown>): BelgePaylasimRecord {
    return {
      id: String(row.id),
      requestIdHash: String(row.request_id_hash),
      payloadDigest: String(row.payload_digest),
      tokenHash: String(row.token_hash),
      manageTokenHash: String(row.manage_token_hash),
      documentId: row.document_id as BelgePaylasimDocumentId,
      blobPathname: String(row.blob_pathname),
      sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
      pdfSha256: row.pdf_sha256 != null ? String(row.pdf_sha256) : null,
      status: row.status as BelgePaylasimStatus,
      creatorIpHash: String(row.creator_ip_hash),
      createdAt: new Date(String(row.created_at)),
      expiresAt: new Date(String(row.expires_at)),
      revokedAt: row.revoked_at ? new Date(String(row.revoked_at)) : null,
      purgedAt: row.purged_at ? new Date(String(row.purged_at)) : null,
      purgeAttempts: Number(row.purge_attempts || 0),
      lastPurgeErrorCode: row.last_purge_error_code ? String(row.last_purge_error_code) : null,
      leaseUntil: row.lease_until ? new Date(String(row.lease_until)) : null,
    };
  }

  async findByRequestIdHash(requestIdHash: string): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_links WHERE request_id_hash = ${requestIdHash} LIMIT 1;
    `;
    return rows[0] ? this.mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_links WHERE token_hash = ${tokenHash} LIMIT 1;
    `;
    return rows[0] ? this.mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async findByManageTokenHash(manageTokenHash: string): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_links WHERE manage_token_hash = ${manageTokenHash} LIMIT 1;
    `;
    return rows[0] ? this.mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async createPendingReservation(input: PendingReservationInput): Promise<BelgePaylasimRecord> {
    await this.ensureSchema();
    const rows = await this.sql`
      INSERT INTO belge_paylasim_links (
        request_id_hash,
        payload_digest,
        token_hash,
        manage_token_hash,
        document_id,
        blob_pathname,
        status,
        creator_ip_hash,
        expires_at
      ) VALUES (
        ${input.requestIdHash},
        ${input.payloadDigest},
        ${input.tokenHash},
        ${input.manageTokenHash},
        ${input.documentId},
        ${input.blobPathname},
        'pending',
        ${input.creatorIpHash},
        ${input.expiresAt.toISOString()}
      )
      RETURNING *;
    `;

    if (!rows[0]) throw new Error("Pending rezervasyon oluşturulamadı.");
    return this.mapRow(rows[0] as Record<string, unknown>);
  }

  async finalizeReady(id: string, sizeBytes: number, pdfSha256: string): Promise<void> {
    await this.ensureSchema();
    await this.sql`
      UPDATE belge_paylasim_links
      SET status = 'ready', size_bytes = ${sizeBytes}, pdf_sha256 = ${pdfSha256}
      WHERE id = ${id}::uuid;
    `;
  }

  async markFailed(id: string, errorCode: string): Promise<void> {
    await this.ensureSchema();
    await this.sql`
      UPDATE belge_paylasim_links
      SET status = 'failed', last_purge_error_code = ${errorCode}
      WHERE id = ${id}::uuid;
    `;
  }

  async revokeLink(id: string): Promise<void> {
    await this.ensureSchema();
    await this.sql`
      UPDATE belge_paylasim_links
      SET status = 'revoked', revoked_at = NOW()
      WHERE id = ${id}::uuid;
    `;
  }

  async checkAndAcquireQuota(creatorIpHash: string): Promise<QuotaCheckResult> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT
        COUNT(*) FILTER (WHERE creator_ip_hash = ${creatorIpHash} AND created_at > NOW() - INTERVAL '15 minutes') AS ip_15min,
        COUNT(*) FILTER (WHERE creator_ip_hash = ${creatorIpHash} AND created_at > NOW() - INTERVAL '24 hours') AS ip_24hr,
        COUNT(*) FILTER (WHERE creator_ip_hash = ${creatorIpHash} AND status = 'ready' AND expires_at > NOW() AND revoked_at IS NULL) AS ip_active,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS global_24hr,
        COALESCE(SUM(size_bytes) FILTER (WHERE status = 'ready' AND expires_at > NOW() AND revoked_at IS NULL), 0) AS total_active_bytes
      FROM belge_paylasim_links;
    `;

    const row = rows[0] as Record<string, string | number>;
    const ip15Min = Number(row?.ip_15min || 0);
    const ip24Hr = Number(row?.ip_24hr || 0);
    const ipActive = Number(row?.ip_active || 0);
    const global24Hr = Number(row?.global_24hr || 0);
    const totalActiveBytes = Number(row?.total_active_bytes || 0);

    if (ip15Min >= BELGE_SHARE_CONFIG.IP_RATE_LIMIT_15MIN) {
      return {
        allowed: false,
        reason: "Çok sık bağlantı oluşturdunuz. Lütfen 15 dakika sonra tekrar deneyin.",
        retryAfterSeconds: 900,
      };
    }

    if (ip24Hr >= BELGE_SHARE_CONFIG.IP_RATE_LIMIT_24H) {
      return {
        allowed: false,
        reason: "Günlük bağlantı oluşturma sınırınıza ulaştınız (24 saatte azami 10 bağlantı).",
        retryAfterSeconds: 3600,
      };
    }

    if (ipActive >= BELGE_SHARE_CONFIG.IP_MAX_ACTIVE_LINKS) {
      return {
        allowed: false,
        reason: "Aynı anda en çok 20 aktif bağlantınız bulunabilir.",
      };
    }

    if (global24Hr >= BELGE_SHARE_CONFIG.GLOBAL_DAILY_LIMIT) {
      return {
        allowed: false,
        reason: "Sistem günlük küresel paylaşım kotasına ulaştı. Lütfen daha sonra tekrar deneyin.",
        retryAfterSeconds: 3600,
      };
    }

    if (totalActiveBytes >= BELGE_SHARE_CONFIG.GLOBAL_MAX_ACTIVE_BLOB_BYTES) {
      return {
        allowed: false,
        reason: "Sistem depolama bütçesi sınırda. Lütfen daha sonra tekrar deneyin.",
      };
    }

    return { allowed: true };
  }

  async getActiveStats(): Promise<{ activeCount: number; totalActiveBytes: number }> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT
        COUNT(*) AS active_count,
        COALESCE(SUM(size_bytes), 0) AS total_active_bytes
      FROM belge_paylasim_links
      WHERE status = 'ready' AND expires_at > NOW() AND revoked_at IS NULL;
    `;
    const row = rows[0] as Record<string, string | number>;
    return {
      activeCount: Number(row?.active_count || 0),
      totalActiveBytes: Number(row?.total_active_bytes || 0),
    };
  }

  async claimExpiredForPurge(limit: number, leaseDurationMs: number): Promise<BelgePaylasimRecord[]> {
    await this.ensureSchema();
    const leaseIntervalSeconds = Math.max(1, Math.floor(leaseDurationMs / 1000));
    const rows = await this.sql`
      WITH candidates AS (
        SELECT id
        FROM belge_paylasim_links
        WHERE (expires_at <= NOW() OR status = 'revoked')
          AND status != 'purged'
          AND (lease_until IS NULL OR lease_until < NOW())
        ORDER BY expires_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE belge_paylasim_links l
      SET lease_until = NOW() + (${leaseIntervalSeconds} * INTERVAL '1 second')
      FROM candidates c
      WHERE l.id = c.id
      RETURNING l.*;
    `;

    return rows.map((r) => this.mapRow(r as Record<string, unknown>));
  }

  async markPurged(id: string): Promise<void> {
    await this.sql`
      UPDATE belge_paylasim_links
      SET status = 'purged', purged_at = NOW(), lease_until = NULL
      WHERE id = ${id}::uuid;
    `;
  }

  async recordPurgeError(id: string, errorCode: string): Promise<void> {
    await this.sql`
      UPDATE belge_paylasim_links
      SET purge_attempts = purge_attempts + 1,
          last_purge_error_code = ${errorCode},
          lease_until = NULL
      WHERE id = ${id}::uuid;
    `;
  }

  async claimStalePendingForPurge(olderThan: Date, limit: number): Promise<BelgePaylasimRecord[]> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT *
      FROM belge_paylasim_links
      WHERE status = 'pending' AND created_at <= ${olderThan.toISOString()}
      ORDER BY created_at ASC
      LIMIT ${limit};
    `;
    return rows.map((r) => this.mapRow(r as Record<string, unknown>));
  }

  async hasRecordWithBlobPathname(pathname: string): Promise<boolean> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT 1 FROM belge_paylasim_links WHERE blob_pathname = ${pathname} LIMIT 1;
    `;
    return rows.length > 0;
  }

  async purgeOldTombstones(olderThan: Date, limit: number): Promise<number> {
    await this.ensureSchema();
    const rows = await this.sql`
      WITH to_delete AS (
        SELECT id FROM belge_paylasim_links
        WHERE status = 'purged' AND purged_at <= ${olderThan.toISOString()}
        LIMIT ${limit}
      )
      DELETE FROM belge_paylasim_links
      WHERE id IN (SELECT id FROM to_delete)
      RETURNING id;
    `;
    return rows.length;
  }
}

let activeRepository: BelgePaylasimRepository | null = null;

export function getBelgePaylasimRepository(): BelgePaylasimRepository {
  if (activeRepository) return activeRepository;

  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel) {
    if (!hasDatabaseUrl()) {
      throw new Error("GÜVENLİK HATASI: Production ortamında veritabanı bağlantısı yapılandırılmamış.");
    }
    activeRepository = new NeonBelgePaylasimRepository();
    return activeRepository;
  }

  // Yerel ortamda DATABASE_URL tanımlıysa Neon kullan, yoksa Memory test adaptörü
  if (hasDatabaseUrl()) {
    activeRepository = new NeonBelgePaylasimRepository();
    return activeRepository;
  }

  // Test ve yerel geliştirme
  activeRepository = new MemoryBelgePaylasimRepository();
  return activeRepository;
}

export function setBelgePaylasimRepositoryForTest(repo: BelgePaylasimRepository | null): void {
  activeRepository = repo;
}
