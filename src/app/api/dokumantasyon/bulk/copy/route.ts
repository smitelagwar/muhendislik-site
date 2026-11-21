// ============================================================================
// POST /api/dokumantasyon/bulk/copy — TOPLU ÖĞE KOPYALAMA
// ============================================================================

import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { copy } from "@vercel/blob";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { bulkMoveSchema } from "@/lib/dokumantasyon/validation";
import { getFile } from "@/lib/dokumantasyon/files";
import { getFolder, isDescendantOf } from "@/lib/dokumantasyon/folders";
import { getDb } from "@/lib/dokumantasyon/db";
import { readLocalDb, writeLocalDb, getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import {
  assertDurableDokumantasyonRuntime,
  DokRuntimeConfigError,
  getBlobCommandOptions,
  hasDatabaseUrl,
} from "@/lib/dokumantasyon/runtime-mode";
import { recordDokActivity } from "@/lib/dokumantasyon/activity";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";

export const dynamic = "force-dynamic";

const MAX_COPY_DEPTH = 20;
const MAX_RECURSIVE_ITEMS = 500;

class CircularCopyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CircularCopyError";
  }
}

interface CopyBudget {
  count: number;
}

async function getUniqueCopyFileName(
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
    const rows =
      folderId === null
        ? await sql`
            SELECT display_name FROM dok_files
            WHERE folder_id IS NULL AND deleted_at IS NULL;
          `
        : await sql`
            SELECT display_name FROM dok_files
            WHERE folder_id = ${folderId}::uuid AND deleted_at IS NULL;
          `;
    existingNames = new Set(rows.map((r) => String(r.display_name).toLowerCase()));
  }

  if (!existingNames.has(originalName.toLowerCase())) {
    return originalName;
  }

  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  const firstCandidate = `${base} (Kopya)${ext}`;
  if (!existingNames.has(firstCandidate.toLowerCase())) {
    return firstCandidate;
  }

  let counter = 2;
  let candidate = `${base} (Kopya ${counter})${ext}`;
  while (existingNames.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${base} (Kopya ${counter})${ext}`;
  }

  return candidate;
}

async function getUniqueCopyFolderName(
  parentId: string | null,
  originalName: string
): Promise<string> {
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
    const rows =
      parentId === null
        ? await sql`
            SELECT name FROM dok_folders
            WHERE parent_id IS NULL AND deleted_at IS NULL;
          `
        : await sql`
            SELECT name FROM dok_folders
            WHERE parent_id = ${parentId}::uuid AND deleted_at IS NULL;
          `;
    existingNames = new Set(rows.map((r) => String(r.name).toLowerCase()));
  }

  if (!existingNames.has(originalName.toLowerCase())) {
    return originalName;
  }

  const firstCandidate = `${originalName} (Kopya)`;
  if (!existingNames.has(firstCandidate.toLowerCase())) {
    return firstCandidate;
  }

  let counter = 2;
  let candidate = `${originalName} (Kopya ${counter})`;
  while (existingNames.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${originalName} (Kopya ${counter})`;
  }

  return candidate;
}

async function createCopiedFolderRecord(name: string, parentId: string | null): Promise<DokFolder> {
  const uniqueName = await getUniqueCopyFolderName(parentId, name);
  const now = new Date().toISOString();

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const newFolder: DokFolder = {
      id: crypto.randomUUID(),
      name: uniqueName,
      parent_id: parentId,
      created_at: now,
      updated_at: now,
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

async function copySingleFile(
  sourceFile: DokFile,
  targetFolderId: string | null,
  budget: CopyBudget
): Promise<DokFile> {
  if (budget.count >= MAX_RECURSIVE_ITEMS) {
    throw new Error(`Tek seferde en fazla ${MAX_RECURSIVE_ITEMS} öğe kopyalanabilir.`);
  }
  budget.count += 1;

  const uniqueName = await getUniqueCopyFileName(targetFolderId, sourceFile.display_name);
  const ext = sourceFile.extension || path.extname(uniqueName).toLowerCase();

  if (!hasDatabaseUrl()) {
    const storageDir = getLocalStorageDir();
    const rawSourceName = sourceFile.blob_pathname
      ? path.basename(sourceFile.blob_pathname)
      : sourceFile.blob_url.replace(/^local:/, "");
    const srcPath = path.join(storageDir, rawSourceName);

    if (!fs.existsSync(srcPath)) {
      throw new Error("Kaynak dosya yerel depoda bulunamadı.");
    }

    const newDiskName = `${crypto.randomUUID()}${ext}`;
    const destPath = path.join(storageDir, newDiskName);
    fs.copyFileSync(srcPath, destPath);

    const db = readLocalDb();
    const now = new Date().toISOString();
    const newFile: DokFile = {
      id: crypto.randomUUID(),
      folder_id: targetFolderId,
      display_name: uniqueName,
      blob_pathname: `dok_storage/${newDiskName}`,
      blob_url: `local:${newDiskName}`,
      size_bytes: sourceFile.size_bytes,
      mime_type: sourceFile.mime_type,
      extension: ext,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    db.files.push(newFile);
    writeLocalDb(db);
    await recordDokActivity({
      action: "upload",
      item_type: "file",
      item_id: newFile.id,
      display_name: newFile.display_name,
    });
    return newFile;
  }

  const sourceRef = sourceFile.blob_pathname || sourceFile.blob_url;
  const targetBlobPathname = `dokumantasyon/${crypto.randomUUID()}${ext}`;
  const copiedBlob = await copy(sourceRef, targetBlobPathname, {
    access: "private",
    ...getBlobCommandOptions(),
  });

  const sql = getDb();
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
      ${targetFolderId},
      ${uniqueName},
      ${copiedBlob.pathname},
      ${copiedBlob.url},
      ${sourceFile.size_bytes},
      ${sourceFile.mime_type},
      ${ext}
    )
    RETURNING *;
  `;
  const createdFile = rows[0] as DokFile;
  await recordDokActivity({
    action: "upload",
    item_type: "file",
    item_id: createdFile.id,
    display_name: createdFile.display_name,
  });
  return createdFile;
}

async function listFolderChildren(
  folderId: string
): Promise<{ folders: DokFolder[]; files: DokFile[] }> {
  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    return {
      folders: db.folders.filter((f) => f.parent_id === folderId && !f.deleted_at),
      files: db.files.filter((f) => f.folder_id === folderId && !f.deleted_at),
    };
  }

  const sql = getDb();
  const [folderRows, fileRows] = await Promise.all([
    sql`
      SELECT * FROM dok_folders
      WHERE parent_id = ${folderId}::uuid AND deleted_at IS NULL
      ORDER BY name ASC;
    `,
    sql`
      SELECT * FROM dok_files
      WHERE folder_id = ${folderId}::uuid AND deleted_at IS NULL
      ORDER BY display_name ASC;
    `,
  ]);

  return {
    folders: folderRows as DokFolder[],
    files: fileRows as DokFile[],
  };
}

async function copyFolderRecursive(
  sourceFolder: DokFolder,
  targetParentId: string | null,
  depth: number,
  budget: CopyBudget
): Promise<DokFolder> {
  if (depth > MAX_COPY_DEPTH) {
    throw new Error(`Klasör kopyalama derinlik sınırı (${MAX_COPY_DEPTH}) aşıldı.`);
  }
  if (budget.count >= MAX_RECURSIVE_ITEMS) {
    throw new Error(`Tek seferde en fazla ${MAX_RECURSIVE_ITEMS} öğe kopyalanabilir.`);
  }
  budget.count += 1;

  // Snapshot children BEFORE creating the new folder (prevents self-recursion if target is same parent)
  const children = await listFolderChildren(sourceFolder.id);
  const createdFolder = await createCopiedFolderRecord(sourceFolder.name, targetParentId);

  for (const childFile of children.files) {
    await copySingleFile(childFile, createdFolder.id, budget);
  }

  for (const childFolder of children.folders) {
    await copyFolderRecursive(childFolder, createdFolder.id, depth + 1, budget);
  }

  return createdFolder;
}

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);
    assertDurableDokumantasyonRuntime(true);

    const body = await request.json().catch(() => ({}));
    const parseResult = bulkMoveSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz kopyalama isteği." },
        { status: 400 }
      );
    }

    const { items, targetFolderId } = parseResult.data;

    if (targetFolderId !== null) {
      const targetFolder = await getFolder(targetFolderId);
      if (!targetFolder || targetFolder.deleted_at) {
        return NextResponse.json(
          { error: "Hedef klasör bulunamadı." },
          { status: 404 }
        );
      }
    }

    const succeeded: string[] = [];
    const failed: Array<{ id: string; type: "file" | "folder"; code: string; message: string }> = [];
    const budget: CopyBudget = { count: 0 };

    for (const item of items) {
      try {
        if (item.type === "file") {
          const sourceFile = await getFile(item.id);
          if (!sourceFile || sourceFile.deleted_at) {
            throw new Error("Kaynak dosya bulunamadı.");
          }
          await copySingleFile(sourceFile, targetFolderId, budget);
        } else {
          const sourceFolder = await getFolder(item.id);
          if (!sourceFolder || sourceFolder.deleted_at) {
            throw new Error("Kaynak klasör bulunamadı.");
          }
          if (targetFolderId !== null) {
            if (targetFolderId === sourceFolder.id || (await isDescendantOf(targetFolderId, sourceFolder.id))) {
              throw new CircularCopyError("Bir klasör kendi içine veya alt klasörüne kopyalanamaz.");
            }
          }
          await copyFolderRecursive(sourceFolder, targetFolderId, 0, budget);
        }
        succeeded.push(item.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Öğe kopyalanamadı.";
        const isCycle = err instanceof CircularCopyError;
        failed.push({
          id: item.id,
          type: item.type,
          code: isCycle ? "CIRCULAR_COPY" : "COPY_ERROR",
          message,
        });
      }
    }

    return NextResponse.json({ succeeded, failed });
  } catch (err: unknown) {
    if (err instanceof DokRuntimeConfigError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Toplu kopyalama sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
