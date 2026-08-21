// ============================================================================
// GET /api/dokumantasyon/items — KLASÖR/DOSYA LİSTELEME VE DRIVE FİLTRELERİ
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { ensureDatabaseTables, getDb } from "@/lib/dokumantasyon/db";
import { getBreadcrumbs, getFolder } from "@/lib/dokumantasyon/folders";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { readLocalDb } from "@/lib/dokumantasyon/local-store";
import { hasDatabaseUrl, assertDurableDokumantasyonRuntime } from "@/lib/dokumantasyon/runtime-mode";

export const dynamic = "force-dynamic";

type CollectionFilter = "none" | "recent" | "starred";
type TypeFilter = "all" | "cad" | "pdf" | "image" | "other";
type DateFilter = "all" | "today" | "week" | "month";
type SizeFilter = "all" | "small" | "medium" | "large";

function enumParam<T extends string>(value: string | null, values: readonly T[], fallback: T): T {
  return value && values.includes(value as T) ? (value as T) : fallback;
}

function hasMatchingType(file: DokFile, type: TypeFilter): boolean {
  if (type === "all") return true;
  if (type === "cad") return file.extension === ".dwg" || file.extension === ".dxf";
  if (type === "pdf") return file.extension === ".pdf";
  if (type === "image") return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(file.extension);
  return ![".dwg", ".dxf", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(file.extension);
}

function hasMatchingDate(file: DokFile, date: DateFilter): boolean {
  if (date === "all") return true;
  const now = Date.now();
  const createdAt = new Date(file.created_at).getTime();
  const threshold = date === "today" ? now - 24 * 60 * 60 * 1000 : date === "week" ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
  return createdAt >= threshold;
}

function hasMatchingSize(file: DokFile, size: SizeFilter): boolean {
  const bytes = Number(file.size_bytes);
  if (size === "all") return true;
  if (size === "small") return bytes < 5 * 1024 * 1024;
  if (size === "medium") return bytes >= 5 * 1024 * 1024 && bytes < 100 * 1024 * 1024;
  return bytes >= 100 * 1024 * 1024;
}

function sortFiles(files: DokFile[], sortBy: string, order: "ASC" | "DESC", collection: CollectionFilter): DokFile[] {
  const multiplier = order === "DESC" ? -1 : 1;
  return [...files].sort((a, b) => {
    if (collection === "recent") {
      return new Date(b.last_opened_at || 0).getTime() - new Date(a.last_opened_at || 0).getTime();
    }
    if (sortBy === "date") return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * multiplier;
    if (sortBy === "size") return (Number(a.size_bytes) - Number(b.size_bytes)) * multiplier;
    return a.display_name.localeCompare(b.display_name, "tr") * multiplier;
  });
}

export async function GET(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertDurableDokumantasyonRuntime(false);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || null;
    const sortBy = enumParam(searchParams.get("sortBy"), ["name", "date", "size"] as const, "name");
    const order = searchParams.get("order") === "desc" ? "DESC" : "ASC";
    const collection = enumParam(searchParams.get("collection"), ["none", "recent", "starred"] as const, "none");
    const type = enumParam(searchParams.get("type"), ["all", "cad", "pdf", "image", "other"] as const, "all");
    const date = enumParam(searchParams.get("date"), ["all", "today", "week", "month"] as const, "all");
    const size = enumParam(searchParams.get("size"), ["all", "small", "medium", "large"] as const, "all");
    // Yıldızlılar ve son açılanlar klasör bağımsızdır; diğer görünüm kullanıcı seçimine uyar.
    const useAllFolders = collection !== "none" || searchParams.get("scope") === "all";

    const currentFolder = folderId ? await getFolder(folderId) : null;
    const breadcrumbs = await getBreadcrumbs(folderId);
    let sourceFolders: DokFolder[] = [];
    let sourceFiles: DokFile[] = [];
    let starredCount = 0;

    if (!hasDatabaseUrl()) {
      const db = readLocalDb();
      sourceFolders = db.folders.filter((folder) => !folder.deleted_at && (useAllFolders || folder.parent_id === folderId || (!folder.parent_id && !folderId)));
      sourceFiles = db.files.filter((file) => !file.deleted_at && (useAllFolders || file.folder_id === folderId || (!file.folder_id && !folderId)));
      starredCount = db.files.filter((file) => !file.deleted_at && file.starred_at).length + db.folders.filter((folder) => !folder.deleted_at && folder.starred_at).length;
    } else {
      const sql = getDb();
      await ensureDatabaseTables(sql);

      if (useAllFolders) {
        sourceFolders = (await sql`SELECT * FROM dok_folders WHERE deleted_at IS NULL ORDER BY name ASC;`) as DokFolder[];
        sourceFiles = (await sql`SELECT * FROM dok_files WHERE deleted_at IS NULL;`) as DokFile[];
      } else if (folderId) {
        sourceFolders = (await sql`SELECT * FROM dok_folders WHERE parent_id = ${folderId} AND deleted_at IS NULL ORDER BY name ASC;`) as DokFolder[];
        sourceFiles = (await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL;`) as DokFile[];
      } else {
        sourceFolders = (await sql`SELECT * FROM dok_folders WHERE parent_id IS NULL AND deleted_at IS NULL ORDER BY name ASC;`) as DokFolder[];
        sourceFiles = (await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL;`) as DokFile[];
      }

      const countRows = await sql`
        SELECT
          (SELECT COUNT(*)::int FROM dok_files WHERE deleted_at IS NULL AND starred_at IS NOT NULL) AS file_count,
          (SELECT COUNT(*)::int FROM dok_folders WHERE deleted_at IS NULL AND starred_at IS NOT NULL) AS folder_count;
      `;
      starredCount = Number(countRows[0]?.file_count || 0) + Number(countRows[0]?.folder_count || 0);
    }

    const folders = sourceFolders
      .filter((folder) => collection !== "starred" || Boolean(folder.starred_at))
      .filter(() => collection !== "recent")
      .filter(() => type === "all" && date === "all" && size === "all")
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));

    const files = sortFiles(
      sourceFiles
        .filter((file) => collection !== "starred" || Boolean(file.starred_at))
        .filter((file) => collection !== "recent" || Boolean(file.last_opened_at))
        .filter((file) => hasMatchingType(file, type))
        .filter((file) => hasMatchingDate(file, date))
        .filter((file) => hasMatchingSize(file, size)),
      sortBy,
      order,
      collection
    );

    const { getPreviewKind } = await import("@/lib/dokumantasyon/preview-capabilities");
    const safeFiles = files.map((file) => ({
      id: file.id,
      folder_id: file.folder_id,
      display_name: file.display_name,
      size_bytes: Number(file.size_bytes),
      mime_type: file.mime_type,
      extension: file.extension,
      created_at: file.created_at,
      updated_at: file.updated_at,
      starred_at: file.starred_at || null,
      last_opened_at: file.last_opened_at || null,
      preview_kind: getPreviewKind(file.extension),
    }));

    return NextResponse.json(
      {
        folder: currentFolder,
        breadcrumbs,
        folders,
        files: safeFiles,
        summary: { starredCount },
        filters: { collection, type, date, size, scope: useAllFolders ? "all" : "current" },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const { DokRuntimeConfigError } = await import("@/lib/dokumantasyon/runtime-mode");
    if (err instanceof DokRuntimeConfigError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
    }
    console.error("Öğe listeleme hatası:", err);
    return NextResponse.json({ error: "Öğeler listelenirken bir hata oluştu." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
