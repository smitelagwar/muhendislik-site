// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOSYA VERİ KATMANI (DAL WITH LOCAL FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { DokFile } from "./types";
import { del } from "@vercel/blob";
import path from "path";
import fs from "fs";
import { readLocalDb, writeLocalDb, getLocalStorageDir } from "./local-store";
import { hasDatabaseUrl, getBlobCommandOptions, hasBlobAccessConfiguration } from "./runtime-mode";
import { releaseCadDerivatives } from "./cad-aps";

/**
 * Belirtilen ID'ye sahip dosyayı getirir
 */
export async function getFile(id: string): Promise<DokFile | null> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    return db.files.find((f) => f.id === id) || null;
  }

  const sql = getDb();
  const rows = await sql`
    SELECT * FROM dok_files WHERE id = ${id} LIMIT 1;
  `;
  return (rows[0] as DokFile) || null;
}

/**
 * Aynı klasör altında dosya adının çakışmasını engeller (örn: "Plan (1).pdf")
 */
export async function getUniqueFileName(
  folderId: string | null,
  originalName: string
): Promise<string> {
  let existingNames: Set<string>;

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    existingNames = new Set(
      db.files
        .filter((f) => f.folder_id === folderId && !f.deleted_at)
        .map((f) => f.display_name.toLowerCase())
    );
  } else {
    const sql = getDb();
    // Nullable UUID değerini ikinci bir tipsiz null denetiminde bağlama:
    // PostgreSQL bu placeholder'ın türünü 42P18 ile çözemeyebilir.
    // Root ve alt klasör sorgularını ayrı, tip bağlamı açık dallarda tutuyoruz.
    if (folderId === null) {
      const rows = await sql`
        SELECT display_name FROM dok_files
        WHERE folder_id IS NULL
          AND deleted_at IS NULL;
      `;
      existingNames = new Set(rows.map((r) => r.display_name.toLowerCase()));
    } else {
      const rows = await sql`
        SELECT display_name FROM dok_files
        WHERE folder_id = ${folderId}::uuid
          AND deleted_at IS NULL;
      `;
      existingNames = new Set(rows.map((r) => r.display_name.toLowerCase()));
    }
  }

  if (!existingNames.has(originalName.toLowerCase())) {
    return originalName;
  }

  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;
  while (existingNames.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${base} (${counter})${ext}`;
  }

  return candidate;
}

/**
 * Yeni dosya kaydı oluşturur
 */
export async function createFileRecord(data: {
  folder_id: string | null;
  display_name: string;
  blob_pathname: string;
  blob_url: string;
  size_bytes: number;
  mime_type: string;
  extension: string;
}): Promise<DokFile> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const existing = db.files.find((f) => f.blob_pathname === data.blob_pathname && !f.deleted_at);
    if (existing) return existing;

    const uniqueName = await getUniqueFileName(data.folder_id, data.display_name);
    const newFile: DokFile = {
      id: crypto.randomUUID(),
      folder_id: data.folder_id,
      display_name: uniqueName,
      blob_pathname: data.blob_pathname,
      blob_url: data.blob_url,
      size_bytes: data.size_bytes,
      mime_type: data.mime_type,
      extension: data.extension,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    db.files.push(newFile);
    writeLocalDb(db);
    return newFile;
  }

  const sql = getDb();

  // 1. Varsa mevcut kaydı döndür (idempotency)
  const existingRows = await sql`
    SELECT * FROM dok_files
    WHERE blob_pathname = ${data.blob_pathname} AND deleted_at IS NULL
    LIMIT 1;
  `;
  if (existingRows.length > 0) {
    return existingRows[0] as DokFile;
  }

  // 2. Atomic insert & çakışma durumunda isim retry
  let candidateName = await getUniqueFileName(data.folder_id, data.display_name);
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      const rows = await sql`
        INSERT INTO dok_files (
          folder_id,
          display_name,
          blob_pathname,
          blob_url,
          size_bytes,
          mime_type,
          extension
        ) VALUES (
          ${data.folder_id},
          ${candidateName},
          ${data.blob_pathname},
          ${data.blob_url},
          ${data.size_bytes},
          ${data.mime_type},
          ${data.extension}
        )
        ON CONFLICT (blob_pathname) DO UPDATE SET updated_at = NOW()
        RETURNING *;
      `;
      return rows[0] as DokFile;
    } catch (err: unknown) {
      attempts++;
      if (attempts < maxAttempts) {
        candidateName = await getUniqueFileName(data.folder_id, data.display_name);
      } else {
        throw err;
      }
    }
  }

  throw new Error("Dosya veritabanı kaydı oluşturulamadı.");
}

export async function createFile(data: {
  displayName: string;
  folderId: string | null;
  blobUrl: string;
  blobPathname: string;
  sizeBytes: number;
  mimeType: string;
}): Promise<DokFile> {
  const ext = path.extname(data.displayName).toLowerCase();
  return createFileRecord({
    display_name: data.displayName,
    folder_id: data.folderId,
    blob_url: data.blobUrl,
    blob_pathname: data.blobPathname,
    size_bytes: data.sizeBytes,
    mime_type: data.mimeType,
    extension: ext,
  });
}

/**
 * Dosya görünen adını günceller (Blob nesnesine dokunulmaz)
 */
export async function renameFile(id: string, newDisplayName: string): Promise<DokFile> {
  const file = await getFile(id);
  if (!file) throw new Error("Dosya bulunamadı.");

  const uniqueName = await getUniqueFileName(file.folder_id, newDisplayName.trim());

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.files.find((f) => f.id === id);
    if (!item) throw new Error("Dosya bulunamadı.");
    item.display_name = uniqueName;
    item.updated_at = new Date().toISOString();
    writeLocalDb(db);
    return item;
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_files
    SET display_name = ${uniqueName}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  return rows[0] as DokFile;
}

/**
 * Dosyayı başka bir klasöre taşır (Blob nesnesine dokunulmaz)
 */
export async function moveFile(id: string, newFolderId: string | null): Promise<DokFile> {
  const file = await getFile(id);
  if (!file) throw new Error("Dosya bulunamadı.");

  const uniqueName = await getUniqueFileName(newFolderId, file.display_name);

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.files.find((f) => f.id === id);
    if (!item) throw new Error("Dosya bulunamadı.");
    item.folder_id = newFolderId;
    item.display_name = uniqueName;
    item.updated_at = new Date().toISOString();
    writeLocalDb(db);
    return item;
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_files
    SET folder_id = ${newFolderId}, display_name = ${uniqueName}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  return rows[0] as DokFile;
}

/**
 * Dosyayı çöp kutusuna taşır ve bu dosyayı içeren tüm aktif paylaşımları iptal eder
 */
export async function trashFile(id: string): Promise<void> {
  await releaseCadDerivatives(id);

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.files.find((f) => f.id === id);
    if (item) {
      item.deleted_at = new Date().toISOString();
      item.updated_at = new Date().toISOString();
      // Bu dosyayı içeren linkleri revoke et
      db.share_items
        .filter((si) => si.file_id === id)
        .forEach((si) => {
          const link = db.shares.find((s) => s.id === si.share_link_id);
          if (link) link.revoked_at = new Date().toISOString();
        });
      writeLocalDb(db);
    }
    return;
  }

  const sql = getDb();
  await sql`
    UPDATE dok_share_links
    SET revoked_at = NOW()
    WHERE id IN (
      SELECT share_link_id FROM dok_share_items WHERE file_id = ${id}
    ) AND revoked_at IS NULL;
  `;

  await sql`
    UPDATE dok_files
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id};
  `;
}

/**
 * Dosyayı çöp kutusundan geri yükler
 */
export async function restoreFile(id: string): Promise<void> {
  const file = await getFile(id);
  if (!file) throw new Error("Dosya bulunamadı.");

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.files.find((f) => f.id === id);
    if (item) {
      item.deleted_at = null;
      item.updated_at = new Date().toISOString();
      writeLocalDb(db);
    }
    return;
  }

  const sql = getDb();
  if (file.folder_id) {
    const parentFolderRows = await sql`
      SELECT id, deleted_at FROM dok_folders WHERE id = ${file.folder_id} LIMIT 1;
    `;
    if (!parentFolderRows[0] || parentFolderRows[0].deleted_at) {
      await sql`UPDATE dok_files SET folder_id = NULL WHERE id = ${id};`;
    }
  }

  await sql`
    UPDATE dok_files
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = ${id};
  `;
}

/**
 * Dosyayı kalıcı olarak siler (Private Blob / Local Storage + DB temizliği)
 */
export async function permanentDeleteFile(id: string): Promise<void> {
  const file = await getFile(id);
  if (!file) return;

  await releaseCadDerivatives(id);

  const isLocal = file.blob_url?.startsWith("local:");
  if (isLocal) {
    const fileNameOnDisk = file.blob_url.replace("local:", "");
    const diskPath = path.join(getLocalStorageDir(), fileNameOnDisk);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch {}
    }
  } else if (file.blob_pathname || file.blob_url) {
    try {
      if (hasBlobAccessConfiguration()) {
        await del(file.blob_pathname || file.blob_url, getBlobCommandOptions());
      }
    } catch (err: unknown) {
      console.warn("Vercel Blob silme uyarısı:", err);
      if (hasDatabaseUrl()) {
        const sql = getDb();
        const errMsg = err instanceof Error ? err.message : String(err);
        await sql`
          UPDATE dok_files
          SET purge_status = 'failed', purge_last_error = ${errMsg}
          WHERE id = ${id};
        `;
        throw new Error(`Kalıcı depolamadaki dosya silinemedi: ${errMsg}`);
      }
    }
  }

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    db.files = db.files.filter((f) => f.id !== id);
    db.share_items = db.share_items.filter((si) => si.file_id !== id);
    writeLocalDb(db);
    return;
  }

  const sql = getDb();
  await sql`DELETE FROM dok_share_items WHERE file_id = ${id};`;
  await sql`DELETE FROM dok_files WHERE id = ${id};`;
}
