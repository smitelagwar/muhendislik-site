// ============================================================================
// GET /api/dokumantasyon/items — KLASÖR VE DOSYA LİSTELEME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getDb } from "@/lib/dokumantasyon/db";
import { getBreadcrumbs, getFolder } from "@/lib/dokumantasyon/folders";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { readLocalDb } from "@/lib/dokumantasyon/local-store";
import { hasDatabaseUrl, assertDurableDokumantasyonRuntime } from "@/lib/dokumantasyon/runtime-mode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertDurableDokumantasyonRuntime(false);

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || null;
    const sortBy = searchParams.get("sortBy") || "name"; // 'name' | 'date' | 'size'
    const order = searchParams.get("order") === "desc" ? "DESC" : "ASC";

    const currentFolder = folderId ? await getFolder(folderId) : null;
    const breadcrumbs = await getBreadcrumbs(folderId);

    let folderRows: DokFolder[] = [];
    let fileRows: DokFile[] = [];

    if (!hasDatabaseUrl()) {
      const db = readLocalDb();
      folderRows = db.folders.filter(
        (f) => (f.parent_id === folderId || (!f.parent_id && !folderId)) && !f.deleted_at
      );
      folderRows.sort((a, b) => a.name.localeCompare(b.name, "tr"));

      fileRows = db.files.filter(
        (f) => (f.folder_id === folderId || (!f.folder_id && !folderId)) && !f.deleted_at
      );

      if (sortBy === "date") {
        fileRows.sort((a, b) => {
          const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          return order === "DESC" ? -diff : diff;
        });
      } else if (sortBy === "size") {
        fileRows.sort((a, b) => {
          const diff = Number(a.size_bytes) - Number(b.size_bytes);
          return order === "DESC" ? -diff : diff;
        });
      } else {
        fileRows.sort((a, b) => {
          const diff = a.display_name.localeCompare(b.display_name, "tr");
          return order === "DESC" ? -diff : diff;
        });
      }
    } else {
      const sql = getDb();

      // 2. Alt klasörler
      if (folderId) {
        folderRows = (await sql`
          SELECT * FROM dok_folders
          WHERE parent_id = ${folderId} AND deleted_at IS NULL
          ORDER BY name ASC;
        `) as DokFolder[];
      } else {
        folderRows = (await sql`
          SELECT * FROM dok_folders
          WHERE parent_id IS NULL AND deleted_at IS NULL
          ORDER BY name ASC;
        `) as DokFolder[];
      }

      // 3. Dosyalar
      if (folderId) {
        if (sortBy === "date") {
          fileRows = (order === "DESC"
            ? await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL ORDER BY created_at DESC;`
            : await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL ORDER BY created_at ASC;`) as DokFile[];
        } else if (sortBy === "size") {
          fileRows = (order === "DESC"
            ? await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL ORDER BY size_bytes DESC;`
            : await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL ORDER BY size_bytes ASC;`) as DokFile[];
        } else {
          fileRows = (order === "DESC"
            ? await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL ORDER BY display_name DESC;`
            : await sql`SELECT * FROM dok_files WHERE folder_id = ${folderId} AND deleted_at IS NULL ORDER BY display_name ASC;`) as DokFile[];
        }
      } else {
        if (sortBy === "date") {
          fileRows = (order === "DESC"
            ? await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY created_at DESC;`
            : await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY created_at ASC;`) as DokFile[];
        } else if (sortBy === "size") {
          fileRows = (order === "DESC"
            ? await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY size_bytes DESC;`
            : await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY size_bytes ASC;`) as DokFile[];
        } else {
          fileRows = (order === "DESC"
            ? await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY display_name DESC;`
            : await sql`SELECT * FROM dok_files WHERE folder_id IS NULL AND deleted_at IS NULL ORDER BY display_name ASC;`) as DokFile[];
        }
      }
    }

    const { getPreviewKind } = await import("@/lib/dokumantasyon/preview-capabilities");

    const safeFiles = fileRows.map((file) => ({
      id: file.id,
      folder_id: file.folder_id,
      display_name: file.display_name,
      size_bytes: Number(file.size_bytes),
      mime_type: file.mime_type,
      extension: file.extension,
      created_at: file.created_at,
      updated_at: file.updated_at,
      preview_kind: getPreviewKind(file.extension),
    }));

    return NextResponse.json(
      {
        folder: currentFolder,
        breadcrumbs,
        folders: folderRows,
        files: safeFiles,
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const { DokRuntimeConfigError } = await import("@/lib/dokumantasyon/runtime-mode");
    if (err instanceof DokRuntimeConfigError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    console.error("Öğe listeleme hatası:", err);
    return NextResponse.json(
      { error: "Öğeler listelenirken bir hata oluştu." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
