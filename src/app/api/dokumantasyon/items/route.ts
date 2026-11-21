// ============================================================================
// GET /api/dokumantasyon/items — KLASÖR/DOSYA LİSTELEME VE DRIVE FİLTRELERİ
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { ensureDatabaseTables, getDb } from "@/lib/dokumantasyon/db";
import { getBreadcrumbs, getFolder } from "@/lib/dokumantasyon/folders";
import {
  getEffectiveItemTimestamp,
  getFileCategory,
  matchesDateFilter,
  matchesSizeFilter,
  matchesTypeFilter,
  normalizeExtension,
} from "@/lib/dokumantasyon/file-categories";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { readLocalDb } from "@/lib/dokumantasyon/local-store";
import { hasDatabaseUrl, assertDurableDokumantasyonRuntime } from "@/lib/dokumantasyon/runtime-mode";

export const dynamic = "force-dynamic";

type CollectionFilter = "none" | "recent" | "starred";
type SortByOption = "name" | "date" | "size" | "type";

export interface DokItemsSummary {
  totalFiles: number;
  totalFolders: number;
  totalSizeBytes: number;
  starredCount: number;
  trashCount: number;
  activeSharesCount: number;
  categoryCounts: {
    cad: number;
    pdf: number;
    image: number;
    other: number;
  };
}

function enumParam<T extends string>(value: string | null, values: readonly T[], fallback: T): T {
  return value && values.includes(value as T) ? (value as T) : fallback;
}

function sortFiles(
  files: DokFile[],
  sortBy: SortByOption,
  order: "ASC" | "DESC",
  collection: CollectionFilter,
  hasExplicitSort: boolean
): DokFile[] {
  const multiplier = order === "DESC" ? -1 : 1;
  return [...files].sort((a, b) => {
    if (collection === "recent" && !hasExplicitSort) {
      return new Date(b.last_opened_at || 0).getTime() - new Date(a.last_opened_at || 0).getTime();
    }
    if (sortBy === "date") {
      return (getEffectiveItemTimestamp(a) - getEffectiveItemTimestamp(b)) * multiplier;
    }
    if (sortBy === "size") {
      return (Number(a.size_bytes || 0) - Number(b.size_bytes || 0)) * multiplier;
    }
    if (sortBy === "type") {
      const extA = normalizeExtension(a.extension || a.display_name);
      const extB = normalizeExtension(b.extension || b.display_name);
      const extCmp = extA.localeCompare(extB, "tr", { sensitivity: "base" });
      if (extCmp !== 0) return extCmp * multiplier;
      return (a.display_name || "").localeCompare(b.display_name || "", "tr", { sensitivity: "base" }) * multiplier;
    }
    return (a.display_name || "").localeCompare(b.display_name || "", "tr", { sensitivity: "base" }) * multiplier;
  });
}

function sortFolders(folders: DokFolder[], sortBy: SortByOption, order: "ASC" | "DESC"): DokFolder[] {
  const multiplier = order === "DESC" ? -1 : 1;
  return [...folders].sort((a, b) => {
    if (sortBy === "date") {
      return (getEffectiveItemTimestamp(a) - getEffectiveItemTimestamp(b)) * multiplier;
    }
    return (a.name || "").localeCompare(b.name || "", "tr", { sensitivity: "base" }) * multiplier;
  });
}

export async function GET(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertDurableDokumantasyonRuntime(false);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || null;
    const rawSortBy = searchParams.get("sortBy");
    const hasExplicitSort = Boolean(rawSortBy);
    const sortBy = enumParam(rawSortBy, ["name", "date", "size", "type"] as const, "name");
    const rawOrder = searchParams.get("order") || searchParams.get("sortOrder");
    const order = rawOrder === "desc" ? "DESC" : "ASC";
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
    let summary: DokItemsSummary = {
      totalFiles: 0,
      totalFolders: 0,
      totalSizeBytes: 0,
      starredCount: 0,
      trashCount: 0,
      activeSharesCount: 0,
      categoryCounts: { cad: 0, pdf: 0, image: 0, other: 0 },
    };

    if (!hasDatabaseUrl()) {
      const db = readLocalDb();
      const activeFolders = db.folders.filter((folder) => !folder.deleted_at);
      const activeFiles = db.files.filter((file) => !file.deleted_at);

      sourceFolders = activeFolders.filter(
        (folder) => useAllFolders || folder.parent_id === folderId || (!folder.parent_id && !folderId)
      );
      sourceFiles = activeFiles.filter(
        (file) => useAllFolders || file.folder_id === folderId || (!file.folder_id && !folderId)
      );

      const categoryCounts = { cad: 0, pdf: 0, image: 0, other: 0 };
      let totalSizeBytes = 0;
      let starredFiles = 0;
      for (const file of activeFiles) {
        totalSizeBytes += Number(file.size_bytes || 0);
        if (file.starred_at) starredFiles += 1;
        const cat = getFileCategory(file.extension || file.display_name);
        categoryCounts[cat] += 1;
      }
      const starredFolders = activeFolders.filter((folder) => Boolean(folder.starred_at)).length;
      const trashCount =
        db.files.filter((file) => Boolean(file.deleted_at)).length +
        db.folders.filter((folder) => Boolean(folder.deleted_at)).length;
      const nowMs = Date.now();
      const activeSharesCount = (db.shares || []).filter(
        (share) => !share.revoked_at && new Date(share.expires_at).getTime() > nowMs
      ).length;

      summary = {
        totalFiles: activeFiles.length,
        totalFolders: activeFolders.length,
        totalSizeBytes,
        starredCount: starredFiles + starredFolders,
        trashCount,
        activeSharesCount,
        categoryCounts,
      };
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

      const [fileStatsRows, folderStatsRows, shareStatsRows] = await Promise.all([
        sql`
          SELECT
            COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS total_files,
            COALESCE(SUM(size_bytes) FILTER (WHERE deleted_at IS NULL), 0)::bigint AS total_size_bytes,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND starred_at IS NOT NULL)::int AS starred_files,
            COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS trashed_files,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND LOWER(REPLACE(COALESCE(extension, ''), '.', '')) IN ('dwg', 'dxf', 'dwf'))::int AS cad_count,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND LOWER(REPLACE(COALESCE(extension, ''), '.', '')) = 'pdf')::int AS pdf_count,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND LOWER(REPLACE(COALESCE(extension, ''), '.', '')) IN ('png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'))::int AS image_count
          FROM dok_files;
        `,
        sql`
          SELECT
            COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS total_folders,
            COUNT(*) FILTER (WHERE deleted_at IS NULL AND starred_at IS NOT NULL)::int AS starred_folders,
            COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS trashed_folders
          FROM dok_folders;
        `,
        sql`
          SELECT COUNT(*)::int AS active_shares_count
          FROM dok_share_links
          WHERE revoked_at IS NULL AND expires_at > NOW();
        `,
      ]);

      const fs = fileStatsRows[0] || {};
      const fls = folderStatsRows[0] || {};
      const ss = shareStatsRows[0] || {};
      const totalFiles = Number(fs.total_files || 0);
      const cadCount = Number(fs.cad_count || 0);
      const pdfCount = Number(fs.pdf_count || 0);
      const imageCount = Number(fs.image_count || 0);

      summary = {
        totalFiles,
        totalFolders: Number(fls.total_folders || 0),
        totalSizeBytes: Number(fs.total_size_bytes || 0),
        starredCount: Number(fs.starred_files || 0) + Number(fls.starred_folders || 0),
        trashCount: Number(fs.trashed_files || 0) + Number(fls.trashed_folders || 0),
        activeSharesCount: Number(ss.active_shares_count || 0),
        categoryCounts: {
          cad: cadCount,
          pdf: pdfCount,
          image: imageCount,
          other: Math.max(0, totalFiles - cadCount - pdfCount - imageCount),
        },
      };
    }

    const folders = sortFolders(
      sourceFolders
        .filter((folder) => collection !== "starred" || Boolean(folder.starred_at))
        .filter(() => collection !== "recent")
        .filter(() => type === "all" && size === "all")
        .filter((folder) => matchesDateFilter(folder, date)),
      sortBy,
      order
    );

    const files = sortFiles(
      sourceFiles
        .filter((file) => collection !== "starred" || Boolean(file.starred_at))
        .filter((file) => collection !== "recent" || Boolean(file.last_opened_at))
        .filter((file) => matchesTypeFilter(file.extension || file.display_name, type))
        .filter((file) => matchesDateFilter(file, date))
        .filter((file) => matchesSizeFilter(file.size_bytes, size)),
      sortBy,
      order,
      collection,
      hasExplicitSort
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
        summary,
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
