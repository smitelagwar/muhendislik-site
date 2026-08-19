// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PUBLIC PAYLAŞIM VE İNDİRME KATMANI (WITH LOCAL FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { DokShareLink, DokShareItem, DokFile } from "./types";
import { hashShareToken, verifyPassword } from "./security";
import { SignJWT, jwtVerify } from "jose";
import { readLocalDb, writeLocalDb } from "./local-store";
import { hasDatabaseUrl } from "./runtime-mode";

const SHARE_ACCESS_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ||
    process.env.DOKUMANTASYON_SESSION_SECRET ||
    "default_share_access_secret_key_change_in_prod"
);

export type PublicShareStatus =
  | "ok"
  | "not_found"
  | "revoked"
  | "expired"
  | "limit_reached";

export interface PublicShareResult {
  status: PublicShareStatus;
  errorMessage?: string;
  link?: DokShareLink;
  requiresPassword?: boolean;
  items?: Array<
    DokShareItem & {
      file_extension?: string;
    }
  >;
  totalFiles?: number;
  totalSizeBytes?: number;
}

/**
 * Public indirme sayfası için token kontrolü ve snapshot listesini getirir
 */
export async function getPublicShareInfo(rawToken: string): Promise<PublicShareResult> {
  const tokenHash = hashShareToken(rawToken);

  let link: DokShareLink | undefined;
  let items: Array<DokShareItem & { file_extension?: string }> = [];

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    link = db.shares.find((s) => s.token_hash === tokenHash);

    if (!link) {
      return {
        status: "not_found",
        errorMessage: "Paylaşım bağlantısı bulunamadı veya geçersiz.",
      };
    }

    if (link.revoked_at) {
      return {
        status: "revoked",
        errorMessage: "Bu paylaşım bağlantısı iptal edilmiştir.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(link.expires_at);
    if (expiresAt <= now) {
      return {
        status: "expired",
        errorMessage: "Bu paylaşım bağlantısının süresi dolmuştur.",
      };
    }

    if (link.max_downloads !== null && link.download_count >= link.max_downloads) {
      return {
        status: "limit_reached",
        errorMessage: "Bu bağlantının maksimum indirme sınırına ulaşılmıştır.",
      };
    }

    const rawItems = db.share_items.filter((si) => si.share_link_id === link?.id);
    items = rawItems.map((si) => {
      const file = db.files.find((f) => f.id === si.file_id);
      return {
        ...si,
        file_extension: file?.extension || "",
      };
    });
  } else {
    const sql = getDb();

    const linkRows = (await sql`
      SELECT * FROM dok_share_links WHERE token_hash = ${tokenHash} LIMIT 1;
    `) as DokShareLink[];

    link = linkRows[0];
    if (!link) {
      return {
        status: "not_found",
        errorMessage: "Paylaşım bağlantısı bulunamadı veya geçersiz.",
      };
    }

    if (link.revoked_at) {
      return {
        status: "revoked",
        errorMessage: "Bu paylaşım bağlantısı iptal edilmiştir.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(link.expires_at);
    if (expiresAt <= now) {
      return {
        status: "expired",
        errorMessage: "Bu paylaşım bağlantısının süresi dolmuştur.",
      };
    }

    if (link.max_downloads !== null && link.download_count >= link.max_downloads) {
      return {
        status: "limit_reached",
        errorMessage: "Bu bağlantının maksimum indirme sınırına ulaşılmıştır.",
      };
    }

    // Snapshot öğelerini al
    items = (await sql`
      SELECT 
        i.*,
        f.extension AS file_extension
      FROM dok_share_items i
      LEFT JOIN dok_files f ON i.file_id = f.id
      WHERE i.share_link_id = ${link.id}
      ORDER BY i.sort_order ASC, i.snapshot_name ASC;
    `) as Array<DokShareItem & { file_extension?: string }>;
  }

  const totalSizeBytes = items.reduce(
    (acc, i) => acc + Number(i.snapshot_size_bytes),
    0
  );

  return {
    status: "ok",
    link,
    requiresPassword: !!link.password_hash,
    items,
    totalFiles: items.length,
    totalSizeBytes,
  };
}

/**
 * Şifreli link için parola doğrulama ve JWT yetki tokenı üretimi
 */
export async function createShareAccessJwt(shareLinkId: string): Promise<string> {
  return new SignJWT({ shareLinkId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("6h")
    .sign(SHARE_ACCESS_SECRET);
}

export async function verifyShareAccessJwt(
  jwt: string | undefined,
  expectedShareLinkId: string
): Promise<boolean> {
  if (!jwt) return false;
  try {
    const { payload } = await jwtVerify(jwt, SHARE_ACCESS_SECRET);
    return payload.shareLinkId === expectedShareLinkId;
  } catch {
    return false;
  }
}

/**
 * İndirme sayacını atomik olarak artırır ve son erişim tarihini günceller
 */
export async function incrementShareDownload(shareLinkId: string): Promise<boolean> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const link = db.shares.find((s) => s.id === shareLinkId);
    if (link) {
      if (link.max_downloads !== null && link.download_count >= link.max_downloads) {
        return false;
      }
      link.download_count = (link.download_count || 0) + 1;
      link.last_accessed_at = new Date().toISOString();
      writeLocalDb(db);
      return true;
    }
    return false;
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_share_links
    SET 
      download_count = download_count + 1,
      last_accessed_at = NOW()
    WHERE id = ${shareLinkId}
      AND (max_downloads IS NULL OR download_count < max_downloads)
      AND revoked_at IS NULL
    RETURNING id;
  `;
  return rows.length > 0;
}
