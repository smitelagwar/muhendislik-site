// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — KLASÖR VERİ KATMANI (DAL WITH LOCAL FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { DokFolder, DokBreadcrumbItem } from "./types";
import { del } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { readLocalDb, writeLocalDb, getLocalStorageDir } from "./local-store";
import { hasDatabaseUrl } from "./runtime-mode";

/**
 * Belirtilen ID'ye sahip klasörü getirir
 */
export async function getFolder(id: string): Promise<DokFolder | null> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    return db.folders.find((f) => f.id === id) || null;
  }

  const sql = getDb();
  const rows = await sql`
    SELECT * FROM dok_folders WHERE id = ${id} LIMIT 1;
  `;
  return (rows[0] as DokFolder) || null;
}

/**
 * Kök dizinden belirtilen klasöre kadar güvenilir breadcrumb zincirini oluşturur
 */
export async function getBreadcrumbs(folderId: string | null): Promise<DokBreadcrumbItem[]> {
  const breadcrumbs: DokBreadcrumbItem[] = [{ id: null, name: "Kök Dizin" }];
  if (!folderId) return breadcrumbs;

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    let currentId: string | null = folderId;
    const chain: DokBreadcrumbItem[] = [];
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const folder = db.folders.find((f) => f.id === currentId);
      if (!folder) break;
      chain.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parent_id;
    }
    return [...breadcrumbs, ...chain];
  }

  const sql = getDb();
  let currentId: string | null = folderId;
  const chain: DokBreadcrumbItem[] = [];
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const rows: Record<string, any>[] = await sql`
      SELECT id, name, parent_id FROM dok_folders WHERE id = ${currentId} LIMIT 1;
    `;
    if (!rows[0]) break;

    chain.unshift({ id: rows[0].id as string, name: rows[0].name as string });
    currentId = rows[0].parent_id as string | null;
  }

  return [...breadcrumbs, ...chain];
}

/**
 * Döngü kontrolü: candidateParentId, folderId'nin bir alt klasörü (descendant) müdür?
 */
export async function isDescendantOf(candidateParentId: string, folderId: string): Promise<boolean> {
  if (candidateParentId === folderId) return true;

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    let currentId: string | null = candidateParentId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      if (currentId === folderId) return true;
      const folder = db.folders.find((f) => f.id === currentId);
      if (!folder) break;
      currentId = folder.parent_id;
    }
    return false;
  }

  const sql = getDb();
  let currentId: string | null = candidateParentId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    if (currentId === folderId) {
      return true;
    }

    const rows: Record<string, any>[] = await sql`
      SELECT parent_id FROM dok_folders WHERE id = ${currentId} LIMIT 1;
    `;
    if (!rows[0]) break;
    currentId = rows[0].parent_id as string | null;
  }

  return false;
}

/**
 * Aynı parent altında klasör adının benzersiz olmasını sağlar
 */
export async function getUniqueFolderName(parentId: string | null, baseName: string): Promise<string> {
  let existingNames: Set<string>;

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    existingNames = new Set(
      db.folders
        .filter((f) => f.parent_id === parentId && !f.deleted_at)
        .map((f) => f.name.toLowerCase())
    );
  } else {
    const sql = getDb();
    const rows = await sql`
      SELECT name FROM dok_folders
      WHERE (parent_id = ${parentId} OR (parent_id IS NULL AND ${parentId} IS NULL))
        AND deleted_at IS NULL;
    `;
    existingNames = new Set(rows.map((r) => r.name.toLowerCase()));
  }

  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let counter = 2;
  while (existingNames.has(`${baseName} (${counter})`.toLowerCase())) {
    counter++;
  }
  return `${baseName} (${counter})`;
}

/**
 * Yeni klasör oluşturur
 */
export async function createFolder(name: string, parentId: string | null): Promise<DokFolder> {
  const uniqueName = await getUniqueFolderName(parentId, name.trim());

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const newFolder: DokFolder = {
      id: crypto.randomUUID(),
      name: uniqueName,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    db.folders.push(newFolder);
    writeLocalDb(db);
    return newFolder;
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO dok_folders (name, parent_id)
    VALUES (${uniqueName}, ${parentId})
    RETURNING *;
  `;
  return rows[0] as DokFolder;
}

/**
 * Klasör adını günceller
 */
export async function renameFolder(id: string, newName: string): Promise<DokFolder> {
  const folder = await getFolder(id);
  if (!folder) throw new Error("Klasör bulunamadı.");

  const uniqueName = await getUniqueFolderName(folder.parent_id, newName.trim());

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.folders.find((f) => f.id === id);
    if (!item) throw new Error("Klasör bulunamadı.");
    item.name = uniqueName;
    item.updated_at = new Date().toISOString();
    writeLocalDb(db);
    return item;
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_folders
    SET name = ${uniqueName}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  return rows[0] as DokFolder;
}

/**
 * Klasörü başka bir klasörün altına taşır (Döngü korumalı)
 */
export async function moveFolder(id: string, newParentId: string | null): Promise<DokFolder> {
  const folder = await getFolder(id);
  if (!folder) throw new Error("Klasör bulunamadı.");

  if (newParentId) {
    if (newParentId === id) {
      throw new Error("Bir klasör kendi içine taşınamaz.");
    }
    const isCycle = await isDescendantOf(newParentId, id);
    if (isCycle) {
      throw new Error("Bir klasör kendi alt klasörünün içine taşınamaz.");
    }
  }

  const uniqueName = await getUniqueFolderName(newParentId, folder.name);

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const item = db.folders.find((f) => f.id === id);
    if (!item) throw new Error("Klasör bulunamadı.");
    item.parent_id = newParentId;
    item.name = uniqueName;
    item.updated_at = new Date().toISOString();
    writeLocalDb(db);
    return item;
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE dok_folders
    SET parent_id = ${newParentId}, name = ${uniqueName}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  return rows[0] as DokFolder;
}

/**
 * Klasörün altındaki tüm alt klasör ID'lerini recursive olarak bulur
 */
export async function getAllSubfolderIds(rootFolderId: string): Promise<string[]> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const result: string[] = [rootFolderId];
    let currentLevel = [rootFolderId];

    while (currentLevel.length > 0) {
      const nextLevel = db.folders
        .filter((f) => f.parent_id && currentLevel.includes(f.parent_id) && !f.deleted_at)
        .map((f) => f.id);
      if (nextLevel.length === 0) break;
      result.push(...nextLevel);
      currentLevel = nextLevel;
    }
    return result;
  }

  const sql = getDb();
  const result: string[] = [rootFolderId];
  let currentLevel = [rootFolderId];

  while (currentLevel.length > 0) {
    const rows = await sql`
      SELECT id FROM dok_folders WHERE parent_id = ANY(${currentLevel}) AND deleted_at IS NULL;
    `;
    const nextLevel = rows.map((r) => r.id);
    if (nextLevel.length === 0) break;
    result.push(...nextLevel);
    currentLevel = nextLevel;
  }

  return result;
}

/**
 * Klasörü çöp kutusuna taşır (Soft delete) ve ilişkili aktif linkleri revoke eder
 */
export async function trashFolder(id: string): Promise<{ affectedFiles: number; affectedFolders: number }> {
  const folderIds = await getAllSubfolderIds(id);

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const now = new Date().toISOString();

    let affectedFiles = 0;
    let affectedFolders = 0;

    // Klasörleri soft-delete yap
    db.folders.forEach((f) => {
      if (folderIds.includes(f.id) && !f.deleted_at) {
        f.deleted_at = now;
        f.updated_at = now;
        affectedFolders++;
      }
    });

    // Dosyaları soft-delete yap
    const fileIds: string[] = [];
    db.files.forEach((file) => {
      if (file.folder_id && folderIds.includes(file.folder_id) && !file.deleted_at) {
        file.deleted_at = now;
        file.updated_at = now;
        fileIds.push(file.id);
        affectedFiles++;
      }
    });

    // Bu dosyaları içeren linkleri revoke et
    if (fileIds.length > 0) {
      db.share_items
        .filter((si) => fileIds.includes(si.file_id))
        .forEach((si) => {
          const link = db.shares.find((s) => s.id === si.share_link_id);
          if (link && !link.revoked_at) link.revoked_at = now;
        });
    }

    writeLocalDb(db);
    return { affectedFiles, affectedFolders };
  }

  const sql = getDb();
  const fileRows = await sql`
    SELECT id FROM dok_files WHERE folder_id = ANY(${folderIds}) AND deleted_at IS NULL;
  `;
  const fileIds = fileRows.map((r) => r.id);

  if (fileIds.length > 0) {
    await sql`
      UPDATE dok_share_links
      SET revoked_at = NOW()
      WHERE id IN (
        SELECT DISTINCT share_link_id FROM dok_share_items WHERE file_id = ANY(${fileIds})
      ) AND revoked_at IS NULL;
    `;

    await sql`
      UPDATE dok_files
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ANY(${fileIds});
    `;
  }

  await sql`
    UPDATE dok_folders
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ANY(${folderIds});
  `;

  return {
    affectedFiles: fileIds.length,
    affectedFolders: folderIds.length,
  };
}

/**
 * Klasörü ve doğrudan altındaki öğeleri çöp kutusundan geri yükler
 */
export async function restoreFolder(id: string): Promise<void> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const folder = db.folders.find((f) => f.id === id);
    if (!folder) return;

    if (folder.parent_id) {
      const parent = db.folders.find((f) => f.id === folder.parent_id);
      if (!parent || parent.deleted_at) {
        folder.parent_id = null;
      }
    }

    folder.deleted_at = null;
    folder.updated_at = new Date().toISOString();

    db.files.forEach((f) => {
      if (f.folder_id === id) {
        f.deleted_at = null;
        f.updated_at = new Date().toISOString();
      }
    });

    writeLocalDb(db);
    return;
  }

  const sql = getDb();
  const folder = await getFolder(id);
  if (folder?.parent_id) {
    const parent = await getFolder(folder.parent_id);
    if (!parent || parent.deleted_at) {
      await sql`UPDATE dok_folders SET parent_id = NULL WHERE id = ${id};`;
    }
  }

  await sql`
    UPDATE dok_folders SET deleted_at = NULL, updated_at = NOW() WHERE id = ${id};
  `;

  await sql`
    UPDATE dok_files SET deleted_at = NULL, updated_at = NOW() WHERE folder_id = ${id};
  `;
}

/**
 * Klasörü ve içindeki tüm dosya/alt klasörleri kalıcı olarak siler
 */
export async function permanentDeleteFolder(id: string): Promise<{ deletedBlobs: string[]; deletedCount: number }> {
  const folderIds = await getAllSubfolderIds(id);

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const storageDir = getLocalStorageDir();
    const filesToDelete = db.files.filter((f) => f.folder_id && folderIds.includes(f.folder_id));

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

    const fileIds = filesToDelete.map((f) => f.id);
    db.files = db.files.filter((f) => !fileIds.includes(f.id));
    db.share_items = db.share_items.filter((si) => !fileIds.includes(si.file_id));
    db.folders = db.folders.filter((f) => !folderIds.includes(f.id));
    writeLocalDb(db);

    return {
      deletedBlobs: [],
      deletedCount: fileIds.length,
    };
  }

  const sql = getDb();
  const fileRows = await sql`
    SELECT id, blob_url FROM dok_files WHERE folder_id = ANY(${folderIds});
  `;

  const blobUrls = fileRows.map((r) => r.blob_url).filter(Boolean);
  const fileIds = fileRows.map((r) => r.id);

  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      console.error("Vercel Blob toplu silme hatası:", err);
    }
  }

  if (fileIds.length > 0) {
    await sql`DELETE FROM dok_share_items WHERE file_id = ANY(${fileIds});`;
    await sql`DELETE FROM dok_files WHERE id = ANY(${fileIds});`;
  }

  await sql`DELETE FROM dok_folders WHERE id = ANY(${folderIds});`;

  return {
    deletedBlobs: blobUrls,
    deletedCount: fileIds.length,
  };
}
