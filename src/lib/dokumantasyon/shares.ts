// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PAYLAŞIM LİNKİ VERİ KATMANI (WITH LOCAL FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { DokFile, DokFolder, DokShareLink, DokShareItem } from "./types";
import {
  generateRawToken,
  hashShareToken,
  hashPassword,
  encryptToken,
  decryptToken,
} from "./security";
import { DOKUMANTASYON_CONFIG } from "./config";
import { getFile } from "./files";
import { getFolder } from "./folders";
import { readLocalDb, writeLocalDb } from "./local-store";
import { hasDatabaseUrl } from "./runtime-mode";

export interface ResolvedShareFile {
  file: DokFile;
  relativePath: string;
}

/**
 * Seçilen dosya ve klasörleri recursive olarak çözümler ve deduplicate eder
 */
export async function resolveItemsForShare(
  items: Array<{ id: string; type: "file" | "folder" }>
): Promise<ResolvedShareFile[]> {
  const fileMap = new Map<string, ResolvedShareFile>();

  for (const item of items) {
    if (item.type === "file") {
      const file = await getFile(item.id);
      if (file && !file.deleted_at && !fileMap.has(file.id)) {
        fileMap.set(file.id, {
          file,
          relativePath: file.display_name,
        });
      }
    } else if (item.type === "folder") {
      const rootFolder = await getFolder(item.id);
      if (!rootFolder || rootFolder.deleted_at) continue;

      // Recursive klasör içi tarama (BFS)
      const folderQueue: Array<{ folderId: string; currentPath: string }> = [
        { folderId: rootFolder.id, currentPath: rootFolder.name },
      ];

      while (folderQueue.length > 0) {
        const current = folderQueue.shift()!;

        if (!hasDatabaseUrl()) {
          const db = readLocalDb();
          const fileRows = db.files.filter((f) => f.folder_id === current.folderId && !f.deleted_at);
          for (const file of fileRows) {
            if (!fileMap.has(file.id)) {
              fileMap.set(file.id, {
                file,
                relativePath: `${current.currentPath}/${file.display_name}`,
              });
            }
          }

          const subFolderRows = db.folders.filter(
            (f) => f.parent_id === current.folderId && !f.deleted_at
          );
          for (const sub of subFolderRows) {
            folderQueue.push({
              folderId: sub.id,
              currentPath: `${current.currentPath}/${sub.name}`,
            });
          }
        } else {
          const sql = getDb();
          // 1. Bu klasördeki aktif dosyaları al
          const fileRows = (await sql`
            SELECT * FROM dok_files WHERE folder_id = ${current.folderId} AND deleted_at IS NULL;
          `) as DokFile[];

          for (const file of fileRows) {
            if (!fileMap.has(file.id)) {
              fileMap.set(file.id, {
                file,
                relativePath: `${current.currentPath}/${file.display_name}`,
              });
            }
          }

          // 2. Alt klasörleri sıraya ekle
          const subFolderRows = (await sql`
            SELECT id, name FROM dok_folders WHERE parent_id = ${current.folderId} AND deleted_at IS NULL;
          `) as DokFolder[];

          for (const sub of subFolderRows) {
            folderQueue.push({
              folderId: sub.id,
              currentPath: `${current.currentPath}/${sub.name}`,
            });
          }
        }
      }
    }
  }

  return Array.from(fileMap.values());
}

/**
 * Yeni süreli paylaşım linki ve snapshot kayıtlarını oluşturur
 */
export async function createShareLink(options: {
  items: Array<{ id: string; type: "file" | "folder" }>;
  duration: "1_DAY" | "3_DAYS" | "1_WEEK" | "1_MONTH" | "CUSTOM";
  customExpiresAt?: string;
  title?: string | null;
  password?: string | null;
  maxDownloads?: number | null;
}): Promise<{
  shareLink: DokShareLink;
  rawToken: string;
  shareUrl: string;
  totalFiles: number;
  totalSizeBytes: number;
}> {
  const resolvedFiles = await resolveItemsForShare(options.items);

  if (resolvedFiles.length === 0) {
    throw new Error("Paylaşılacak geçerli aktif dosya bulunamadı.");
  }

  // 1. Süre (Expires At) Hesaplama
  let expiresAt: Date;
  if (options.duration === "CUSTOM" && options.customExpiresAt) {
    expiresAt = new Date(options.customExpiresAt);
    if (isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new Error("Özel bitiş tarihi gelecekte bir zaman olmalıdır.");
    }
  } else {
    const seconds =
      DOKUMANTASYON_CONFIG.SHARE_DURATIONS[
        options.duration as keyof typeof DOKUMANTASYON_CONFIG.SHARE_DURATIONS
      ] || DOKUMANTASYON_CONFIG.SHARE_DURATIONS["1_DAY"];
    expiresAt = new Date(Date.now() + seconds * 1000);
  }

  // 2. Opsiyonel Şifre Hashleme
  let passwordHash: string | null = null;
  if (options.password && options.password.trim().length >= 4) {
    passwordHash = await hashPassword(options.password.trim());
  }

  // 3. Token Üretimi (32 byte base64url) ve DB Hashing (SHA-256)
  const rawToken = generateRawToken();
  const tokenHash = hashShareToken(rawToken);
  const urlTokenEncrypted = encryptToken(rawToken);

  let shareLink: DokShareLink;
  let totalSizeBytes = 0;

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const linkId = crypto.randomUUID();

    shareLink = {
      id: linkId,
      token_hash: tokenHash,
      title: options.title?.trim() || null,
      expires_at: expiresAt.toISOString(),
      password_hash: passwordHash,
      max_downloads: options.maxDownloads || null,
      download_count: 0,
      created_at: new Date().toISOString(),
      revoked_at: null,
      last_accessed_at: null,
      url_token_encrypted: urlTokenEncrypted,
    };
    db.shares.push(shareLink);

    for (let i = 0; i < resolvedFiles.length; i++) {
      const { file, relativePath } = resolvedFiles[i];
      const size = Number(file.size_bytes);
      totalSizeBytes += size;

      const item: DokShareItem = {
        id: crypto.randomUUID(),
        share_link_id: linkId,
        file_id: file.id,
        snapshot_name: file.display_name,
        relative_path: relativePath,
        snapshot_size_bytes: size,
        snapshot_mime_type: file.mime_type,
        sort_order: i,
      };
      db.share_items.push(item);
    }
    writeLocalDb(db);
  } else {
    const sql = getDb();

    // 4. Share Link DB Kaydı
    const linkRows = await sql`
      INSERT INTO dok_share_links (
        token_hash,
        title,
        expires_at,
        password_hash,
        max_downloads,
        url_token_encrypted
      ) VALUES (
        ${tokenHash},
        ${options.title?.trim() || null},
        ${expiresAt.toISOString()},
        ${passwordHash},
        ${options.maxDownloads || null},
        ${urlTokenEncrypted}
      )
      RETURNING *;
    `;

    shareLink = linkRows[0] as DokShareLink;

    // 5. Snapshot Item Kayıtları
    for (let i = 0; i < resolvedFiles.length; i++) {
      const { file, relativePath } = resolvedFiles[i];
      const size = Number(file.size_bytes);
      totalSizeBytes += size;

      await sql`
        INSERT INTO dok_share_items (
          share_link_id,
          file_id,
          snapshot_name,
          relative_path,
          snapshot_size_bytes,
          snapshot_mime_type,
          sort_order
        ) VALUES (
          ${shareLink.id},
          ${file.id},
          ${file.display_name},
          ${relativePath},
          ${size},
          ${file.mime_type},
          ${i}
        );
      `;
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareUrl = `${siteUrl}/p/${rawToken}`;

  return {
    shareLink,
    rawToken,
    shareUrl,
    totalFiles: resolvedFiles.length,
    totalSizeBytes,
  };
}

/**
 * Aktif ve geçmiş tüm linkleri listeler (Admin)
 */
export async function getAdminShareLinks(): Promise<
  Array<
    DokShareLink & {
      total_files: number;
      total_size_bytes: number;
      decrypted_token: string | null;
      is_expired: boolean;
      is_active: boolean;
    }
  >
> {
  const now = Date.now();

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    return db.shares.map((r) => {
      const expiresAtTime = new Date(r.expires_at).getTime();
      const isExpired = expiresAtTime <= now;
      const isRevoked = r.revoked_at !== null;
      const isOverDownloadLimit =
        r.max_downloads !== null && r.download_count >= r.max_downloads;
      const isActive = !isExpired && !isRevoked && !isOverDownloadLimit;

      let decryptedToken: string | null = null;
      if (r.url_token_encrypted) {
        decryptedToken = decryptToken(r.url_token_encrypted);
      }

      const items = db.share_items.filter((si) => si.share_link_id === r.id);
      const total_files = items.length;
      const total_size_bytes = items.reduce((acc, curr) => acc + Number(curr.snapshot_size_bytes), 0);

      return {
        ...r,
        total_files,
        total_size_bytes,
        decrypted_token: decryptedToken,
        is_expired: isExpired,
        is_active: isActive,
      };
    });
  }

  const sql = getDb();

  const rows = await sql`
    SELECT 
      l.*,
      COUNT(i.id)::int AS total_files,
      COALESCE(SUM(i.snapshot_size_bytes), 0)::bigint AS total_size_bytes
    FROM dok_share_links l
    LEFT JOIN dok_share_items i ON l.id = i.share_link_id
    GROUP BY l.id
    ORDER BY l.created_at DESC;
  `;

  return rows.map((r: Record<string, any>) => {
    const expiresAtTime = new Date(r.expires_at as string).getTime();
    const isExpired = expiresAtTime <= now;
    const isRevoked = r.revoked_at !== null;
    const isOverDownloadLimit =
      r.max_downloads !== null && r.download_count >= r.max_downloads;
    const isActive = !isExpired && !isRevoked && !isOverDownloadLimit;

    let decryptedToken: string | null = null;
    if (r.url_token_encrypted) {
      decryptedToken = decryptToken(r.url_token_encrypted as string);
    }

    return {
      id: r.id as string,
      token_hash: r.token_hash as string,
      title: (r.title as string) || null,
      expires_at: r.expires_at as string,
      password_hash: (r.password_hash as string) || null,
      max_downloads: r.max_downloads !== null ? Number(r.max_downloads) : null,
      download_count: Number(r.download_count || 0),
      created_at: r.created_at as string,
      revoked_at: (r.revoked_at as string) || null,
      last_accessed_at: (r.last_accessed_at as string) || null,
      url_token_encrypted: (r.url_token_encrypted as string) || null,
      total_files: Number(r.total_files || 0),
      total_size_bytes: Number(r.total_size_bytes || 0),
      decrypted_token: decryptedToken,
      is_expired: isExpired,
      is_active: isActive,
    };
  });
}

/**
 * Paylaşım linkini derhal iptal eder (Revoke)
 */
export async function revokeShareLink(id: string): Promise<void> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const link = db.shares.find((s) => s.id === id);
    if (link) {
      link.revoked_at = new Date().toISOString();
      writeLocalDb(db);
    }
    return;
  }

  const sql = getDb();
  await sql`
    UPDATE dok_share_links
    SET revoked_at = NOW()
    WHERE id = ${id};
  `;
}
