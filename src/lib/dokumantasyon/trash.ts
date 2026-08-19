// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ÇÖP KUTUSU SERVİSİ (WITH LOCAL FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { DokTrashItem } from "./types";
import { del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { readLocalDb, writeLocalDb, getLocalStorageDir } from "./local-store";

/**
 * Çöp kutusundaki tüm silinmiş dosya ve klasörleri listeler
 */
export async function getTrashItems(): Promise<DokTrashItem[]> {
  if (!process.env.DATABASE_URL) {
    const db = readLocalDb();
    const folderItems: DokTrashItem[] = db.folders
      .filter((f) => f.deleted_at)
      .map((f) => ({
        id: f.id,
        type: "folder" as const,
        name: f.name,
        deleted_at: f.deleted_at!,
      }));

    const fileItems: DokTrashItem[] = db.files
      .filter((f) => f.deleted_at)
      .map((f) => {
        const parent = db.folders.find((p) => p.id === f.folder_id);
        return {
          id: f.id,
          type: "file" as const,
          name: f.display_name,
          size_bytes: Number(f.size_bytes),
          deleted_at: f.deleted_at!,
          original_folder_name: parent?.name || null,
        };
      });

    return [...folderItems, ...fileItems].sort(
      (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
    );
  }

  const sql = getDb();

  const folderRows = await sql`
    SELECT id, name, deleted_at, 'folder' AS type
    FROM dok_folders
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
  `;

  const fileRows = await sql`
    SELECT f.id, f.display_name AS name, f.size_bytes, f.deleted_at, 'file' AS type,
           p.name AS original_folder_name
    FROM dok_files f
    LEFT JOIN dok_folders p ON f.folder_id = p.id
    WHERE f.deleted_at IS NOT NULL
    ORDER BY f.deleted_at DESC;
  `;

  const items: DokTrashItem[] = [
    ...folderRows.map((r) => ({
      id: r.id as string,
      type: "folder" as const,
      name: r.name as string,
      deleted_at: r.deleted_at as string,
    })),
    ...fileRows.map((r) => ({
      id: r.id as string,
      type: "file" as const,
      name: r.name as string,
      size_bytes: Number(r.size_bytes),
      deleted_at: r.deleted_at as string,
      original_folder_name: (r.original_folder_name as string) || null,
    })),
  ];

  return items.sort(
    (a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
  );
}

/**
 * Çöp kutusunu tamamen boşaltır
 */
export async function emptyTrash(): Promise<{ deletedFilesCount: number; deletedFoldersCount: number }> {
  if (!process.env.DATABASE_URL) {
    const db = readLocalDb();
    const storageDir = getLocalStorageDir();

    const filesToDelete = db.files.filter((f) => f.deleted_at);
    filesToDelete.forEach((file) => {
      if (file.blob_url?.startsWith("local:")) {
        const fileNameOnDisk = file.blob_url.replace("local:", "");
        const diskPath = path.join(storageDir, fileNameOnDisk);
        if (fs.existsSync(diskPath)) {
          try {
            fs.unlinkSync(diskPath);
          } catch {
            // ignore
          }
        }
      }
    });

    const deletedFilesCount = filesToDelete.length;
    const deletedFoldersCount = db.folders.filter((f) => f.deleted_at).length;

    const fileIds = filesToDelete.map((f) => f.id);
    db.files = db.files.filter((f) => !f.deleted_at);
    db.share_items = db.share_items.filter((si) => !fileIds.includes(si.file_id));
    db.folders = db.folders.filter((f) => !f.deleted_at);

    writeLocalDb(db);
    return { deletedFilesCount, deletedFoldersCount };
  }

  const sql = getDb();

  // 1. Silinmiş dosyaların Blob URL'lerini al
  const fileRows = await sql`
    SELECT id, blob_url FROM dok_files WHERE deleted_at IS NOT NULL;
  `;

  const blobUrls = fileRows.map((r) => r.blob_url).filter(Boolean);
  const fileIds = fileRows.map((r) => r.id);

  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      console.error("Çöp kutusu Blob temizliği hatası:", err);
    }
  }

  // 2. DB'den silinmiş dosyaları ve share item bağlantılarını sil
  if (fileIds.length > 0) {
    await sql`DELETE FROM dok_share_items WHERE file_id = ANY(${fileIds});`;
    await sql`DELETE FROM dok_files WHERE id = ANY(${fileIds});`;
  }

  // 3. Silinmiş klasörleri sil
  const folderRows = await sql`
    SELECT id FROM dok_folders WHERE deleted_at IS NOT NULL;
  `;
  const folderIds = folderRows.map((r) => r.id);

  if (folderIds.length > 0) {
    await sql`DELETE FROM dok_folders WHERE id = ANY(${folderIds});`;
  }

  return {
    deletedFilesCount: fileIds.length,
    deletedFoldersCount: folderIds.length,
  };
}
