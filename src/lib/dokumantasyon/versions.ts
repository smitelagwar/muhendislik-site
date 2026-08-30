// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOSYA VERSİYONLAMA VE SNAPSHOT SERVİSİ
// ============================================================================

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";
import { getDb, ensureDatabaseTables } from "./db";
import { DokRuntimeConfigError, getBlobCommandOptions, hasBlobAccessConfiguration, isExplicitLocalDokMode } from "./runtime-mode";
import { readLocalDb, writeLocalDb, getLocalStorageDir } from "./local-store";
import { DokFileVersion } from "./types";
import { releaseCadDerivatives } from "./cad-aps";

/**
 * Dosya için SHA-256 hash hesaplar
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Bir dosyanın tüm versiyon geçmişini getirir
 */
export async function getFileVersions(fileId: string): Promise<DokFileVersion[]> {
  if (isExplicitLocalDokMode()) {
    const db = readLocalDb();
    if (!db.file_versions) db.file_versions = [];

    const file = db.files.find((f) => f.id === fileId && !f.deleted_at);
    if (!file) return [];

    let versions = db.file_versions.filter((v) => v.file_id === fileId);

    // Eğer henüz v1 kaydı yoksa mevcut dosyadan v1 üret
    if (versions.length === 0) {
      const v1: DokFileVersion = {
        id: crypto.randomUUID(),
        file_id: file.id,
        version_number: 1,
        blob_pathname: file.blob_pathname,
        blob_url: file.blob_url,
        size_bytes: file.size_bytes,
        mime_type: file.mime_type,
        sha256_hash: null,
        comment: "Orijinal yükleme",
        created_by: "admin",
        created_at: file.created_at || new Date().toISOString(),
      };
      db.file_versions.push(v1);
      writeLocalDb(db);
      versions = [v1];
    }

    return versions.sort((a, b) => b.version_number - a.version_number);
  }

  const sql = getDb();
  await ensureDatabaseTables(sql);

  const fileRows = await sql`
    SELECT * FROM dok_files WHERE id = ${fileId} AND deleted_at IS NULL LIMIT 1;
  `;
  if (fileRows.length === 0) return [];
  const file = fileRows[0];

  const versionRows = await sql`
    SELECT * FROM dok_file_versions WHERE file_id = ${fileId} ORDER BY version_number DESC;
  `;

  if (versionRows.length === 0) {
    // v1 kaydını otomatik başlat
    const v1Id = crypto.randomUUID();
    await sql`
      INSERT INTO dok_file_versions (
        id, file_id, version_number, blob_pathname, blob_url, size_bytes, mime_type, comment, created_by, created_at
      ) VALUES (
        ${v1Id}, ${file.id}, 1, ${file.blob_pathname}, ${file.blob_url}, ${file.size_bytes}, ${file.mime_type}, 'Orijinal yükleme', 'admin', ${file.created_at}
      ) ON CONFLICT (file_id, version_number) DO NOTHING;
    `;

    const freshRows = await sql`
      SELECT * FROM dok_file_versions WHERE file_id = ${fileId} ORDER BY version_number DESC;
    `;
    return freshRows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      file_id: String(r.file_id),
      version_number: Number(r.version_number),
      blob_pathname: String(r.blob_pathname),
      blob_url: String(r.blob_url),
      size_bytes: Number(r.size_bytes),
      mime_type: String(r.mime_type),
      sha256_hash: r.sha256_hash ? String(r.sha256_hash) : null,
      comment: r.comment ? String(r.comment) : null,
      created_by: String(r.created_by),
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    }));
  }

  return versionRows.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    file_id: String(r.file_id),
    version_number: Number(r.version_number),
    blob_pathname: String(r.blob_pathname),
    blob_url: String(r.blob_url),
    size_bytes: Number(r.size_bytes),
    mime_type: String(r.mime_type),
    sha256_hash: r.sha256_hash ? String(r.sha256_hash) : null,
    comment: r.comment ? String(r.comment) : null,
    created_by: String(r.created_by),
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }));
}

/**
 * Dosya için yeni bir versiyon kaydeder
 */
export async function createNewFileVersion(params: {
  fileId: string;
  contentBuffer: Buffer;
  mimeType?: string;
  comment?: string;
  username?: string;
}): Promise<DokFileVersion> {
  const { fileId, contentBuffer, comment = "Stüdyo düzenlemesi", username = "admin" } = params;
  const sha256_hash = calculateSha256(contentBuffer);
  const size_bytes = contentBuffer.length;

  if (isExplicitLocalDokMode()) {
    const db = readLocalDb();
    if (!db.file_versions) db.file_versions = [];

    const fileIndex = db.files.findIndex((f) => f.id === fileId && !f.deleted_at);
    if (fileIndex === -1) throw new Error("Dosya bulunamadı.");
    const file = db.files[fileIndex];

    // Önceki versiyonlar
    const existingVersions = db.file_versions.filter((v) => v.file_id === fileId);
    let currentMaxVersion = 0;
    if (existingVersions.length > 0) {
      currentMaxVersion = Math.max(...existingVersions.map((v) => v.version_number));
    } else {
      // v1 ekle
      const v1: DokFileVersion = {
        id: crypto.randomUUID(),
        file_id: file.id,
        version_number: 1,
        blob_pathname: file.blob_pathname,
        blob_url: file.blob_url,
        size_bytes: file.size_bytes,
        mime_type: file.mime_type,
        sha256_hash: null,
        comment: "Orijinal yükleme",
        created_by: "admin",
        created_at: file.created_at || new Date().toISOString(),
      };
      db.file_versions.push(v1);
      currentMaxVersion = 1;
    }

    const nextVersionNumber = currentMaxVersion + 1;
    const filename = `${file.id}_v${nextVersionNumber}${file.extension}`;
    const storageDir = getLocalStorageDir();
    const filePath = path.join(storageDir, filename);

    fs.writeFileSync(filePath, contentBuffer);

    const blob_pathname = `dok_storage/${filename}`;
    const blob_url = `/api/dokumantasyon/files/${file.id}/access`;

    const newVersion: DokFileVersion = {
      id: crypto.randomUUID(),
      file_id: file.id,
      version_number: nextVersionNumber,
      blob_pathname,
      blob_url,
      size_bytes,
      mime_type: params.mimeType || file.mime_type,
      sha256_hash,
      comment,
      created_by: username,
      created_at: new Date().toISOString(),
    };

    db.file_versions.push(newVersion);

    // Ana dosya kaydını güncelle
    db.files[fileIndex] = {
      ...file,
      current_version_number: nextVersionNumber,
      size_bytes,
      blob_pathname,
      blob_url,
      updated_at: new Date().toISOString(),
    };

    writeLocalDb(db);
    if (file.extension.toLowerCase() === ".dwg") {
      await releaseCadDerivatives(fileId);
    }
    return newVersion;
  }

  // PostgreSQL / Vercel Modu
  const sql = getDb();
  await ensureDatabaseTables(sql);

  const fileRows = await sql`
    SELECT * FROM dok_files WHERE id = ${fileId} AND deleted_at IS NULL LIMIT 1;
  `;
  if (fileRows.length === 0) throw new Error("Dosya bulunamadı.");
  const file = fileRows[0];

  const versionRows = await sql`
    SELECT version_number FROM dok_file_versions WHERE file_id = ${fileId} ORDER BY version_number DESC;
  `;

  let nextVersionNumber = 2;
  if (versionRows.length === 0) {
    // v1 kaydını ekle
    await sql`
      INSERT INTO dok_file_versions (
        id, file_id, version_number, blob_pathname, blob_url, size_bytes, mime_type, comment, created_by, created_at
      ) VALUES (
        ${crypto.randomUUID()}, ${file.id}, 1, ${file.blob_pathname}, ${file.blob_url}, ${file.size_bytes}, ${file.mime_type}, 'Orijinal yükleme', 'admin', ${file.created_at}
      ) ON CONFLICT (file_id, version_number) DO NOTHING;
    `;
    nextVersionNumber = 2;
  } else {
    nextVersionNumber = Math.max(...versionRows.map((r: Record<string, unknown>) => Number(r.version_number))) + 1;
  }

  let blob_pathname = `dokumantasyon/${file.id}_v${nextVersionNumber}${file.extension}`;
  let blob_url = "";

  if (hasBlobAccessConfiguration()) {
    const blobRes = await put(blob_pathname, contentBuffer, {
      access: "private",
      contentType: params.mimeType || file.mime_type,
      ...getBlobCommandOptions(),
    });
    blob_pathname = blobRes.pathname;
    blob_url = blobRes.url;
  } else {
    throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
  }

  const versionId = crypto.randomUUID();
  await sql`
    INSERT INTO dok_file_versions (
      id, file_id, version_number, blob_pathname, blob_url, size_bytes, mime_type, sha256_hash, comment, created_by, created_at
    ) VALUES (
      ${versionId}, ${file.id}, ${nextVersionNumber}, ${blob_pathname}, ${blob_url}, ${size_bytes}, ${params.mimeType || file.mime_type}, ${sha256_hash}, ${comment}, ${username}, NOW()
    );
  `;

  await sql`
    UPDATE dok_files SET
      current_version_number = ${nextVersionNumber},
      size_bytes = ${size_bytes},
      blob_pathname = ${blob_pathname},
      blob_url = ${blob_url},
      updated_at = NOW()
    WHERE id = ${file.id};
  `;

  if (file.extension.toLowerCase() === ".dwg") {
    await releaseCadDerivatives(fileId);
  }

  return {
    id: versionId,
    file_id: file.id,
    version_number: nextVersionNumber,
    blob_pathname,
    blob_url,
    size_bytes,
    mime_type: params.mimeType || file.mime_type,
    sha256_hash,
    comment,
    created_by: username,
    created_at: new Date().toISOString(),
  };
}

/**
 * Eski bir versiyonu yeni bir versiyon olarak geri yükler
 */
export async function restoreFileVersion(params: {
  fileId: string;
  versionId: string;
  username?: string;
}): Promise<DokFileVersion> {
  const { fileId, versionId, username = "admin" } = params;

  if (isExplicitLocalDokMode()) {
    const db = readLocalDb();
    if (!db.file_versions) db.file_versions = [];

    const targetVersion = db.file_versions.find(
      (v) => v.id === versionId && v.file_id === fileId
    );
    if (!targetVersion) throw new Error("Geri yüklenecek versiyon bulunamadı.");

    const storageDir = getLocalStorageDir();
    const targetFilePath = path.join(storageDir, path.basename(targetVersion.blob_pathname));
    let buffer: Buffer;

    if (fs.existsSync(targetFilePath)) {
      buffer = fs.readFileSync(targetFilePath);
    } else {
      buffer = Buffer.from("");
    }

    return createNewFileVersion({
      fileId,
      contentBuffer: buffer,
      mimeType: targetVersion.mime_type,
      comment: `v${targetVersion.version_number} sürümünden geri yüklendi`,
      username,
    });
  }

  const sql = getDb();
  await ensureDatabaseTables(sql);

  const versionRows = await sql`
    SELECT * FROM dok_file_versions WHERE id = ${versionId} AND file_id = ${fileId} LIMIT 1;
  `;
  if (versionRows.length === 0) throw new Error("Geri yüklenecek versiyon bulunamadı.");
  const targetVersion = versionRows[0];

  return createNewFileVersion({
    fileId,
    contentBuffer: Buffer.from(""), // Vercel / serverless copy
    mimeType: targetVersion.mime_type,
    comment: `v${targetVersion.version_number} sürümünden geri yüklendi`,
    username,
  });
}
